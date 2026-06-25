import { useEffect, useMemo, useRef } from "react";
import { useSceneAudioControls } from "@/lib/sceneAudio";

/**
 * 씬 대사 TTS 보이스 훅.
 *
 * - beats: 씬 타임라인의 대사 구간(초). who → 보이스 프로필 매핑.
 * - currentTime: 씬의 현재 재생 시각(초). Scene*Motion 의 t 를 그대로 넘긴다.
 * - speed: 0(정지)/1/2 — 0 이면 모든 보이스 일시정지.
 *
 * 동작:
 *  1. mount 시 모든 beat 대사를 /api/tts 로 병렬 프리로드(mp3 blob).
 *  2. currentTime 이 beat.from..beat.to 안일 때만 해당 beat 의 Audio 재생.
 *  3. 같은 beat 안에서는 한 번만 play() 한다(재생 중 t 갱신마다 재시작 X).
 *  4. 음량/뮤트/속도는 sceneAudio 버스의 voice* 와 speed/playbackRate 를 따른다.
 */

export type VoiceRole = "narration" | "gh" | "ant";

export type VoiceBeat = {
  from: number;
  to: number;
  who: VoiceRole;
  text: string;
};

const VOICE_PROFILES: Record<VoiceRole, { voice: string; instructions: string }> = {
  narration: {
    voice: "shimmer",
    instructions:
      "한국어로 또박또박 읽어주세요. 80대 할머니의 귀족적이고 우아한 분위기, 차분하고 따뜻하며 부드러운 톤. 동화를 들려주듯 느리고 정성스럽게.",
  },
  gh: {
    voice: "fable",
    instructions:
      "한국어로 읽어주세요. 어린 남자아이의 발랄하고 천진난만한 개구쟁이 톤. 호기심 가득하고 들뜬 목소리로, 살짝 빠르고 신나게.",
  },
  ant: {
    voice: "nova",
    instructions:
      "한국어로 읽어주세요. 똑똑하고 책임감 있는 여자아이의 배려심 담긴 톤. 또랑또랑하고 다정하지만 단단하게, 적당한 속도로.",
  },
};

async function fetchVoice(text: string, role: VoiceRole): Promise<string> {
  const profile = VOICE_PROFILES[role];
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice: profile.voice,
      instructions: profile.instructions,
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function useSceneVoice(beats: VoiceBeat[], currentTime: number) {
  const controls = useSceneAudioControls();

  // 안정적인 key — beats 배열 참조가 매 렌더 바뀌어도 같은 대사면 같은 key.
  const beatsKey = useMemo(
    () => beats.map((b) => `${b.from}-${b.who}-${b.text}`).join("|"),
    [beats]
  );

  const audiosRef = useRef<HTMLAudioElement[]>([]);
  const activeRef = useRef<number>(-1);

  // 프리로드 + Audio 인스턴스 생성
  useEffect(() => {
    let cancelled = false;
    const list: HTMLAudioElement[] = beats.map(() => new Audio());
    audiosRef.current = list;
    activeRef.current = -1;

    Promise.all(
      beats.map(async (b, i) => {
        try {
          const url = await fetchVoice(b.text, b.who);
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          list[i].src = url;
          list[i].preload = "auto";
        } catch (e) {
          console.warn("[sceneVoice] preload failed", b.text, e);
        }
      })
    );

    return () => {
      cancelled = true;
      for (const a of list) {
        try { a.pause(); } catch { /* noop */ }
        if (a.src) {
          try { URL.revokeObjectURL(a.src); } catch { /* noop */ }
        }
      }
      audiosRef.current = [];
      activeRef.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatsKey]);

  // currentTime / speed / 볼륨 동기화
  useEffect(() => {
    const list = audiosRef.current;
    if (list.length === 0) return;
    const s = controls.read();
    const vol = s.voiceMuted ? 0 : s.voiceVol;
    const sceneRate = s.speed === 0 ? 0 : s.speed * s.playbackRate;

    // 활성 beat 찾기
    let idx = -1;
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i];
      if (currentTime >= b.from && currentTime < b.to) { idx = i; break; }
    }

    // beat 가 바뀌었다면 이전 오디오 정지
    if (activeRef.current !== idx && activeRef.current >= 0) {
      const prev = list[activeRef.current];
      if (prev) {
        try { prev.pause(); } catch { /* noop */ }
        try { prev.currentTime = 0; } catch { /* noop */ }
      }
      activeRef.current = -1;
    }

    // 일시정지(speed=0): 현재 재생중인 오디오만 일시정지하고 active 유지(다시 재생 시 이어서)
    if (sceneRate === 0) {
      if (idx >= 0) {
        const a = list[idx];
        if (a && !a.paused) { try { a.pause(); } catch { /* noop */ } }
      }
      return;
    }

    if (idx < 0) return;

    const a = list[idx];
    // 아직 mp3 가 도착하지 않았다면 active 를 잠그지 말고 다음 tick 에 재시도하게 둔다.
    if (!a || !a.src) return;

    const beat = beats[idx];
    const windowSec = Math.max(0.5, beat.to - beat.from);
    const dur = Number.isFinite(a.duration) ? a.duration : 0;

    // 대사 윈도우보다 음성이 길면 윈도우에 맞춰 빨리 재생, 짧으면 그대로 재생(여유는 무음).
    const fitRate = dur > 0 && dur > windowSec ? dur / windowSec : 1;
    const finalRate = Math.max(0.5, Math.min(4, fitRate * sceneRate));

    a.volume = vol;
    a.playbackRate = finalRate;

    if (activeRef.current !== idx) {
      activeRef.current = idx;
      // 비트 진입 시점이 windowSec 의 몇 % 인지 → 동일 비율로 음성 위치 설정.
      // (씬을 2x 로 보다가 비트 중간부터 들어와도 대사가 같은 위치에서 시작)
      const into = Math.max(0, currentTime - beat.from);
      const pos = dur > 0 ? Math.min(dur - 0.05, (into / windowSec) * dur) : 0;
      try { a.currentTime = pos; } catch { /* noop */ }
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // 재생 거부 — active 를 풀어 다음 tick 에 다시 시도.
          if (activeRef.current === idx) activeRef.current = -1;
        });
      }
    } else if (a.paused && a.readyState >= 2) {
      // 같은 비트이지만 어떤 이유로 멈춰 있으면(예: 직전에 거부) 다시 시도.
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => { /* noop */ });
    }
  }, [currentTime, controls, beats]);
}
