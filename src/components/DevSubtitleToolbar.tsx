import { useMemo, useRef } from "react";
import { devTimelineRequestSeek, useDevTimelineState } from "@/lib/devTimeline";

/**
 * 개발용 자막 + 타임라인 툴바.
 * 활성 씬이 publish 한 beats/t/duration 을 시각화한다.
 * - 상단: 현재 화자/대사 자막
 * - 중단: 비트 색상 막대 + 플레이헤드 (드래그/클릭으로 스크럽)
 * - 하단: 재생/일시정지, 시간 표시, 이전/다음 비트 점프
 * 격자 오버레이처럼 dev 모드에서만 표시한다.
 */
const WHO_COLOR: Record<string, string> = {
  narration: "oklch(0.78 0.05 80)",
  ant: "oklch(0.55 0.18 30)",
  ants: "oklch(0.62 0.18 40)",
  gh: "oklch(0.7 0.18 140)",
  country: "oklch(0.7 0.15 80)",
  city: "oklch(0.65 0.18 260)",
  post: "oklch(0.65 0.18 30)",
};

const WHO_LABEL: Record<string, string> = {
  narration: "나레이션",
  ant: "개미",
  ants: "개미들",
  gh: "베짱이",
  country: "시골쥐",
  city: "서울쥐",
  post: "우편 배달쥐",
};

function fmt(t: number) {
  const mm = Math.floor(t / 60);
  const ss = t - mm * 60;
  return `${mm}:${ss.toFixed(1).padStart(4, "0")}`;
}

export function DevSubtitleToolbar({
  paused,
  onTogglePlay,
}: {
  paused: boolean;
  onTogglePlay: () => void;
}) {
  const state = useDevTimelineState();
  const trackRef = useRef<HTMLDivElement>(null);

  const activeBeat = useMemo(() => {
    if (!state) return null;
    return state.beats.find((b) => state.t >= b.from && state.t < b.to) ?? null;
  }, [state]);

  if (!state) {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "8px 10px",
          background: "oklch(0.12 0.02 50 / 0.85)",
          color: "oklch(0.85 0.03 80)",
          fontSize: 10,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          borderTop: "1px solid oklch(0.5 0.05 220 / 0.4)",
          zIndex: 60,
        }}
      >
        ◇ 개발자 타임라인 대기 중 (활성 씬 없음)
      </div>
    );
  }

  const pct = Math.max(0, Math.min(1, state.duration > 0 ? state.t / state.duration : 0));

  const seekFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    devTimelineRequestSeek(ratio * state.duration);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    seekFromEvent(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    seekFromEvent(e.clientX);
  };

  const jumpBeat = (delta: number) => {
    const idx = state.beats.findIndex((b) => state.t >= b.from && state.t < b.to);
    const targetIdx = Math.max(
      0,
      Math.min(state.beats.length - 1, (idx === -1 ? 0 : idx) + delta),
    );
    const target = state.beats[targetIdx];
    if (target) devTimelineRequestSeek(target.from + 0.001);
  };

  const who = activeBeat?.who ?? "narration";
  const whoColor = WHO_COLOR[who] ?? "oklch(0.75 0.05 80)";

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "6px 8px 6px",
        background: "oklch(0.1 0.02 50 / 0.92)",
        color: "oklch(0.95 0.03 80)",
        borderTop: "1px solid oklch(0.55 0.08 220 / 0.5)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {/* 자막 라인 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minHeight: 18,
          fontSize: 11,
          lineHeight: 1.25,
        }}
      >
        <span
          style={{
            flex: "0 0 auto",
            padding: "1px 6px",
            borderRadius: 999,
            background: whoColor,
            color: "oklch(0.12 0.02 50)",
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: 0.3,
          }}
        >
          {WHO_LABEL[who] ?? who}
        </span>
        <span
          style={{
            flex: 1,
            color: activeBeat ? "oklch(0.97 0.03 80)" : "oklch(0.6 0.02 80)",
            fontFamily: "ui-sans-serif, system-ui",
            fontSize: 11,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={activeBeat?.text ?? ""}
        >
          {activeBeat?.text ?? "— (대사 없음)"}
        </span>
      </div>

      {/* 타임라인 트랙 */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          position: "relative",
          height: 14,
          background: "oklch(0.2 0.02 50)",
          borderRadius: 4,
          cursor: "pointer",
          touchAction: "none",
          overflow: "hidden",
        }}
      >
        {/* 비트 색상 막대 */}
        {state.beats.map((b, i) => {
          const left = (b.from / state.duration) * 100;
          const width = ((b.to - b.from) / state.duration) * 100;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                width: `${width}%`,
                top: 2,
                bottom: 2,
                background: WHO_COLOR[b.who] ?? "oklch(0.6 0.05 220)",
                opacity: 0.55,
                borderLeft: "1px solid oklch(0 0 0 / 0.35)",
              }}
              title={`${WHO_LABEL[b.who] ?? b.who} · ${b.from.toFixed(1)}~${b.to.toFixed(1)}s\n${b.text}`}
            />
          );
        })}
        {/* 진행 영역 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct * 100}%`,
            background: "oklch(0.95 0.06 220 / 0.18)",
            pointerEvents: "none",
          }}
        />
        {/* 플레이헤드 */}
        <div
          style={{
            position: "absolute",
            left: `${pct * 100}%`,
            top: -2,
            bottom: -2,
            width: 2,
            background: "oklch(0.95 0.14 80)",
            boxShadow: "0 0 4px oklch(0.95 0.14 80 / 0.9)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* 컨트롤 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
        }}
      >
        <button
          type="button"
          onClick={onTogglePlay}
          style={{
            padding: "2px 8px",
            borderRadius: 4,
            border: "1px solid oklch(0.55 0.08 220 / 0.5)",
            background: paused ? "oklch(0.55 0.16 80 / 0.9)" : "oklch(0.3 0.05 220 / 0.9)",
            color: "oklch(0.98 0.02 80)",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 10,
          }}
        >
          {paused ? "▶ 재생" : "⏸ 정지"}
        </button>
        <button
          type="button"
          onClick={() => jumpBeat(-1)}
          style={btnStyle}
        >
          ◀ 이전
        </button>
        <button
          type="button"
          onClick={() => jumpBeat(1)}
          style={btnStyle}
        >
          다음 ▶
        </button>
        <span style={{ marginLeft: "auto", color: "oklch(0.85 0.03 80)" }}>
          {state.label} · {fmt(state.t)} / {fmt(state.duration)}
        </span>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 4,
  border: "1px solid oklch(0.5 0.05 220 / 0.4)",
  background: "oklch(0.18 0.02 50 / 0.9)",
  color: "oklch(0.92 0.03 80)",
  cursor: "pointer",
  fontSize: 10,
};