import { useEffect, useRef, useState } from "react";
import antWalk from "@/assets/scene1/ant-walk.png";
import antCarry from "@/assets/scene1/ant-carry.png";
import antPush from "@/assets/scene1/ant-push.png";
import antLeaf from "@/assets/scene1/ant-leaf.png";
import ghViolin from "@/assets/scene1/gh-violin.png";
import ghAsk from "@/assets/scene1/gh-ask.png";
import ghSing from "@/assets/scene1/gh-sing.png";

/**
 * 씬 1 모션 프레임 — 여름날 열심히 일하는 개미와 놀고 있는 베짱이
 *
 * 비트(초, 1x 기준):
 *  0–6   개미들 줄지어 일함 + 베짱이 바이올린 연주
 *  6–12  베짱이가 개미에게 "왜 이렇게 일해? 힘들지 않아?"
 *  12–18 개미: "추운 겨울을 대비해서 열심히 일해야 해."
 *  18–24 베짱이: "아직 시간 많아! 같이 놀자~"
 *  24–32 베짱이 신나게 노래/연주, 개미는 계속 일함 (루프)
 *
 * speed: 1 | 2 | 0(=정지)
 */
export type Scene1Speed = 1 | 2 | 0;

const BEATS: { from: number; to: number; who: "gh" | "ant" | "none"; text: string }[] = [
  { from: 0,  to: 6,  who: "none", text: "" },
  { from: 6,  to: 12, who: "gh",   text: "베짱이: 왜 그렇게 열심히 일하니? 힘들지 않아?" },
  { from: 12, to: 18, who: "ant",  text: "개미: 추운 겨울을 대비해서 열심히 일해야 해!" },
  { from: 18, to: 24, who: "gh",   text: "베짱이: 아직 시간 많아~ 같이 놀자!" },
  { from: 24, to: 32, who: "gh",   text: "베짱이: ♪ 라라라~ 여름은 즐거워 ♪" },
];

const LOOP_SEC = 32;

export function Scene1Motion({ speed }: { speed: Scene1Speed }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => (prev + dt * speed) % LOOP_SEC);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed]);

  const beat = BEATS.find((b) => t >= b.from && t < b.to) ?? BEATS[0];

  // 개미 행진 위치 (왼쪽 → 오른쪽, 12초 주기)
  const marchT = (t % 12) / 12;
  const antX = (offset: number) => ((marchT + offset) % 1) * 110 - 10; // %

  // 베짱이 살짝 흔들림
  const sway = Math.sin(t * 2.4) * 2;
  const bob = Math.sin(t * 3.1) * 1.5;

  // 베짱이는 24초 이후 점프하며 노래
  const partyMode = t >= 24;
  const jump = partyMode ? Math.abs(Math.sin(t * 4)) * 4 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* 개미들 — 바닥(아래쪽) 일렬 행진. 원본 비율 유지를 위해 height 고정 + 자동 width */}
      <Ant src={antLeaf}  x={antX(0)}    bottom={4}  h={26} />
      <Ant src={antCarry} x={antX(0.33)} bottom={3}  h={28} />
      <Ant src={antPush}  x={antX(0.66)} bottom={2}  h={27} />
      <Ant src={antWalk}  x={antX(0.15)} bottom={6}  h={22} flip />

      {/* 베짱이 — 오른쪽 위쪽 풀잎 위에서 연주/노래 */}
      <div
        className="absolute"
        style={{
          right: "6%",
          bottom: `${16 + jump}%`,
          height: "34%",
          transform: `translateY(${bob}px) rotate(${sway * 0.6}deg)`,
          transition: "bottom 0.12s linear",
        }}
      >
        <img
          src={partyMode ? ghSing : beat.who === "gh" && beat.text.includes("?") ? ghAsk : ghViolin}
          alt=""
          className="h-full w-auto"
          style={{
            filter: partyMode
              ? "drop-shadow(0 4px 8px oklch(0 0 0 / 0.4))"
              : "drop-shadow(0 3px 5px oklch(0 0 0 / 0.35))",
          }}
          draggable={false}
        />
        {/* 음표 */}
        {partyMode && <Notes />}
      </div>

      {/* 대사 자막 */}
      {beat.text && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-center"
          style={{
            bottom: "2%",
            maxWidth: "82%",
            background: "oklch(0.18 0.02 50 / 0.78)",
            color: "oklch(0.97 0.05 85)",
            border: "1px solid oklch(0.85 0.1 80 / 0.5)",
            fontSize: "clamp(11px, 1.8vw, 16px)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            boxShadow: "0 6px 18px oklch(0 0 0 / 0.4)",
            animation: "fade-in 0.4s ease-out",
          }}
          key={beat.from}
        >
          {beat.text}
        </div>
      )}

      {/* 좌상단 비트 인디케이터 */}
      <div
        className="absolute"
        style={{
          left: "2%", top: "8%",
          background: "oklch(0 0 0 / 0.45)",
          color: "oklch(0.95 0.06 80)",
          fontSize: 10, padding: "2px 8px", borderRadius: 999,
        }}
      >
        씬 1 · {Math.floor(t)}s / {LOOP_SEC}s
      </div>
    </div>
  );
}

function Ant({
  src, x, bottom, h, flip = false,
}: { src: string; x: number; bottom: number; h: number; flip?: boolean }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="absolute"
      style={{
        left: `${x}%`,
        bottom: `${bottom}%`,
        height: `${h}%`,
        width: "auto",
        transform: flip ? "scaleX(-1)" : undefined,
        filter: "drop-shadow(0 2px 3px oklch(0 0 0 / 0.35))",
      }}
    />
  );
}

function Notes() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute text-2xl"
          style={{
            right: `${-10 - i * 8}%`,
            top: `${10 + i * 12}%`,
            color: "oklch(0.25 0.04 55)",
            opacity: 0.85,
            animation: `note-float 1.4s ease-in ${i * 0.25}s infinite`,
          }}
        >
          ♪
        </span>
      ))}
    </>
  );
}
