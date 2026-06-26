import { useEffect, useRef, useState } from "react";
import antWalk from "@/assets/scene1/ant-walk.png";
import antCarry from "@/assets/scene1/ant-carry.png";
import antPush from "@/assets/scene1/ant-push.png";
import antLeaf from "@/assets/scene1/ant-leaf.png";
import ghViolin from "@/assets/scene1/gh-violin.png";
import ghAsk from "@/assets/scene1/gh-ask.png";
import ghSing from "@/assets/scene1/gh-sing.png";
import { useSceneAudio } from "@/lib/sceneAudio";
import beatsData from "@/assets/scene1-beats.json";

/**
 * 씬 1 모션 프레임 — TTS 음성과 자막/모션이 싱크된다.
 * 비트 타임라인(from/to)은 실제 생성된 TTS 음성 길이로 계산됨 (src/assets/scene1-beats.json).
 * speed: 1 | 2 | 0(=정지)
 */
export type Scene1Speed = 1 | 2 | 0;

type Beat = { i: number; who: "gh" | "ant" | "narration"; text: string; file: string; dur: number; from: number; to: number };
const BEATS = beatsData as Beat[];
const LAST_END = BEATS[BEATS.length - 1].to;
const LOOP_SEC = Math.ceil(LAST_END + 1.5); // TTS 끝난 뒤 약간의 여백

// 모션 동기화 키 타이밍 (대사 시작 시점에 맞춤)
const FIRST_GH_BEAT = BEATS.find((b) => b.who === "gh")!;
const ANT_REPLY_BEAT = BEATS.find((b, idx) => idx > 0 && b.who === "gh" && /개미야/.test(b.text))!;
const SING_START_BEAT = BEATS.find((b) => /노래를 불러/.test(b.text))!;
const SING_END = LAST_END;

export function Scene1Motion({ speed, onComplete }: { speed: Scene1Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 공용 오디오 버스에 씬1 BGM/SFX 등록 — 툴바(BGM/SFX/음소거/속도)가 자동 반영된다.
  useSceneAudio({
    bgm: "/audio/scene1_bgm.mp3",
    sfx: "/audio/summer_insects_90s_vfx.wav",
    bgmVolume: 0.35, // TTS 가청성을 위해 BGM 낮춤
    sfxVolume: 1.0,
  });

  // TTS 오디오 풀
  const audioRef = useRef<HTMLAudioElement[]>([]);
  const activeIdxRef = useRef<number>(-1);
  useEffect(() => {
    audioRef.current = BEATS.map((b) => {
      const a = new Audio(b.file);
      a.preload = "auto";
      a.volume = 1;
      return a;
    });
    return () => {
      audioRef.current.forEach((a) => { a.pause(); a.src = ""; });
      audioRef.current = [];
      activeIdxRef.current = -1;
    };
  }, []);

  // 속도/정지 반영
  useEffect(() => {
    audioRef.current.forEach((a) => {
      if (speed === 0) a.pause();
      else a.playbackRate = speed;
    });
  }, [speed]);

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
      const looped = next % LOOP_SEC;
      if (looped < timeRef.current) {
        // 루프 — 모든 TTS 멈춤
        audioRef.current.forEach((a) => { a.pause(); a.currentTime = 0; });
        activeIdxRef.current = -1;
      }
      timeRef.current = looped;
      setT(timeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed]);

  const beat = BEATS.find((b) => t >= b.from && t < b.to) ?? BEATS[0];

  // 비트 진입 시 해당 TTS 재생
  useEffect(() => {
    if (speed === 0) return;
    const idx = BEATS.findIndex((b) => t >= b.from && t < b.to);
    if (idx === -1) return;
    if (activeIdxRef.current === idx) return;
    const prev = activeIdxRef.current;
    if (prev >= 0 && audioRef.current[prev]) {
      audioRef.current[prev].pause();
      audioRef.current[prev].currentTime = 0;
    }
    const a = audioRef.current[idx];
    if (a) {
      a.currentTime = Math.max(0, t - BEATS[idx].from);
      a.playbackRate = speed;
      a.play().catch(() => {});
    }
    activeIdxRef.current = idx;
  }, [t, speed]);

  // 개미 행진 위치 (좌 → 우, 12초 주기)
  const marchT = (t % 12) / 12;
  const antX = (offset: number) => ((marchT + offset) % 1) * 110 - 10;

  // 베짱이 살짝 흔들림
  const sway = Math.sin(t * 2.4) * 2;
  const bob = Math.sin(t * 3.1) * 1.5;

  // 베짱이가 신나게 노래/점프 — 노래 시작 대사부터 씬 끝까지
  const partyMode = t >= SING_START_BEAT.from && t < SING_END;

  // 베짱이 진입 — 첫 베짱이 대사 시작 직전에 튀어오르며 등장
  const ENTRY_DUR = 2.4;
  const entryStart = Math.max(0, FIRST_GH_BEAT.from - ENTRY_DUR);
  const entryP = Math.min(1, Math.max(0, (t - entryStart) / ENTRY_DUR));
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

      {/* 베짱이가 개미에게 직접 말 걸 때 등장하는 대화 상대 개미 */}
      {t >= ANT_REPLY_BEAT.from && (
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
            opacity: Math.min(1, (t - ANT_REPLY_BEAT.from) / 0.6),
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
        씬 1 · {t.toFixed(1)}s / {LOOP_SEC}s · 비트 {beat.i + 1}/{BEATS.length}
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
