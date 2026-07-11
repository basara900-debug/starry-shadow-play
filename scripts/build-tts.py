#!/usr/bin/env python3
"""동화 TTS 빌드 스크립트.

사용법:
    python3 scripts/build-tts.py <story-id> [--force]

예:
    python3 scripts/build-tts.py town-country

동작:
  1. src/stories/<story-id>/script.json 를 읽는다.
  2. 각 씬의 dialogue 배열을 순회하며 Lovable AI TTS (openai/gpt-4o-mini-tts)
     로 mp3 를 생성한다. 화자별 voice/instructions 는 script.json의
     `voices` 매핑을 따른다.
  3. mp3 는 public/audio/<story-id>/scene<N>/tts/<idx>_<who>.mp3 에 저장.
  4. ffprobe 로 각 mp3 의 실제 길이를 재고, 각 대사 사이 `gapSec` (기본 0.5초)
     의 정적 gap 을 넣은 타임라인을 계산.
  5. 결과를 src/stories/<story-id>/timing.json 에 기록.
     - beats: [{from, to, who, text}]
     - durationSec = 마지막 beat.to + gapSec

이 스크립트만 재실행하면 대사/씬 길이/재생 위치가 모두 자동으로 다시 맞춰진다.

환경 변수:
  LOVABLE_API_KEY (필수) — 샌드박스에 자동 주입됨.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
from pathlib import Path

import requests

GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/audio/speech"
MODEL = "openai/gpt-4o-mini-tts"
ROOT = Path(__file__).resolve().parent.parent


def ffprobe_duration(path: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ]).decode().strip()
    return float(out)


def synthesize(text: str, voice: str, instructions: str | None, api_key: str) -> bytes:
    body = {
        "model": MODEL,
        "input": text,
        "voice": voice,
        "response_format": "mp3",
    }
    if instructions:
        body["instructions"] = instructions
    r = requests.post(
        GATEWAY_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=body,
        timeout=120,
    )
    if r.status_code == 402:
        sys.exit("Lovable AI 크레딧이 부족합니다. Workspace 결제 설정을 확인하세요.")
    if r.status_code == 429:
        sys.exit("Lovable AI 속도 제한에 걸렸습니다. 잠시 후 다시 시도하세요.")
    if not r.ok:
        sys.exit(f"TTS 실패 {r.status_code}: {r.text[:400]}")
    # OpenAI 계열은 기본적으로 오디오 바이트를 그대로 반환하지만,
    # 게이트웨이가 base64 JSON 을 감쌀 수 있으니 둘 다 처리.
    ctype = r.headers.get("content-type", "")
    if ctype.startswith("audio/") or r.content[:3] == b"ID3" or r.content[:2] == b"\xff\xfb":
        return r.content
    try:
        data = r.json()
        if isinstance(data, dict) and "audio" in data:
            return base64.b64decode(data["audio"])
    except Exception:
        pass
    return r.content


def build_story(story_id: str, force: bool) -> None:
    script_path = ROOT / "src" / "stories" / story_id / "script.json"
    if not script_path.exists():
        sys.exit(f"스크립트 파일이 없습니다: {script_path}")
    script = json.loads(script_path.read_text())

    api_key = os.environ.get("LOVABLE_API_KEY")
    if not api_key:
        sys.exit("LOVABLE_API_KEY 환경변수가 필요합니다.")

    gap = float(script.get("gapSec", 0.5))
    voices = script.get("voices", {})
    timing_scenes = []

    for si, scene in enumerate(script["scenes"], start=1):
        sid = scene["id"]
        out_dir = ROOT / "public" / "audio" / story_id / f"scene{si}" / "tts"
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"[{sid}] {len(scene['dialogue'])} 대사 → {out_dir.relative_to(ROOT)}")

        beats = []
        cursor = gap  # 씬 시작에도 gap 확보 (0초부터 대사가 튀지 않도록)
        for i, line in enumerate(scene["dialogue"]):
            who = line["who"]
            text = line["text"]
            fname = f"{i:02d}_{who}.mp3"
            out_path = out_dir / fname

            if not out_path.exists() or force:
                voice_cfg = voices.get(who, {})
                voice = voice_cfg.get("voice", "alloy")
                instructions = voice_cfg.get("instructions")
                audio = synthesize(text, voice, instructions, api_key)
                out_path.write_bytes(audio)
                print(f"  ✓ {fname} ({len(audio)/1024:.1f} KB)")
            else:
                print(f"  · {fname} (skip, 이미 존재)")

            dur = ffprobe_duration(out_path)
            frm = round(cursor, 3)
            to = round(cursor + dur, 3)
            beats.append({"from": frm, "to": to, "who": who, "text": text})
            cursor = to + gap  # 다음 대사까지 gap 확보

        scene_dur = round(cursor, 3)  # 마지막 대사 뒤 gap 까지 포함
        timing_scenes.append({"id": sid, "durationSec": scene_dur, "beats": beats})
        print(f"  ⇒ 씬 길이 {scene_dur}s")

    timing_path = ROOT / "src" / "stories" / story_id / "timing.json"
    timing_path.write_text(json.dumps({"scenes": timing_scenes}, ensure_ascii=False, indent=2))
    print(f"\n✓ {timing_path.relative_to(ROOT)} 갱신 완료")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("story_id", help="src/stories/<id> 폴더 이름 (예: town-country)")
    ap.add_argument("--force", action="store_true", help="이미 존재하는 mp3 도 다시 생성")
    args = ap.parse_args()
    build_story(args.story_id, args.force)


if __name__ == "__main__":
    main()