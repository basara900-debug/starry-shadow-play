import { useEffect, useState } from "react";

/**
 * 개발용 타임라인/자막 버스.
 * 활성 씬이 자신의 비트(대사)와 현재 t/duration 을 publish 하고,
 * 하단 DevSubtitleToolbar 가 이를 구독해 자막과 슬라이드(스크럽) 컨트롤을 보여준다.
 * 격자 오버레이와 마찬가지로 개발 모드 전용 — 토글로 끄면 보이지 않는다.
 */
export type DevTimelineBeat = {
  from: number;
  to: number;
  who: string;
  text: string;
};

export type DevTimelineState = {
  sceneId: string;
  label: string;
  beats: DevTimelineBeat[];
  t: number;
  duration: number;
} | null;

let current: DevTimelineState = null;
const listeners = new Set<(s: DevTimelineState) => void>();
let seekHandler: ((t: number) => void) | null = null;

function publish(s: DevTimelineState) {
  current = s;
  listeners.forEach((l) => l(s));
}

export function devTimelineRequestSeek(t: number) {
  seekHandler?.(t);
}

/** 활성 씬에서 호출 — t/duration/beats 를 publish 하고 외부 seek 요청을 받아 들인다. */
export function useDevTimelineSync(args: {
  sceneId: string;
  label: string;
  beats: DevTimelineBeat[];
  t: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const { sceneId, label, beats, t, duration, onSeek } = args;

  // seek 핸들러 등록 (씬 마운트 동안 유지)
  useEffect(() => {
    seekHandler = onSeek;
    return () => {
      if (seekHandler === onSeek) seekHandler = null;
    };
  }, [onSeek]);

  // 매 프레임 publish — 단일 구독자(툴바)만 영향 받음
  useEffect(() => {
    publish({ sceneId, label, beats, t, duration });
  }, [sceneId, label, beats, t, duration]);

  // 언마운트 시 비움
  useEffect(() => {
    return () => {
      if (current && current.sceneId === sceneId) publish(null);
    };
  }, [sceneId]);
}

export function useDevTimelineState(): DevTimelineState {
  const [s, setS] = useState<DevTimelineState>(current);
  useEffect(() => {
    const cb = (next: DevTimelineState) => setS(next);
    listeners.add(cb);
    cb(current);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return s;
}