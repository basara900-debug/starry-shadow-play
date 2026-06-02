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
const LOOP_SEC = 90; // 전체 씬 2 길이

const ANTS = [ant2, ant4, ant6];

type Line = { from: number; to: number; who: "ant" | "gh" | "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 6,  who: "narration", text: "개미들은 잎과 씨앗을 나르고, 베짱이는 나무 위에서 바이올린을 켠다." },
  { from: 6,  to: 12, who: "ant", text: "영차 영차 열심히 일하자! 이제 곧 겨울이 올 거야. 더 추워지기 전에 열심히 일하자!" },
  { from: 12, to: 18, who: "ant", text: "자, 이것도 가져가고, 요것도 챙겨가자. 어이 친구, 거기 있는 재료 좀 챙겨줘!" },
  { from: 18, to: 24, who: "gh",  text: "개미야, 아직도 열심히 일하고 있네! 아직 겨울은 멀었다구. 나랑 같이 노래 부르면서 좀 쉬자~" },
  { from: 24, to: 32, who: "gh",  text: "개미야, 왜 그렇게 열심히 일하니? 쉬고 싶고 놀고 싶지 않니?" },
  { from: 32, to: 38, who: "narration", text: "베짱이가 개미에게 말을 걸고, 개미 하나가 베짱이를 보며 대화를 시작한다." },
  { from: 38, to: 44, who: "ant", text: "베짱아, 추운 겨울이 얼마 안 남았어. 그때를 대비해서 열심히 일해야 해!" },
  { from: 44, to: 52, who: "gh",  text: "개미야, 일을 많이 했잖아~ 이제 조금 쉬고 우리 같이 놀자!" },
  { from: 52, to: 58, who: "gh",  text: "♪ 랄랄라~ ♪ (베짱이가 점프하며 노래한다)" },
  { from: 58, to: 64, who: "ant", text: "미안해. 하지만 아직 해야 할 게 많아서 우린 계속 일할게." },
  { from: 64, to: 70, who: "gh",  text: "아이고 딱해라, 열심히 일만 하느라 놀지를 못하네. 내가 너희들을 위해 즐거운 노래를 불러줄게!" },
  { from: 70, to: 76, who: "narration", text: "베짱이는 신나게 연주하며 노래하고, 개미들은 그 노래를 들으며 열심히 일한다." },
  { from: 76, to: 82, who: "ant", text: "자, 더 추워지기 전까지 모든 준비를 끝마쳐야 한다! 모두 힘내자!" },
  { from: 82, to: 90, who: "narration", text: "개미들은 더 분주히 일하고, 베짱이는 더 신나게 연주하며 노래를 부른다." },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene2Motion({ speed }: { speed: Scene2Speed }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // BGM — 90초 구간 루프
  useEffect(() => {
    if (!bgmRef.current) {
      const a = new Audio("/audio/scene2_bgm.mp3");
      a.loop = false;
      a.preload = "auto";
      a.volume = 0.45;
      a.addEventListener("timeupdate", () => {
        if (a.currentTime >= 90) {
          a.currentTime = 0;
          a.play().catch(() => {});
        }
      });
      bgmRef.current = a;
    }
    const a = bgmRef.current;
    if (speed === 0) {
      a.pause();
    } else {
      a.playbackRate = speed;
      a.play().catch(() => {});
    }
  }, [speed]);

  useEffect(() => {
    return () => {
      const a = bgmRef.current;
      if (a) {
        a.pause();
        bgmRef.current = null;
      }
    };
  }, []);

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

      {/* 32초~ : 나뭇잎을 짊어진 개미가 베짱이와 마주보고 대화 (중앙 하단 15%) */}
      {t >= 32 && (
        <img
          src={ANTS[0]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "50%",
            bottom: "15%",
            height: "26%",
            width: "auto",
            transform: `translateX(-50%) scaleX(-1) translateY(${Math.sin(t * 3) * 1.5}px)`,
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.4))",
            opacity: Math.min(1, (t - 32) / 0.6),
            transition: "opacity 0.2s linear",
          }}
        />
      )}

      {/* 베짱이 — 우측 중간, 6초마다 포즈 전환 */}
      <div
        className="absolute"
        style={{
          right: "19%",
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

      {/* 대사 자막 */}
      <Subtitle line={currentLine(t)} />
    </div>
  );
}

function Subtitle({ line }: { line: Line | null }) {
  if (!line) return null;
  const palette =
    line.who === "ant"
      ? { bg: "oklch(0.25 0.05 30 / 0.82)", fg: "oklch(0.97 0.02 80)", label: "개미" }
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