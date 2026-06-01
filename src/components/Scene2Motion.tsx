import { useEffect, useRef, useState } from "react";
import gh2 from "@/assets/scene2/gh-2.png";
import gh3 from "@/assets/scene2/gh-3.png";
import gh5 from "@/assets/scene2/gh-5.png";
import gh6 from "@/assets/scene2/gh-6.png";
import ant2 from "@/assets/scene2/ant-2.png";
import ant4 from "@/assets/scene2/ant-4.png";
import ant6 from "@/assets/scene2/ant-6.png";

/**
 * 씬 2 모션 — 가을, 베짱이는 우측 중간에서 6초마다 포즈 전환,
 * 개미들은 우→좌 행진.
 */
export type Scene2Speed = 1 | 2 | 0;

const GH_POSES = [gh2, gh3, gh5, gh6];
const GH_INTERVAL = 6; // 초
const LOOP_SEC = GH_POSES.length * GH_INTERVAL; // 24s

const ANTS = [ant2, ant4, ant6];

export function Scene2Motion({ speed }: { speed: Scene2Speed }) {
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

  // 베짱이 현재 포즈
  const ghIdx = Math.floor(t / GH_INTERVAL) % GH_POSES.length;
  const ghLocalT = (t % GH_INTERVAL) / GH_INTERVAL; // 0~1
  // 페이드 인/아웃: 0~0.12 in, 0.88~1 out
  const ghOpacity =
    ghLocalT < 0.12 ? ghLocalT / 0.12 : ghLocalT > 0.88 ? (1 - ghLocalT) / 0.12 : 1;
  const sway = Math.sin(t * 2) * 2;
  const bob = Math.sin(t * 2.8) * 2;

  // 개미 행진: 우 → 좌, 14초 주기
  const marchT = (t % 14) / 14;
  const antX = (offset: number) => 100 - (((marchT + offset) % 1) * 115 - 8);

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* 개미들 — 우→좌 이동, 좌측을 향함 */}
      <Ant src={ANTS[0]} x={antX(0)}    bottom={4} h={24} />
      <Ant src={ANTS[1]} x={antX(0.33)} bottom={6} h={22} />
      <Ant src={ANTS[2]} x={antX(0.66)} bottom={3} h={26} />

      {/* 베짱이 — 우측 중간, 6초마다 포즈 전환 */}
      <div
        className="absolute"
        style={{
          right: "4%",
          top: "38%",
          height: "30%",
          transform: `translateY(${bob}px) rotate(${sway * 0.4}deg)`,
          opacity: ghOpacity,
          transformOrigin: "bottom center",
          transition: "opacity 0.2s linear",
        }}
      >
        <img
          key={ghIdx}
          src={GH_POSES[ghIdx]}
          alt=""
          draggable={false}
          className="h-full w-auto"
          style={{
            filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.35))",
          }}
        />
      </div>

      {/* 좌상단 비트 인디케이터 */}
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
        씬 2 · {Math.floor(t)}s / {LOOP_SEC}s
      </div>
    </div>
  );
}

function Ant({
  src,
  x,
  bottom,
  h,
}: {
  src: string;
  x: number;
  bottom: number;
  h: number;
}) {
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
        transformOrigin: "bottom center",
        filter: "drop-shadow(0 2px 3px oklch(0 0 0 / 0.35))",
      }}
    />
  );
}