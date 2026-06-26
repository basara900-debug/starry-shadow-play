import { useEffect, useRef } from "react";
import type { SceneAudioState } from "@/lib/sceneAudio";

export type SceneBeat = {
  i: number;
  who: "narration" | "ant" | "gh" | "ants";
  text: string;
  file: string;
  dur: number;
  from: number;
  to: number;
};

const voiceCache = new Map<string, HTMLAudioElement>();

export function getSceneVoice(file: string) {
  let a = voiceCache.get(file);
  if (!a) {
    a = new Audio(file);
    a.preload = "auto";
    voiceCache.set(file, a);
  }
  return a;
}

export function primeSceneTts(beats: SceneBeat[]) {
  for (const b of beats) {
    const audio = getSceneVoice(b.file);
    const muted = audio.muted;
    const volume = audio.volume;
    audio.muted = true;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        audio.pause();
        try { audio.currentTime = 0; } catch { /* noop */ }
        audio.muted = muted;
        audio.volume = volume;
      })
      .catch(() => {
        audio.muted = muted;
        audio.volume = volume;
      });
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
  const audioRef = useRef<HTMLAudioElement[]>([]);
  const activeIdxRef = useRef<number>(-1);

  useEffect(() => {
    audioRef.current = beats.map((b) => getSceneVoice(b.file));
    return () => {
      audioRef.current.forEach((a) => {
        a.pause();
        try { a.currentTime = 0; } catch { /* noop */ }
      });
      audioRef.current = [];
      activeIdxRef.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beats]);

  // volume/mute/speed propagation
  useEffect(() => {
    const vol = audioState.voiceMuted ? 0 : audioState.voiceVol;
    audioRef.current.forEach((a) => {
      a.volume = vol;
      if (speed === 0) a.pause();
      else a.playbackRate = speed;
    });
  }, [speed, audioState.voiceVol, audioState.voiceMuted]);

  useEffect(() => {
    if (speed === 0) return;
    if (!audioState.unlocked) return;
    const idx = beats.findIndex((b) => t >= b.from && t < b.to);
    if (idx === -1) {
      if (activeIdxRef.current !== -1) {
        const prev = activeIdxRef.current;
        audioRef.current[prev]?.pause();
        activeIdxRef.current = -1;
      }
      return;
    }
    if (activeIdxRef.current === idx) {
      const cur = audioRef.current[idx];
      if (cur) {
        cur.playbackRate = speed;
        cur.volume = audioState.voiceMuted ? 0 : audioState.voiceVol;
        if (cur.paused) {
          try { cur.currentTime = Math.max(0, t - beats[idx].from); } catch { /* noop */ }
          void cur.play().catch(() => { activeIdxRef.current = -1; });
        }
      }
      return;
    }
    const prev = activeIdxRef.current;
    if (prev >= 0 && audioRef.current[prev]) {
      audioRef.current[prev].pause();
      audioRef.current[prev].currentTime = 0;
    }
    const a = audioRef.current[idx];
    if (a) {
      try { a.currentTime = Math.max(0, t - beats[idx].from); } catch { /* noop */ }
      a.playbackRate = speed;
      a.volume = audioState.voiceMuted ? 0 : audioState.voiceVol;
      void a.play().catch(() => { activeIdxRef.current = -1; });
    }
    activeIdxRef.current = idx;
  }, [t, speed, audioState.unlocked, audioState.voiceVol, audioState.voiceMuted, beats]);

  // loop reset hook
  const resetAllRef = useRef(() => {
    audioRef.current.forEach((a) => { a.pause(); try { a.currentTime = 0; } catch { /* noop */ } });
    activeIdxRef.current = -1;
  });
  return resetAllRef.current;
}