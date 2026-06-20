import { useEffect, useRef, useState } from "react";
import { useSceneAudio } from "@/lib/sceneAudio";
import type { StorySceneDefinition, StorySpeaker } from "@/data/townCountryStory";
import countryMouseCutout from "@/assets/town-country/country_mouse_cutout.png";
import sheet1Asset from "@/assets/town-country/country_sheet_1.png.asset.json";
import sheet2Asset from "@/assets/town-country/country_sheet_2.png.asset.json";
import sheet3Asset from "@/assets/town-country/country_sheet_3.png.asset.json";
import sheet4Asset from "@/assets/town-country/country_sheet_4.png.asset.json";
import exitSheet1Asset from "@/assets/town-country/exit_sheet_1.png.asset.json";
import exitSheet2Asset from "@/assets/town-country/exit_sheet_2.png.asset.json";

const SPEAKER_LABEL: Record<StorySpeaker, string> = {
  narration: "나레이션",
  country: "시골쥐",
  city: "서울쥐",
  post: "우편 배달쥐",
};

const SPEAKER_PALETTE: Record<StorySpeaker, { bg: string; fg: string; border: string }> = {
  narration:   { bg: "oklch(0.97 0.01 90 / 0.88)", fg: "oklch(0.22 0.02 50)", border: "oklch(0.75 0.02 80 / 0.6)" },
  country:     { bg: "oklch(0.36 0.10 80 / 0.88)", fg: "oklch(0.98 0.04 95)", border: "oklch(0.65 0.13 80 / 0.55)" },
  city:        { bg: "oklch(0.34 0.12 260 / 0.88)", fg: "oklch(0.97 0.04 250)", border: "oklch(0.62 0.15 260 / 0.55)" },
  post:        { bg: "oklch(0.34 0.11 30 / 0.88)", fg: "oklch(0.98 0.04 60)", border: "oklch(0.62 0.15 30 / 0.55)" },
};

export type StorySceneSpeed = 1 | 2 | 0;

export function StorySceneMotion({
  scene,
  speed,
  onComplete,
}: {
  scene: StorySceneDefinition;
  speed: StorySceneSpeed;
  onComplete?: () => void;
}) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useSceneAudio({
    bgm: scene.bgmUrl,
    sfx: scene.sfxUrl,
    bgmVolume: 0.7,
    sfxVolume: 0.75,
    maxDurationSec: scene.durationSec,
  });

  useEffect(() => {
    doneRef.current = false;
    timeRef.current = 0;
    setT(0);
    lastRef.current = null;
  }, [scene.id]);

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      const next = timeRef.current + dt * speed;
      if (next >= scene.durationSec && !doneRef.current) {
        doneRef.current = true;
        window.setTimeout(() => onCompleteRef.current?.(), 0);
      }
      timeRef.current = next % scene.durationSec;
      setT(timeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [scene.id, scene.durationSec, speed]);

  const pulse = 0.985 + Math.sin(t * 0.55) * 0.015;
  const driftX = Math.sin(t * 0.14) * 1.2;
  const driftY = Math.cos(t * 0.12) * 1.1;

  const beat = scene.beats.find((b) => t >= b.from && t < b.to);

  // 씬1 0~32초: 시골쥐 캐릭터를 우측에서 20%, 아래에서 10% 지점에 배치하고 살짝 흔들리는 모션 적용
  const showCountryMouse = scene.id === "town-country-1" && t < 32;
  const cmBob = Math.sin(t * 2.2) * 1.8;
  const cmSway = Math.sin(t * 1.4) * 2.5;
  const cmEntry = Math.min(1, t / 0.8);

  // 씬1 32~82초: 시골쥐 네 시트를 32초 이전 시골쥐와 동일한 위치/크기로 순차 노출
  // 시트1: 32~52s, 시트2: 52~70s, 시트3: 70~76s, 시트4: 76~82s
  const sheetSegments: Array<{ from: number; to: number; src: string }> = [
    { from: 32, to: 52, src: sheet1Asset.url },
    { from: 52, to: 70, src: sheet2Asset.url },
    { from: 70, to: 76, src: sheet3Asset.url },
    { from: 76, to: 82, src: sheet4Asset.url },
  ];
  const activeSheet = scene.id === "town-country-1"
    ? sheetSegments.find((s) => t >= s.from && t < s.to)
    : undefined;
  const sheetEntry = activeSheet ? Math.min(1, (t - activeSheet.from) / 0.5) : 0;

  // 씬1 82~90초: 시골쥐가 현재 위치(right 40%)에서 우측 70%/80% 지점까지 이동하며 퇴장
  // 시트1: 82~86s → left 60%에서 70%, 시트2: 86~90s → left 60%에서 80%
  const exitSegments: Array<{ from: number; to: number; rightFrom: number; rightTo: number; src: string }> = [
    { from: 82, to: 86, rightFrom: 40, rightTo: 30, src: exitSheet1Asset.url },
    { from: 86, to: 90, rightFrom: 40, rightTo: 20, src: exitSheet2Asset.url },
  ];
  const activeExit = scene.id === "town-country-1"
    ? exitSegments.find((s) => t >= s.from && t < s.to)
    : undefined;
  const exitProgress = activeExit ? (t - activeExit.from) / (activeExit.to - activeExit.from) : 0;
  const exitRightPct = activeExit
    ? activeExit.rightFrom + (activeExit.rightTo - activeExit.rightFrom) * exitProgress
    : 40;
  const exitEntry = activeExit ? Math.min(1, (t - activeExit.from) / 0.4) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <div
        className="absolute inset-[-2.5%]"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, oklch(1 0 0 / 0.01) 0%, oklch(0 0 0 / 0.06) 70%, oklch(0 0 0 / 0.12) 100%)",
          transform: `translate(${driftX}px, ${driftY}px) scale(${pulse})`,
          transition: "transform 120ms linear",
        }}
      />

      {beat && (() => {
        const palette = SPEAKER_PALETTE[beat.who];
        return (
          <div
            key={`${scene.id}-${beat.from}`}
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
          >
            <span style={{ opacity: 0.75, marginRight: 8, fontSize: "0.85em" }}>
              {SPEAKER_LABEL[beat.who]}
            </span>
            {beat.text}
          </div>
        );
      })()}

      {showCountryMouse && (
        <img
          src={countryMouseCutout}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            right: "40%",
            bottom: "15%",
            height: "20%",
            width: "auto",
            transform: `translateY(${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, cmEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}

      {activeSheet && (
        <img
          key={`sheet-${activeSheet.from}`}
          src={activeSheet.src}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            right: "40%",
            bottom: "15%",
            height: "20%",
            width: "auto",
            transform: `translateY(${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, sheetEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}

      {activeExit && (
        <img
          key={`exit-${activeExit.from}`}
          src={activeExit.src}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            right: `${exitRightPct}%`,
            bottom: "15%",
            height: "20%",
            width: "auto",
            transform: `translateY(${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, exitEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear, right 120ms linear",
          }}
        />
      )}

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
          border: "1px solid oklch(0.85 0.08 75 / 0.28)",
        }}
      >
        {scene.title} · {scene.setting}
      </div>

      <div
        className="absolute"
        style={{
          right: "2%",
          top: "8%",
          background: "oklch(0 0 0 / 0.42)",
          color: "oklch(0.92 0.04 80)",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 999,
          border: "1px solid oklch(0.85 0.08 75 / 0.24)",
        }}
      >
        {Math.floor(t)}s / {scene.durationSec}s
      </div>
    </div>
  );
}