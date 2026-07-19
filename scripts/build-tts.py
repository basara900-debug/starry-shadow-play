#!/usr/bin/env python3
"""동화 TTS 빌드 스크립트.

사용법:
    python3 scripts/build-tts.py <story-id> [--force] [--only-scene N] [--engine elevenlabs|lovable]

script.json 의 최상단 `engine` 필드로 엔진을 결정한다.
  - "elevenlabs" : ElevenLabs eleven_multilingual_v2 (한국어 자연스러움)
  - "lovable"    : Lovable AI /v1/audio/speech (openai/gpt-4o-mini-tts)

ElevenLabs 스크립트 구조:
  voices[<who>] = { voiceId, settings: { stability, similarity_boost, style, use_speaker_boost, speed } }
  emotions[<name>] = { stability?, similarity_boost?, style?, speed? }     (선택)
  scenes[i].mood = <emotion-name>                                          (선택)
  scenes[i].dialogue[j].emotion = <emotion-name>                           (선택)

voice_settings 병합 순서:
  기본값 ← voices[who].settings ← emotions[scene.mood] ← emotions[line.emotion]

텍스트 + voiceId + 최종 settings 해시를 <mp3>.hash 에 저장하여 변경분만 재생성.
`--force` 는 hash 무시하고 전부 재생성.

환경 변수:
  ELEVENLABS_API_KEY  (engine=elevenlabs 필수)
  LOVABLE_API_KEY     (engine=lovable 필수)
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/audio/speech"
LOVABLE_MODEL = "openai/gpt-4o-mini-tts"
ELEVEN_URL_TPL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
ELEVEN_DEFAULT_MODEL = "eleven_multilingual_v2"
ROOT = Path(__file__).resolve().parent.parent


def ffprobe_duration(path: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ]).decode().strip()
    return float(out)


def synthesize_lovable(text: str, voice: str, instructions: str | None, api_key: str) -> bytes:
    body = {
        "model": LOVABLE_MODEL,
        "input": text,
        "voice": voice,
        "response_format": "mp3",
    }
    if instructions:
        body["instructions"] = instructions
    r = requests.post(
        LOVABLE_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=body,
        timeout=120,
    )
    if r.status_code == 402:
        sys.exit("Lovable AI 크레딧이 부족합니다.")
    if r.status_code == 429:
        sys.exit("Lovable AI 속도 제한.")
    if not r.ok:
        sys.exit(f"Lovable TTS 실패 {r.status_code}: {r.text[:400]}")
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


def merge_settings(*layers: dict | None) -> dict:
    out: dict = {}
    for layer in layers:
        if not layer:
            continue
        for k, v in layer.items():
            if v is not None:
                out[k] = v
    return out


def synthesize_elevenlabs(text: str, voice_id: str, model_id: str, settings: dict,
                          previous_text: str | None, next_text: str | None,
                          api_key: str) -> bytes:
    body: dict = {
        "text": text,
        "model_id": model_id,
        "voice_settings": settings,
    }
    # eleven_v3 는 previous_text/next_text 미지원
    if previous_text and model_id != "eleven_v3":
        body["previous_text"] = previous_text[-500:]
    if next_text and model_id != "eleven_v3":
        body["next_text"] = next_text[:500]

    url = ELEVEN_URL_TPL.format(voice_id=voice_id)
    last_err = ""
    for attempt in range(3):
        r = requests.post(
            url,
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json=body,
            timeout=180,
        )
        if r.status_code == 401:
            sys.exit("ElevenLabs 인증 실패(401). ELEVENLABS_API_KEY 확인 필요.")
        if r.status_code == 402:
            sys.exit("ElevenLabs 크레딧 부족.")
        if r.status_code in (429, 500, 502, 503, 504):
            last_err = f"{r.status_code}: {r.text[:200]}"
            time.sleep(1.5 * (attempt + 1))
            continue
        if not r.ok:
            sys.exit(f"ElevenLabs TTS 실패 {r.status_code}: {r.text[:400]}")
        return r.content
    sys.exit(f"ElevenLabs 재시도 실패: {last_err}")


def build_v3_text(text: str, persona: str | None, direction: str | None,
                  global_rule: str | None) -> str:
    """v3 인라인 오디오 태그만 텍스트 앞에 붙인다.
    persona / globalRule / 긴 direction 문자열은 v3 가 그대로 낭독하므로 사용하지 않는다.
    대신 짧은 감정 태그 (예: [sadly][sighs]) 만 프리픽스로 사용한다.
    persona/globalRule 은 사람이 script.json 에서 읽는 메타데이터로만 남긴다."""
    tag = (direction or "").strip()
    if not tag:
        return text
    return f"{tag} {text}"


def hash_signature(payload: dict) -> str:
    blob = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


def build_story(story_id: str, force: bool, only_scene: int | None, engine_override: str | None) -> None:
    script_path = ROOT / "src" / "stories" / story_id / "script.json"
    if not script_path.exists():
        sys.exit(f"스크립트 파일이 없습니다: {script_path}")
    script = json.loads(script_path.read_text())

    engine = engine_override or script.get("engine", "lovable")
    if engine == "elevenlabs":
        api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not api_key:
            sys.exit("ELEVENLABS_API_KEY 환경변수 필요.")
    elif engine == "lovable":
        api_key = os.environ.get("LOVABLE_API_KEY")
        if not api_key:
            sys.exit("LOVABLE_API_KEY 환경변수 필요.")
    else:
        sys.exit(f"알 수 없는 engine: {engine}")

    gap = float(script.get("gapSec", 0.5))
    voices = script.get("voices", {})
    emotions = script.get("emotions", {})
    model_id = script.get("model", ELEVEN_DEFAULT_MODEL)
    default_eleven = {
        "stability": 0.5, "similarity_boost": 0.8, "style": 0.3,
        "use_speaker_boost": True, "speed": 1.0,
    }
    timing_scenes = []

    for si, scene in enumerate(script["scenes"], start=1):
        sid = scene["id"]
        out_dir = ROOT / "public" / "audio" / story_id / f"scene{si}" / "tts"
        out_dir.mkdir(parents=True, exist_ok=True)
        do_scene = only_scene is None or only_scene == si
        print(f"[{sid}] {len(scene['dialogue'])} 대사 → {out_dir.relative_to(ROOT)}"
              + ("" if do_scene else "  (skip: --only-scene)"))

        scene_mood = scene.get("mood")
        dlg = scene["dialogue"]

        beats = []
        cursor = gap
        for i, line in enumerate(dlg):
            who = line["who"]
            text = line["text"]
            fname = f"{i:02d}_{who}.mp3"
            out_path = out_dir / fname
            hash_path = out_path.with_suffix(".mp3.hash")

            if engine == "elevenlabs":
                vcfg = voices.get(who) or voices.get("narration") or {}
                voice_id = vcfg.get("voiceId")
                if not voice_id:
                    sys.exit(f"voiceId 누락: who={who}")
                base_settings = vcfg.get("settings", {})
                mood_settings = emotions.get(scene_mood) if scene_mood else None
                line_settings = emotions.get(line.get("emotion")) if line.get("emotion") else None
                final_settings = merge_settings(default_eleven, base_settings, mood_settings, line_settings)
                # v3 direction hint: persona + emotion.directionPrompt
                persona_text = vcfg.get("persona")
                # v3 는 짧은 오디오 태그만 안전. emotions[<name>].v3Tag 사용.
                line_emotion = line.get("emotion")
                direction_text = emotions.get(line_emotion, {}).get("v3Tag") if line_emotion else None
                if not direction_text and scene_mood:
                    direction_text = emotions.get(scene_mood, {}).get("v3Tag")
                global_rule = script.get("globalPerformanceRule")
                send_text = (
                    build_v3_text(text, persona_text, direction_text, global_rule)
                    if model_id == "eleven_v3"
                    else text
                )
                sig = hash_signature({
                    "engine": "elevenlabs", "model": model_id,
                    "voiceId": voice_id, "settings": final_settings, "text": text,
                    "persona": persona_text,
                    "v3Tag": direction_text,
                    "globalRule": global_rule,
                })
            else:
                vcfg = voices.get(who, {})
                sig = hash_signature({
                    "engine": "lovable", "model": LOVABLE_MODEL,
                    "voice": vcfg.get("voice", "alloy"),
                    "instructions": vcfg.get("instructions"),
                    "text": text,
                })

            existing_sig = hash_path.read_text().strip() if hash_path.exists() else ""
            need_gen = force or not out_path.exists() or existing_sig != sig
            if not do_scene:
                need_gen = False

            if need_gen:
                if engine == "elevenlabs":
                    prev_text = dlg[i - 1]["text"] if i > 0 else None
                    next_text = dlg[i + 1]["text"] if i + 1 < len(dlg) else None
                    audio = synthesize_elevenlabs(
                        send_text, voice_id, model_id, final_settings,
                        prev_text, next_text, api_key,
                    )
                else:
                    audio = synthesize_lovable(
                        text, vcfg.get("voice", "alloy"),
                        vcfg.get("instructions"), api_key,
                    )
                out_path.write_bytes(audio)
                hash_path.write_text(sig)
                print(f"  ✓ {fname} ({len(audio)/1024:.1f} KB)")
            elif not out_path.exists():
                sys.exit(f"파일 없음 (--only-scene 밖): {out_path}")
            else:
                print(f"  · {fname} (skip)")

            dur = ffprobe_duration(out_path)
            frm = round(cursor, 3)
            to = round(cursor + dur, 3)
            beats.append({"from": frm, "to": to, "who": who, "text": text})
            cursor = to + gap

        scene_dur = round(cursor, 3)
        timing_scenes.append({"id": sid, "durationSec": scene_dur, "beats": beats})
        print(f"  ⇒ 씬 길이 {scene_dur}s")

    timing_path = ROOT / "src" / "stories" / story_id / "timing.json"
    timing_path.write_text(json.dumps({"scenes": timing_scenes}, ensure_ascii=False, indent=2))
    print(f"\n✓ {timing_path.relative_to(ROOT)} 갱신 완료")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("story_id")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only-scene", type=int, default=None)
    ap.add_argument("--engine", choices=["elevenlabs", "lovable"], default=None)
    args = ap.parse_args()
    build_story(args.story_id, args.force, args.only_scene, args.engine)


if __name__ == "__main__":
    main()