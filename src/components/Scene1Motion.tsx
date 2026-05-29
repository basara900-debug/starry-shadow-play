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
  { from: 6,  to: 12, who: "ant",  text: "개미들: 영차 영차 열심히 일하자! 오늘 흘린 땀이 내일에는 큰 보답으로 돌아 올 거야!" },
  { from: 12, to: 18, who: "ant",  text: "개미들: 자 이것도 가져가고, 요것도 챙겨가자~ 어이 친구, 거기 땅 좀 파줘!" },
  { from: 18, to: 24, who: "gh",   text: "베짱이: 우와 저 개미떼들을 봐! 정말 이 더운 여름에 열심히 일하네. 정말 힘들게 사는군." },
  { from: 24, to: 32, who: "gh",   text: "베짱이: 개미야 개미야~ 왜 그렇게 열심히 일하니? 힘들지 않아?" },
  { from: 32, to: 38, who: "none", text: "(베짱이가 연주를 멈추고 다가가자, 개미 한 마리가 베짱이를 바라본다)" },
  { from: 38, to: 44, who: "ant",  text: "개미: 응 베짱아, 앞으로 다가올 추운 겨울을 대비해서 열심히 일해야 해!" },
  { from: 44, to: 52, who: "gh",   text: "베짱이: 아직 겨울까지는 시간 많아~ 우리 같이 놀자!" },
  { from: 52, to: 58, who: "gh",   text: "베짱이: ♪ 랄랄라~ 여름은 즐거워 ♪" },
  { from: 58, to: 64, who: "ant",  text: "개미: 우리는 놀 시간이 없어. 미안하지만 계속 일할게." },
  { from: 64, to: 70, who: "gh",   text: "베짱이: 아이고 딱해라~ 일만 하느라 놀지를 못하네. 내가 너희를 위해 즐거운 노래를 불러줄게!" },
  { from: 70, to: 76, who: "gh",   text: "베짱이: ♪ 라라라~ 신나는 여름의 노래 ♪ (개미들은 노래를 들으며 부지런히 일한다)" },
  { from: 76, to: 82, who: "ant",  text: "개미들: 자, 해가 지기 전까지 모든 일을 끝마쳐야 한다. 모두 힘내자!" },
  { from: 82, to: 90, who: "none", text: "(개미들은 더 분주히 일하고, 베짱이는 더욱 신나게 연주하며 노래한다)" },
];

const LOOP_SEC = 90;

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
  // 우 → 좌 방향 행진
  const antX = (offset: number) => 100 - ((marchT + offset) % 1) * 110;

  // 베짱이 살짝 흔들림
  const sway = Math.sin(t * 2.4) * 2;
  const bob = Math.sin(t * 3.1) * 1.5;

  // 베짱이가 신나게 노래/점프하는 구간: 52–58s, 70–90s
  const partyMode = (t >= 52 && t < 58) || (t >= 70 && t < 90);
  const jump = partyMode ? Math.abs(Math.sin(t * 4)) * 4 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* 개미들 — 바닥(아래쪽) 일렬 행진. 원본 비율 유지를 위해 height 고정 + 자동 width */}
      <Ant src={antLeaf}  x={antX(0)}    bottom={4}  h={26} flip />
      <Ant src={antCarry} x={antX(0.33)} bottom={3}  h={28} flip />
      <Ant src={antPush}  x={antX(0.66)} bottom={2}  h={27} flip />
      <Ant src={antWalk}  x={antX(0.15)} bottom={6}  h={22} />

      {/* 베짱이 — 오른쪽 위쪽 풀잎 위에서 연주/노래 */}
      <div
        className="absolute"
        style={{
          left: "3%",
          bottom: `${42 + jump}%`,
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
            top: "4%",
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
