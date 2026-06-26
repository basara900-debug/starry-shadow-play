import { useEffect, useRef, useState } from "react";
import ghA from "@/assets/scene4/gh_a.png.asset.json";
import ghB from "@/assets/scene4/gh_b.png.asset.json";
import ghC from "@/assets/scene4/gh_c.png.asset.json";
import ghD from "@/assets/scene4/gh_d.png.asset.json";
import antA from "@/assets/scene4/ant_a.png.asset.json";
import antB from "@/assets/scene4/ant_b.png.asset.json";
import antC from "@/assets/scene4/ant_c.png.asset.json";
import antD from "@/assets/scene4/ant_d.png.asset.json";
import antE from "@/assets/scene4/ant_e.png.asset.json";
import antF from "@/assets/scene4/ant_f.png.asset.json";
import ant1 from "@/assets/scene4/ant1.png.asset.json";
import ant2 from "@/assets/scene4/ant2.png.asset.json";
import ant3 from "@/assets/scene4/ant3.png.asset.json";
import ant4 from "@/assets/scene4/ant4.png.asset.json";
import bgmAsset from "@/assets/scene4/scene4_bgm.mp3.asset.json";
import sfxAsset from "@/assets/scene4/scene4_sfx.mp3.asset.json";
import { useSceneAudio, useSceneAudioState } from "@/lib/sceneAudio";
import beatsData from "@/assets/scene4-beats.json";
import { useSceneBeatPlayback, type SceneBeat } from "@/lib/sceneTts";
import { useDevTimelineSync } from "@/lib/devTimeline";

/**
 * 씬 4 — 따뜻한 오두막 안. 베짱이와 개미들의 화해와 노래.
 * 90초 루프, 끝나면 onComplete 호출.
 */
export type Scene4Speed = 1 | 2 | 0;

const BEATS = beatsData as SceneBeat[];
const LAST_END = BEATS[BEATS.length - 1].to;
const LOOP_SEC = Math.ceil(LAST_END + 1.5);

// 모션 동기화 키 — 노래 시작/마무리 비트
const SONG_START_BEAT = BEATS.find((b) => /신나는 노래/.test(b.text)) ?? BEATS[6];
const SONG_END_BEAT = BEATS.find((b) => /다음 노래를 시작/.test(b.text)) ?? BEATS[BEATS.length - 2];

// 베짱이 포즈 — 비트 인덱스 기반
// 0~5(들어와서 울먹임/감사) → ghA
// 노래 시작 직전(고마워/덕분에) → ghB
// 노래 시작 ~ 끝 직전 → ghC
// 마무리 비트 → ghD
function ghPose(t: number): string {
  if (t < SONG_START_BEAT.from - 2) return ghA.url;
  if (t < SONG_START_BEAT.from) return ghB.url;
  if (t < SONG_END_BEAT.from) return ghC.url;
  return ghD.url;
}

// 개미 포즈 — 현재 비트 인덱스에 따라 표정 전환
const ANT_POSE_BY_IDX = [antA.url, antB.url, antC.url, antD.url, antD.url, antE.url, antE.url, antE.url, antE.url, antE.url, antF.url, antF.url, antF.url, antF.url, antF.url];
function antPose(t: number): string {
  const idx = BEATS.findIndex((b) => t >= b.from && t < b.to);
  if (idx === -1) return antF.url;
  return ANT_POSE_BY_IDX[Math.min(idx, ANT_POSE_BY_IDX.length - 1)];
}

// 배경 개미들 — 화면 수평 50%, 상단 40% 지점을 중심으로 마름모(다이아) 배치
const BG_ANTS: { src: string; left: number; top: number; bob: number; sway: number }[] = [
  { src: ant1.url, left: 50, top: 32, bob: 0.0, sway: 0.0 }, // 위
  { src: ant2.url, left: 42, top: 40, bob: 0.7, sway: 0.5 }, // 왼쪽
  { src: ant3.url, left: 58, top: 40, bob: 1.4, sway: 1.0 }, // 오른쪽
  { src: ant4.url, left: 50, top: 48, bob: 2.1, sway: 1.5 }, // 아래
];

function currentLine(t: number): SceneBeat | null {
  for (let i = 0; i < BEATS.length; i++) {
    const start = BEATS[i].from;
    const end = i + 1 < BEATS.length ? BEATS[i + 1].from : LAST_END + 1;
    if (t >= start && t < end) return BEATS[i];
  }
  return null;
}

export function Scene4Motion({ speed, onComplete }: { speed: Scene4Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 공용 오디오 버스에 씬 4 BGM/SFX 등록.
  useSceneAudio({
    bgm: bgmAsset.url,
    sfx: sfxAsset.url,
    bgmVolume: 0.4,
    sfxVolume: 0.4,
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

  // 베짱이 포즈 — 시간대별로 결정
  const ghSrc = ghPose(t);
  const bob = Math.sin(t * 2.4) * 2;
  const sway = Math.sin(t * 1.8) * 1.5;
  const antSrc = antPose(t);
  const antBob = Math.sin(t * 2.4 + 1.2) * 2;
  const antSway = Math.sin(t * 1.8 + 0.6) * 1.5;

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

      {/* 화면 중간 50% 높이/50% 위치에 모여있는 개미 친구들 */}
      {BG_ANTS.map((a, i) => {
        const bb = Math.sin(t * 2.2 + a.bob) * 2;
        const sw = Math.sin(t * 1.6 + a.sway) * 1.2;
        return (
          <img
            key={i}
            src={a.src}
            alt=""
            draggable={false}
            className="absolute"
            style={{
              left: `${a.left + sw * 0.3}%`,
              top: `${a.top}%`,
              height: "18%",
              width: "auto",
              transform: `translate(-50%, calc(-50% + ${bb}px))`,
              transformOrigin: "center",
              filter: "drop-shadow(0 3px 6px oklch(0 0 0 / 0.45))",
            }}
          />
        );
      })}

      {/* 개미 — 베짱이 좌측 30% 지점, 같은 높이/사이즈, 좌우 반전하여 베짱이를 바라봄 */}
      <img
        src={antSrc}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: `${40 + antSway * 0.4}%`,
          bottom: "10%",
          height: "30%",
          width: "auto",
          transform: `translate(-50%, ${antBob}px) scaleX(-1)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 4px 8px oklch(0 0 0 / 0.4))",
          transition: "opacity 200ms linear",
        }}
      />

      {/* 베짱이 — 우측 40%, 아래 10% 위치에서 시간대별 포즈 표현 */}
      <img
        src={ghSrc}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: `${60 + sway * 0.4}%`,
          bottom: "10%",
          height: "30%",
          width: "auto",
          transform: `translate(-50%, ${bob}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 4px 8px oklch(0 0 0 / 0.4))",
          transition: "opacity 200ms linear",
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
        씬 4 · {t.toFixed(1)}s / {LOOP_SEC}s
      </div>

      <Subtitle line={currentLine(t)} />
    </div>
  );
}

function Subtitle({ line }: { line: SceneBeat | null }) {
  if (!line) return null;
  const palette =
    line.who === "ant" || line.who === "ants"
      ? { bg: "oklch(0.32 0.08 50 / 0.85)", fg: "oklch(0.97 0.03 80)", border: "oklch(0.55 0.12 50 / 0.55)", label: line.who === "ants" ? "개미들" : "개미" }
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