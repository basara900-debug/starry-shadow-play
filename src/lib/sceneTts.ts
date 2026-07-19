import { useEffect, useRef, useState } from "react";
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
const MAX_MASTER_PLAY_RETRIES = 8;
const MASTER_PLAY_RETRY_MS = 180;

export type SceneMasterVoiceStatus = {
  state: "idle" | "loading" | "ready" | "playing" | "paused" | "blocked" | "error";
  hasStarted: boolean;
  attempts: number;
  message?: string;
};

const MASTER_IDLE_STATUS: SceneMasterVoiceStatus = {
  state: "idle",
  hasStarted: false,
  attempts: 0,
};

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

/**
 * 씬 하나에 대응하는 통합 마스터 mp3 를 재생한다.
 *
 * 왜 이렇게 하나:
 *  - 대사 조각마다 `<audio>.src` 를 교체하면 브라우저가 매 전환마다 mp3 를
 *    새로 로드·디코드하며 100~500ms 의 지연이 발생해 다음 대사 앞부분이
 *    잘리는 "끊김" 현상이 생긴다.
 *  - 씬 통째로 이어붙인 마스터 mp3 를 한 번만 로드해두면 대사 사이 지연이
 *    파일 자체의 무음(build-tts.py 가 gapSec 만큼 anullsrc 삽입)으로
 *    자연스럽게 채워진다.
 *
 * 동기화 원칙:
 *  - 자연 재생을 신뢰한다. 매 프레임 `currentTime = t` 를 강제하지 않는다.
 *  - `t` 가 씬 시작(≈0)으로 되감기(루프) 되었거나 dev 툴바 seek 로 크게
 *    벌어졌을 때(> 0.4s) 만 강제 재동기화한다.
 */
export function useSceneMasterVoice(opts: {
  url: string;
  t: number;
  speed: number;
  audioState: SceneAudioState;
  durationSec: number;
}): SceneMasterVoiceStatus {
  const { url, t, speed, audioState, durationSec } = opts;
  const [status, setStatus] = useState<SceneMasterVoiceStatus>(MASTER_IDLE_STATUS);
  const startedRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const sourceTokenRef = useRef(0);

  const clearRetry = () => {
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // 씬 전환: pathname 정확 비교 (endsWith 는 scene1↔scene11 처럼 접미가 겹치는 케이스에서 오탐)
  useEffect(() => {
    const a = getSharedVoice();
    if (!a) return;
    sourceTokenRef.current += 1;
    const token = sourceTokenRef.current;
    clearRetry();
    startedRef.current = false;
    attemptsRef.current = 0;
    setStatus({ state: "loading", hasStarted: false, attempts: 0 });
    let currentPath = "";
    try {
      currentPath = a.src ? new URL(a.src, window.location.origin).pathname : "";
    } catch { /* noop */ }
    if (currentPath !== url) {
      try { a.pause(); } catch { /* noop */ }
      a.src = url;
      try { a.currentTime = 0; } catch { /* noop */ }
      a.load();
      // 다음 재생 시도가 반드시 새 src 에 대해 다시 일어나도록 플래그 초기화
      (a as any).__playPending = false;
      if (import.meta.env.DEV) {
        console.log("[TTS] src ->", url);
      }
    } else if (a.readyState >= 2) {
      setStatus({ state: "ready", hasStarted: false, attempts: 0 });
    }
    const onLoadedData = () => {
      if (sourceTokenRef.current !== token) return;
      setStatus((s) => ({ ...s, state: startedRef.current ? "playing" : "ready" }));
      if (import.meta.env.DEV) {
        console.log("[TTS] ready", url, "duration", Number.isFinite(a.duration) ? a.duration.toFixed(2) : "?");
      }
    };
    const onError = () => {
      if (sourceTokenRef.current !== token) return;
      const code = a.error?.code;
      const message = code ? `audio error code ${code}` : "audio load failed";
      setStatus({ state: "error", hasStarted: startedRef.current, attempts: attemptsRef.current, message });
      if (import.meta.env.DEV) console.warn("[TTS] error", message, url);
    };
    a.addEventListener("loadeddata", onLoadedData);
    a.addEventListener("canplay", onLoadedData);
    a.addEventListener("error", onError);
    return () => {
      clearRetry();
      a.removeEventListener("loadeddata", onLoadedData);
      a.removeEventListener("canplay", onLoadedData);
      a.removeEventListener("error", onError);
      try { a.pause(); } catch { /* noop */ }
      (a as any).__playPending = false;
    };
  }, [url]);

  // 볼륨 / 뮤트 반영
  useEffect(() => {
    const a = getSharedVoice();
    if (!a) return;
    a.volume = audioState.voiceMuted ? 0 : audioState.voiceVol;
  }, [audioState.voiceVol, audioState.voiceMuted]);

  // 재생 상태 & 드리프트 보정
  useEffect(() => {
    const a = getSharedVoice();
    if (!a) return;
    if (!audioState.unlocked) return;

    if (speed === 0 || t >= durationSec) {
      clearRetry();
      if (!a.paused) { try { a.pause(); } catch { /* noop */ } }
      setStatus((s) => ({ ...s, state: speed === 0 ? "paused" : s.state }));
      return;
    }

    // playbackRate 실시간 반영
    if (Math.abs(a.playbackRate - speed) > 0.01) {
      a.playbackRate = speed;
    }

    // 루프로 t 가 처음으로 되감겼을 때 (t≈0 인데 audio 는 뒤쪽)
    if (t < 0.3 && a.currentTime > 1.0) {
      try { a.currentTime = t; } catch { /* noop */ }
    } else if (Math.abs(a.currentTime - t) > 0.4) {
      // seek / 큰 드리프트만 재동기화 — 대사 자연 흐름은 유지
      try { a.currentTime = t; } catch { /* noop */ }
    }

    if (a.paused && !(a as any).__playPending && retryTimerRef.current == null) {
      (a as any).__playPending = true;
      const token = sourceTokenRef.current;
      const attempt = () => {
        if (sourceTokenRef.current !== token) return;
        if (speed === 0 || t >= durationSec) {
          (a as any).__playPending = false;
          return;
        }
        attemptsRef.current += 1;
        setStatus({
          state: a.readyState < 2 ? "loading" : "ready",
          hasStarted: startedRef.current,
          attempts: attemptsRef.current,
        });
        const p = a.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            if (sourceTokenRef.current !== token) return;
            clearRetry();
            startedRef.current = true;
            (a as any).__playPending = false;
            setStatus({ state: "playing", hasStarted: true, attempts: attemptsRef.current });
            if (import.meta.env.DEV) console.log("[TTS] play ok", a.currentSrc.split("/").pop());
          }).catch((err) => {
            if (sourceTokenRef.current !== token) return;
            (a as any).__playPending = false;
            const retryable = attemptsRef.current < MAX_MASTER_PLAY_RETRIES;
            const message = `${err?.name ?? "play failed"}${retryable ? " — retrying" : ""}`;
            setStatus({
              state: retryable ? "blocked" : "error",
              hasStarted: startedRef.current,
              attempts: attemptsRef.current,
              message,
            });
            if (import.meta.env.DEV) console.warn("[TTS] play fail", err?.name, a.currentSrc.split("/").pop());
            if (retryable && retryTimerRef.current == null) {
              retryTimerRef.current = window.setTimeout(() => {
                retryTimerRef.current = null;
                if (sourceTokenRef.current !== token) return;
                if (!a.paused) return;
                (a as any).__playPending = true;
                attempt();
              }, MASTER_PLAY_RETRY_MS);
            }
          });
        } else {
          startedRef.current = true;
          (a as any).__playPending = false;
          setStatus({ state: "playing", hasStarted: true, attempts: attemptsRef.current });
        }
      };
      // readyState < HAVE_CURRENT_DATA (2) 이면 loadeddata 를 기다렸다가 재생
      if (a.readyState < 2) {
        setStatus({ state: "loading", hasStarted: startedRef.current, attempts: attemptsRef.current });
        const onReady = () => {
          a.removeEventListener("loadeddata", onReady);
          if (sourceTokenRef.current !== token) return;
          attempt();
        };
        a.addEventListener("loadeddata", onReady, { once: true });
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null;
          a.removeEventListener("loadeddata", onReady);
          if (sourceTokenRef.current !== token) return;
          attempt();
        }, MASTER_PLAY_RETRY_MS);
      } else {
        attempt();
      }
    }
  }, [t, speed, durationSec, audioState.unlocked]);

  return status;
}