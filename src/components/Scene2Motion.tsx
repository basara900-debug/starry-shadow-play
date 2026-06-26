import { useEffect, useRef, useState } from "react";
import gh2 from "@/assets/scene2/gh-2.png";
import gh3 from "@/assets/scene2/gh-3.png";
import gh5 from "@/assets/scene2/gh-5.png";
import gh6 from "@/assets/scene2/gh-6.png";
import ant2 from "@/assets/scene2/ant-2.png";
import ant4 from "@/assets/scene2/ant-4.png";
import ant6 from "@/assets/scene2/ant-6.png";
import { useSceneAudio, useSceneAudioState } from "@/lib/sceneAudio";
import beatsData from "@/assets/scene2-beats.json";
import { useSceneBeatPlayback, type SceneBeat } from "@/lib/sceneTts";

/**
 * 씬 2 모션 — 가을, 베짱이는 우측 중간에서 6초마다 포즈 전환,
 * 개미들은 우→좌 행진.
 */
export type Scene2Speed = 1 | 2 | 0;

const GH_POSES = [gh2, gh3, gh5, gh6];
const GH_INTERVAL = 6; // 초
const ANTS = [ant2, ant4, ant6];

const BEATS = beatsData as SceneBeat[];
const LAST_END = BEATS[BEATS.length - 1].to;
const LOOP_SEC = Math.ceil(LAST_END + 1.5);
// 베짱이가 처음 말하는 시점, 개미가 베짱이에게 답하는 시점 — 모션 동기화 키
const FIRST_GH_BEAT = BEATS.find((b) => b.who === "gh")!;
const ANT_REPLY_BEAT = BEATS.find((b) => b.who === "ant" && /베짱이/.test(b.text))!;

function currentLine(t: number): SceneBeat | null {
  return BEATS.find((b) => t >= b.from && t < b.to) ?? null;
}

export function Scene2Motion({ speed, onComplete }: { speed: Scene2Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 공용 오디오 버스에 BGM/SFX를 등록 — 볼륨/음소거/속도/일시정지는 자동 적용.
  useSceneAudio({
    bgm: "/audio/scene2_bgm.mp3",
    sfx: "/audio/scene2_sfx.mp3",
    bgmVolume: 0.35,
    sfxVolume: 0.35,
  });
  const audioState = useSceneAudioState();
  useSceneBeatPlayback(BEATS, t, speed, audioState);

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

      {/* 개미가 베짱이에게 답하는 비트 이후, 마주보고 대화 (중앙 하단 15%) */}
      {t >= ANT_REPLY_BEAT.from && (
        <img
          src={ANTS[0]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "60%",
            bottom: "15%",
            height: "26%",
            width: "auto",
            transform: `translateX(-50%) scaleX(-1) translateY(${Math.sin(t * 3) * 1.5}px)`,
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.4))",
            opacity: Math.min(1, (t - ANT_REPLY_BEAT.from) / 0.6),
            transition: "opacity 0.2s linear",
          }}
        />
      )}

      {/* 베짱이 — 우측 중간, 6초마다 포즈 전환 */}
      <div
        className="absolute"
        style={{
          right: "13%",
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
        씬 2 · {t.toFixed(1)}s / {LOOP_SEC}s
      </div>

      {/* 대사 자막 */}
      <Subtitle line={currentLine(t)} />
    </div>
  );
}

function Subtitle({ line }: { line: SceneBeat | null }) {
  if (!line) return null;
  const palette =
    line.who === "ant"
      ? { bg: "oklch(0.32 0.08 50 / 0.85)", fg: "oklch(0.97 0.03 80)", border: "oklch(0.55 0.12 50 / 0.55)", label: "개미" }
      : line.who === "gh"
      ? { bg: "oklch(0.36 0.13 145 / 0.85)", fg: "oklch(0.98 0.04 110)", border: "oklch(0.65 0.16 145 / 0.55)", label: "베짱이" }
      : { bg: "oklch(0.97 0.01 90 / 0.88)", fg: "oklch(0.22 0.02 50)", border: "oklch(0.75 0.02 80 / 0.6)", label: "내레이션" };
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