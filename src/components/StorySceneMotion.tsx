import { useEffect, useRef, useState } from "react";
import { useSceneAudio } from "@/lib/sceneAudio";
import type { StorySceneDefinition, StorySpeaker } from "@/data/townCountryStory";
import { useDevTimelineSync } from "@/lib/devTimeline";
import countryMouseCutout from "@/assets/town-country/country_mouse_cutout.png";
import scene2BgAsset from "@/assets/town-country/scene2.jpg.asset.json";
import sheet1Asset from "@/assets/town-country/country_sheet_1.png.asset.json";
import sheet2Asset from "@/assets/town-country/country_sheet_2.png.asset.json";
import sheet3Asset from "@/assets/town-country/country_sheet_3.png.asset.json";
import sheet4Asset from "@/assets/town-country/country_sheet_4.png.asset.json";
import cityUniform1 from "@/assets/town-country/country_uniform_1.png.asset.json";
import cityUniform2 from "@/assets/town-country/country_uniform_2.png.asset.json";
import cityUniform3 from "@/assets/town-country/country_uniform_3.png.asset.json";
import countryFlip1 from "@/assets/town-country/country_flip_1.png.asset.json";
import countryFlip2 from "@/assets/town-country/country_flip_2.png.asset.json";
import pair1 from "@/assets/town-country/pair_clean_1.png.asset.json";
import pair2 from "@/assets/town-country/pair_clean_2.png.asset.json";
import pair3 from "@/assets/town-country/pair_clean_3.png.asset.json";
import walkClean1 from "@/assets/town-country/walk_clean_1.png.asset.json";
import walkClean2 from "@/assets/town-country/walk_clean_2.png.asset.json";
import countryCycle1 from "@/assets/town-country/country_cycle_1.png.asset.json";
import countryCycle2 from "@/assets/town-country/country_cycle_2.png.asset.json";
import countryCycle3 from "@/assets/town-country/country_cycle_3.png.asset.json";
import countryCycle4 from "@/assets/town-country/country_cycle_4.png.asset.json";
import pairWalkAsset from "@/assets/town-country/pair_walk.png.asset.json";
import exitSheet1Asset from "@/assets/town-country/exit_sheet_1.png.asset.json";
import exitSheet2Asset from "@/assets/town-country/exit_sheet_2.png.asset.json";
import postSheet1Asset from "@/assets/town-country/post_sheet_1.png.asset.json";
import postSheet2Asset from "@/assets/town-country/post_sheet_2.png.asset.json";
import postSheet3Asset from "@/assets/town-country/post_sheet_3.png.asset.json";
import postSheet4Asset from "@/assets/town-country/post_sheet_4.png.asset.json";
import postSheet5Asset from "@/assets/town-country/post_sheet_5.png.asset.json";
import scene3PairAsset from "@/assets/town-country/scene3_pair.png.asset.json";
import scene3City1Asset from "@/assets/town-country/scene3_city1.png.asset.json";
import scene3City2Asset from "@/assets/town-country/scene3_city2.png.asset.json";
import scene3City3Asset from "@/assets/town-country/scene3_city3.png.asset.json";
import scene3Country1Asset from "@/assets/town-country/scene3_country1.png.asset.json";
import scene3Country2Asset from "@/assets/town-country/scene3_country2.png.asset.json";
import scene3Country3Asset from "@/assets/town-country/scene3_country3.png.asset.json";
import scene3CityAAsset from "@/assets/town-country/scene3_city_a.png.asset.json";
import scene3CityBAsset from "@/assets/town-country/scene3_city_b.png.asset.json";
import scene3CityCAsset from "@/assets/town-country/scene3_city_c.png.asset.json";
import scene3CityDAsset from "@/assets/town-country/scene3_city_d.png.asset.json";
import scene3CityEAsset from "@/assets/town-country/scene3_city_e.png.asset.json";
import scene3CityFAsset from "@/assets/town-country/scene3_city_f.png.asset.json";
import scene3CityGAsset from "@/assets/town-country/scene3_city_g.png.asset.json";
import scene3CityHAsset from "@/assets/town-country/scene3_city_h.png.asset.json";
import scene3CityIAsset from "@/assets/town-country/scene3_city_i.png.asset.json";
import scene3CityJAsset from "@/assets/town-country/scene3_city_j.png.asset.json";
import scene3CityKAsset from "@/assets/town-country/scene3_city_k.png.asset.json";
import scene3CityLAsset from "@/assets/town-country/scene3_city_l.png.asset.json";
import scene3CityMAsset from "@/assets/town-country/scene3_city_m.png.asset.json";
import scene3CityNAsset from "@/assets/town-country/scene3_city_n.png.asset.json";
import scene3CityOAsset from "@/assets/town-country/scene3_city_o.png.asset.json";

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

  useDevTimelineSync({
    sceneId: scene.id,
    label: scene.title,
    beats: scene.beats,
    t,
    duration: scene.durationSec,
    onSeek: (newT: number) => {
      const clamped = Math.max(0, Math.min(scene.durationSec - 0.01, newT));
      timeRef.current = clamped;
      setT(clamped);
      doneRef.current = false;
    },
  });

  const pulse = 0.985 + Math.sin(t * 0.55) * 0.015;
  const driftX = Math.sin(t * 0.14) * 1.2;
  const driftY = Math.cos(t * 0.12) * 1.1;

  const beat = scene.beats.find((b) => t >= b.from && t < b.to);

  const cmBob = Math.sin(t * 2.2) * 1.8;
  const cmSway = Math.sin(t * 1.4) * 2.5;

  // 씬1 0~32초: 시골쥐 캐릭터를 우측에서 40%, 아래에서 15% 지점에 배치하고 살짝 흔들리는 모션 적용
  const showCountryMouse = scene.id === "town-country-1" && t < 32;
  const cmEntry = Math.min(1, t / 0.8);

  // 씬1 32~82초: 시골쥐 네 시트를 32초 이전 시골쥐와 동일한 위치/크기로 순차 노출
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

  // 씬2 0~70초: 서울쥐 캐릭터(크기 통일된 3장)를 좌측 25%, 하단 15% 위치에 순환 표시
  const cityFrames = [cityUniform1.url, cityUniform2.url, cityUniform3.url];
  const CITY_FRAME_DUR = 1.4;
  const showCityCycle = scene.id === "town-country-2" && t < 70 && !(t >= 12 && t < 24) && !(t >= 67 && t < 70);
  const cityFrameIdx = Math.floor(t / CITY_FRAME_DUR) % cityFrames.length;
  const citySrc = cityFrames[cityFrameIdx];
  const cityEntry = Math.min(1, t / 0.6);

  // 씬2 0~12초: 시골쥐 캐릭터 시트 2장을 좌우 반전하여 우측 40%, 하단 15%에 배치
  const countryFlipSegments: Array<{ from: number; to: number; src: string }> = [
    { from: 0, to: 6, src: countryFlip1.url },
    { from: 6, to: 12, src: countryFlip2.url },
  ];
  const activeCountryFlip = scene.id === "town-country-2"
    ? countryFlipSegments.find((s) => t >= s.from && t < s.to)
    : undefined;
  const countryFlipEntry = activeCountryFlip ? Math.min(1, (t - activeCountryFlip.from) / 0.4) : 0;

  const pairFrames = [pair1.url, pair2.url, pair3.url];
  const showPairCycle = scene.id === "town-country-2" && t >= 12 && t < 24;
  const pairFrameIdx = showPairCycle ? Math.floor((t - 12) / 2) % pairFrames.length : 0;
  const pairSrc = pairFrames[pairFrameIdx];
  const pairEntry = showPairCycle ? Math.min(1, ((t - 12) % 2) / 0.3) : 0;

  // 씬2 67~70초 & 73~76초: 서울쥐 워크 시트 2장이 좌측 수평 이동
  const walkSegments: Array<{ from: number; to: number; leftFrom: number; leftTo: number; src: string }> = [
    { from: 67, to: 70, leftFrom: 35, leftTo: 15, src: walkClean1.url },
    { from: 73, to: 76, leftFrom: 15, leftTo: 35, src: walkClean2.url },
  ];
  const activeWalk = scene.id === "town-country-2"
    ? walkSegments.find((s) => t >= s.from && t < s.to)
    : undefined;
  const walkProgress = activeWalk ? (t - activeWalk.from) / (activeWalk.to - activeWalk.from) : 0;
  const walkLeftPct = activeWalk
    ? activeWalk.leftFrom + (activeWalk.leftTo - activeWalk.leftFrom) * walkProgress
    : 35;
  const walkEntry = activeWalk ? Math.min(1, (t - activeWalk.from) / 0.3) : 0;

  // 씬2 24~76초: 시골쥐 캐릭터 4장을 좌우 반전하여 우측 30%에서 순환
  const countryCycleFrames = [countryCycle1.url, countryCycle2.url, countryCycle3.url, countryCycle4.url];
  const COUNTRY_CYCLE_DUR = 1.4;
  const showCountryCycle = scene.id === "town-country-2" && t >= 24 && t < 76;
  const countryCycleIdx = showCountryCycle
    ? Math.floor((t - 24) / COUNTRY_CYCLE_DUR) % countryCycleFrames.length
    : 0;
  const countryCycleSrc = countryCycleFrames[countryCycleIdx];
  const countryCycleEntry = showCountryCycle ? Math.min(1, (t - 24) / 0.4) : 0;

  // 씬2 76~90초: 한 쌍 캐릭터가 60% 지점에서 20% 지점까지 이동
  const showPairWalk = scene.id === "town-country-2" && t >= 76 && t < 90;
  const pairWalkProgress = showPairWalk ? (t - 76) / (90 - 76) : 0;
  const pairWalkLeftPct = 60 + (20 - 60) * pairWalkProgress;
  const pairWalkEntry = showPairWalk ? Math.min(1, (t - 76) / 0.4) : 0;

  // 씬1 82~90초: 시골쥐가 현재 위치에서 우측으로 수평 이동하며 퇴장
  // 시트1: 82~86s → left 60%에서 75%, 시트2: 86~90s → left 75%에서 85%
  const exitSegments: Array<{ from: number; to: number; rightFrom: number; rightTo: number; src: string }> = [
    { from: 82, to: 86, rightFrom: 40, rightTo: 25, src: exitSheet1Asset.url },
    { from: 86, to: 90, rightFrom: 25, rightTo: 15, src: exitSheet2Asset.url },
  ];
  const activeExit = scene.id === "town-country-1"
    ? exitSegments.find((s) => t >= s.from && t < s.to)
    : undefined;
  const exitProgress = activeExit ? (t - activeExit.from) / (activeExit.to - activeExit.from) : 0;
  const exitRightPct = activeExit
    ? activeExit.rightFrom + (activeExit.rightTo - activeExit.rightFrom) * exitProgress
    : 40;
  const exitEntry = activeExit ? Math.min(1, (t - activeExit.from) / 0.4) : 0;

  // 씬1 32~64초: 우편 배달부 쥐 다섯 시트가 순차 등장/이동
  // - 좌표는 `left` 기준(우측 N% → left (100-N)%)
  // - 캐릭터 크기는 4번째 시트(height 20%)를 기준으로 시트별 height/bottom 보정해
  //   실제 캐릭터 크기와 발 위치(하단 15%)를 통일
  type PostSeg = {
    from: number;
    to: number;
    leftFrom: number;
    leftTo: number;
    src: string;
    shake?: boolean;
    key: string;
    heightPct: number;
    bottomPct: number;
  };
  const postSegments: PostSeg[] = [
    { key: "p1",  from: 32, to: 38, leftFrom: 15, leftTo: 25, src: postSheet1Asset.url, heightPct: 24.4, bottomPct: 12.2 },
    { key: "p2",  from: 38, to: 44, leftFrom: 25, leftTo: 35, src: postSheet2Asset.url, heightPct: 24.4, bottomPct: 12.2 },
    // 3번 시트: 44~52s, 좌측 40% 고정
    { key: "p3",  from: 44, to: 52, leftFrom: 40, leftTo: 40, src: postSheet3Asset.url, heightPct: 25.1, bottomPct: 11.7 },
    // 4번 시트: 52~58s, 좌측 45% 고정
    { key: "p4",  from: 52, to: 58, leftFrom: 45, leftTo: 45, src: postSheet4Asset.url, heightPct: 20.0, bottomPct: 13.9 },
    // 5번 시트: 58~72s, 우측 45% → 25% (= left 55% → 75%)
    { key: "p5",  from: 58, to: 72, leftFrom: 55, leftTo: 75, src: postSheet5Asset.url, heightPct: 24.4, bottomPct: 11.7 },
  ];
  const activePosts = scene.id === "town-country-1"
    ? postSegments.filter((s) => t >= s.from && t < s.to)
    : [];

  // 씬 3: 캐릭터 모션
  // 0~12s: 한 쌍 캐릭터 시트 (120% 확대) — left 80% → 50%, bottom 8%
  const showScene3Pair = scene.id === "town-country-3" && t < 12;
  const scene3PairProgress = showScene3Pair ? Math.min(1, t / 12) : 0;
  const scene3PairLeftPct = 80 + (50 - 80) * scene3PairProgress;
  const scene3PairEntry = showScene3Pair ? Math.min(1, t / 0.5) : 0;

  // 12~24s: 서울쥐 3장 (city) — left 60%, bottom 35%, 로테이션(좌우 흔들림)으로 포즈 순환
  // 12~24s: 시골쥐 3장 (country) — left 40%, bottom 8%, 동일 로테이션 모션
  const scene3CityFrames = [scene3City1Asset.url, scene3City2Asset.url, scene3City3Asset.url];
  const scene3CountryFrames = [scene3Country1Asset.url, scene3Country2Asset.url, scene3Country3Asset.url];
  const showScene3Rotation = scene.id === "town-country-3" && t >= 12 && t < 24;
  const scene3RotT = showScene3Rotation ? t - 12 : 0;
  const SCENE3_POSE_DUR = 4; // 12초 / 3포즈
  const scene3PoseIdx = showScene3Rotation
    ? Math.min(scene3CityFrames.length - 1, Math.floor(scene3RotT / SCENE3_POSE_DUR))
    : 0;
  const scene3RotAngle = Math.sin(scene3RotT * 2.4) * 10; // ±10도 로테이션
  const scene3RotEntry = showScene3Rotation ? Math.min(1, (t - 12) / 0.4) : 0;

  // 씬 3 24~36s: 서울쥐 신규 시트 3장 — left 60%, bottom 40%, 4초 간격 전환
  const scene3CityAltFrames = [scene3CityAAsset.url, scene3CityBAsset.url, scene3CityCAsset.url];
  const showScene3CityAlt = scene.id === "town-country-3" && t >= 24 && t < 36;
  const scene3CityAltIdx = showScene3CityAlt
    ? Math.min(scene3CityAltFrames.length - 1, Math.floor((t - 24) / 4))
    : 0;
  const scene3CityAltEntry = showScene3CityAlt ? Math.min(1, ((t - 24) % 4) / 0.4) : 0;

  // 씬 3 24~36s: 시골쥐 신규 시트 2장 — left 40%, bottom 40%, 4초 간격 순환 전환 (A,B,A)
  const scene3CountryAltCycle = [scene3CityNAsset.url, scene3CityOAsset.url, scene3CityNAsset.url];
  const showScene3CountryAlt = scene.id === "town-country-3" && t >= 24 && t < 36;
  const scene3CountryAltIdx = showScene3CountryAlt
    ? Math.min(scene3CountryAltCycle.length - 1, Math.floor((t - 24) / 4))
    : 0;
  const scene3CountryAltEntry = showScene3CountryAlt ? Math.min(1, ((t - 24) % 4) / 0.4) : 0;

  // 씬 3 36~52s: 서울쥐 신규 시트 5장 — left 60%, bottom 40%, 4초 간격 전환
  const scene3CityAlt2Frames = [
    scene3CityDAsset.url,
    scene3CityEAsset.url,
    scene3CityFAsset.url,
    scene3CityGAsset.url,
    scene3CityHAsset.url,
  ];
  const showScene3CityAlt2 = scene.id === "town-country-3" && t >= 36 && t < 52;
  const scene3CityAlt2Idx = showScene3CityAlt2
    ? Math.min(scene3CityAlt2Frames.length - 1, Math.floor((t - 36) / 4))
    : 0;
  const scene3CityAlt2Entry = showScene3CityAlt2 ? Math.min(1, ((t - 36) % 4) / 0.4) : 0;

  // 씬 3 52~64s: 서울쥐 신규 시트 3장 — left 60%, bottom 40%, 4초 간격 전환
  const scene3CityAlt3Frames = [scene3CityIAsset.url, scene3CityJAsset.url, scene3CityKAsset.url];
  const showScene3CityAlt3 = scene.id === "town-country-3" && t >= 52 && t < 64;
  const scene3CityAlt3Idx = showScene3CityAlt3
    ? Math.min(scene3CityAlt3Frames.length - 1, Math.floor((t - 52) / 4))
    : 0;
  const scene3CityAlt3Entry = showScene3CityAlt3 ? Math.min(1, ((t - 52) % 4) / 0.4) : 0;

  // 씬 3 64~70s: 달리는 서울쥐(좌우 반전) — left 60% → 40%, bottom 40%
  const showScene3CityRun = scene.id === "town-country-3" && t >= 64 && t < 70;
  const scene3CityRunProgress = showScene3CityRun ? (t - 64) / 6 : 0;
  const scene3CityRunLeftPct = 60 + (40 - 60) * scene3CityRunProgress;
  const scene3CityRunEntry = showScene3CityRun ? Math.min(1, (t - 64) / 0.4) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {/* 씬 4: 60~90초 구간에서 배경을 서울쥐 방안(씬 2 배경)으로 전환 */}
      {scene.id === "town-country-4" && t >= 60 && (
        <img
          src={scene2BgAsset.url}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          style={{ zIndex: 0 }}
        />
      )}
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

      {showCityCycle && (
        <img
          key={`city-cycle-${cityFrameIdx}`}
          src={citySrc}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "35%",
            bottom: "15%",
            height: "20%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, cityEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}

      {activeCountryFlip && (
        <img
          key={`country-flip-${activeCountryFlip.from}`}
          src={activeCountryFlip.src}
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
            opacity: Math.max(0.85, countryFlipEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}

      {showPairCycle && (
        <img
          key={`pair-cycle-${pairFrameIdx}`}
          src={pairSrc}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "45%",
            bottom: "15%",
            height: "23.4%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, pairEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}

      {activeWalk && (
        <img
          key={`walk-${activeWalk.from}`}
          src={activeWalk.src}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${walkLeftPct}%`,
            bottom: "15%",
            height: "20%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, walkEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear, left 120ms linear",
          }}
        />
      )}

      {showCountryCycle && (
        <img
          key={`country-cycle-${countryCycleIdx}`}
          src={countryCycleSrc}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            right: "30%",
            bottom: "15%",
            height: "20%",
            width: "auto",
            transform: `scaleX(-1) translateY(${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, countryCycleEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}

      {showPairWalk && (
        <img
          src={pairWalkAsset.url}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${pairWalkLeftPct}%`,
            bottom: "15%",
            height: "26%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.85, pairWalkEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear, left 120ms linear",
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

      {activePosts.map((seg) => {
        const dur = seg.to - seg.from;
        const progress = dur > 0 ? (t - seg.from) / dur : 1;
        const leftPct = seg.leftFrom + (seg.leftTo - seg.leftFrom) * progress;
        const entry = Math.min(1, (t - seg.from) / 0.4);
        const shakeX = seg.shake ? Math.sin(t * 18) * 3 : 0;
        const shakeR = seg.shake ? Math.sin(t * 22) * 4 : 0;
        return (
          <img
            key={`post-${seg.key}`}
            src={seg.src}
            alt=""
            draggable={false}
            className="absolute"
            style={{
              left: `${leftPct}%`,
              bottom: `${seg.bottomPct}%`,
              height: `${seg.heightPct}%`,
              width: "auto",
              transform: `translate(${shakeX}px, ${cmBob}px) rotate(${cmSway + shakeR}deg)`,
              transformOrigin: "bottom center",
              opacity: Math.max(0.85, entry),
              filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
              transition: "transform 80ms linear, left 120ms linear",
            }}
          />
        );
      })}


      {showScene3Pair && (
        <img
          src={scene3PairAsset.url}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${scene3PairLeftPct}%`,
            bottom: "8%",
            height: "24%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3PairEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear, left 120ms linear",
          }}
        />
      )}
      {showScene3Rotation && (
        <img
          key={`scene3-city-${scene3PoseIdx}`}
          src={scene3CityFrames[scene3PoseIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "60%",
            bottom: "35%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${scene3RotAngle}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3RotEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3Rotation && (
        <img
          key={`scene3-country-${scene3PoseIdx}`}
          src={scene3CountryFrames[scene3PoseIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "40%",
            bottom: "8%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${-scene3RotAngle}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3RotEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3CityAlt && (
        <img
          key={`scene3-city-alt-${scene3CityAltIdx}`}
          src={scene3CityAltFrames[scene3CityAltIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "60%",
            bottom: "40%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3CityAltEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3CountryAlt && (
        <img
          key={`scene3-country-alt-${scene3CountryAltIdx}`}
          src={scene3CountryAltCycle[scene3CountryAltIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "40%",
            bottom: "40%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3CountryAltEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3CityAlt2 && (
        <img
          key={`scene3-city-alt2-${scene3CityAlt2Idx}`}
          src={scene3CityAlt2Frames[scene3CityAlt2Idx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "60%",
            bottom: "40%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3CityAlt2Entry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3CityAlt3 && (
        <img
          key={`scene3-city-alt3-${scene3CityAlt3Idx}`}
          src={scene3CityAlt3Frames[scene3CityAlt3Idx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: "60%",
            bottom: "40%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3CityAlt3Entry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3CityRun && (
        <img
          key="scene3-city-run"
          src={scene3CityMAsset.url}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${scene3CityRunLeftPct}%`,
            bottom: "40%",
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) scaleX(-1)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3CityRunEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "left 100ms linear, transform 100ms linear",
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