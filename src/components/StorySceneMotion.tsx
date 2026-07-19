import { useEffect, useMemo, useRef, useState } from "react";
import { useSceneAudio, useSceneAudioState } from "@/lib/sceneAudio";
import { useSceneBeatPlayback, useSceneMasterVoice, type SceneBeat } from "@/lib/sceneTts";
import type { StorySceneDefinition, StorySpeaker } from "@/data/townCountryStory";
import { useDevTimelineSync } from "@/lib/devTimeline";
import { useDevMotionSync, type DevMotionSegment } from "@/lib/devMotionTimeline";
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
import scene3CountryPAsset from "@/assets/town-country/scene3_country_p.png.asset.json";
import scene3CountryQAsset from "@/assets/town-country/scene3_country_q.png.asset.json";
import scene3CountryRAsset from "@/assets/town-country/scene3_country_r.png.asset.json";
import scene3CountrySAsset from "@/assets/town-country/scene3_country_s.png.asset.json";
import scene3CountryTAsset from "@/assets/town-country/scene3_country_t.png.asset.json";
import scene3CountryUAsset from "@/assets/town-country/scene3_country_u.png.asset.json";
import scene3CountryVAsset from "@/assets/town-country/scene3_country_v.png.asset.json";
import scene3CountryWAsset from "@/assets/town-country/scene3_country_w.png.asset.json";
import scene3CountryRun1Asset from "@/assets/town-country/scene3_country_run1.png.asset.json";
import scene3CountryRun2Asset from "@/assets/town-country/scene3_country_run2.png.asset.json";
import scene3PairRunAsset from "@/assets/town-country/scene3_pair_run.png.asset.json";
import scene4PairFleeAsset from "@/assets/town-country/scene4_pair_flee.png.asset.json";
import scene4CountryAAsset from "@/assets/town-country/scene4_country_a.png.asset.json";
import scene4CountryBAsset from "@/assets/town-country/scene4_country_b.png.asset.json";
import tomSit1Asset from "@/assets/boy-wolf/tom_sit_1.png.asset.json";
import tomSit2Asset from "@/assets/boy-wolf/tom_sit_2.png.asset.json";
import bwSheep1Asset from "@/assets/boy-wolf/bw_sheep_1.png.asset.json";
import bwSheep2Asset from "@/assets/boy-wolf/bw_sheep_2.png.asset.json";
import bwSheep3Asset from "@/assets/boy-wolf/bw_sheep_3.png.asset.json";
import bwSheep4Asset from "@/assets/boy-wolf/bw_sheep_4.png.asset.json";
import bwSheep5Asset from "@/assets/boy-wolf/bw_sheep_5.png.asset.json";

const SCENE4_FLEE = {
  sceneId: "town-country-4",
  asset: scene4PairFleeAsset,
  startSec: 0,
  endSec: 12,
  fromLeftPct: 15,
  toLeftPct: 80,
  bottomPct: 10,
  heightPct: 26,
  flipX: true,
  fadeInSec: 0.4,
};

const SCENE3_COUNTRY_ALT3 = {
  sceneId: "town-country-3",
  frames: [scene3CountryUAsset, scene3CountryVAsset, scene3CountryWAsset],
  startSec: 52,
  endSec: 58,
  intervalSec: 2,
  leftPct: 40,
  bottomPct: 40,
  fadeInSec: 0.4,
};

// 씬 4 12~36s: 시골쥐 캐릭터 시트 2장 — left 80%, bottom 15%, 4초 간격 순환 전환
const SCENE4_COUNTRY_CYCLE = {
  sceneId: "town-country-4",
  frames: [scene4CountryAAsset, scene4CountryBAsset],
  startSec: 12,
  endSec: 36,
  intervalSec: 4,
  leftPct: 80,
  bottomPct: 15,
  heightPct: 26,
  fadeInSec: 0.4,
};

// 양치기 소년 씬1 21~34s: 톰 캐릭터 시트 2장(좌우 반전) — left 20%, bottom 20%, 4초 간격 순환
const BOY_WOLF_S1_TOM = {
  sceneId: "boy-wolf-1",
  frames: [tomSit1Asset, tomSit2Asset],
  startSec: 21,
  endSec: 34,
  intervalSec: 4,
  leftPct: 20,
  bottomPct: 10,
  heightPct: 34,
  flipX: true,
  fadeInSec: 0.4,
};

// 양치기 소년 씬1 0~92s: 양떼 5포즈 — bottom 20%, left 68%↔72% 왕복, 4s 간격 순환
const BOY_WOLF_S1_SHEEP = {
  sceneId: "boy-wolf-1",
  frames: [bwSheep1Asset, bwSheep2Asset, bwSheep3Asset, bwSheep4Asset, bwSheep5Asset],
  startSec: 0,
  endSec: 92,
  intervalSec: 4,
  leftMinPct: 68,
  leftMaxPct: 72,
  bottomPct: 20,
  heightPct: 22,
  sweepSec: 6,
  fadeInSec: 0.4,
};

// 씬별 모션 세그먼트 카탈로그 — DevMotionToolbar 가 트랙 시각화 + 겹침/공백 경고에 사용.
// 실제 렌더링 조건과 동일한 시간 구간을 정적으로 나열한다. 실제 조건과 어긋나면 툴바 표시가 실제와 달라지니 유지·보수 시 함께 갱신.
const SCENE_MOTIONS: Record<string, DevMotionSegment[]> = {
  "town-country-1": [
    { id: "s1-cm",     track: "시골쥐",     label: "배치",     from: 0,  to: 32 },
    { id: "s1-sh1",    track: "시골쥐",     label: "시트1",    from: 32, to: 52 },
    { id: "s1-sh2",    track: "시골쥐",     label: "시트2",    from: 52, to: 70 },
    { id: "s1-sh3",    track: "시골쥐",     label: "시트3",    from: 70, to: 76 },
    { id: "s1-sh4",    track: "시골쥐",     label: "시트4",    from: 76, to: 82 },
    { id: "s1-ex1",    track: "시골쥐",     label: "퇴장1",    from: 82, to: 86 },
    { id: "s1-ex2",    track: "시골쥐",     label: "퇴장2",    from: 86, to: 90 },
    { id: "s1-p1",     track: "우편배달쥐", label: "p1",       from: 32, to: 38 },
    { id: "s1-p2",     track: "우편배달쥐", label: "p2",       from: 38, to: 44 },
    { id: "s1-p3",     track: "우편배달쥐", label: "p3",       from: 44, to: 52 },
    { id: "s1-p4",     track: "우편배달쥐", label: "p4",       from: 52, to: 58 },
    { id: "s1-p5",     track: "우편배달쥐", label: "p5",       from: 58, to: 72 },
  ],
  "town-country-2": [
    { id: "s2-city-a", track: "서울쥐",     label: "순환A",    from: 0,  to: 12 },
    { id: "s2-city-b", track: "서울쥐",     label: "순환B",    from: 24, to: 67 },
    { id: "s2-walk1",  track: "서울쥐",     label: "걷기1",    from: 67, to: 70 },
    { id: "s2-walk2",  track: "서울쥐",     label: "걷기2",    from: 73, to: 76 },
    { id: "s2-cf1",    track: "시골쥐",     label: "반전1",    from: 0,  to: 6  },
    { id: "s2-cf2",    track: "시골쥐",     label: "반전2",    from: 6,  to: 12 },
    { id: "s2-cc",     track: "시골쥐",     label: "순환",     from: 24, to: 76 },
    { id: "s2-pair",   track: "한쌍",       label: "순환",     from: 12, to: 24 },
    { id: "s2-pw",     track: "한쌍",       label: "이동",     from: 76, to: 90 },
  ],
  "town-country-3": [
    { id: "s3-pair",       track: "한쌍",   label: "이동",     from: 0,  to: 12 },
    { id: "s3-city-rot",   track: "서울쥐", label: "포즈회전", from: 12, to: 24 },
    { id: "s3-city-alt",   track: "서울쥐", label: "신규3장",  from: 24, to: 36 },
    { id: "s3-city-alt2",  track: "서울쥐", label: "신규5장",  from: 36, to: 52 },
    { id: "s3-city-alt3",  track: "서울쥐", label: "신규3장",  from: 52, to: 64 },
    { id: "s3-city-run",   track: "서울쥐", label: "달리기",   from: 64, to: 70 },
    { id: "s3-country-rot",track: "시골쥐", label: "포즈회전", from: 12, to: 24 },
    { id: "s3-country-alt",track: "시골쥐", label: "신규2장",  from: 24, to: 36 },
    { id: "s3-country-a2", track: "시골쥐", label: "신규5장",  from: 36, to: 52 },
    { id: "s3-country-a3", track: "시골쥐", label: `순환(${SCENE3_COUNTRY_ALT3.intervalSec}s)`, from: SCENE3_COUNTRY_ALT3.startSec, to: SCENE3_COUNTRY_ALT3.endSec },
    { id: "s3-country-run",track: "시골쥐", label: "왕복",     from: 64, to: 72 },
    { id: "s3-pair-flee",  track: "한쌍",   label: "도망",     from: 76, to: 86 },
  ],
  "town-country-4": [
    { id: "s4-flee",   track: "한쌍",   label: "도망",     from: SCENE4_FLEE.startSec,          to: SCENE4_FLEE.endSec },
    { id: "s4-cc",     track: "시골쥐", label: `순환(${SCENE4_COUNTRY_CYCLE.intervalSec}s)`, from: SCENE4_COUNTRY_CYCLE.startSec, to: SCENE4_COUNTRY_CYCLE.endSec },
    { id: "s4-bg2",    track: "배경",   label: "서울방 전환", from: 60, to: 90 },
  ],
  "boy-wolf-1": [
    { id: "bw1-tom", track: "톰", label: `순환(${BOY_WOLF_S1_TOM.intervalSec}s)`, from: BOY_WOLF_S1_TOM.startSec, to: BOY_WOLF_S1_TOM.endSec },
    { id: "bw1-sheep", track: "양떼", label: `순환(${BOY_WOLF_S1_SHEEP.intervalSec}s)`, from: BOY_WOLF_S1_SHEEP.startSec, to: BOY_WOLF_S1_SHEEP.endSec },
  ],
};

const SPEAKER_LABEL: Record<StorySpeaker, string> = {
  narration: "나레이션",
  country: "시골쥐",
  city: "서울쥐",
  post: "우편 배달쥐",
  // boy-wolf
  tom: "톰",
  tom_hurry: "톰",
  tom_sad: "톰",
  v_m1: "마을 남자 1",
  v_m2: "마을 남자 2",
  v_m3: "마을 남자 3",
  v_w1: "마을 여자 1",
  v_w2: "마을 여자 2",
  villagers: "마을 사람들",
};

const SPEAKER_PALETTE: Record<StorySpeaker, { bg: string; fg: string; border: string }> = {
  narration:   { bg: "oklch(0.97 0.01 90 / 0.88)", fg: "oklch(0.22 0.02 50)", border: "oklch(0.75 0.02 80 / 0.6)" },
  country:     { bg: "oklch(0.36 0.10 80 / 0.88)", fg: "oklch(0.98 0.04 95)", border: "oklch(0.65 0.13 80 / 0.55)" },
  city:        { bg: "oklch(0.34 0.12 260 / 0.88)", fg: "oklch(0.97 0.04 250)", border: "oklch(0.62 0.15 260 / 0.55)" },
  post:        { bg: "oklch(0.34 0.11 30 / 0.88)", fg: "oklch(0.98 0.04 60)", border: "oklch(0.62 0.15 30 / 0.55)" },
  // boy-wolf — 톰(초록 계열), 마을 남자(따뜻한 갈색), 마을 여자(부드러운 로즈), 군중(중립)
  tom:         { bg: "oklch(0.36 0.11 145 / 0.88)", fg: "oklch(0.98 0.04 130)", border: "oklch(0.62 0.15 145 / 0.55)" },
  tom_hurry:   { bg: "oklch(0.36 0.13 35 / 0.9)",  fg: "oklch(0.98 0.04 60)",  border: "oklch(0.65 0.17 35 / 0.6)" },
  tom_sad:     { bg: "oklch(0.30 0.08 240 / 0.9)", fg: "oklch(0.96 0.03 240)", border: "oklch(0.58 0.10 240 / 0.55)" },
  v_m1:        { bg: "oklch(0.34 0.09 55 / 0.88)", fg: "oklch(0.98 0.04 70)",  border: "oklch(0.62 0.12 55 / 0.55)" },
  v_m2:        { bg: "oklch(0.34 0.08 40 / 0.88)", fg: "oklch(0.98 0.04 55)",  border: "oklch(0.60 0.10 40 / 0.55)" },
  v_m3:        { bg: "oklch(0.32 0.12 20 / 0.9)",  fg: "oklch(0.98 0.04 40)",  border: "oklch(0.60 0.15 20 / 0.55)" },
  v_w1:        { bg: "oklch(0.38 0.10 350 / 0.88)", fg: "oklch(0.98 0.04 350)", border: "oklch(0.66 0.13 350 / 0.55)" },
  v_w2:        { bg: "oklch(0.36 0.08 330 / 0.88)", fg: "oklch(0.97 0.04 340)", border: "oklch(0.62 0.10 330 / 0.55)" },
  villagers:   { bg: "oklch(0.30 0.03 80 / 0.9)",  fg: "oklch(0.96 0.02 85)",  border: "oklch(0.55 0.04 80 / 0.55)" },
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

  // 스토리별 TTS: scene.id 에서 story 폴더/씬 번호를 도출한다. ("boy-wolf-3" → boy-wolf/scene3)
  const audioState = useSceneAudioState();
  const sceneNum = scene.id.match(/-(\d+)$/)?.[1] ?? "1";
  const storyDir = scene.id.replace(/-\d+$/, "");
  const masterUrl = `/audio/${storyDir}/scene${sceneNum}.mp3`;
  const hasMasterVoice = storyDir === "boy-wolf";
  const fallbackBeats = useMemo<SceneBeat[]>(() => {
    return scene.beats.map((b, i) => ({
      ...b,
      i,
      file: `/audio/${storyDir}/scene${sceneNum}/tts/${String(i).padStart(2, "0")}_${b.who}.mp3`,
      dur: Math.max(0, b.to - b.from),
    }));
  }, [scene.beats, sceneNum, storyDir]);
  const masterStatus = useSceneMasterVoice({
    url: masterUrl,
    t,
    speed,
    audioState,
    durationSec: scene.durationSec,
    enabled: hasMasterVoice,
  });
  useSceneBeatPlayback(
    fallbackBeats,
    t,
    speed,
    audioState,
    !hasMasterVoice || masterStatus.state === "error",
  );

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
      const waitingForVoice =
        hasMasterVoice &&
        !audioState.voiceMuted &&
        !masterStatus.hasStarted &&
        masterStatus.state !== "error" &&
        (!audioState.unlocked || masterStatus.state === "idle" || masterStatus.state === "loading" || masterStatus.state === "ready" || masterStatus.state === "blocked");
      if (waitingForVoice) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const next = timeRef.current + dt * speed;
      // 씬 완료 조건: 타이머 만료 + 음성 완료(또는 음성 사용 안 함/에러/뮤트)
      const voiceDone =
        !hasMasterVoice ||
        audioState.voiceMuted ||
        masterStatus.state === "error" ||
        masterStatus.hasFinished;
      if (next >= scene.durationSec) {
        if (voiceDone && !doneRef.current) {
          doneRef.current = true;
          window.setTimeout(() => onCompleteRef.current?.(), 0);
          timeRef.current = next % scene.durationSec;
        } else {
          // 음성이 아직 끝나지 않았으면 타이머를 durationSec 직전에 고정
          timeRef.current = Math.max(0, scene.durationSec - 0.05);
        }
      } else {
        timeRef.current = next;
      }
      setT(timeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [scene.id, scene.durationSec, speed, hasMasterVoice, audioState.unlocked, audioState.voiceMuted, masterStatus.hasStarted, masterStatus.hasFinished, masterStatus.state]);

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

  useDevMotionSync(scene.id, SCENE_MOTIONS[scene.id] ?? []);

  const pulse = 0.985 + Math.sin(t * 0.55) * 0.015;
  const driftX = Math.sin(t * 0.14) * 1.2;
  const driftY = Math.cos(t * 0.12) * 1.1;

  const beat = scene.beats.find((b) => t >= b.from && t < b.to);
  const voiceNotice = hasMasterVoice && masterStatus.state !== "playing" && masterStatus.state !== "ready" && masterStatus.state !== "idle"
    ? masterStatus.state === "error"
      ? `음성 오류 · ${masterStatus.message ?? masterUrl}`
      : !masterStatus.hasStarted
        ? `음성 준비 중 · ${masterStatus.state}${masterStatus.attempts ? ` ${masterStatus.attempts}` : ""}`
        : null
    : null;

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

  // 씬 3 36~52s: 시골쥐 신규 시트 5장 — left 40%, bottom 40%, 4초 간격 순환 전환
  const scene3CountryAlt2Frames = [
    scene3CountryPAsset.url,
    scene3CountryQAsset.url,
    scene3CountryRAsset.url,
    scene3CountrySAsset.url,
    scene3CountryTAsset.url,
  ];
  const showScene3CountryAlt2 = scene.id === "town-country-3" && t >= 36 && t < 52;
  const scene3CountryAlt2Idx = showScene3CountryAlt2
    ? Math.min(scene3CountryAlt2Frames.length - 1, Math.floor((t - 36) / 4))
    : 0;
  const scene3CountryAlt2Entry = showScene3CountryAlt2 ? Math.min(1, ((t - 36) % 4) / 0.4) : 0;

  // 씬 3 52~58s: 시골쥐 신규 시트 3장 — left 40%, bottom 40%, 2초 간격 순환 전환
  const scene3CountryAlt3Frames = SCENE3_COUNTRY_ALT3.frames.map((f) => f.url);
  const showScene3CountryAlt3 =
    scene.id === SCENE3_COUNTRY_ALT3.sceneId &&
    t >= SCENE3_COUNTRY_ALT3.startSec &&
    t < SCENE3_COUNTRY_ALT3.endSec;
  const scene3CountryAlt3Idx = showScene3CountryAlt3
    ? Math.min(
        scene3CountryAlt3Frames.length - 1,
        Math.floor((t - SCENE3_COUNTRY_ALT3.startSec) / SCENE3_COUNTRY_ALT3.intervalSec)
      )
    : 0;
  const scene3CountryAlt3Entry = showScene3CountryAlt3
    ? Math.min(
        1,
        ((t - SCENE3_COUNTRY_ALT3.startSec) % SCENE3_COUNTRY_ALT3.intervalSec) /
          SCENE3_COUNTRY_ALT3.fadeInSec
      )
    : 0;

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

  // 씬 3 64~72s: 시골쥐 왕복 모션 — 2회 왕복 (각 4초).
  // 각 왕복: 0~2s 프레임1로 left 40→30, 2~4s 프레임2로 left 30→40.
  const showScene3CountryRun = scene.id === "town-country-3" && t >= 64 && t < 72;
  const scene3CountryRunLocal = showScene3CountryRun ? (t - 64) % 4 : 0;
  const scene3CountryRunGoing = scene3CountryRunLocal < 2;
  const scene3CountryRunPhase = scene3CountryRunGoing
    ? scene3CountryRunLocal / 2
    : (scene3CountryRunLocal - 2) / 2;
  const scene3CountryRunLeftPct = scene3CountryRunGoing
    ? 40 + (30 - 40) * scene3CountryRunPhase
    : 30 + (40 - 30) * scene3CountryRunPhase;
  const scene3CountryRunSrc = scene3CountryRunGoing
    ? scene3CountryRun1Asset.url
    : scene3CountryRun2Asset.url;

  // 씬 4 0~12s: 한 쌍 캐릭터(좌우 반전) 도망 — left 15% → 80%, bottom 10%
  const showScene4PairFlee =
    scene.id === SCENE4_FLEE.sceneId && t >= SCENE4_FLEE.startSec && t < SCENE4_FLEE.endSec;
  const scene4PairFleeProgress = showScene4PairFlee
    ? (t - SCENE4_FLEE.startSec) / (SCENE4_FLEE.endSec - SCENE4_FLEE.startSec)
    : 0;
  const scene4PairFleeLeftPct =
    SCENE4_FLEE.fromLeftPct + (SCENE4_FLEE.toLeftPct - SCENE4_FLEE.fromLeftPct) * scene4PairFleeProgress;
  const scene4PairFleeEntry = showScene4PairFlee
    ? Math.min(1, (t - SCENE4_FLEE.startSec) / SCENE4_FLEE.fadeInSec)
    : 0;

  // 씬 4 12~36s: 시골쥐 캐릭터 시트 2장 — left 80%, bottom 15%, 4초 간격 순환 전환
  const scene4CountryCycleFrames = SCENE4_COUNTRY_CYCLE.frames.map((f) => f.url);
  const showScene4CountryCycle =
    scene.id === SCENE4_COUNTRY_CYCLE.sceneId &&
    t >= SCENE4_COUNTRY_CYCLE.startSec &&
    t < SCENE4_COUNTRY_CYCLE.endSec;
  const scene4CountryCycleIdx = showScene4CountryCycle
    ? Math.floor((t - SCENE4_COUNTRY_CYCLE.startSec) / SCENE4_COUNTRY_CYCLE.intervalSec) %
      scene4CountryCycleFrames.length
    : 0;
  const scene4CountryCycleEntry = showScene4CountryCycle
    ? Math.min(
        1,
        ((t - SCENE4_COUNTRY_CYCLE.startSec) % SCENE4_COUNTRY_CYCLE.intervalSec) /
          SCENE4_COUNTRY_CYCLE.fadeInSec
      )
    : 0;

  // 양치기 소년 씬1: 톰 순환 포즈
  const boyWolfS1TomFrames = BOY_WOLF_S1_TOM.frames.map((f) => f.url);
  const showBoyWolfS1Tom =
    scene.id === BOY_WOLF_S1_TOM.sceneId &&
    t >= BOY_WOLF_S1_TOM.startSec &&
    t < BOY_WOLF_S1_TOM.endSec;
  const boyWolfS1TomIdx = showBoyWolfS1Tom
    ? Math.floor((t - BOY_WOLF_S1_TOM.startSec) / BOY_WOLF_S1_TOM.intervalSec) %
      boyWolfS1TomFrames.length
    : 0;
  const boyWolfS1TomEntry = showBoyWolfS1Tom
    ? Math.min(
        1,
        ((t - BOY_WOLF_S1_TOM.startSec) % BOY_WOLF_S1_TOM.intervalSec) /
          BOY_WOLF_S1_TOM.fadeInSec
      )
    : 0;

  // 양치기 소년 씬1: 양떼 순환 + 좌우 왕복
  const boyWolfS1SheepFrames = BOY_WOLF_S1_SHEEP.frames.map((f) => f.url);
  const showBoyWolfS1Sheep =
    scene.id === BOY_WOLF_S1_SHEEP.sceneId &&
    t >= BOY_WOLF_S1_SHEEP.startSec &&
    t < BOY_WOLF_S1_SHEEP.endSec;
  const boyWolfS1SheepIdx = showBoyWolfS1Sheep
    ? Math.floor((t - BOY_WOLF_S1_SHEEP.startSec) / BOY_WOLF_S1_SHEEP.intervalSec) %
      boyWolfS1SheepFrames.length
    : 0;
  const boyWolfS1SheepEntry = showBoyWolfS1Sheep
    ? Math.min(
        1,
        ((t - BOY_WOLF_S1_SHEEP.startSec) % BOY_WOLF_S1_SHEEP.intervalSec) /
          BOY_WOLF_S1_SHEEP.fadeInSec
      )
    : 0;
  const boyWolfS1SheepMid =
    (BOY_WOLF_S1_SHEEP.leftMinPct + BOY_WOLF_S1_SHEEP.leftMaxPct) / 2;
  const boyWolfS1SheepAmp =
    (BOY_WOLF_S1_SHEEP.leftMaxPct - BOY_WOLF_S1_SHEEP.leftMinPct) / 2;
  const boyWolfS1SheepLeftPct = showBoyWolfS1Sheep
    ? boyWolfS1SheepMid +
      boyWolfS1SheepAmp *
        Math.sin(
          ((t - BOY_WOLF_S1_SHEEP.startSec) * Math.PI * 2) /
            BOY_WOLF_S1_SHEEP.sweepSec
        )
    : boyWolfS1SheepMid;

  const showScene3PairFlee = scene.id === "town-country-3" && t >= 76 && t < 86;
  const scene3PairFleeProgress = showScene3PairFlee ? (t - 76) / 10 : 0;
  const scene3PairFleeLeftPct = 50 + (80 - 50) * scene3PairFleeProgress;
  const scene3PairFleeEntry = showScene3PairFlee ? Math.min(1, (t - 76) / 0.4) : 0;

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

      {voiceNotice && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold"
          style={{
            top: "13%",
            zIndex: 8,
            background: masterStatus.state === "error" ? "oklch(0.32 0.12 25 / 0.88)" : "oklch(0.18 0.04 70 / 0.78)",
            color: "oklch(0.96 0.04 80)",
            border: "1px solid oklch(0.85 0.08 75 / 0.32)",
            boxShadow: "0 6px 18px oklch(0 0 0 / 0.35)",
          }}
        >
          {voiceNotice}
        </div>
      )}

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
      {showScene3CountryAlt2 && (
        <img
          key={`scene3-country-alt2-${scene3CountryAlt2Idx}`}
          src={scene3CountryAlt2Frames[scene3CountryAlt2Idx]}
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
            opacity: Math.max(0.9, scene3CountryAlt2Entry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "transform 100ms linear",
          }}
        />
      )}
      {showScene3CountryAlt3 && (
        <img
          key={`scene3-country-alt3-${scene3CountryAlt3Idx}`}
          src={scene3CountryAlt3Frames[scene3CountryAlt3Idx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${SCENE3_COUNTRY_ALT3.leftPct}%`,
            bottom: `${SCENE3_COUNTRY_ALT3.bottomPct}%`,
            height: "22%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) rotate(${cmSway}deg)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3CountryAlt3Entry),
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
      {showScene3CountryRun && (
        <img
          key={`scene3-country-run-${scene3CountryRunGoing ? 1 : 2}`}
          src={scene3CountryRunSrc}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${scene3CountryRunLeftPct}%`,
            bottom: "40%",
            height: "28.6%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px)`,
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "left 100ms linear, transform 100ms linear",
          }}
        />
      )}
      {showScene3PairFlee && (
        <img
          src={scene3PairRunAsset.url}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${scene3PairFleeLeftPct}%`,
            bottom: "10%",
            height: "26%",
            width: "auto",
            transform: `translate(-50%, ${cmBob}px) scaleX(-1)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene3PairFleeEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "left 100ms linear, transform 100ms linear",
          }}
        />
      )}
      {showScene4PairFlee && (
        <img
          src={SCENE4_FLEE.asset.url}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${scene4PairFleeLeftPct}%`,
            bottom: `${SCENE4_FLEE.bottomPct}%`,
            height: `${SCENE4_FLEE.heightPct}%`,
            width: "auto",
            transform: `translate(-50%, ${cmBob}px)${SCENE4_FLEE.flipX ? " scaleX(-1)" : ""}`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene4PairFleeEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
            transition: "left 100ms linear, transform 100ms linear",
          }}
        />
      )}
      {showScene4CountryCycle && (
        <img
          src={scene4CountryCycleFrames[scene4CountryCycleIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${SCENE4_COUNTRY_CYCLE.leftPct}%`,
            bottom: `${SCENE4_COUNTRY_CYCLE.bottomPct}%`,
            height: `${SCENE4_COUNTRY_CYCLE.heightPct}%`,
            width: "auto",
            transform: `translate(-50%, ${cmBob}px)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, scene4CountryCycleEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45)) brightness(1.15)",
          }}
        />
      )}
      {showBoyWolfS1Tom && (
        <img
          src={boyWolfS1TomFrames[boyWolfS1TomIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${BOY_WOLF_S1_TOM.leftPct}%`,
            bottom: `${BOY_WOLF_S1_TOM.bottomPct}%`,
            height: `${BOY_WOLF_S1_TOM.heightPct}%`,
            width: "auto",
            transform: `translate(-50%, ${cmBob}px)${BOY_WOLF_S1_TOM.flipX ? " scaleX(-1)" : ""}`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, boyWolfS1TomEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45))",
          }}
        />
      )}
      {showBoyWolfS1Sheep && (
        <img
          src={boyWolfS1SheepFrames[boyWolfS1SheepIdx]}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${boyWolfS1SheepLeftPct}%`,
            bottom: `${BOY_WOLF_S1_SHEEP.bottomPct}%`,
            height: `${BOY_WOLF_S1_SHEEP.heightPct}%`,
            width: "auto",
            transform: `translate(-50%, ${cmBob}px)`,
            transformOrigin: "bottom center",
            opacity: Math.max(0.9, boyWolfS1SheepEntry),
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.45))",
            transition: "left 0.1s linear",
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