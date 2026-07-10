import { useEffect, useRef } from "react";
import type { SceneAudioState } from "@/lib/sceneAudio";

export type SceneBeat = {
  i: number;
  who: "narration" | "ant" | "gh" | "ants" | "city" | "country" | "post" | string;
  text: string;
  file: string;
  dur: number;
  from: number;
  to: number;
};

// 모바일 브라우저는 사용자 제스처당 unlock 가능한 <audio> 요소 수에 제한이 있어
// 씬마다 14개씩 새 Audio를 prime 하면 씬 3 이후가 음소거 되는 현상이 발생한다.
// 따라서 앱 전체에서 단 하나의 공유 <audio> 요소를 사용하고 비트가 바뀔 때 src 만 교체한다.
let sharedVoice: HTMLAudioElement | null = null;
function getSharedVoice() {
  if (typeof window === "undefined") return null;
  if (!sharedVoice) {
    sharedVoice = new Audio();
    sharedVoice.preload = "auto";
  }
  return sharedVoice;
}

export function getSceneVoice(_file: string) {
  return getSharedVoice();
}

/**
 * 사용자 제스처 안에서 호출 — 공유 오디오 요소를 unlock 한다.
 * src 비워둔 채로 play() 가 실패해도 무방하므로 무음 데이터 URI 로 한 번 재생한다.
 */
export function primeSceneTts(_beats: SceneBeat[]) {
  const a = getSharedVoice();
  if (!a) return;
  if ((a as any).__primed) return;
  (a as any).__primed = true;
  const prevSrc = a.src;
  const prevMuted = a.muted;
  const prevVol = a.volume;
  a.muted = true;
  a.volume = 0;
  // 1프레임 무음 mp3 (data URI) — 모든 브라우저에서 디코드 가능한 최소 mp3.
  a.src =
    "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7097lUUUbpKSXk5vK4yzr+lwIM5GIWMlMrvLn8mFJSnsLDEgITDQ8ImlT4hUUkSyOWFFMm7+8WG6yGFgEEoFQO//qzkc";
  const p = a.play();
  const restore = () => {
    try { a.pause(); } catch {/* noop */}
    try { a.currentTime = 0; } catch {/* noop */}
    a.src = prevSrc;
    a.muted = prevMuted;
    a.volume = prevVol;
  };
  if (p && typeof p.then === "function") {
    p.then(restore).catch(restore);
  } else {
    restore();
  }
}

/**
 * Drives TTS playback for a beat-timeline scene.
 * Plays the matching beat when t is within [from, to), respecting speed/volume/mute/unlock.
 */
export function useSceneBeatPlayback(
  beats: SceneBeat[],
  t: number,
  speed: number,
  audioState: SceneAudioState,
) {
  const activeIdxRef = useRef<number>(-1);

  useEffect(() => {
    activeIdxRef.current = -1;
    return () => {
      const a = getSharedVoice();
      if (a) {
        a.pause();
        try { a.currentTime = 0; } catch { /* noop */ }
      }
      activeIdxRef.current = -1;
    };
  }, [beats]);

  // volume/mute/speed propagation
  useEffect(() => {
    const a = getSharedVoice();
    if (!a) return;
    const vol = audioState.voiceMuted ? 0 : audioState.voiceVol;
    a.volume = vol;
    if (speed === 0) a.pause();
    else a.playbackRate = speed;
  }, [speed, audioState.voiceVol, audioState.voiceMuted]);

  useEffect(() => {
    if (speed === 0) return;
    if (!audioState.unlocked) return;
    const a = getSharedVoice();
    if (!a) return;
    const idx = beats.findIndex((b) => t >= b.from && t < b.to);
    if (idx === -1) {
      if (activeIdxRef.current !== -1) {
        a.pause();
        activeIdxRef.current = -1;
      }
      return;
    }
    if (activeIdxRef.current === idx) {
      a.playbackRate = speed;
      a.volume = audioState.voiceMuted ? 0 : audioState.voiceVol;
      if (a.paused) {
        try { a.currentTime = Math.max(0, t - beats[idx].from); } catch { /* noop */ }
        void a.play().catch(() => { activeIdxRef.current = -1; });
      }
      return;
    }
    // 비트 변경 — src 를 새 파일로 교체하고 처음부터 재생
    try { a.pause(); } catch { /* noop */ }
    if (!a.src.endsWith(beats[idx].file)) {
      a.src = beats[idx].file;
    }
    try { a.currentTime = Math.max(0, t - beats[idx].from); } catch { /* noop */ }
    a.playbackRate = speed;
    a.volume = audioState.voiceMuted ? 0 : audioState.voiceVol;
    void a.play().catch(() => { activeIdxRef.current = -1; });
    activeIdxRef.current = idx;
  }, [t, speed, audioState.unlocked, audioState.voiceVol, audioState.voiceMuted, beats]);

  // loop reset hook
  const resetAllRef = useRef(() => {
    const a = getSharedVoice();
    if (a) {
      a.pause();
      try { a.currentTime = 0; } catch { /* noop */ }
    }
    activeIdxRef.current = -1;
  });
  return resetAllRef.current;
}