import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: ShadowTheaterTitle,
});

type Stage = "idle" | "opening" | "playing" | "closing";

/* ---------- Audio engine ---------- */
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const bgmTimerRef = useRef<number | null>(null);

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
      bgmGainRef.current = bgm;
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // Gentle lullaby loop — pentatonic, soft triangle voice
  const startBgm = useCallback(async () => {
    const ctx = await ensure();
    if (!bgmGainRef.current) return;
    bgmGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
    bgmGainRef.current.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.2);
    if (bgmTimerRef.current) return;
    // C major pentatonic in 5th octave
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
    let i = 0;
    const beat = 0.7;
    const playNote = () => {
      const c = ctxRef.current;
      const g = bgmGainRef.current;
      if (!c || !g) return;
      const t = c.currentTime;
      const o1 = c.createOscillator();
      o1.type = "triangle";
      o1.frequency.value = notes[i % notes.length];
      const o2 = c.createOscillator();
      o2.type = "sine";
      o2.frequency.value = notes[i % notes.length] / 2;
      const v = c.createGain();
      v.gain.setValueAtTime(0, t);
      v.gain.linearRampToValueAtTime(0.5, t + 0.05);
      v.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.95);
      o1.connect(v);
      o2.connect(v);
      v.connect(g);
      o1.start(t);
      o2.start(t);
      o1.stop(t + beat);
      o2.stop(t + beat);
      i++;
    };
    playNote();
    bgmTimerRef.current = window.setInterval(playNote, beat * 1000);
  }, [ensure]);

  const stopBgm = useCallback(() => {
    if (bgmTimerRef.current) {
      clearInterval(bgmTimerRef.current);
      bgmTimerRef.current = null;
    }
    const ctx = ctxRef.current;
    const g = bgmGainRef.current;
    if (ctx && g) {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    }
  }, []);

  // SFX
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
      curtain: async (open: boolean) => {
        const ctx = await ensure();
        const t = ctx.currentTime;
        const dur = 1.6;
        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // Soft noise whoosh
          data[i] = (Math.random() * 2 - 1) * 0.6;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 0.9;
        filter.frequency.setValueAtTime(open ? 400 : 1200, t);
        filter.frequency.exponentialRampToValueAtTime(open ? 1600 : 300, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.2);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        src.connect(filter).connect(g).connect(masterRef.current!);
        src.start(t);
        src.stop(t + dur + 0.05);
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
      shootingStar: async () => {
        const ctx = await ensure();
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(2200, t);
        o.frequency.exponentialRampToValueAtTime(220, t + 1.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(g).connect(masterRef.current!);
        o.start(t);
        o.stop(t + 1.25);
      },
    }),
    [ensure]
  );

  return { startBgm, stopBgm, sfx };
}

/* ---------- Main component ---------- */
function ShadowTheaterTitle() {
  const [stage, setStage] = useState<Stage>("idle");
  const [musicOn, setMusicOn] = useState(false);
  const [shootingKey, setShootingKey] = useState(0);
  const { startBgm, stopBgm, sfx } = useAudio();

  // Auto choreography: opening -> playing -> closing -> idle
  useEffect(() => {
    if (stage === "opening") {
      sfx.curtain(true);
      const t = setTimeout(() => setStage("playing"), 1600);
      return () => clearTimeout(t);
    }
    if (stage === "playing") {
      // After a beat of "show", auto-close (demo loop)
      const t = setTimeout(() => setStage("closing"), 5200);
      return () => clearTimeout(t);
    }
    if (stage === "closing") {
      sfx.curtain(false);
      const t1 = setTimeout(() => {
        setShootingKey((k) => k + 1);
        sfx.shootingStar();
      }, 900);
      const t2 = setTimeout(() => setStage("idle"), 2600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [stage, sfx]);

  const onPlay = async () => {
    await sfx.click();
    if (stage === "idle") {
      if (!musicOn) {
        setMusicOn(true);
        startBgm();
      }
      setStage("opening");
    } else {
      setStage("closing");
    }
  };

  const toggleMusic = async () => {
    await sfx.click();
    if (musicOn) {
      stopBgm();
      setMusicOn(false);
    } else {
      setMusicOn(true);
      startBgm();
    }
  };

  const curtainOpen = stage === "opening" || stage === "playing";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[oklch(0.12_0.03_40)] px-3 py-4">
      {/* warm room ambience */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, oklch(0.28 0.08 60 / 0.55), oklch(0.10 0.03 40) 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Wooden cassette frame */}
        <div
          className="relative rounded-[28px] p-3 shadow-[0_30px_60px_-20px_oklch(0_0_0/_0.8)]"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.42 0.07 55) 0%, oklch(0.32 0.06 50) 50%, oklch(0.26 0.05 48) 100%)",
            border: "2px solid oklch(0.22 0.05 45)",
          }}
        >
          {/* wood grain overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, oklch(0.2 0.04 40 / 0.4) 0px, oklch(0.5 0.08 60 / 0.2) 2px, transparent 4px, transparent 9px)",
            }}
          />

          {/* Title banner */}
          <TitleBanner />

          {/* Stage window */}
          <div className="relative mt-3 px-1">
            <StageCircle
              curtainOpen={curtainOpen}
              stage={stage}
              shootingKey={shootingKey}
            />
          </div>

          {/* Cassette reel + label strip */}
          <div className="relative mt-3 flex items-center gap-3 px-1">
            <ReelBadge spinning={stage !== "idle"} />
            <div
              className="flex-1 rounded-md border px-3 py-2 text-[10px] uppercase tracking-[0.25em]"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.92 0.04 85), oklch(0.84 0.05 78))",
                borderColor: "oklch(0.55 0.07 55)",
                color: "oklch(0.30 0.06 45)",
                boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.6)",
              }}
            >
              <div className="font-semibold">Tape A · 별빛 숲속 동물 친구들</div>
              <div className="mt-0.5 text-[9px] tracking-[0.3em] opacity-70">
                {stage === "idle" && "▌ 대기 중 · 재생을 눌러주세요"}
                {stage === "opening" && "▶ 막이 오르는 중..."}
                {stage === "playing" && "● 공연 중"}
                {stage === "closing" && "■ 막이 내려갑니다"}
              </div>
            </div>
          </div>

          {/* Control panel */}
          <ControlPanel
            stage={stage}
            musicOn={musicOn}
            onPlay={onPlay}
            onToggleMusic={toggleMusic}
            onClick={() => sfx.click()}
          />
        </div>

        <p className="mt-4 text-center text-[11px] tracking-[0.3em] text-[oklch(0.75_0.05_70)/_0.6] opacity-70">
          ✦  부모와 아이가 함께 즐기는 그림자 동화  ✦
        </p>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-1.2deg); }
          50% { transform: rotate(1.6deg); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes wag {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes lookAround {
          0%, 100% { transform: translateX(0) rotate(0); }
          25% { transform: translateX(-1px) rotate(-5deg); }
          75% { transform: translateX(1px) rotate(5deg); }
        }
        @keyframes hop {
          0%, 100% { transform: translateY(0) scaleY(1); }
          20% { transform: translateY(0) scaleY(0.85); }
          50% { transform: translateY(-22px) scaleY(1.05); }
          80% { transform: translateY(0) scaleY(0.92); }
        }
        @keyframes spinReel {
          to { transform: rotate(360deg); }
        }
        @keyframes shoot {
          0% { transform: translate(0,0) rotate(35deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate(220px,180px) rotate(35deg); opacity: 0; }
        }
        @keyframes shimmer {
          0%,100% { filter: drop-shadow(0 0 4px oklch(0.95 0.18 85 / 0.6)); }
          50% { filter: drop-shadow(0 0 12px oklch(0.95 0.2 85 / 0.95)); }
        }
        @keyframes curtainL {
          from { transform: translateX(0); }
          to { transform: translateX(-78%); }
        }
        @keyframes curtainR {
          from { transform: translateX(0); }
          to { transform: translateX(78%); }
        }
      `}</style>
    </main>
  );
}

/* ---------- Title banner ---------- */
function TitleBanner() {
  return (
    <div
      className="relative mx-auto rounded-xl px-4 py-3 text-center"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.38 0.06 50) 0%, oklch(0.28 0.05 45) 100%)",
        border: "2px solid oklch(0.62 0.10 70)",
        boxShadow:
          "inset 0 1px 0 oklch(1 0 0 / 0.15), 0 4px 14px -6px oklch(0 0 0 / 0.6)",
      }}
    >
      <div
        className="font-serif text-[20px] leading-tight tracking-wide"
        style={{
          color: "oklch(0.88 0.13 82)",
          textShadow:
            "0 1px 0 oklch(0.2 0.05 40), 0 0 12px oklch(0.85 0.18 80 / 0.45)",
          fontStyle: "italic",
        }}
      >
        Little Star, Little Forest
      </div>
      <div
        className="font-serif text-[15px] tracking-[0.4em]"
        style={{
          color: "oklch(0.82 0.12 78)",
          textShadow: "0 1px 0 oklch(0.2 0.05 40)",
        }}
      >
        — SHADOW THEATER —
      </div>
    </div>
  );
}

/* ---------- Stage circle ---------- */
function StageCircle({
  curtainOpen,
  stage,
  shootingKey,
}: {
  curtainOpen: boolean;
  stage: Stage;
  shootingKey: number;
}) {
  return (
    <div
      className="relative mx-auto aspect-square w-full overflow-hidden rounded-full"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, oklch(0.94 0.07 85) 0%, oklch(0.82 0.10 75) 40%, oklch(0.55 0.10 60) 80%, oklch(0.32 0.07 50) 100%)",
        boxShadow:
          "inset 0 0 40px oklch(0.20 0.05 40 / 0.7), inset 0 0 80px oklch(0.85 0.15 70 / 0.25)",
        border: "4px solid oklch(0.22 0.05 45)",
      }}
    >
      {/* Night sky behind trees */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, oklch(0.36 0.08 65) 0%, oklch(0.20 0.05 50) 70%)",
          clipPath: "circle(50% at 50% 50%)",
        }}
      />

      {/* Twinkling stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 26 }).map((_, i) => {
          const x = (i * 37 + 13) % 100;
          const y = ((i * 53) % 60) + 5;
          const size = (i % 3) + 2;
          const delay = (i % 7) * 0.3;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                background: "oklch(0.97 0.10 85)",
                boxShadow: "0 0 6px oklch(0.95 0.15 85 / 0.9)",
                animation: `twinkle ${1.8 + (i % 4) * 0.4}s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Shooting star */}
      {stage === "closing" && (
        <div
          key={shootingKey}
          className="absolute left-[-10%] top-[8%] h-[3px] w-[60px] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.98 0.15 85), oklch(0.95 0.2 85))",
            boxShadow: "0 0 14px oklch(0.95 0.2 85)",
            animation: "shoot 1.6s ease-in forwards",
          }}
        />
      )}

      {/* Distant trees (silhouettes, swaying) */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {[
          { x: 30, h: 110, w: 40, d: 0 },
          { x: 75, h: 140, w: 55, d: 0.4 },
          { x: 125, h: 95, w: 36, d: 0.8 },
          { x: 275, h: 100, w: 38, d: 0.2 },
          { x: 325, h: 135, w: 52, d: 0.6 },
          { x: 370, h: 105, w: 42, d: 1.0 },
        ].map((t, i) => (
          <g
            key={i}
            style={{
              transformOrigin: `${t.x}px 320px`,
              animation: `sway ${4 + (i % 3)}s ease-in-out ${t.d}s infinite`,
            }}
          >
            <rect
              x={t.x - 3}
              y={320 - t.h * 0.4}
              width="6"
              height={t.h * 0.4}
              fill="oklch(0.08 0.03 40)"
            />
            <path
              d={`M${t.x - t.w / 2},${320 - t.h * 0.35} L${t.x},${320 - t.h} L${t.x + t.w / 2},${320 - t.h * 0.35} Z`}
              fill="oklch(0.05 0.02 40)"
            />
            <path
              d={`M${t.x - t.w / 2.3},${320 - t.h * 0.55} L${t.x},${320 - t.h * 1.05} L${t.x + t.w / 2.3},${320 - t.h * 0.55} Z`}
              fill="oklch(0.04 0.02 40)"
            />
          </g>
        ))}
        {/* ground / log */}
        <ellipse cx="200" cy="335" rx="180" ry="14" fill="oklch(0.10 0.03 40)" />
        <rect x="40" y="328" width="320" height="18" rx="9" fill="oklch(0.08 0.03 40)" />
      </svg>

      {/* Proscenium arch + curtains */}
      <Proscenium open={curtainOpen} />

      {/* Animals row (on the log, in front of curtains) */}
      <div
        className="absolute left-0 right-0"
        style={{ bottom: "11%" }}
      >
        <AnimalsRow stage={stage} />
      </div>
    </div>
  );
}

/* ---------- Proscenium with curtains ---------- */
function Proscenium({ open }: { open: boolean }) {
  // Stage opening centered, with curtains that slide
  return (
    <div
      className="absolute"
      style={{
        left: "14%",
        right: "14%",
        top: "22%",
        bottom: "22%",
      }}
    >
      {/* glow behind curtain */}
      <div
        className="absolute inset-0 rounded-[16px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, oklch(0.95 0.13 85) 0%, oklch(0.78 0.13 75) 50%, oklch(0.45 0.10 60) 100%)",
          boxShadow: "inset 0 0 30px oklch(0.30 0.06 50 / 0.6)",
        }}
      />
      {/* arch frame */}
      <div
        className="absolute inset-0 rounded-t-[40%] rounded-b-[8px] border-2"
        style={{
          borderColor: "oklch(0.32 0.06 45)",
          boxShadow: "inset 0 0 0 4px oklch(0.55 0.10 65)",
        }}
      />
      {/* valance (top drape) */}
      <div
        className="absolute left-0 right-0 top-0 h-[18%] rounded-t-[40%]"
        style={{
          background:
            "repeating-linear-gradient(180deg, oklch(0.42 0.15 30) 0px, oklch(0.32 0.13 25) 6px, oklch(0.42 0.15 30) 12px)",
          borderBottom: "2px solid oklch(0.25 0.10 25)",
        }}
      />
      {/* curtain halves */}
      <div className="absolute inset-0 overflow-hidden rounded-t-[40%] rounded-b-[8px]">
        <div
          className="absolute bottom-0 left-0 top-[10%] w-1/2"
          style={{
            background:
              "repeating-linear-gradient(90deg, oklch(0.40 0.16 28) 0px, oklch(0.28 0.13 25) 8px, oklch(0.38 0.16 28) 16px)",
            boxShadow: "inset -8px 0 12px oklch(0.15 0.08 20 / 0.7)",
            animation: open
              ? "curtainL 1.5s cubic-bezier(.6,.05,.3,1) forwards"
              : "curtainL 1.5s cubic-bezier(.6,.05,.3,1) reverse forwards",
            transformOrigin: "left center",
          }}
        />
        <div
          className="absolute bottom-0 right-0 top-[10%] w-1/2"
          style={{
            background:
              "repeating-linear-gradient(90deg, oklch(0.38 0.16 28) 0px, oklch(0.28 0.13 25) 8px, oklch(0.40 0.16 28) 16px)",
            boxShadow: "inset 8px 0 12px oklch(0.15 0.08 20 / 0.7)",
            animation: open
              ? "curtainR 1.5s cubic-bezier(.6,.05,.3,1) forwards"
              : "curtainR 1.5s cubic-bezier(.6,.05,.3,1) reverse forwards",
            transformOrigin: "right center",
          }}
        />
      </div>
    </div>
  );
}

/* ---------- Animals row ---------- */
function AnimalsRow({ stage }: { stage: Stage }) {
  // 6 animals, leftmost rabbit (big) and rightmost squirrel hop on 'playing'
  const showing = stage === "opening" || stage === "playing";
  return (
    <div className="relative mx-auto flex h-[58px] w-[85%] items-end justify-between">
      {/* big rabbit */}
      <AnimalSlot
        hop={showing}
        idleAnim="bob"
        delay={0}
      >
        <RabbitBig />
      </AnimalSlot>
      <AnimalSlot idleAnim="lookAround" delay={0.3}>
        <RabbitSmall />
      </AnimalSlot>
      <AnimalSlot idleAnim="bob" delay={0.6}>
        <Bear />
      </AnimalSlot>
      <AnimalSlot idleAnim="lookAround" delay={0.2}>
        <Fox />
      </AnimalSlot>
      <AnimalSlot idleAnim="bob" delay={0.5}>
        <Deer />
      </AnimalSlot>
      <AnimalSlot hop={showing} idleAnim="lookAround" delay={0.1}>
        <Squirrel />
      </AnimalSlot>
    </div>
  );
}

function AnimalSlot({
  children,
  idleAnim,
  delay,
  hop,
}: {
  children: React.ReactNode;
  idleAnim: "bob" | "lookAround";
  delay: number;
  hop?: boolean;
}) {
  return (
    <div
      style={{
        animation: hop
          ? `hop 1.1s ease-in-out ${delay}s infinite`
          : `${idleAnim} ${2.4 + delay}s ease-in-out ${delay}s infinite`,
        transformOrigin: "bottom center",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Animal silhouettes (cute SVGs) ---------- */
const inkFill = "oklch(0.06 0.02 40)";

function RabbitBig() {
  return (
    <svg width="44" height="60" viewBox="0 0 44 60">
      {/* ears */}
      <ellipse cx="15" cy="12" rx="4" ry="11" fill={inkFill} />
      <ellipse cx="28" cy="12" rx="4" ry="11" fill={inkFill} />
      {/* head + body */}
      <ellipse cx="22" cy="32" rx="14" ry="13" fill={inkFill} />
      <ellipse cx="22" cy="50" rx="16" ry="9" fill={inkFill} />
      {/* eye sparkle */}
      <circle cx="18" cy="30" r="1.4" fill="oklch(0.95 0.12 85)" />
    </svg>
  );
}
function RabbitSmall() {
  return (
    <svg width="30" height="46" viewBox="0 0 30 46">
      <ellipse cx="10" cy="10" rx="3" ry="8" fill={inkFill} />
      <ellipse cx="19" cy="10" rx="3" ry="8" fill={inkFill} />
      <ellipse cx="15" cy="24" rx="10" ry="9" fill={inkFill} />
      <ellipse cx="15" cy="38" rx="11" ry="7" fill={inkFill} />
      <circle cx="12" cy="22" r="1.1" fill="oklch(0.95 0.12 85)" />
    </svg>
  );
}
function Bear() {
  return (
    <svg width="46" height="50" viewBox="0 0 46 50">
      <circle cx="12" cy="14" r="5" fill={inkFill} />
      <circle cx="34" cy="14" r="5" fill={inkFill} />
      <ellipse cx="23" cy="22" rx="14" ry="12" fill={inkFill} />
      <ellipse cx="23" cy="40" rx="17" ry="9" fill={inkFill} />
      <circle cx="19" cy="22" r="1.3" fill="oklch(0.95 0.12 85)" />
      <circle cx="27" cy="22" r="1.3" fill="oklch(0.95 0.12 85)" />
    </svg>
  );
}
function Fox() {
  return (
    <svg width="40" height="46" viewBox="0 0 40 46">
      {/* ears */}
      <path d="M8,12 L12,2 L16,12 Z" fill={inkFill} />
      <path d="M24,12 L28,2 L32,12 Z" fill={inkFill} />
      {/* head */}
      <path d="M6,22 Q20,8 34,22 L28,30 L12,30 Z" fill={inkFill} />
      {/* body */}
      <ellipse cx="20" cy="38" rx="14" ry="8" fill={inkFill} />
      {/* tail */}
      <path d="M32,38 Q42,32 38,22 Q36,32 30,36 Z" fill={inkFill} />
      <circle cx="16" cy="22" r="1.2" fill="oklch(0.95 0.12 85)" />
      <circle cx="24" cy="22" r="1.2" fill="oklch(0.95 0.12 85)" />
    </svg>
  );
}
function Deer() {
  return (
    <svg width="44" height="60" viewBox="0 0 44 60">
      {/* antlers */}
      <path
        d="M14,12 L10,2 M14,12 L18,4 M30,12 L34,2 M30,12 L26,4"
        stroke={inkFill}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="22" cy="20" rx="9" ry="10" fill={inkFill} />
      <ellipse cx="22" cy="40" rx="14" ry="11" fill={inkFill} />
      {/* legs */}
      <rect x="14" y="48" width="3" height="10" fill={inkFill} />
      <rect x="27" y="48" width="3" height="10" fill={inkFill} />
      <circle cx="19" cy="20" r="1.2" fill="oklch(0.95 0.12 85)" />
      <circle cx="25" cy="20" r="1.2" fill="oklch(0.95 0.12 85)" />
    </svg>
  );
}
function Squirrel() {
  return (
    <svg width="36" height="48" viewBox="0 0 36 48">
      <ellipse cx="14" cy="20" rx="9" ry="9" fill={inkFill} />
      <path d="M9,14 L7,7 L13,12 Z" fill={inkFill} />
      <path d="M19,14 L21,7 L17,12 Z" fill={inkFill} />
      <ellipse cx="14" cy="36" rx="10" ry="9" fill={inkFill} />
      {/* big tail */}
      <path d="M22,38 Q36,32 30,14 Q24,22 22,30 Z" fill={inkFill} />
      <circle cx="11" cy="20" r="1.1" fill="oklch(0.95 0.12 85)" />
      <circle cx="17" cy="20" r="1.1" fill="oklch(0.95 0.12 85)" />
    </svg>
  );
}

/* ---------- Cassette reel badge ---------- */
function ReelBadge({ spinning }: { spinning: boolean }) {
  return (
    <div
      className="relative h-[58px] w-[58px] shrink-0 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 35% 35%, oklch(0.30 0.06 50), oklch(0.18 0.04 45))",
        boxShadow:
          "inset 0 0 10px oklch(0 0 0 / 0.6), 0 2px 6px oklch(0 0 0 / 0.5)",
        border: "2px solid oklch(0.22 0.05 45)",
      }}
    >
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: "oklch(0.92 0.03 80)",
          animation: spinning ? "spinReel 1.8s linear infinite" : undefined,
        }}
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
            style={{
              background: "oklch(0.25 0.05 45)",
              transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-12px)`,
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "oklch(0.25 0.05 45)" }}
        />
      </div>
    </div>
  );
}

/* ---------- Control panel ---------- */
function ControlPanel({
  stage,
  musicOn,
  onPlay,
  onToggleMusic,
  onClick,
}: {
  stage: Stage;
  musicOn: boolean;
  onPlay: () => void;
  onToggleMusic: () => void;
  onClick: () => void;
}) {
  const playing = stage !== "idle";
  return (
    <div
      className="relative mt-4 grid grid-cols-5 gap-2 rounded-2xl p-3"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.34 0.06 50), oklch(0.24 0.05 45))",
        border: "2px solid oklch(0.20 0.05 45)",
        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.1)",
      }}
    >
      <CassetteButton onClick={onPlay} label={playing ? "STOP" : "PLAY"}>
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 5 L19 12 L7 19 Z" />
          </svg>
        )}
      </CassetteButton>
      <CassetteButton onClick={onClick} label="LIST">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="8" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="8" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.2" fill="currentColor" />
          <circle cx="4" cy="12" r="1.2" fill="currentColor" />
          <circle cx="4" cy="18" r="1.2" fill="currentColor" />
        </svg>
      </CassetteButton>
      <CassetteButton onClick={onClick} label="EJECT">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5 L20 15 L4 15 Z" />
          <rect x="4" y="17" width="16" height="2.5" rx="1" />
        </svg>
      </CassetteButton>
      <CassetteButton onClick={onToggleMusic} label={musicOn ? "MUTE" : "MUSIC"}>
        {musicOn ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 9 v6 h4 l5 4 V5 L8 9 Z" />
            <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 9 v6 h4 l5 4 V5 L8 9 Z" />
            <path d="M16 8 Q20 12 16 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </CassetteButton>
      <CassetteButton onClick={onClick} label="STORE">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M4 4 h12 l4 4 v12 H4 Z" />
          <rect x="8" y="14" width="8" height="6" />
          <rect x="8" y="4" width="6" height="4" />
        </svg>
      </CassetteButton>
    </div>
  );
}

function CassetteButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-transform active:translate-y-[2px]"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.94 0.02 80), oklch(0.82 0.03 75))",
        border: "1.5px solid oklch(0.50 0.06 55)",
        boxShadow:
          "inset 0 1px 0 oklch(1 0 0 / 0.7), 0 2px 0 oklch(0.40 0.06 50), 0 3px 6px oklch(0 0 0 / 0.35)",
        color: "oklch(0.28 0.06 45)",
      }}
      aria-label={label}
    >
      <span className="flex h-6 w-6 items-center justify-center">{children}</span>
      <span className="text-[9px] font-semibold tracking-[0.15em]">{label}</span>
    </button>
  );
}
