import { useMemo, useRef } from "react";
import {
  devTimelineRequestSeek,
  useDevTimelineState,
} from "@/lib/devTimeline";
import {
  findGaps,
  findOverlaps,
  groupByTrack,
  useDevMotionState,
  type DevMotionSegment,
} from "@/lib/devMotionTimeline";

/**
 * 씬 모션 타임라인 툴바.
 * - 트랙별 색상 막대 + 현재 시각(t) 플레이헤드 + 겹침(빨강 아웃라인) / 공백(노랑 하이라이트) 경고
 * - 막대 클릭 → 해당 세그먼트 시작으로 스크럽
 * - 트랙 빈 영역 클릭 → 그 시각으로 스크럽
 */
const TRACK_COLORS = [
  "oklch(0.65 0.15 30)",   // 오렌지
  "oklch(0.65 0.15 260)",  // 블루
  "oklch(0.65 0.15 140)",  // 그린
  "oklch(0.7 0.16 80)",    // 옐로
  "oklch(0.65 0.17 320)",  // 마젠타
  "oklch(0.65 0.14 200)",  // 시안
];

function fmt(t: number) {
  return `${t.toFixed(1)}s`;
}

export function DevMotionToolbar() {
  const timeline = useDevTimelineState();
  const motion = useDevMotionState();
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const overlaps = useMemo(
    () => (motion ? findOverlaps(motion.segments) : new Set<string>()),
    [motion],
  );
  const gaps = useMemo(
    () => (motion ? findGaps(motion.segments, 0.05) : []),
    [motion],
  );
  const byTrack = useMemo<Map<string, DevMotionSegment[]>>(
    () => (motion ? groupByTrack(motion.segments) : new Map()),
    [motion],
  );

  const duration = timeline?.duration ?? 0;
  const t = timeline?.t ?? 0;

  const trackColor = useMemo(() => {
    const m = new Map<string, string>();
    let i = 0;
    if (motion) {
      for (const track of byTrack.keys()) {
        m.set(track, TRACK_COLORS[i % TRACK_COLORS.length]);
        i++;
      }
    }
    return m;
  }, [motion, byTrack]);

  if (!motion || !timeline || duration <= 0) {
    return (
    <div
      style={{
        height: "100%",
        padding: "2px 6px",
        background: "oklch(0.11 0.02 50 / 0.35)",
        color: "oklch(0.7 0.03 80 / 0.9)",
        fontSize: 8,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        borderTop: "1px solid oklch(0.5 0.05 220 / 0.2)",
        display: "flex",
        alignItems: "center",
      }}
    >
      ◇ 모션 타임라인 대기 중 (현재 씬에 등록된 모션 없음)
    </div>
  );
}

  const seek = (clientX: number, el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    devTimelineRequestSeek(ratio * duration);
  };

  const trackList = Array.from(byTrack.keys());
  // 라벨 폭
  const LABEL_W = 64;

  return (
    <div
      style={{
        height: "100%",
        padding: "2px 4px",
        background: "oklch(0.09 0.02 50 / 0.5)",
        borderTop: "1px solid oklch(0.55 0.08 220 / 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        overflowY: "auto",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "oklch(0.92 0.03 80 / 0.95)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 8,
          color: "oklch(0.75 0.03 80 / 0.95)",
          padding: "0 2px 1px",
          borderBottom: "1px dashed oklch(0.4 0.03 220 / 0.25)",
        }}
      >
        <span style={{ fontWeight: 700, color: "oklch(0.85 0.04 80 / 0.95)" }}>
          🎬 모션 타임라인
        </span>
        <span>트랙 {trackList.length} · 세그먼트 {motion.segments.length}</span>
        {overlaps.size > 0 && (
          <span style={{ color: "oklch(0.72 0.2 25 / 0.95)", fontWeight: 700 }}>
            ⚠ 겹침 {overlaps.size / 2}쌍
          </span>
        )}
        {gaps.length > 0 && (
          <span style={{ color: "oklch(0.78 0.16 90 / 0.95)", fontWeight: 700 }}>
            ⚠ 공백 {gaps.length}
          </span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {fmt(t)} / {fmt(duration)}
        </span>
      </div>

      {trackList.length === 0 && (
        <div style={{ fontSize: 8, color: "oklch(0.6 0.02 80 / 0.9)", padding: 2 }}>
          이 씬에 등록된 모션 세그먼트가 없습니다.
        </div>
      )}

      {trackList.map((track) => {
        const segs = byTrack.get(track) ?? [];
        const color = trackColor.get(track) ?? "oklch(0.65 0.1 220)";
        const trackGaps = gaps.filter((g) => g.track === track);
        return (
          <div
            key={track}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 8,
              minHeight: 12,
            }}
          >
            <div
              style={{
                width: LABEL_W,
                flex: "0 0 auto",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: color,
                fontWeight: 700,
                paddingRight: 2,
              }}
              title={track}
            >
              {track}
            </div>
            <div
              ref={(el) => {
                trackRefs.current[track] = el;
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                seek(e.clientX, e.currentTarget as HTMLDivElement);
              }}
              onPointerMove={(e) => {
                if (e.buttons !== 1) return;
                seek(e.clientX, e.currentTarget as HTMLDivElement);
              }}
              style={{
                position: "relative",
                flex: 1,
                height: 10,
                background: "oklch(0.17 0.02 50 / 0.55)",
                borderRadius: 3,
                cursor: "pointer",
                touchAction: "none",
                overflow: "hidden",
              }}
            >
              {/* 공백 하이라이트 */}
              {trackGaps.map((g, i) => {
                const left = (g.from / duration) * 100;
                const width = ((g.to - g.from) / duration) * 100;
                return (
                  <div
                    key={`gap-${i}`}
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      width: `${width}%`,
                      top: 0,
                      bottom: 0,
                      background:
                        "repeating-linear-gradient(45deg, oklch(0.75 0.16 90 / 0.25) 0 3px, transparent 3px 6px)",
                      pointerEvents: "none",
                    }}
                    title={`공백 ${g.from.toFixed(1)}~${g.to.toFixed(1)}s`}
                  />
                );
              })}
              {/* 세그먼트 */}
              {segs.map((seg) => {
                const left = (seg.from / duration) * 100;
                const width = ((seg.to - seg.from) / duration) * 100;
                const active = t >= seg.from && t < seg.to;
                const isOverlap = overlaps.has(seg.id);
                return (
                  <div
                    key={seg.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      devTimelineRequestSeek(seg.from + 0.01);
                    }}
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      width: `${Math.max(0.4, width)}%`,
                      top: 0,
                      bottom: 0,
                      background: color,
                      opacity: active ? 0.95 : 0.6,
                      border: isOverlap
                        ? "1.5px solid oklch(0.7 0.22 25 / 0.95)"
                        : active
                          ? "1px solid oklch(0.95 0.03 80 / 0.8)"
                          : "1px solid oklch(0 0 0 / 0.25)",
                      borderRadius: 2,
                      boxShadow: isOverlap
                        ? "0 0 4px oklch(0.7 0.22 25 / 0.7)"
                        : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "oklch(0.1 0.02 50 / 0.95)",
                      fontSize: 7,
                      fontWeight: 700,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                    title={`${seg.label}\n${seg.from.toFixed(1)}~${seg.to.toFixed(1)}s (${(seg.to - seg.from).toFixed(1)}s)${isOverlap ? "\n⚠ 다른 세그먼트와 겹침" : ""}`}
                  >
                    {width > 4 ? seg.label : ""}
                  </div>
                );
              })}
              {/* 플레이헤드 */}
              <div
                style={{
                  position: "absolute",
                  left: `${(t / duration) * 100}%`,
                  top: -1,
                  bottom: -1,
                  width: 2,
                  background: "oklch(0.95 0.14 80 / 0.95)",
                  boxShadow: "0 0 3px oklch(0.95 0.14 80 / 0.7)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
