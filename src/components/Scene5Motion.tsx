import { useEffect, useRef, useState } from "react";
import { useSceneAudio } from "@/lib/sceneAudio";
import bgmAsset from "@/assets/scene5/scene5_bgm.mp3.asset.json";
import ant1Asset from "@/assets/scene5/ant1.png.asset.json";
import ant2Asset from "@/assets/scene5/ant2.png.asset.json";
import ant3Asset from "@/assets/scene5/ant3.png.asset.json";
import ant4Asset from "@/assets/scene5/ant4.png.asset.json";
import ant5Asset from "@/assets/scene5/ant5.png.asset.json";
import hopper1Asset from "@/assets/scene5/hopper1.png.asset.json";
import hopper2Asset from "@/assets/scene5/hopper2.png.asset.json";
import hopper3Asset from "@/assets/scene5/hopper3.png.asset.json";

const ANT_FRAMES = [ant1Asset.url, ant2Asset.url, ant3Asset.url, ant4Asset.url, ant5Asset.url];
const FRAME_SEC = 6;
const HOPPER_FRAMES = [hopper1Asset.url, hopper2Asset.url, hopper3Asset.url];
const HOPPER_FRAME_SEC = 8;

/**
 * 씬 5 — 에필로그. 등장인물은 등장하지 않고, 나레이션이 독자(어린이)에게
 * 동화의 교훈을 생각해 보도록 질문을 던진다. 90초 루프.
 */
export type Scene5Speed = 1 | 2 | 0;

const LOOP_SEC = 90;

type Line = { from: number; to: number; who: "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 6,  who: "narration", text: "어린이 여러분 이야기는 재미 있었나요?" },
  { from: 12, to: 18, who: "narration", text: "그럼 우리! 생각을 크게 하는 연습을 해 볼까요?" },
  { from: 24, to: 30, who: "narration", text: "여러분은 이 이야기를 보고 어떤 생각을 하게 되었나요?" },
  { from: 36, to: 42, who: "narration", text: "베짱이는 무엇을 잘못했을까요?" },
  { from: 48, to: 54, who: "narration", text: "베짱이가 정말 잘 못한 것일까요?" },
  { from: 60, to: 66, who: "narration", text: "개미는 무엇을 잘 했을까요?" },
  { from: 72, to: 78, who: "narration", text: "모두가 행복해지려면 서로 사이가 어떤게 좋을까요?" },
  { from: 84, to: 90, who: "narration", text: "엄마,아빠랑 한번 이야기를 나눠 보세요! 생각이 커질 거예요!" },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene5Motion({ speed, onComplete }: { speed: Scene5Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 공용 오디오 버스 — 별도 사운드 파일이 아직 없어 메인 테마를 차분히 깔아준다.
  useSceneAudio({
    bgm: bgmAsset.url,
    bgmVolume: 0.55,
    sfxVolume: 0,
  });

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      const next = timeRef.current + dt * speed;
      if (next >= LOOP_SEC && !doneRef.current) {
        doneRef.current = true;
        window.setTimeout(() => onCompleteRef.current?.(), 0);
      }
      timeRef.current = next % LOOP_SEC;
      setT(timeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed]);

  const line = currentLine(t);
  const antFrame = ANT_FRAMES[Math.floor(t / FRAME_SEC) % ANT_FRAMES.length];
  const hopperFrame = HOPPER_FRAMES[Math.floor(t / HOPPER_FRAME_SEC) % HOPPER_FRAMES.length];

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

      {/* 우측 개미 캐릭터 — 6초 간격 5프레임 루프 */}
      <img
        src={antFrame}
        alt="개미 캐릭터"
        style={{
          position: "absolute",
          right: "20%",
          bottom: "40%",
          width: "clamp(66px, 9.6vw, 132px)",
          height: "auto",
          transform: "translate(50%, 0)",
          filter: "drop-shadow(0 6px 12px oklch(0 0 0 / 0.45))",
        }}
      />

      {/* 좌측 베짱이 캐릭터 — 8초 간격 3프레임 루프 */}
      <img
        src={hopperFrame}
        alt="베짱이 캐릭터"
        style={{
          position: "absolute",
          left: "20%",
          top: "40%",
          width: "clamp(66px, 9.6vw, 132px)",
          height: "auto",
          transform: "translate(-50%, 0)",
          filter: "drop-shadow(0 6px 12px oklch(0 0 0 / 0.45))",
        }}
      />
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