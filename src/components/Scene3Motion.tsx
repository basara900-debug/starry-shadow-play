import { useEffect, useRef, useState } from "react";
import gh1 from "@/assets/scene3/gh-1.png";
import gh2 from "@/assets/scene3/gh-2.png";
import gh3 from "@/assets/scene3/gh-3.png";

/**
 * 씬 3 — 겨울 배경 위의 베짱이 캐릭터.
 * 좌측 25%, 하단 10% 부근에 배치되고 8초마다 포즈가 자연스럽게 전환된다.
 */
export type Scene3Speed = 1 | 2 | 0;

const POSES = [gh1, gh2, gh3];
const POSE_INTERVAL = 8; // 초
const FADE = 0.9; // 페이드 구간(초)

export function Scene3Motion({ speed }: { speed: Scene3Speed }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => prev + dt * speed);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed]);

  const cycle = POSE_INTERVAL * POSES.length;
  const tt = ((t % cycle) + cycle) % cycle;
  const idx = Math.floor(tt / POSE_INTERVAL);
  const localT = tt - idx * POSE_INTERVAL; // 0~POSE_INTERVAL
  const nextIdx = (idx + 1) % POSES.length;

  // 다음 포즈로의 페이드 비율 (0~1)
  const fadeIn = localT > POSE_INTERVAL - FADE
    ? (localT - (POSE_INTERVAL - FADE)) / FADE
    : 0;

  // 살짝 떨림/숨쉬는 듯한 미세 모션
  const bob = Math.sin(t * 1.6) * 0.6;
  const shiver = idx === 0 ? Math.sin(t * 22) * 0.6 : 0; // 첫 포즈(떠는 베짱이)는 가볍게 진동

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div
        className="absolute"
        style={{
          left: "25%",
          bottom: "10%",
          height: "44%",
          transform: `translate(-50%, ${bob}px) translateX(${shiver}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.35))",
        }}
      >
        <div style={{ position: "relative", height: "100%" }}>
          <img
            src={POSES[idx]}
            alt=""
            draggable={false}
            style={{
              height: "100%",
              width: "auto",
              display: "block",
              opacity: 1 - fadeIn,
              transition: "opacity 80ms linear",
            }}
          />
          {fadeIn > 0 && (
            <img
              src={POSES[nextIdx]}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                height: "100%",
                width: "auto",
                display: "block",
                opacity: fadeIn,
                transition: "opacity 80ms linear",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}