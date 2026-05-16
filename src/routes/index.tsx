import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: ShadowTheater,
});

const SCENES = [
  {
    id: "wake",
    title: "Bébé s'éveille",
    subtitle: "Une petite étoile descend chuchoter dans la forêt",
    caption: "« Réveille-toi, petit. La nuit est douce. »",
  },
  {
    id: "walk",
    title: "La promenade",
    subtitle: "Le renard guide bébé entre les fougères",
    caption: "« Suis la lumière, pas à pas, sur les feuilles. »",
  },
  {
    id: "dance",
    title: "La danse des lucioles",
    subtitle: "Les arbres se penchent, les hiboux chantent",
    caption: "« Tournons, tournons, la forêt est notre théâtre. »",
  },
  {
    id: "sleep",
    title: "Bonne nuit, petite étoile",
    subtitle: "Bébé s'endort sous la mousse",
    caption: "« À demain, mon ami du ciel. »",
  },
];

function ShadowTheater() {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.35 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), 6500);
    return () => clearTimeout(t);
  }, [scene, playing]);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    setPointer({
      x: Math.min(1, Math.max(0, (point.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (point.clientY - rect.top) / rect.height)),
    });
  };

  const current = SCENES[scene];
  const moonX = 20 + pointer.x * 60;
  const moonY = 10 + pointer.y * 30;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[oklch(0.16_0.04_270)] text-[oklch(0.96_0.02_90)]">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[2000ms] ease-out"
        style={{
          background: `radial-gradient(circle at ${moonX}% ${moonY}%, oklch(0.55 0.13 75 / 0.55), oklch(0.22 0.06 280 / 0.35) 35%, oklch(0.12 0.04 270) 75%)`,
        }}
      />
      {/* stars */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 53) % 100;
          const y = (i * 29) % 70;
          const size = (i % 3) + 1;
          const delay = (i % 7) * 0.4;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-[oklch(0.95_0.06_90)] animate-pulse"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                opacity: 0.5 + ((i % 4) * 0.12),
                animationDelay: `${delay}s`,
                animationDuration: `${2 + (i % 4)}s`,
              }}
            />
          );
        })}
      </div>

      {/* header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✦</span>
          <div className="leading-tight">
            <p className="font-serif text-lg tracking-wide">Little Star, Little Forêt Bébé</p>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[oklch(0.85_0.05_90/_0.7)]">
              Shadow Theater
            </p>
          </div>
        </div>
        <nav className="hidden gap-8 text-xs uppercase tracking-[0.3em] text-[oklch(0.9_0.04_90/_0.7)] md:flex">
          <a href="#stage" className="hover:text-[oklch(0.95_0.1_90)]">Scène</a>
          <a href="#about" className="hover:text-[oklch(0.95_0.1_90)]">Histoire</a>
          <a href="#shows" className="hover:text-[oklch(0.95_0.1_90)]">Séances</a>
        </nav>
      </header>

      {/* stage */}
      <section id="stage" className="relative z-10 px-4 pb-12 md:px-12">
        <div
          ref={stageRef}
          onMouseMove={handleMove}
          onTouchMove={handleMove}
          className="relative mx-auto aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-[28px] border border-[oklch(0.95_0.06_90/_0.18)] shadow-[0_30px_80px_-20px_oklch(0.05_0.05_270/_0.7)]"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.28 0.07 275) 0%, oklch(0.20 0.06 280) 40%, oklch(0.14 0.05 270) 100%)",
          }}
        >
          {/* curtain edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[oklch(0.18_0.09_25)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[oklch(0.18_0.09_25)] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-[oklch(0.18_0.09_25)]" />

          {/* moon */}
          <div
            className="absolute rounded-full transition-all duration-[1200ms] ease-out"
            style={{
              left: `${moonX}%`,
              top: `${moonY}%`,
              width: 120,
              height: 120,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle at 35% 35%, oklch(0.97 0.08 90), oklch(0.78 0.12 80) 60%, oklch(0.55 0.13 70) 100%)",
              boxShadow: "0 0 80px oklch(0.85 0.15 80 / 0.6)",
            }}
          />

          {/* distant hills */}
          <svg viewBox="0 0 1600 400" className="absolute inset-x-0 bottom-0 w-full" preserveAspectRatio="none">
            <path
              d="M0,400 L0,260 C200,180 320,300 520,240 C700,190 820,300 1000,250 C1200,200 1380,300 1600,240 L1600,400 Z"
              fill="oklch(0.12 0.05 275)"
              opacity="0.7"
            />
            <path
              d="M0,400 L0,320 C180,260 360,340 560,290 C760,250 940,360 1140,310 C1340,270 1500,360 1600,320 L1600,400 Z"
              fill="oklch(0.08 0.04 275)"
              opacity="0.9"
            />
          </svg>

          {/* forest silhouettes */}
          <Forest scene={scene} />

          {/* characters */}
          <Characters scene={scene} />

          {/* caption */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8">
            <p
              key={current.id}
              className="mx-auto max-w-2xl text-center font-serif text-base italic text-[oklch(0.96_0.04_85)] md:text-xl"
              style={{ animation: "fade 1.2s ease both" }}
            >
              {current.caption}
            </p>
          </div>
        </div>

        {/* controls */}
        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-serif text-2xl md:text-3xl">{current.title}</p>
            <p className="text-sm text-[oklch(0.88_0.04_90/_0.7)]">{current.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setScene(i);
                  setPlaying(false);
                }}
                aria-label={`Scène ${i + 1}: ${s.title}`}
                className={`h-2 rounded-full transition-all ${
                  i === scene ? "w-10 bg-[oklch(0.9_0.13_85)]" : "w-2 bg-[oklch(0.9_0.04_90/_0.3)]"
                }`}
              />
            ))}
            <button
              onClick={() => setPlaying((p) => !p)}
              className="ml-4 rounded-full border border-[oklch(0.95_0.06_90/_0.3)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[oklch(0.95_0.05_90)] hover:bg-[oklch(0.95_0.06_90/_0.08)]"
            >
              {playing ? "Pause" : "Jouer"}
            </button>
          </div>
        </div>
      </section>

      {/* about */}
      <section id="about" className="relative z-10 mx-auto max-w-4xl px-6 py-20 text-center md:px-12">
        <p className="text-xs uppercase tracking-[0.4em] text-[oklch(0.85_0.06_85)]">L'histoire</p>
        <h2 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">
          Un petit théâtre d'ombres pour les rêves des tout-petits.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[oklch(0.9_0.03_90/_0.75)] md:text-base">
          Chaque soir, une étoile descend du ciel pour réveiller bébé et l'emmener danser dans
          la forêt. Renards, hiboux et lucioles viennent jouer derrière le drap éclairé,
          jusqu'à ce que la lune les berce à nouveau.
        </p>
      </section>

      {/* shows */}
      <section id="shows" className="relative z-10 mx-auto max-w-5xl px-6 pb-24 md:px-12">
        <p className="text-xs uppercase tracking-[0.4em] text-[oklch(0.85_0.06_85)]">Prochaines séances</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { d: "Ven 24 mai", t: "19h30", p: "Atelier des Lucioles, Paris" },
            { d: "Sam 25 mai", t: "17h00", p: "Le Petit Bois, Lyon" },
            { d: "Dim 02 juin", t: "11h00", p: "La Clairière, Bordeaux" },
          ].map((s) => (
            <div
              key={s.d}
              className="rounded-2xl border border-[oklch(0.95_0.06_90/_0.18)] bg-[oklch(0.22_0.05_275/_0.5)] p-5 backdrop-blur"
            >
              <p className="font-serif text-lg">{s.d}</p>
              <p className="text-sm text-[oklch(0.9_0.13_85)]">{s.t}</p>
              <p className="mt-2 text-xs text-[oklch(0.9_0.04_90/_0.7)]">{s.p}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.4em] text-[oklch(0.85_0.04_90/_0.5)]">
          ✦  Fait avec tendresse pour les petits rêveurs  ✦
        </p>
      </section>

      <style>{`
        @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes sway { 0%,100% { transform: rotate(-1deg); } 50% { transform: rotate(1.5deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes twinkle { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }
      `}</style>
    </main>
  );
}

function Forest({ scene }: { scene: number }) {
  return (
    <svg
      viewBox="0 0 1600 600"
      className="absolute inset-x-0 bottom-0 w-full"
      preserveAspectRatio="none"
    >
      {/* ground */}
      <path d="M0,600 L0,500 L1600,460 L1600,600 Z" fill="oklch(0.05 0.03 270)" />
      {/* trees, swaying */}
      {[
        { x: 100, h: 280, w: 90 },
        { x: 260, h: 360, w: 130 },
        { x: 470, h: 240, w: 80 },
        { x: 640, h: 320, w: 110 },
        { x: 980, h: 300, w: 100 },
        { x: 1180, h: 380, w: 140 },
        { x: 1400, h: 260, w: 90 },
      ].map((t, i) => (
        <g
          key={i}
          style={{
            transformOrigin: `${t.x}px 500px`,
            animation: `sway ${5 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
          }}
        >
          <rect x={t.x - 8} y={500 - t.h * 0.55} width="16" height={t.h * 0.55} fill="oklch(0.05 0.02 270)" />
          <path
            d={`M${t.x - t.w / 2},${500 - t.h * 0.5} L${t.x},${500 - t.h} L${t.x + t.w / 2},${500 - t.h * 0.5} Z`}
            fill="oklch(0.04 0.02 270)"
          />
          <path
            d={`M${t.x - t.w / 2.2},${500 - t.h * 0.7} L${t.x},${500 - t.h * 1.05} L${t.x + t.w / 2.2},${500 - t.h * 0.7} Z`}
            fill="oklch(0.03 0.02 270)"
          />
        </g>
      ))}
      {/* fireflies appear in dance scene */}
      {scene === 2 &&
        Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx={120 + ((i * 113) % 1400)}
            cy={250 + ((i * 47) % 180)}
            r={3}
            fill="oklch(0.95 0.18 100)"
            style={{
              animation: `twinkle ${1.5 + (i % 3)}s ease-in-out ${i * 0.2}s infinite, float ${3 + (i % 4)}s ease-in-out infinite`,
              filter: "drop-shadow(0 0 6px oklch(0.95 0.2 100))",
            }}
          />
        ))}
    </svg>
  );
}

function Characters({ scene }: { scene: number }) {
  // positions for bebe + companion per scene
  const pos = [
    { bx: 50, fox: 70, walking: false, sleeping: false, owl: false },
    { bx: 38, fox: 30, walking: true, sleeping: false, owl: true },
    { bx: 55, fox: 65, walking: true, sleeping: false, owl: true },
    { bx: 50, fox: 56, walking: false, sleeping: true, owl: false },
  ][scene];

  return (
    <div className="absolute inset-0">
      {/* little star (descending) */}
      <div
        className="absolute transition-all duration-[1500ms] ease-in-out"
        style={{
          left: `${pos.bx + 4}%`,
          top: scene === 3 ? "10%" : scene === 0 ? "30%" : "20%",
          transform: "translate(-50%, -50%)",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <svg width="46" height="46" viewBox="0 0 46 46">
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.98 0.15 90)" />
              <stop offset="60%" stopColor="oklch(0.85 0.18 80)" />
              <stop offset="100%" stopColor="oklch(0.6 0.18 70 / 0)" />
            </radialGradient>
          </defs>
          <circle cx="23" cy="23" r="22" fill="url(#starGlow)" opacity="0.7" />
          <path
            d="M23 8 L26 19 L37 20 L28 27 L31 38 L23 31 L15 38 L18 27 L9 20 L20 19 Z"
            fill="oklch(0.97 0.15 90)"
            style={{ filter: "drop-shadow(0 0 8px oklch(0.95 0.2 85))" }}
          />
        </svg>
      </div>

      {/* bebe silhouette */}
      <div
        className="absolute bottom-[14%] transition-all duration-[1500ms] ease-in-out"
        style={{
          left: `${pos.bx}%`,
          transform: `translateX(-50%) ${pos.sleeping ? "rotate(-90deg) translateY(20px)" : ""}`,
          animation: pos.walking ? "float 1.2s ease-in-out infinite" : undefined,
        }}
      >
        <svg width="70" height="100" viewBox="0 0 70 100">
          {/* head */}
          <circle cx="35" cy="22" r="18" fill="oklch(0.04 0.02 270)" />
          {/* tiny tuft */}
          <path d="M30 6 Q35 -2 40 6" stroke="oklch(0.04 0.02 270)" strokeWidth="3" fill="none" />
          {/* body (pajama) */}
          <path
            d="M16 44 Q35 36 54 44 L58 92 Q35 100 12 92 Z"
            fill="oklch(0.04 0.02 270)"
          />
          {/* arm reaching up to star in scenes 0,2 */}
          {(scene === 0 || scene === 2) && (
            <path d="M50 50 Q60 38 56 22" stroke="oklch(0.04 0.02 270)" strokeWidth="8" strokeLinecap="round" fill="none" />
          )}
        </svg>
      </div>

      {/* fox companion */}
      <div
        className="absolute bottom-[14%] transition-all duration-[1500ms] ease-in-out"
        style={{
          left: `${pos.fox}%`,
          transform: "translateX(-50%)",
          animation: pos.walking ? "float 1.4s ease-in-out infinite" : undefined,
        }}
      >
        <svg width="90" height="60" viewBox="0 0 90 60">
          {/* body */}
          <ellipse cx="42" cy="42" rx="28" ry="14" fill="oklch(0.04 0.02 270)" />
          {/* legs */}
          <rect x="22" y="48" width="5" height="12" fill="oklch(0.04 0.02 270)" />
          <rect x="34" y="50" width="5" height="10" fill="oklch(0.04 0.02 270)" />
          <rect x="50" y="50" width="5" height="10" fill="oklch(0.04 0.02 270)" />
          <rect x="60" y="48" width="5" height="12" fill="oklch(0.04 0.02 270)" />
          {/* head */}
          <path d="M62 38 L82 22 L84 40 Z" fill="oklch(0.04 0.02 270)" />
          {/* ears */}
          <path d="M74 26 L78 16 L82 26 Z" fill="oklch(0.04 0.02 270)" />
          {/* tail */}
          <path d="M14 40 Q-2 32 8 22 Q12 32 22 38 Z" fill="oklch(0.04 0.02 270)" />
        </svg>
      </div>

      {/* owl on branch */}
      {pos.owl && (
        <div className="absolute left-[15%] top-[28%]" style={{ animation: "float 4s ease-in-out infinite" }}>
          <svg width="50" height="60" viewBox="0 0 50 60">
            <ellipse cx="25" cy="32" rx="16" ry="20" fill="oklch(0.04 0.02 270)" />
            <path d="M10 18 L16 8 L20 20 Z" fill="oklch(0.04 0.02 270)" />
            <path d="M30 20 L34 8 L40 18 Z" fill="oklch(0.04 0.02 270)" />
            <circle cx="19" cy="28" r="3" fill="oklch(0.95 0.15 85)" />
            <circle cx="31" cy="28" r="3" fill="oklch(0.95 0.15 85)" />
          </svg>
        </div>
      )}

      {/* mushroom bed when sleeping */}
      {pos.sleeping && (
        <svg className="absolute bottom-[10%] left-[58%]" width="60" height="40" viewBox="0 0 60 40">
          <ellipse cx="30" cy="34" rx="28" ry="5" fill="oklch(0.04 0.02 270)" opacity="0.7" />
          <path d="M8 22 Q30 -2 52 22 Z" fill="oklch(0.04 0.02 270)" />
          <rect x="24" y="20" width="12" height="16" fill="oklch(0.04 0.02 270)" />
        </svg>
      )}
    </div>
  );
}
