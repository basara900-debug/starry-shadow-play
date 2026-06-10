import { useEffect, useRef, useState } from "react";
import { useSceneAudio } from "@/lib/sceneAudio";

/**
 * 씬 5 — 에필로그. 등장인물은 등장하지 않고, 나레이션이 독자(어린이)에게
 * 동화의 교훈을 생각해 보도록 질문을 던진다. 90초 루프.
 */
export type Scene5Speed = 1 | 2 | 0;

const LOOP_SEC = 90;

type Line = { from: number; to: number; who: "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 8,  who: "narration", text: "이렇게 개미와 베짱이의 이야기는 끝이 났어요." },
  { from: 8,  to: 18, who: "narration", text: "여러분은 이 이야기를 보고 어떤 생각이 들었나요?" },
  { from: 18, to: 30, who: "narration", text: "더운 여름에도 쉬지 않고 일한 개미는 왜 그렇게 열심히 일했을까요?" },
  { from: 30, to: 42, who: "narration", text: "노래만 부르던 베짱이는 추운 겨울이 되었을 때 어떤 마음이었을까요?" },
  { from: 42, to: 54, who: "narration", text: "추위에 떨며 찾아온 베짱이를 따뜻하게 맞아준 개미들의 마음은 어땠을까요?" },
  { from: 54, to: 66, who: "narration", text: "만약 여러분이 개미였다면 베짱이에게 어떻게 했을 것 같나요?" },
  { from: 66, to: 78, who: "narration", text: "이 이야기가 우리에게 알려주는 교훈은 무엇일까요?" },
  { from: 78, to: 90, who: "narration", text: "오늘 할 일을 미리 준비하는 마음과, 어려운 친구를 돕는 따뜻한 마음을 함께 기억해요." },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene5Motion({ speed, onComplete }: { speed: Scene5Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // 공용 오디오 버스 — 별도 사운드 파일이 아직 없어 메인 테마를 차분히 깔아준다.
  useSceneAudio({
    bgm: "/audio/main-theme.mp3",
    sfx: null,
    bgmVolume: 0.55,
    sfxVolume: 0,
  });

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next >= LOOP_SEC && !doneRef.current) {
          doneRef.current = true;
          onComplete?.();
        }
        return next % LOOP_SEC;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed, onComplete]);

  const line = currentLine(t);

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* 잔잔한 톤 오버레이 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.95 0.04 85 / 0.18) 0%, oklch(0.25 0.04 60 / 0.35) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* 인디케이터 */}
      <div
        className="absolute"
        style={{
          left: "2%",
          top: "8%",
          background: "oklch(0 0 0 / 0.45)",
          color: "oklch(0.95 0.06 80)",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 999,
        }}
      >
        씬 5 · {Math.floor(t)}s / {LOOP_SEC}s
      </div>

      {line && <Subtitle line={line} />}
    </div>
  );
}

function Subtitle({ line }: { line: Line }) {
  const palette = {
    bg: "oklch(0.97 0.01 90 / 0.88)",
    fg: "oklch(0.22 0.02 50)",
    border: "oklch(0.75 0.02 80 / 0.6)",
    label: "내레이션",
  };
  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: "4%",
        transform: "translateX(-50%)",
        maxWidth: "82%",
        background: palette.bg,
        color: palette.fg,
        padding: "6px 14px",
        borderRadius: 12,
        fontSize: "clamp(11px, 1.8vw, 16px)",
        fontWeight: 600,
        lineHeight: 1.45,
        textAlign: "center",
        border: `1px solid ${palette.border}`,
        boxShadow: "0 6px 18px oklch(0 0 0 / 0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          fontSize: "clamp(9px, 1.1vw, 11px)",
          opacity: 0.85,
          letterSpacing: "0.06em",
          marginBottom: 2,
        }}
      >
        {palette.label}
      </div>
      {line.text}
    </div>
  );
}