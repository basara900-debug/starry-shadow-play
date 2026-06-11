import { useEffect, useRef, useState } from "react";
import antWalk from "@/assets/scene1/ant-walk.png";
import antCarry from "@/assets/scene1/ant-carry.png";
import antPush from "@/assets/scene1/ant-push.png";
import antLeaf from "@/assets/scene1/ant-leaf.png";
import ghViolin from "@/assets/scene1/gh-violin.png";
import ghAsk from "@/assets/scene1/gh-ask.png";
import ghSing from "@/assets/scene1/gh-sing.png";
import { useSceneAudio } from "@/lib/sceneAudio";

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

const BEATS: { from: number; to: number; who: "gh" | "ant" | "narration"; text: string }[] = [
  { from: 0,  to: 6,  who: "narration", text: "어느 무더운 여름! 개미들이 들판에서 열심히 일하고 있었습니다." },
  { from: 6,  to: 12, who: "ant",  text: "영차 영차 열심히 일하자! 오늘 흘리는 땀이 내일에는 큰 보답으로 돌아 올거야" },
  { from: 12, to: 18, who: "narration", text: "그때 어디선가 베짱이 하나가 개미들이 일하는 곳에 나타났습니다." },
  { from: 18, to: 24, who: "gh",   text: "우와 저 개미때들을 봐! 정말 이 더운 여름에 열심히 일하네는군" },
  { from: 24, to: 32, who: "ant",  text: "자 이것도 가져가고, 요것도 챙겨가자, 어이 친구 거기 땅좀 파줘" },
  { from: 32, to: 38, who: "narration", text: "개미들이 열심히 일하는게 신기했던 베짱이는 개미들에게 말을 걸었습니다." },
  { from: 38, to: 44, who: "gh",   text: "개미야 개미야 왜 그렇게 열심히 일하고 있니? 힘들지 않아?" },
  { from: 44, to: 52, who: "ant",  text: "아~ 베짱이구나, 앞으로 다가올 추운 겨울을 대비해서 열심히 일해놔야 하거든!" },
  { from: 52, to: 58, who: "gh",   text: "그렇지만, 아직 겨울이 오려면 시간이 많이 남았어, 힘든데 이제 쉬고, 나랑 같이 놀자 개미야!" },
  { from: 58, to: 64, who: "ant",  text: "미안하지만 우리는 지금 놀 시간이 없어! 그러니 같이 못 놀아, 하지만 너는 재미있게 놀아!" },
  { from: 64, to: 70, who: "gh",   text: "아이고 딱해라! 열심히 일 하느라고 쉬지를 못하네! 그럼 내가 너희들을 위해 즐거운 노래를 불러줄께" },
  { from: 70, to: 76, who: "narration", text: "베짱이는 신나게 연주하고 노래를 했고 개미들은 베짱이의 노래를 들으며 열심히 일을 했습니다." },
  { from: 76, to: 82, who: "ant",  text: "자 이제 해가 지기 전까지 얼마 안 남았어! 모든 일들을 빨리 끝마쳐야 하니 우리 힘내자" },
  { from: 82, to: 90, who: "narration", text: "어느 무더운 여름날! 개미들은 땀 흘리며 열심히 일하고, 베짱이는 신나게 노래했습니다." },
];

const LOOP_SEC = 90;

export function Scene1Motion({ speed, onComplete }: { speed: Scene1Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 공용 오디오 버스에 씬1 BGM/SFX 등록 — 툴바(BGM/SFX/음소거/속도)가 자동 반영된다.
  useSceneAudio({
    bgm: "/audio/scene1_bgm.mp3",
    sfx: "/audio/summer_insects_90s_vfx.wav",
    bgmVolume: 0.85,
    sfxVolume: 1.0,
  });

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next >= LOOP_SEC) {
          onCompleteRef.current?.();
          return next % LOOP_SEC;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed]);

  const beat = BEATS.find((b) => t >= b.from && t < b.to) ?? BEATS[0];

  // 개미 행진 위치 (좌 → 우, 12초 주기)
  const marchT = (t % 12) / 12;
  const antX = (offset: number) => ((marchT + offset) % 1) * 110 - 10;

  // 베짱이 살짝 흔들림
  const sway = Math.sin(t * 2.4) * 2;
  const bob = Math.sin(t * 3.1) * 1.5;

  // 베짱이가 신나게 노래/점프하는 구간: 52–58s, 70–90s
  const partyMode = (t >= 52 && t < 58) || (t >= 70 && t < 90);

  // 베짱이 진입 애니메이션 (0–2.4s): 화면 아래에서 꽃밭 앞쪽으로 살짝 튀어오르며 등장
  const ENTRY_DUR = 2.4;
  const entryP = Math.min(1, Math.max(0, t / ENTRY_DUR));
  // easeOutBack 느낌
  const easeOutBack = (p: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  };
  const eased = easeOutBack(entryP);
  // 시작: 화면 아래로 -60% 내려간 상태, 종료: 0
  const entryOffsetY = (1 - eased) * 60; // %
  const entryOpacity = Math.min(1, entryP * 1.6);
  const entryHop = entryP < 1 ? Math.sin(entryP * Math.PI * 2) * 2 : 0;
  const jump = partyMode ? Math.abs(Math.sin(t * 4)) * 4 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* 개미들 — 바닥(아래쪽) 일렬 행진. 원본 비율 유지를 위해 height 고정 + 자동 width */}
      <Ant src={antLeaf}  x={antX(0)}    bottom={4}  h={26} />
      <Ant src={antCarry} x={antX(0.33)} bottom={3}  h={28} flip />
      <Ant src={antPush}  x={antX(0.66)} bottom={2}  h={27} flip />
      <Ant src={antWalk}  x={antX(0.15)} bottom={6}  h={22} flip />

      {/* 32s 이후 등장하는 대화 상대 개미 — 화면 중앙에서 베짱이(왼쪽)를 바라봄 */}
      {t >= 32 && (
        <img
          src={antWalk}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "36%",
            bottom: "22%",
            height: "22%",
            width: "auto",
            // 베짱이는 왼쪽에 있으므로 개미는 왼쪽을 향해야 함 (원본은 오른쪽 보고 있음 → flip)
          transform: `scaleX(-1) translateY(${Math.sin(t * 3) * 1.2}px)`,
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 2px 3px oklch(0 0 0 / 0.35))",
            opacity: Math.min(1, (t - 32) / 0.6),
          }}
        />
      )}

      {/* 베짱이 — 오른쪽 위쪽 풀잎 위에서 연주/노래 */}
      <div
        className="absolute"
        style={{
          left: "3%",
          bottom: `${42 + jump}%`,
          height: "34%",
          transform: `translate(0, calc(${entryOffsetY + entryHop}% + ${bob}px)) rotate(${sway * 0.6 + (1 - eased) * -8}deg)`,
          opacity: entryOpacity,
          transition: "bottom 0.12s linear",
          transformOrigin: "bottom center",
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
        (() => {
          const palette = beat.who === "ant"
            ? { bg: "oklch(0.32 0.08 50 / 0.85)", fg: "oklch(0.97 0.03 80)", border: "oklch(0.55 0.12 50 / 0.55)" }
            : beat.who === "gh"
            ? { bg: "oklch(0.36 0.13 145 / 0.85)", fg: "oklch(0.98 0.04 110)", border: "oklch(0.65 0.16 145 / 0.55)" }
            : { bg: "oklch(0.97 0.01 90 / 0.88)", fg: "oklch(0.22 0.02 50)", border: "oklch(0.75 0.02 80 / 0.6)" };
          return (
            <div
              className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-center"
              style={{
                top: "4%",
                maxWidth: "82%",
                background: palette.bg,
                color: palette.fg,
                border: `1px solid ${palette.border}`,
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
          );
        })()
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
