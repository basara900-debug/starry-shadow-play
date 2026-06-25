import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cassetteImg from "@/assets/idle-animation.gif";
import theaterStageImg from "@/assets/theater-stage.jpg";
import mainThemeUrl from "@/assets/main-theme.mp3";
import scene3BgmAsset from "@/assets/scene3/scene3_bgm.mp3.asset.json";
import scene3SfxAsset from "@/assets/scene3/scene3_sfx.mp3.asset.json";
import scene4BgmAsset from "@/assets/scene4/scene4_bgm.mp3.asset.json";
import scene4SfxAsset from "@/assets/scene4/scene4_sfx.mp3.asset.json";
import scene5BgmAsset from "@/assets/scene5/scene5_bgm.mp3.asset.json";
import { StorySceneMotion, type StorySceneSpeed } from "@/components/StorySceneMotion";
import { CASSETTES, type Cassette } from "@/data/cassettes";
import { TOWN_COUNTRY_STORY } from "@/data/townCountryStory";
import { supabase } from "@/integrations/supabase/client";
import { Scene1Motion, type Scene1Speed } from "@/components/Scene1Motion";
import { Scene2Motion, type Scene2Speed } from "@/components/Scene2Motion";
import { Scene3Motion, type Scene3Speed } from "@/components/Scene3Motion";
import { Scene4Motion, type Scene4Speed } from "@/components/Scene4Motion";
import { Scene5Motion, type Scene5Speed } from "@/components/Scene5Motion";
import {
  SceneAudioProvider,
  useSceneAudioControls,
  usePrimeSceneAudio,
  type SceneSpeed,
} from "@/lib/sceneAudio";

export const Route = createFileRoute("/")({
  component: ShadowTheaterRoute,
});

function ShadowTheaterRoute() {
  return (
    <SceneAudioProvider>
      <ShadowTheaterTitle />
    </SceneAudioProvider>
  );
}

type Stage = "idle" | "theater";

export type SceneRow = { id: string; url: string; path: string; name: string };

const SCENES_BUCKET = "scenes";

function publicUrlFor(path: string): string {
  const { data } = supabase.storage.from(SCENES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function loadScenesFromCloud(): Promise<SceneRow[]> {
  const { data, error } = await supabase
    .from("scenes")
    .select("id, name, image_path, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[scenes] load failed", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string) ?? "",
    path: r.image_path as string,
    url: publicUrlFor(r.image_path as string),
  }));
}

/* ---------- Audio engine (Web Audio synth, no assets) ---------- */
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmTargetRef = useRef<number>(0.55);
  const bgmMutedRef = useRef<boolean>(false);
  const fadeTimerRef = useRef<number | null>(null);
  const playbackRateRef = useRef<number>(1.0);

  const applyBgmVolume = useCallback(() => {
    const a = bgmAudioRef.current;
    if (!a) return;
    a.volume = bgmMutedRef.current ? 0 : bgmTargetRef.current;
  }, []);

  const setBgmVolume = useCallback((v: number) => {
    bgmTargetRef.current = Math.max(0, Math.min(1, v));
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    applyBgmVolume();
  }, [applyBgmVolume]);

  const setBgmMuted = useCallback((m: boolean) => {
    bgmMutedRef.current = m;
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    applyBgmVolume();
  }, [applyBgmVolume]);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = Math.max(0.1, Math.min(2.0, rate));
    const a = bgmAudioRef.current;
    if (a) a.playbackRate = playbackRateRef.current;
  }, []);

  const ensure = useCallback(async () => {
    if (!ctxRef.current) {
      const Ctx =
        (window.AudioContext as typeof AudioContext) ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
      const bgm = ctx.createGain();
      bgm.gain.value = 0;
      bgm.connect(master);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const startBgm = useCallback(async () => {
    await ensure();
    if (!bgmAudioRef.current) {
      const a = new Audio(mainThemeUrl);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      a.playbackRate = playbackRateRef.current;
      bgmAudioRef.current = a;
    }
    const a = bgmAudioRef.current;
    try {
      await a.play();
    } catch {
      // autoplay blocked until user gesture; ignore
    }
    // fade in to current target (respecting mute)
    if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
    const target = bgmMutedRef.current ? 0 : bgmTargetRef.current;
    const steps = 24;
    const dur = 1200;
    let i = 0;
    const start = a.volume;
    fadeTimerRef.current = window.setInterval(() => {
      i++;
      a.volume = Math.min(1, start + (target - start) * (i / steps));
      if (i >= steps) {
        if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }, dur / steps);
  }, [ensure]);

  const stopBgm = useCallback(() => {
    const a = bgmAudioRef.current;
    if (!a) return;
    if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
    const steps = 16;
    const dur = 600;
    const start = a.volume;
    let i = 0;
    fadeTimerRef.current = window.setInterval(() => {
      i++;
      a.volume = Math.max(0, start * (1 - i / steps));
      if (i >= steps) {
        if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
        a.pause();
      }
    }, dur / steps);
  }, []);

  const sfx = useMemo(
    () => ({
      click: async () => {
        const ctx = await ensure();
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(440, t + 0.08);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g).connect(masterRef.current!);
        o.start(t);
        o.stop(t + 0.14);
      },
      sparkle: async () => {
        const ctx = await ensure();
        const t = ctx.currentTime;
        const notes = [1318.5, 1760, 2093];
        notes.forEach((f, idx) => {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.setValueAtTime(f, t + idx * 0.08);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.14, t + idx * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.35);
          o.connect(g).connect(masterRef.current!);
          o.start(t + idx * 0.08);
          o.stop(t + idx * 0.08 + 0.4);
        });
      },
    }),
    [ensure]
  );

  const setMasterVolume = useCallback((v: number) => {
    const m = masterRef.current;
    if (!m) return;
    m.gain.value = Math.max(0, Math.min(1, v));
  }, []);

  return { startBgm, stopBgm, sfx, setBgmVolume, setBgmMuted, setMasterVolume, setPlaybackRate, ensure };
}

/* ---------- Geometry of the cassette image (percent of image box) ---------- */
// Left reel circle
const L = { cx: 28.2, cy: 47.5, r: 18.6 };
// Right stage circle
const R = { cx: 70.2, cy: 47.5, r: 18.6 };
// Buttons row (5 buttons)
const BTN_Y = 85.5;
const BTN_W = 7.2;
const BTN_H = 11.5;
const BTN_X = [30.2, 40.1, 50.0, 59.9, 69.8];

/* ---------- Main component ---------- */
function ShadowTheaterTitle() {
  const [stage, setStage] = useState<Stage>("idle");
  const [musicOn, setMusicOn] = useState(false);
  const [pressed, setPressed] = useState<number | null>(null);
  const [bgmVol, setBgmVol] = useState(0.55);
  const [bgmMuted, setBgmMutedState] = useState(false);
  const [sfxVol, setSfxVol] = useState(0.6);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [voiceVol, setVoiceVol] = useState(0.8);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  // 카세트 삽입/이젝트 상태.
  // - selectedCassetteId: 리스트에서 마지막으로 고른 카세트 (다음 INPUT 시 삽입될 대상)
  // - loadedCassetteId: 현재 데크에 물리적으로 삽입되어 모션 프로그램에 커넥팅된 카세트 (null = 이젝트 상태)
  // 처음 의도대로 INPUT/EJECT 버튼이 개미와 베짱이 모션 프로그램과의 연결을 토글한다.
  // 각 카세트는 자체 완결된 프로그램. 기본 삽입 카세트는 "개미와 베짱이".
  // 가장 최근 updatedAt 카세트를 기본값으로 사용한다.
  const DEFAULT_CASSETTE_ID = [...CASSETTES].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  )[0]?.id ?? CASSETTES[0].id;
  // 마지막으로 작업/재생하던 카세트를 기억해 새로고침(커밋) 후에도 동일한 카세트가 데크에 삽입돼 있도록 한다.
  const LAST_CASSETTE_KEY = "shadow-theater:last-cassette";
  const initialCassetteId = (() => {
    if (typeof window === "undefined") return DEFAULT_CASSETTE_ID;
    try {
      const stored = window.localStorage.getItem(LAST_CASSETTE_KEY);
      if (stored && CASSETTES.some((c) => c.id === stored)) return stored;
    } catch { /* noop */ }
    return DEFAULT_CASSETTE_ID;
  })();
  const [selectedCassetteId, setSelectedCassetteId] = useState<string>(initialCassetteId);
  const [loadedCassetteId, setLoadedCassetteId] = useState<string | null>(initialCassetteId);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loadedCassetteId) return;
    try { window.localStorage.setItem(LAST_CASSETTE_KEY, loadedCassetteId); } catch { /* noop */ }
  }, [loadedCassetteId]);
  const { startBgm, stopBgm, sfx, setBgmVolume, setBgmMuted, setMasterVolume, setPlaybackRate, ensure } = useAudio();

  useEffect(() => { setBgmVolume(bgmVol); }, [bgmVol, setBgmVolume]);
  useEffect(() => { setBgmMuted(bgmMuted); }, [bgmMuted, setBgmMuted]);
  useEffect(() => { setMasterVolume(sfxMuted ? 0 : sfxVol); }, [sfxVol, sfxMuted, setMasterVolume]);
  useEffect(() => { setPlaybackRate(playbackRate); }, [playbackRate, setPlaybackRate]);

  // 모든 씬에 적용되는 공용 오디오 버스에도 동일 값을 흘려보낸다.
  const bus = useSceneAudioControls();
  const sceneAudioUrls = useMemo(
    () => [
      "/audio/scene1_bgm.mp3",
      "/audio/summer_insects_90s_vfx.wav",
      "/audio/scene2_bgm.mp3",
      "/audio/scene2_sfx.mp3",
      scene3BgmAsset.url,
      scene3SfxAsset.url,
      scene4BgmAsset.url,
      scene4SfxAsset.url,
      mainThemeUrl,
      scene5BgmAsset.url,
      // 다른 카세트(스토리 프로그램)들의 모든 씬 오디오도 함께 프라임한다.
      // 첫 사용자 제스처에서 모든 Audio 요소가 잠금 해제되어야 자동 씬 전환 시
      // 새 씬의 BGM/SFX가 끊김 없이 재생된다(Safari/iOS는 요소별 unlock 필요).
      ...TOWN_COUNTRY_STORY.scenes.flatMap((s) => [s.bgmUrl, s.sfxUrl]).filter((u): u is string => Boolean(u)),
    ],
    []
  );
  usePrimeSceneAudio(sceneAudioUrls);
  useEffect(() => { bus.setBgm(bgmVol); }, [bgmVol, bus]);
  useEffect(() => { bus.setBgmMuted(bgmMuted); }, [bgmMuted, bus]);
  useEffect(() => { bus.setSfx(sfxVol); }, [sfxVol, bus]);
  useEffect(() => { bus.setSfxMuted(sfxMuted); }, [sfxMuted, bus]);
  useEffect(() => { bus.setVoice(voiceVol); }, [voiceVol, bus]);
  useEffect(() => { bus.setVoiceMuted(voiceMuted); }, [voiceMuted, bus]);
  useEffect(() => { bus.setPlaybackRate(playbackRate); }, [playbackRate, bus]);

  // 타이틀 등장과 동시에 BGM 자동 재생. 브라우저 autoplay 차단 시 첫 사용자 제스처에서 재시도.
  useEffect(() => {
    let started = false;
    const tryStart = async () => {
      if (started) return;
      started = true;
      setMusicOn(true);
      await startBgm();
    };
    tryStart();
    const onGesture = () => { tryStart(); };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [startBgm]);

  const handleButton = async (i: number) => {
    setPressed(i);
    setTimeout(() => setPressed(null), 160);
    await sfx.click();
    if (i === 0) {
      // PLAY: 카세트가 삽입(커넥팅) 되어 있을 때만 그림자 연극 스테이지로 전환한다.
      // 이젝트 상태(loadedCassetteId == null)에서는 무시 — 사용자는 먼저 INPUT 으로 카세트를 끼워야 한다.
      if (loadedCassetteId == null) return;
      window.setTimeout(() => {
        stopBgm();
        setMusicOn(false);
        setStage("theater");
      }, 1200);
    } else if (i === 3) {
      // SETTING opens settings panel
      await ensure();
      setSettingsOpen(true);
    } else if (i === 2) {
      // INPUT/EJECT: 현재 선택된 카세트를 데크에 끼우거나 빼낸다.
      // - 비어 있으면 selectedCassetteId 를 삽입 (모션 프로그램에 커넥팅)
      // - 이미 끼워져 있으면 이젝트 (모션 프로그램 연결 해제)
      setLoadedCassetteId((prev) => (prev == null ? selectedCassetteId : null));
    } else if (i === 1) {
      // LIST opens cassette list panel
      await ensure();
      setListOpen(true);
    }
    // STORE (i === 4): reserved for future store flow
  };

  const exitTheater = async () => {
    await sfx.click();
    setStage("idle");
    setMusicOn(true);
    await startBgm();
  };

  // 씬 라이브러리 로드 (Cloud)
  useEffect(() => {
    let cancelled = false;
    loadScenesFromCloud().then((rows) => {
      if (cancelled) return;
      setScenes(rows);
      setSceneIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshScenes = useCallback(async () => {
    const rows = await loadScenesFromCloud();
    setScenes(rows);
  }, []);

  return (
    <main
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, oklch(0.22 0.05 55) 0%, oklch(0.08 0.02 40) 75%)",
      }}
    >
      <Keyframes />
      {/* Aspect-ratio stage that contains the entire UI. Fits any viewport. */}
      <div
        className="relative"
        style={{
          aspectRatio: "1376 / 768",
          width: "min(100vw, calc(100dvh * 1376 / 768))",
          height: "min(100dvh, calc(100vw * 768 / 1376))",
        }}
      >
        {stage === "idle" && (
          <>
            {/* Base cassette image — used as-is */}
            <img
              src={cassetteImg}
              alt="Little Star, Little Forest, Shadow Theater cassette"
              className="absolute inset-0 h-full w-full select-none"
              draggable={false}
            />

            {/* ===== BUTTON HOTSPOTS ===== */}
            {BTN_X.map((x, i) => (
          <button
            key={i}
            onClick={() => handleButton(i)}
            aria-label={["Play", "List", "Input/Eject", "Setting", "Store"][i]}
            className="absolute cursor-pointer rounded-[14%] border-0 bg-transparent p-0 transition-transform"
            style={{
              left: `${x - BTN_W / 2}%`,
              top: `${BTN_Y - BTN_H / 2}%`,
              width: `${BTN_W}%`,
              height: `${BTN_H}%`,
              transform: pressed === i ? "translateY(2%) scale(0.96)" : "none",
              boxShadow:
                pressed === i
                  ? "inset 0 4px 8px oklch(0 0 0 / 0.35)"
                  : "0 0 0 transparent",
            }}
          />
            ))}

            {/* tiny LED on cassette to show music state */}
            <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "50%",
            top: "6.2%",
            width: "1.1%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: musicOn
              ? "radial-gradient(circle, oklch(0.85 0.18 80), oklch(0.55 0.18 60))"
              : "oklch(0.25 0.02 60)",
            boxShadow: musicOn
              ? "0 0 12px oklch(0.85 0.18 80 / 0.9)"
              : "none",
            transition: "background 0.3s, box-shadow 0.3s",
          }}
            />
          </>
        )}

        {stage === "theater" && (
          <TheaterStage
            cassetteId={loadedCassetteId}
            scenes={scenes}
            onRefresh={refreshScenes}
            sceneIndex={sceneIndex}
            setSceneIndex={setSceneIndex}
            onOpenSettings={async () => { await sfx.click(); await ensure(); setSettingsOpen(true); }}
            onExit={exitTheater}
            onClickSfx={sfx.click}
          />
        )}

        {/* Settings panel (opens from SETTING button) */}
        {settingsOpen && (
          <SettingsPanel
            onClose={() => setSettingsOpen(false)}
            rows={[
              { label: "BGM", volume: bgmVol, muted: bgmMuted, setVolume: setBgmVol, setMuted: setBgmMutedState },
              { label: "SFX", volume: sfxVol, muted: sfxMuted, setVolume: setSfxVol, setMuted: setSfxMuted },
              { label: "대사 / 나레이션", volume: voiceVol, muted: voiceMuted, setVolume: setVoiceVol, setMuted: setVoiceMuted },
            ]}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRateState}
          />
        )}

        {listOpen && (
          <ListPanel
            onClose={() => setListOpen(false)}
            selectedId={selectedCassetteId}
            loadedId={loadedCassetteId}
            onSelect={(id) => {
              setSelectedCassetteId(id);
              // 카세트가 이미 끼워져 있던 상태라면, 새로 선택한 카세트로 즉시 교체(swap)하여
              // 사용자가 메인 UI 로 돌아가 PLAY 만 누르면 새 동화가 바로 구동되도록 한다.
              setLoadedCassetteId((prev) => (prev == null ? prev : id));
              setListOpen(false);
            }}
          />
        )}

        {/* 카세트 삽입/이젝트 상태 표시 (메인 타이틀에서만) */}
        {stage === "idle" && (
          <div
            className="pointer-events-none absolute text-[10px] font-semibold"
            style={{
              left: "50%",
              top: "9.2%",
              transform: "translateX(-50%)",
              padding: "2px 10px",
              borderRadius: 999,
              background: loadedCassetteId
                ? "oklch(0.35 0.08 145 / 0.85)"
                : "oklch(0.3 0.02 50 / 0.75)",
              color: loadedCassetteId
                ? "oklch(0.95 0.12 145)"
                : "oklch(0.75 0.04 75)",
              border: loadedCassetteId
                ? "1px solid oklch(0.85 0.16 145 / 0.5)"
                : "1px solid oklch(0.85 0.08 75 / 0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {loadedCassetteId
              ? `▣ ${CASSETTES.find((c) => c.id === loadedCassetteId)?.title ?? "카세트"} 삽입됨`
              : "▢ 이젝트됨 — INPUT 으로 카세트 삽입"}
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- Helpers ---------- */

/* ---------- Theater Stage (세컨드 스테이지) ---------- */
// 무대 이미지 내 스크린 영역(이미지 박스 % 좌표)
const SCREEN = { x: 13.2, y: 7.5, w: 73.6, h: 70.5 };
// 무대 이미지에 그려져 있는 4개 컨트롤 버튼의 클릭 핫스팟 (중심 x%, y% 고정)
const THEATER_BTN_Y = 81.0;
const THEATER_BTN_W = 7.5;
const THEATER_BTN_H = 7.2;
const THEATER_BTN_X = [29.0, 43.0, 57.0, 68.0];

function TheaterStage({
  cassetteId,
  scenes,
  onRefresh,
  sceneIndex,
  setSceneIndex,
  onOpenSettings,
  onExit,
  onClickSfx,
}: {
  cassetteId: string | null;
  scenes: SceneRow[];
  onRefresh: () => Promise<void>;
  sceneIndex: number;
  setSceneIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenSettings: () => void;
  onExit: () => void;
  onClickSfx: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // 1x → 2x → paused → 1x ... 세 단계 순환
  const [playState, setPlayState] = useState<"1x" | "2x" | "paused">("1x");
  const [pressed, setPressed] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // 공용 오디오 버스에 현재 재생 속도를 반영 (일시정지 시 0).
  const audioCtl = useSceneAudioControls();
  useEffect(() => {
    const s: SceneSpeed = playState === "paused" ? 0 : playState === "2x" ? 2 : 1;
    audioCtl.setSpeed(s);
  }, [playState, audioCtl]);

  // 극장(세컨드 스테이지)에서 잠시 바꾼 재생 속도는 메인 타이틀 UI 설정과 분리한다.
  // TheaterStage가 언마운트되면 공용 오디오 버스의 speed를 기본값(1x)으로 복구해
  // 메인 화면 BGM/SFX가 2배속 또는 정지 상태로 남지 않게 한다.
  useEffect(() => {
    return () => {
      audioCtl.setSpeed(1);
    };
  }, [audioCtl]);

  // 카세트별 프로그램 분리 — 한 카세트가 다른 카세트의 모션/대사/오디오를 절대 침범하지 않는다.
  // program 값이 그 카세트 안에서 어떤 씬 시스템이 동작할지를 결정한다.
  const program: "ants-grasshopper" | "town-country" | null =
    cassetteId === "ants-grasshopper"
      ? "ants-grasshopper"
      : cassetteId === TOWN_COUNTRY_STORY.id
        ? "town-country"
        : null;
  const storyProgram = program === "town-country" ? TOWN_COUNTRY_STORY : null;
  const activeScenes = storyProgram
    ? storyProgram.scenes.map((scene) => ({
        id: scene.id,
        url: scene.url,
        path: scene.id,
        name: `${scene.title} · ${scene.setting}`,
      }))
    : scenes;
  const current = activeScenes[sceneIndex];
  const paused = playState === "paused";
  // 씬 2 배경 이미지가 아직 업로드되지 않아도 가을 톤 폴백으로 모션을 보여줌
  const showScene2Fallback =
    program === "ants-grasshopper" && sceneIndex === 1 && !current;
  // 자유 업로드 워크플로우는 어떤 카세트에도 묶이지 않은 "프로그램 없음" 상태에서만 허용한다.
  const allowSceneUploads = program === null;

  const openPicker = () => fileRef.current?.click();

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    const startIndex = scenes.length;
    const baseOrder = scenes.length;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(SCENES_BUCKET)
          .upload(path, file, { contentType: file.type || `image/${ext}`, upsert: false });
        if (upErr) {
          console.error("[scenes] upload failed", upErr);
          continue;
        }
        const { error: insErr } = await supabase.from("scenes").insert({
          name: file.name,
          image_path: path,
          sort_order: baseOrder + i,
        });
        if (insErr) console.error("[scenes] insert row failed", insErr);
      }
      await onRefresh();
      setSceneIndex(startIndex);
    } finally {
      setUploading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("모든 씬을 삭제할까요?")) return;
    const paths = scenes.map((s) => s.path);
    if (paths.length) {
      await supabase.storage.from(SCENES_BUCKET).remove(paths);
    }
    await supabase.from("scenes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setSceneIndex(0);
    await onRefresh();
  };

  const deleteCurrent = async () => {
    if (!current) return;
    if (!confirm(`씬 ${sceneIndex + 1} 배경을 삭제할까요?`)) return;
    if (current.path) {
      await supabase.storage.from(SCENES_BUCKET).remove([current.path]);
    }
    await supabase.from("scenes").delete().eq("id", current.id);
    setSceneIndex((i) => Math.max(0, Math.min(i, scenes.length - 2)));
    await onRefresh();
  };

  const press = async (i: number, fn: () => void) => {
    setPressed(i);
    setTimeout(() => setPressed(null), 160);
    await onClickSfx();
    fn();
  };

  // 자동 씬 전환: 1x = 8s, 2x = 4s, paused = 정지
  useEffect(() => {
    if (activeScenes.length < 2 || paused) return;
    // 씬 1은 Scene1Motion이 자체적으로 90초 루프를 가지며 onComplete로 다음 씬을 트리거함
    if (sceneIndex === 0) return;
    // 씬 2도 자체 90초 루프를 가지므로 자동 전환에서 제외
    if (sceneIndex === 1) return;
    // 씬 3도 자체 90초 루프를 가지므로 자동 전환에서 제외
    if (sceneIndex === 2) return;
    // 씬 4도 자체 90초 루프를 가지므로 자동 전환에서 제외
    if (sceneIndex === 3) return;
    // 씬 5도 자체 90초 루프를 가지므로 자동 전환에서 제외
    if (sceneIndex === 4) return;
    const interval = playState === "2x" ? 4000 : 8000;
    const t = window.setInterval(() => {
      setSceneIndex((i) => (i + 1) % activeScenes.length);
    }, interval);
    return () => window.clearInterval(t);
  }, [activeScenes.length, playState, paused, sceneIndex, setSceneIndex]);

  const actions = [
    {
      label: "Play / 2x / Pause",
      onClick: () =>
        setPlayState((s) => (s === "1x" ? "2x" : s === "2x" ? "paused" : "1x")),
    },
    {
      label: "Next scene",
      onClick: () => {
        if (activeScenes.length === 0) {
          openPicker();
          return;
        }
        setSceneIndex((i) => (i + 1) % activeScenes.length);
      },
    },
    { label: "Settings", onClick: onOpenSettings },
    { label: "Exit", onClick: onExit },
  ];

  return (
    <div className="absolute inset-0" style={{ animation: "fade-in 0.4s ease-out" }}>
      <img
        src={theaterStageImg}
        alt="Shadow theater stage"
        className="absolute inset-0 h-full w-full select-none"
        draggable={false}
      />

      {/* 스크린 영역 - 씬 이미지 렌더링 */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${SCREEN.x}%`,
          top: `${SCREEN.y}%`,
          width: `${SCREEN.w}%`,
          height: `${SCREEN.h}%`,
          // 비율 유지로 남는 부분은 무대 스크린과 같은 톤으로 채움
          background: "oklch(0.9 0.03 85)",
        }}
      >
        {current || showScene2Fallback ? (
          <div className="relative h-full w-full">
            {current ? (
              <img
                src={current.url}
                alt={`Scene ${sceneIndex + 1}`}
                className="h-full w-full object-cover"
                style={{
                  opacity: paused ? 0.55 : 1,
                  filter: paused ? "grayscale(0.4)" : "none",
                  transition: "opacity 0.25s, filter 0.25s",
                }}
                draggable={false}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.78 0.12 70) 0%, oklch(0.68 0.14 55) 45%, oklch(0.55 0.12 45) 100%)",
                  opacity: paused ? 0.7 : 1,
                  transition: "opacity 0.25s",
                }}
              />
            )}
            {program === "ants-grasshopper" && sceneIndex === 0 && (
              <Scene1Motion
                speed={(playState === "paused" ? 0 : playState === "2x" ? 2 : 1) as Scene1Speed}
                onComplete={() => {
                  setSceneIndex(1);
                }}
              />
            )}
            {program === "ants-grasshopper" && sceneIndex === 1 && (
              <Scene2Motion
                speed={(playState === "paused" ? 0 : playState === "2x" ? 2 : 1) as Scene2Speed}
                onComplete={() => {
                  setSceneIndex(2);
                }}
              />
            )}
            {program === "ants-grasshopper" && sceneIndex === 2 && (
              <Scene3Motion
                speed={(playState === "paused" ? 0 : playState === "2x" ? 2 : 1) as Scene3Speed}
                onComplete={() => {
                  setSceneIndex(3);
                }}
              />
            )}
            {program === "ants-grasshopper" && sceneIndex === 3 && (
              <Scene4Motion
                speed={(playState === "paused" ? 0 : playState === "2x" ? 2 : 1) as Scene4Speed}
                onComplete={() => {
                  setSceneIndex((i) => (scenes.length > 4 ? 4 : i));
                }}
              />
            )}
            {program === "ants-grasshopper" && sceneIndex === 4 && (
              <Scene5Motion
                speed={(playState === "paused" ? 0 : playState === "2x" ? 2 : 1) as Scene5Speed}
                onComplete={() => {
                  setSceneIndex(0);
                  // 마지막 씬(에필로그)이 끝나면 극장을 빠져나와 메인 타이틀 UI로 복귀.
                  onExit();
                }}
              />
            )}
            {program === "town-country" && storyProgram && sceneIndex >= 0 && sceneIndex < storyProgram.scenes.length && (
              <StorySceneMotion
                scene={storyProgram.scenes[sceneIndex]}
                speed={(playState === "paused" ? 0 : playState === "2x" ? 2 : 1) as StorySceneSpeed}
                onComplete={() => {
                  // stale closure 회피 — 항상 최신 인덱스 기준으로 분기.
                  // 마지막 씬이 아니면 다음 씬으로, 마지막이면 메인 타이틀로 복귀.
                  let exited = false;
                  setSceneIndex((i) => {
                    if (i >= storyProgram.scenes.length - 1) {
                      exited = true;
                      return 0;
                    }
                    return i + 1;
                  });
                  if (exited) onExit();
                }}
              />
            )}
            {program === null && cassetteId !== null && (
              <div
                className="absolute inset-0 grid place-items-center"
                style={{ background: "oklch(0 0 0 / 0.45)" }}
              >
                <div
                  className="rounded-2xl px-5 py-4 text-center"
                  style={{
                    background: "oklch(0.18 0.02 50 / 0.85)",
                    border: "1px solid oklch(0.85 0.08 75 / 0.3)",
                    color: "oklch(0.95 0.04 80)",
                    maxWidth: "78%",
                  }}
                >
                  <div className="text-sm font-semibold">
                    {CASSETTES.find((c) => c.id === cassetteId)?.title ?? "선택된 카세트"}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: "oklch(0.75 0.04 75)" }}>
                    이 카세트의 모션 프로그램은 준비 중입니다.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="grid h-full w-full place-items-center cursor-pointer border-0 bg-transparent"
          >
            <div
              className="rounded-2xl px-6 py-5 text-center"
              style={{
                background: "oklch(0 0 0 / 0.3)",
                border: "1px dashed oklch(1 0 0 / 0.45)",
                color: "oklch(0.95 0.04 80)",
                backdropFilter: "blur(2px)",
              }}
            >
              <div className="text-sm font-semibold">
                {uploading ? "업로드 중…" : "씬 이미지를 업로드하세요"}
              </div>
              <div className="mt-1 text-xs opacity-75">
                JPG / PNG · 여러 장 선택 시 순서대로 씬 1, 씬 2…
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 재생 상태 뱃지 */}
      <div
        className="pointer-events-none absolute text-[11px] font-semibold"
        style={{
          left: "2.5%",
          top: "4%",
          background: "oklch(0 0 0 / 0.5)",
          color: playState === "paused" ? "oklch(0.75 0.04 80)" : "oklch(0.95 0.14 80)",
          padding: "3px 12px",
          borderRadius: 999,
          border: "1px solid oklch(0.85 0.08 75 / 0.4)",
        }}
      >
        {playState === "1x" ? "▶ 재생 1x" : playState === "2x" ? "▶▶ 2x" : "⏸ 일시정지"}
      </div>

      {/* 씬 카운터 */}
      {activeScenes.length > 0 && (
        <div
          className="pointer-events-none absolute text-[11px] font-semibold"
          style={{
            left: "50%",
            top: "4%",
            transform: "translateX(-50%)",
            background: "oklch(0 0 0 / 0.45)",
            color: "oklch(0.95 0.06 80)",
            padding: "3px 12px",
            borderRadius: 999,
            border: "1px solid oklch(0.85 0.08 75 / 0.4)",
          }}
        >
          씬 {sceneIndex + 1} / {activeScenes.length}
        </div>
      )}

      {/* 우상단 - 씬 추가 / 초기화 */}
      <div className="absolute flex gap-2" style={{ right: "2.5%", top: "3.5%" }}>
        {allowSceneUploads && (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="cursor-pointer rounded-full border-0 text-[11px] font-semibold"
            style={{
              padding: "5px 12px",
              background: "oklch(0.88 0.14 80 / 0.92)",
              color: "oklch(0.22 0.05 50)",
              boxShadow: "0 4px 12px oklch(0 0 0 / 0.35)",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "업로드 중…" : "+ 씬 추가"}
          </button>
        )}
        {allowSceneUploads && scenes.length > 0 && (
          <button
            type="button"
            onClick={deleteCurrent}
            disabled={!current}
            className="cursor-pointer rounded-full border-0 text-[11px] font-semibold"
            style={{
              padding: "5px 12px",
              background: "oklch(0.45 0.14 30 / 0.85)",
              color: "oklch(0.97 0.04 80)",
              border: "1px solid oklch(0.85 0.08 75 / 0.3)",
              opacity: current ? 1 : 0.45,
            }}
          >
            현재 씬 삭제
          </button>
        )}
        {allowSceneUploads && scenes.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer rounded-full border-0 text-[11px] font-semibold"
            style={{
              padding: "5px 12px",
              background: "oklch(0.3 0.02 50 / 0.75)",
              color: "oklch(0.92 0.04 80)",
              border: "1px solid oklch(0.85 0.08 75 / 0.25)",
            }}
          >
            전체 비우기
          </button>
        )}
        {storyProgram && (
          <div
            className="pointer-events-none rounded-full text-[11px] font-semibold"
            style={{
              padding: "5px 12px",
              background: "oklch(0.18 0.02 50 / 0.78)",
              color: "oklch(0.94 0.04 80)",
              border: "1px solid oklch(0.85 0.08 75 / 0.22)",
            }}
          >
            대사 · BGM · SFX 첨부 준비 완료
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onUpload}
      />

      {/* 하단 컨트롤 핫스팟 (무대 이미지의 4개 버튼 위치에 정렬) */}
      {THEATER_BTN_X.map((x, i) => (
        <button
          key={i}
          onClick={() => press(i, actions[i].onClick)}
          aria-label={actions[i].label}
          className="absolute cursor-pointer rounded-full border-0 bg-transparent p-0 transition-transform"
          style={{
            left: `${x - THEATER_BTN_W / 2}%`,
            top: `${THEATER_BTN_Y - THEATER_BTN_H / 2}%`,
            width: `${THEATER_BTN_W}%`,
            height: `${THEATER_BTN_H}%`,
            transform: pressed === i ? "translateY(2%) scale(0.95)" : "none",
            boxShadow:
              pressed === i
                ? "inset 0 0 0 2px oklch(0.95 0.12 80 / 0.85), 0 0 18px oklch(0.95 0.12 80 / 0.5)"
                : "none",
          }}
        />
      ))}
    </div>
  );
}

type SettingsRow = {
  label: string;
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  setMuted: (m: boolean | ((prev: boolean) => boolean)) => void;
};

function SettingsPanel({ onClose, rows, playbackRate, setPlaybackRate }: { onClose: () => void; rows: SettingsRow[]; playbackRate: number; setPlaybackRate: (v: number) => void }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.55)", backdropFilter: "blur(4px)", animation: "fade-in 0.2s ease-out" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-5"
        style={{
          width: "min(82%, 380px)",
          background: "linear-gradient(180deg, oklch(0.22 0.04 55), oklch(0.14 0.03 45))",
          border: "1px solid oklch(0.85 0.08 75 / 0.3)",
          boxShadow: "0 20px 60px oklch(0 0 0 / 0.55)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "oklch(0.95 0.06 80)" }}>설정 · 볼륨</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-7 w-7 place-items-center rounded-full transition-colors"
            style={{ background: "oklch(0.3 0.02 50 / 0.6)", color: "oklch(0.9 0.04 80)" }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <VolumeRow key={row.label} {...row} />
          ))}
          <SpeedRow value={playbackRate} onChange={setPlaybackRate} />
        </div>
      </div>
    </div>
  );
}

function VolumeRow({ label, volume, muted, setVolume, setMuted }: SettingsRow) {
  const displayed = muted ? 0 : volume;
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "oklch(0.18 0.02 50 / 0.7)" }}>
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? `${label} 음소거 해제` : `${label} 음소거`}
        className="grid place-items-center rounded-full transition-transform active:scale-95"
        style={{ width: 30, height: 30, color: muted ? "oklch(0.6 0.02 60)" : "oklch(0.92 0.08 80)" }}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "oklch(0.85 0.04 80)" }}>
          <span>{label}</span>
          <span style={{ color: "oklch(0.7 0.03 70)" }}>{Math.round(displayed * 100)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={displayed}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (muted && v > 0) setMuted(false);
          }}
          aria-label={`${label} 볼륨`}
          className="bgm-slider w-full"
          style={{ ["--p" as string]: `${displayed * 100}%` }}
        />
      </div>
    </div>
  );
}
function SpeedRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "oklch(0.18 0.02 50 / 0.7)" }}>
      <div
        className="grid place-items-center rounded-full"
        style={{ width: 30, height: 30, color: "oklch(0.92 0.08 80)" }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "oklch(0.85 0.04 80)" }}>
          <span>재생 속도</span>
          <span style={{ color: "oklch(0.7 0.03 70)" }}>{value.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-label="재생 속도"
          className="bgm-slider w-full"
          style={{ ["--p" as string]: `${((value - 0.1) / 1.9) * 100}%` }}
        />
      </div>
    </div>
  );
}

function CircleOverlay({
  c,
  children,
}: {
  c: { cx: number; cy: number; r: number };
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute overflow-hidden"
      style={{
        left: `${c.cx - c.r}%`,
        top: `${c.cy - c.r}%`,
        width: `${c.r * 2}%`,
        aspectRatio: "1",
        borderRadius: "50%",
      }}
    >
      {children}
    </div>
  );
}

function Twinkles({ count, dim = false }: { count: number; dim?: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i * 137.5) % 360;
        const rr = 18 + ((i * 53) % 32);
        const rad = (a * Math.PI) / 180;
        return {
          x: 50 + Math.cos(rad) * rr,
          y: 50 + Math.sin(rad) * rr,
          d: 1.6 + ((i * 7) % 14) / 10,
          delay: ((i * 311) % 100) / 100,
          dur: 1.6 + ((i * 17) % 18) / 10,
        };
      }),
    [count]
  );
  return (
    <>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.d}%`,
            aspectRatio: "1",
            background: "white",
            opacity: dim ? 0.45 : 0.9,
            transform: "translate(-50%, -50%)",
            filter: "blur(0.3px)",
            boxShadow: "0 0 6px white",
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function SpinningHub({ spinning }: { spinning: boolean }) {
  // Subtle ring + 4 spokes over the existing hub graphic
  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: "50%",
        width: "26%",
        aspectRatio: "1",
        transform: "translate(-50%, -50%)",
        animation: spinning ? "spin 2.6s linear infinite" : "none",
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <g
          fill="none"
          stroke="oklch(0.25 0.03 50 / 0.55)"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <circle cx="50" cy="50" r="34" />
          <line x1="50" y1="16" x2="50" y2="32" />
          <line x1="50" y1="68" x2="50" y2="84" />
          <line x1="16" y1="50" x2="32" y2="50" />
          <line x1="68" y1="50" x2="84" y2="50" />
        </g>
      </svg>
    </div>
  );
}

function SwayHint() {
  // Soft warm light wash that gently breathes — implies trees swaying
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 75%, oklch(0.85 0.12 75 / 0.18), transparent 60%)",
        animation: "breathe 5s ease-in-out infinite",
        mixBlendMode: "screen",
      }}
    />
  );
}

function CurtainOverlay({ open }: { open: boolean }) {
  // Two soft curtains sliding over the stage center
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    top: "30%",
    height: "44%",
    width: "32%",
    background:
      "linear-gradient(180deg, oklch(0.30 0.06 45 / 0.92), oklch(0.18 0.04 40 / 0.95))",
    backgroundImage:
      "repeating-linear-gradient(90deg, oklch(0 0 0 / 0.18) 0 3%, transparent 3% 6%)",
    transition: "transform 1.4s cubic-bezier(.6,.1,.3,1)",
    boxShadow: "inset 0 0 20px oklch(0 0 0 / 0.5)",
  };
  return (
    <>
      <div
        style={{
          ...baseStyle,
          left: "18%",
          borderRadius: "4% 8% 6% 10% / 12% 6% 10% 4%",
          transform: open ? "translateX(-95%)" : "translateX(0)",
        }}
      />
      <div
        style={{
          ...baseStyle,
          left: "50%",
          borderRadius: "8% 4% 10% 6% / 6% 12% 4% 10%",
          transform: open ? "translateX(95%)" : "translateX(0)",
        }}
      />
    </>
  );
}

function HoppingAnimals({ active }: { active: boolean }) {
  // Tiny silhouettes that overlay the leftmost (rabbit) and rightmost (squirrel) animals.
  const common: React.CSSProperties = {
    position: "absolute",
    bottom: "12%",
    width: "9%",
    aspectRatio: "1",
    transformOrigin: "50% 100%",
    filter: "drop-shadow(0 2px 2px oklch(0 0 0 / 0.6))",
  };
  return (
    <>
      <div
        style={{
          ...common,
          left: "16%",
          animation: active ? "hop 0.9s ease-in-out infinite" : "none",
        }}
      >
        <RabbitSil />
      </div>
      <div
        style={{
          ...common,
          right: "16%",
          animation: active ? "hop 0.9s ease-in-out 0.45s infinite" : "none",
        }}
      >
        <SquirrelSil />
      </div>
    </>
  );
}

function RabbitSil() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <g fill="oklch(0.08 0.02 40)">
        <ellipse cx="50" cy="78" rx="22" ry="18" />
        <ellipse cx="42" cy="50" rx="10" ry="22" />
        <ellipse cx="58" cy="50" rx="10" ry="22" />
        <circle cx="50" cy="62" r="14" />
      </g>
    </svg>
  );
}

function SquirrelSil() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <g fill="oklch(0.08 0.02 40)">
        <ellipse cx="46" cy="74" rx="20" ry="16" />
        <circle cx="40" cy="55" r="12" />
        <path d="M62,80 Q88,60 72,30 Q90,40 84,72 Q78,86 62,86 Z" />
      </g>
    </svg>
  );
}

function ShootingStar() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute"
        style={{
          left: "10%",
          top: "12%",
          width: "70%",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, white, transparent)",
          transform: "rotate(28deg)",
          transformOrigin: "left center",
          animation: "shoot 1.4s ease-out forwards",
          filter: "blur(0.4px) drop-shadow(0 0 6px white)",
        }}
      />
    </div>
  );
}

function Keyframes() {
  return (
    <style>{`
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.7); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
      }
      @keyframes spin {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to   { transform: translate(-50%, -50%) rotate(360deg); }
      }
      @keyframes breathe {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes hop {
        0%, 100% { transform: translateY(0) scaleY(1); }
        20% { transform: translateY(0) scaleY(0.88); }
        50% { transform: translateY(-24%) scaleY(1.05); }
        80% { transform: translateY(0) scaleY(0.92); }
      }
      @keyframes shoot {
        0%   { opacity: 0; transform: rotate(28deg) translateX(-30%) scaleX(0.2); }
        20%  { opacity: 1; }
        100% { opacity: 0; transform: rotate(28deg) translateX(40%) scaleX(1); }
      }
      @keyframes treeSway {
        0%   { transform: rotate(0deg); }
        18%  { transform: rotate(0.65deg); }
        32%  { transform: rotate(0.55deg); }
        50%  { transform: rotate(0deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes note-float {
        0%   { transform: translate(0, 0) scale(0.7); opacity: 0; }
        20%  { opacity: 0.9; }
        100% { transform: translate(-30%, -180%) scale(1.1); opacity: 0; }
      }
      .bgm-slider {
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(90deg, oklch(0.85 0.12 80) 0%, oklch(0.85 0.12 80) var(--p,55%), oklch(0.35 0.02 60) var(--p,55%), oklch(0.35 0.02 60) 100%);
        outline: none;
        cursor: pointer;
      }
      .bgm-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: oklch(0.95 0.06 80);
        box-shadow: 0 0 6px oklch(0.85 0.18 80 / 0.7);
        border: none;
      }
      .bgm-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: oklch(0.95 0.06 80);
        box-shadow: 0 0 6px oklch(0.85 0.18 80 / 0.7);
        border: none;
      }
    `}</style>
  );
}

/* ---------- List Panel (cassette tape case collection) ---------- */
function ListPanel({
  onClose,
  selectedId,
  loadedId,
  onSelect,
}: {
  onClose: () => void;
  selectedId: string;
  loadedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [devMode, setDevMode] = useState(false);
  const items = useMemo<Cassette[]>(
    () =>
      devMode
        ? CASSETTES.filter((c) => c.isUpdate)
        : CASSETTES.filter((c) => c.purchased),
    [devMode]
  );

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{
        background: "oklch(0 0 0 / 0.55)",
        backdropFilter: "blur(4px)",
        animation: "fade-in 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl"
        style={{
          width: "min(88%, 520px)",
          maxHeight: "82%",
          background:
            "linear-gradient(180deg, oklch(0.22 0.04 55), oklch(0.12 0.03 45))",
          border: "1px solid oklch(0.85 0.08 75 / 0.3)",
          boxShadow: "0 20px 60px oklch(0 0 0 / 0.55)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid oklch(0.85 0.08 75 / 0.18)" }}
        >
          <div className="flex items-baseline gap-2">
            <h2
              className="text-base font-semibold"
              style={{ color: "oklch(0.95 0.06 80)" }}
            >
              {devMode ? "업데이트 목록" : "내 카세트"}
            </h2>
            <span
              className="text-xs"
              style={{ color: "oklch(0.7 0.03 70)" }}
            >
              {items.length}개
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* DEV toggle */}
            <button
              type="button"
              onClick={() => setDevMode((d) => !d)}
              aria-pressed={devMode}
              aria-label="개발자 모드 전환"
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: devMode
                  ? "oklch(0.72 0.18 145 / 0.25)"
                  : "oklch(0.3 0.02 50 / 0.6)",
                color: devMode
                  ? "oklch(0.9 0.16 145)"
                  : "oklch(0.75 0.04 75)",
                border: devMode
                  ? "1px solid oklch(0.72 0.18 145 / 0.6)"
                  : "1px solid oklch(0.85 0.08 75 / 0.15)",
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: devMode
                    ? "oklch(0.85 0.2 145)"
                    : "oklch(0.55 0.02 60)",
                  boxShadow: devMode
                    ? "0 0 6px oklch(0.85 0.2 145)"
                    : "none",
                }}
              />
              DEV
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="grid h-7 w-7 place-items-center rounded-full"
              style={{
                background: "oklch(0.3 0.02 50 / 0.6)",
                color: "oklch(0.9 0.04 80)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div
              className="grid place-items-center py-12 text-center text-sm"
              style={{ color: "oklch(0.7 0.03 70)" }}
            >
              {devMode
                ? "업데이트된 카세트가 없습니다."
                : "구매한 카세트가 없습니다.\n상점에서 새 카세트를 만나보세요."}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((c) => (
                <li key={c.id}>
                  <CassetteCard
                    cassette={c}
                    showUpdateBadge={devMode}
                    isSelected={c.id === selectedId}
                    isLoaded={c.id === loadedId}
                    onSelect={() => onSelect(c.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CassetteCard({
  cassette,
  showUpdateBadge,
  isSelected,
  isLoaded,
  onSelect,
}: {
  cassette: Cassette;
  showUpdateBadge: boolean;
  isSelected: boolean;
  isLoaded: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex w-full flex-col gap-1.5 rounded-xl p-2 text-left transition-transform active:scale-[0.97]"
      style={{
        background: "oklch(0.18 0.02 50 / 0.7)",
        border: isSelected
          ? "1px solid oklch(0.85 0.16 80 / 0.85)"
          : "1px solid oklch(0.85 0.08 75 / 0.12)",
        boxShadow: isSelected
          ? "0 0 0 2px oklch(0.85 0.16 80 / 0.55), 0 6px 18px oklch(0 0 0 / 0.4)"
          : "none",
      }}
    >
      {/* Cassette tape case thumbnail */}
      <div
        className="relative w-full overflow-hidden rounded-md"
        style={{
          aspectRatio: "16 / 10",
          background: `linear-gradient(135deg, ${cassette.hueA}, ${cassette.hueB})`,
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.25), inset 0 -8px 18px oklch(0 0 0 / 0.35)",
        }}
      >
        {/* Top label strip */}
        <div
          className="absolute inset-x-2 top-2 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
          style={{
            background: "oklch(0.96 0.02 90 / 0.92)",
            color: "oklch(0.25 0.05 50)",
          }}
        >
          Shadow Theater
        </div>
        {/* Two reels */}
        <div className="absolute inset-x-0 bottom-1.5 flex items-end justify-center gap-6">
          <Reel />
          <Reel />
        </div>
        {/* Update badge */}
        {showUpdateBadge && cassette.isUpdate && (
          <span
            className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              background: "oklch(0.78 0.2 145)",
              color: "oklch(0.15 0.05 145)",
              boxShadow: "0 0 8px oklch(0.78 0.2 145 / 0.6)",
            }}
          >
            NEW
          </span>
        )}
        {isLoaded && (
          <span
            className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              background: "oklch(0.35 0.1 145 / 0.95)",
              color: "oklch(0.95 0.14 145)",
              border: "1px solid oklch(0.85 0.16 145 / 0.6)",
            }}
          >
            삽입됨
          </span>
        )}
      </div>
      {/* Title + subtitle */}
      <div className="px-0.5">
        <div
          className="truncate text-xs font-semibold"
          style={{ color: "oklch(0.95 0.04 80)" }}
        >
          {cassette.title}
        </div>
        <div
          className="truncate text-[10px]"
          style={{ color: "oklch(0.7 0.03 70)" }}
        >
          {cassette.subtitle}
        </div>
      </div>
    </button>
  );
}

function Reel() {
  return (
    <div
      className="rounded-full"
      style={{
        width: "22%",
        aspectRatio: "1",
        background:
          "radial-gradient(circle, oklch(0.96 0.02 90) 28%, oklch(0.2 0.02 50) 30%, oklch(0.2 0.02 50) 55%, oklch(0.4 0.03 60) 58%)",
        border: "1px solid oklch(0 0 0 / 0.4)",
      }}
    />
  );
}
