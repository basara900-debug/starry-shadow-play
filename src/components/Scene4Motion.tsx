import { useEffect, useRef, useState } from "react";
import gh1 from "@/assets/scene3/gh-1.png";
import gh2 from "@/assets/scene3/gh-2.png";
import gh3 from "@/assets/scene3/gh-3.png";
import ant2 from "@/assets/scene2/ant-2.png";
import ant4 from "@/assets/scene2/ant-4.png";
import ant6 from "@/assets/scene2/ant-6.png";

/**
 * 씬 4 — 따뜻한 오두막 안. 베짱이와 개미들의 화해와 노래.
 * 90초 루프, 끝나면 onComplete 호출.
 */
export type Scene4Speed = 1 | 2 | 0;

const GH_POSES = [gh1, gh2, gh3];
const ANTS = [ant2, ant4, ant6];
const POSE_INTERVAL = 6; // 초
const FADE = 0.8;
const LOOP_SEC = 90;

type Line = { from: number; to: number; who: "gh" | "ant" | "ants" | "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 6,  who: "narration", text: "너무도 따뜻한 집안으로 들어오자 베짱이는 너무 기뻐 눈물을 흘렸어요." },
  { from: 6,  to: 12, who: "ant", text: "베짱이야 너무 추웠지? 배고프진 않았니? 며칠동안 아무것도 먹지 못했지!" },
  { from: 12, to: 18, who: "gh",  text: "개미야 너무 춥고 배고팠어. 진즉에 니 말을 들었으면 좋을 걸 그랬어." },
  { from: 18, to: 24, who: "ant", text: "아니야, 베짱이 니 덕에 힘든 일을 해도 즐겁고 기운나게 할 수 있었어. 어서 이리로 와 같이 밥 먹자." },
  { from: 24, to: 30, who: "gh",  text: "흑, 흑, 흑. 고마워 개미야, 이렇게 반갑게 맞아줘서." },
  { from: 30, to: 36, who: "narration", text: "베짱이는 개미들의 친절에 얼은 몸을 녹이고 맛있는 밥을 배부르게 먹을 수 있었어요." },
  { from: 36, to: 42, who: "gh",  text: "고마워, 덕분에 지금 너무 행복해. 이럴 때 내 노래와 연주가 빠지면 안되지!" },
  { from: 42, to: 48, who: "narration", text: "배부르고 따뜻해진 베짱이는 신나게 연주와 노래를 부르기 시작했어요." },
  { from: 48, to: 54, who: "gh",  text: "나는 나는 베짱이, 이 들판에 제일가는 음악가, 친절한 개미들의 친구, 너무나 행복해!" },
  { from: 54, to: 60, who: "narration", text: "벽난로에서는 장작이 타닥타닥 타는 소리가 들리고, 베짱이와 개미는 같이 노래를 부르고 춤을 추었습니다." },
  { from: 60, to: 66, who: "ant", text: "베짱이야, 역시 네 노래는 모두를 즐겁게 하는 힘이 있어. 이번 겨울 우리랑 지내고 내년에도 잘 부탁해!" },
  { from: 66, to: 72, who: "gh",  text: "그래 개미야, 우린 친한 친구들이야. 나도 다음 해에는 잘 부탁해." },
  { from: 72, to: 78, who: "ants", text: "자, 이제 또 신나게 놀자구!" },
  { from: 78, to: 84, who: "gh",  text: "자, 다음 노래를 시작한다. 가자!" },
  { from: 84, to: 90, who: "narration", text: "추운 겨울이 다가와도 이제 개미와 베짱이는 아무 걱정 없이 사이좋게 행복했답니다." },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene4Motion({ speed, onComplete }: { speed: Scene4Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const doneRef = useRef(false);

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

  // 베짱이 포즈 전환
  const cycle = POSE_INTERVAL * GH_POSES.length;
  const tt = ((t % cycle) + cycle) % cycle;
  const idx = Math.floor(tt / POSE_INTERVAL);
  const localT = tt - idx * POSE_INTERVAL;
  const nextIdx = (idx + 1) % GH_POSES.length;
  const fadeIn = localT > POSE_INTERVAL - FADE ? (localT - (POSE_INTERVAL - FADE)) / FADE : 0;

  const bob = Math.sin(t * 2.4) * 2;
  const sway = Math.sin(t * 1.8) * 1.5;

  // 개미들 - 식탁 주변에 모여있다가 60초부터 춤추듯 좌우로 움직임
  const dance = t >= 54 ? Math.sin(t * 3) * 4 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* 따뜻한 오두막 내부 톤 오버레이 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 65%, oklch(0.55 0.12 55 / 0.15) 0%, oklch(0.25 0.08 35 / 0.35) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* 베짱이 — 좌측 중앙 */}
      <div
        className="absolute"
        style={{
          left: "32%",
          bottom: "14%",
          height: "38%",
          transform: `translate(-50%, ${bob}px) rotate(${sway * 0.3}deg)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.4))",
        }}
      >
        <div style={{ position: "relative", height: "100%" }}>
          <img
            src={GH_POSES[idx]}
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
              src={GH_POSES[nextIdx]}
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

      {/* 개미들 — 우측에 모여 식탁 주변에 있다가 춤춤 */}
      <img
        src={ANTS[0]}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: `${58 + dance * 0.3}%`,
          bottom: "12%",
          height: "22%",
          width: "auto",
          transform: `scaleX(-1) translateY(${Math.sin(t * 2.6) * 1.5}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.4))",
        }}
      />
      <img
        src={ANTS[1]}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: `${70 + dance * 0.5}%`,
          bottom: "10%",
          height: "24%",
          width: "auto",
          transform: `scaleX(-1) translateY(${Math.sin(t * 2.2 + 1) * 1.5}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.4))",
        }}
      />
      <img
        src={ANTS[2]}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: `${82 + dance * 0.4}%`,
          bottom: "13%",
          height: "20%",
          width: "auto",
          transform: `scaleX(-1) translateY(${Math.sin(t * 3.1 + 2) * 1.5}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.4))",
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
        씬 4 · {Math.floor(t)}s / {LOOP_SEC}s
      </div>

      <Subtitle line={currentLine(t)} />
    </div>
  );
}

function Subtitle({ line }: { line: Line | null }) {
  if (!line) return null;
  const palette =
    line.who === "ant" || line.who === "ants"
      ? { bg: "oklch(0.25 0.05 30 / 0.82)", fg: "oklch(0.97 0.02 80)", label: line.who === "ants" ? "개미들" : "개미" }
      : line.who === "gh"
      ? { bg: "oklch(0.32 0.12 140 / 0.82)", fg: "oklch(0.98 0.04 110)", label: "베짱이" }
      : { bg: "oklch(0.18 0 0 / 0.78)", fg: "oklch(0.95 0 0)", label: "내레이션" };
  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: "4%",
        transform: "translateX(-50%)",
        maxWidth: "84%",
        background: palette.bg,
        color: palette.fg,
        padding: "10px 16px",
        borderRadius: 12,
        fontSize: 16,
        lineHeight: 1.45,
        textAlign: "center",
        boxShadow: "0 6px 18px oklch(0 0 0 / 0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.85,
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {palette.label}
      </div>
      {line.text}
    </div>
  );
}