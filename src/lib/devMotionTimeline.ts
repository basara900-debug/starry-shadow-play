import { useEffect, useState } from "react";

/**
 * 개발용 씬 모션 타임라인 버스.
 * 활성 씬이 자신의 모션 세그먼트(트랙별 [from, to] 구간)를 publish 하고,
 * DevMotionToolbar 가 이를 구독해 트랙 시각화 + 겹침/공백 경고 + 스크럽 진입을 제공한다.
 * 자막 타임라인(devTimeline)과 동일한 seek 채널(devTimelineRequestSeek)을 재사용한다.
 */
export type DevMotionSegment = {
  id: string;
  label: string;
  track: string;
  from: number;
  to: number;
  color?: string;
};

export type DevMotionState = {
  sceneId: string;
  segments: DevMotionSegment[];
} | null;

let current: DevMotionState = null;
const listeners = new Set<(s: DevMotionState) => void>();

function publish(s: DevMotionState) {
  current = s;
  listeners.forEach((l) => l(s));
}

/** 활성 씬에서 호출 — 씬의 모션 세그먼트 목록을 publish. */
export function useDevMotionSync(sceneId: string, segments: DevMotionSegment[]) {
  useEffect(() => {
    publish({ sceneId, segments });
  }, [sceneId, segments]);
  useEffect(() => {
    return () => {
      if (current && current.sceneId === sceneId) publish(null);
    };
  }, [sceneId]);
}

export function useDevMotionState(): DevMotionState {
  const [s, setS] = useState<DevMotionState>(current);
  useEffect(() => {
    const cb = (next: DevMotionState) => setS(next);
    listeners.add(cb);
    cb(current);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return s;
}

/** 트랙별로 그룹핑 + 시간 순 정렬. */
export function groupByTrack(segments: DevMotionSegment[]) {
  const map = new Map<string, DevMotionSegment[]>();
  for (const seg of segments) {
    if (!map.has(seg.track)) map.set(seg.track, []);
    map.get(seg.track)!.push(seg);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.from - b.from);
  return map;
}

/** 같은 트랙 내에서 겹치는 세그먼트 id 집합을 반환. */
export function findOverlaps(segments: DevMotionSegment[]): Set<string> {
  const overlapping = new Set<string>();
  const byTrack = groupByTrack(segments);
  for (const arr of byTrack.values()) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i].to > arr[j].from && arr[j].to > arr[i].from) {
          overlapping.add(arr[i].id);
          overlapping.add(arr[j].id);
        } else if (arr[j].from >= arr[i].to) {
          break;
        }
      }
    }
  }
  return overlapping;
}

/** 같은 트랙 내 인접 세그먼트 사이의 공백(gap) 목록. gap > threshold 만 반환. */
export function findGaps(
  segments: DevMotionSegment[],
  threshold = 0.05,
): Array<{ track: string; from: number; to: number }> {
  const gaps: Array<{ track: string; from: number; to: number }> = [];
  const byTrack = groupByTrack(segments);
  for (const [track, arr] of byTrack) {
    for (let i = 0; i < arr.length - 1; i++) {
      const gap = arr[i + 1].from - arr[i].to;
      if (gap > threshold) {
        gaps.push({ track, from: arr[i].to, to: arr[i + 1].from });
      }
    }
  }
  return gaps;
}