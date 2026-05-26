import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cassetteImg from "@/assets/idle-animation.gif";
import theaterStageImg from "@/assets/theater-stage.jpg";
import mainThemeUrl from "@/assets/main-theme.mp3";
import { CASSETTES, type Cassette } from "@/data/cassettes";

export const Route = createFileRoute("/")({
  component: ShadowTheaterTitle,
});

type Stage = "idle" | "theater";

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
  const [scenes, setScenes] = useState<string[]>([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const { startBgm, stopBgm, sfx, setBgmVolume, setBgmMuted, setMasterVolume, setPlaybackRate, ensure } = useAudio();

  useEffect(() => { setBgmVolume(bgmVol); }, [bgmVol, setBgmVolume]);
  useEffect(() => { setBgmMuted(bgmMuted); }, [bgmMuted, setBgmMuted]);
  useEffect(() => { setMasterVolume(sfxMuted ? 0 : sfxVol); }, [sfxVol, sfxMuted, setMasterVolume]);
  useEffect(() => { setPlaybackRate(playbackRate); }, [playbackRate, setPlaybackRate]);

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
      // PLAY: 12프레임(약 1.2초) 재생 후 BGM 정지 + 그림자 연극(세컨드 스테이지) 전환.
      window.setTimeout(() => {
        stopBgm();
        setMusicOn(false);
        setStage("theater");
      }, 1200);
    } else if (i === 3) {
      // SETTING opens settings panel
      await ensure();
      setSettingsOpen(true);
    } else if (i === 1) {
      // LIST opens cassette list panel
      await ensure();
      setListOpen(true);
    }
    // LIST / INPUT-EJECT / STORE: reserved for future cassette swap
  };

  const exitTheater = async () => {
    await sfx.click();
    setStage("idle");
    setMusicOn(true);
    await startBgm();
  };

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
            scenes={scenes}
            setScenes={setScenes}
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

        {listOpen && <ListPanel onClose={() => setListOpen(false)} />}
      </div>
    </main>
  );
}

/* ---------- Helpers ---------- */

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
function ListPanel({ onClose }: { onClose: () => void }) {
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
                  <CassetteCard cassette={c} showUpdateBadge={devMode} />
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
}: {
  cassette: Cassette;
  showUpdateBadge: boolean;
}) {
  return (
    <button
      type="button"
      className="group relative flex w-full flex-col gap-1.5 rounded-xl p-2 text-left transition-transform active:scale-[0.97]"
      style={{
        background: "oklch(0.18 0.02 50 / 0.7)",
        border: "1px solid oklch(0.85 0.08 75 / 0.12)",
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
