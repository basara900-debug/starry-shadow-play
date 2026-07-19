import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import timingJson from "@/stories/boy-wolf/timing.json";
import scriptJson from "@/stories/boy-wolf/script.json";

export const Route = createFileRoute("/audio")({
  head: () => ({
    meta: [
      { title: "음성 듣기 — 양치기 소년" },
      { name: "description", content: "ElevenLabs로 생성한 양치기 소년 대사 음성을 씬별/대사별로 골라 재생합니다." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AudioBrowserPage,
});

type Beat = { from: number; to: number; who: string; text: string };
type TimingScene = { id: string; durationSec: number; beats: Beat[] };
type ScriptScene = { id: string; title: string; dialogue: { who: string; text: string }[] };

const SPEAKER_LABEL: Record<string, string> = {
  narration: "나레이션",
  tom: "톰",
  villager: "마을 사람",
  father: "아버지",
  whistle: "휘슬",
  wolf: "늑대",
};

const SPEAKER_COLOR: Record<string, string> = {
  narration: "oklch(0.7 0.08 75)",
  tom: "oklch(0.75 0.14 220)",
  villager: "oklch(0.72 0.12 30)",
  father: "oklch(0.7 0.1 145)",
  whistle: "oklch(0.78 0.1 300)",
  wolf: "oklch(0.6 0.15 25)",
};

function fmt(sec: number) {
  if (!isFinite(sec)) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function speakerLabel(who: string) {
  return SPEAKER_LABEL[who] ?? who;
}

function speakerColor(who: string) {
  return SPEAKER_COLOR[who] ?? "oklch(0.7 0.05 60)";
}

/** 씬 번호 (1-based) → 파일명 규칙과 일치 */
function sceneIndex(id: string) {
  const m = id.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** 대사 파일명: `<NN>_<who>.mp3` (NN은 씬 내 라인 인덱스, 00 부터) */
function lineFilename(index: number, who: string) {
  return `${index.toString().padStart(2, "0")}_${who}.mp3`;
}

function AudioBrowserPage() {
  const scenes = useMemo(() => {
    const scriptById = new Map<string, ScriptScene>(
      (scriptJson.scenes as ScriptScene[]).map((s) => [s.id, s]),
    );
    return (timingJson.scenes as TimingScene[]).map((t) => ({
      ...t,
      index: sceneIndex(t.id),
      title: scriptById.get(t.id)?.title ?? t.id,
    }));
  }, []);

  const [openScene, setOpenScene] = useState<string | null>(scenes[0]?.id ?? null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 한 번에 하나만 재생: 새 오디오 재생 이벤트가 들어오면 이전 오디오 정지
  useEffect(() => {
    const handler = (e: Event) => {
      const el = e.target as HTMLAudioElement | null;
      if (!el || !(el instanceof HTMLAudioElement)) return;
      if (currentAudioRef.current && currentAudioRef.current !== el) {
        try {
          currentAudioRef.current.pause();
        } catch {}
      }
      currentAudioRef.current = el;
    };
    document.addEventListener("play", handler, true);
    return () => document.removeEventListener("play", handler, true);
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "oklch(0.16 0.02 60)",
        color: "oklch(0.94 0.03 75)",
        padding: "16px 12px 96px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ maxWidth: 640, margin: "0 auto 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
            🎧 양치기 소년 · 음성 듣기
          </h1>
          <Link
            to="/"
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              background: "oklch(0.28 0.03 60)",
              color: "oklch(0.92 0.03 75)",
              textDecoration: "none",
              border: "1px solid oklch(0.4 0.04 60)",
            }}
          >
            ← 홈
          </Link>
        </div>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          ElevenLabs로 생성된 대사 음성 파일을 직접 골라 들을 수 있습니다.
        </p>
      </header>

      <section style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, opacity: 0.75, margin: "8px 4px" }}>
          씬 마스터 (전체 재생)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scenes.map((s) => (
            <SceneMasterRow key={s.id} sceneIndex={s.index} title={s.title} duration={s.durationSec} />
          ))}
        </div>

        <h2 style={{ fontSize: 13, fontWeight: 700, opacity: 0.75, margin: "24px 4px 8px" }}>
          씬별 개별 대사
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {scenes.map((s) => {
            const open = openScene === s.id;
            return (
              <div
                key={s.id}
                style={{
                  background: "oklch(0.22 0.02 60)",
                  border: "1px solid oklch(0.35 0.03 60)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenScene(open ? null : s.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "10px 12px",
                    background: "transparent",
                    color: "inherit",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>
                    <span style={{ opacity: 0.6, marginRight: 6 }}>#{s.index}</span>
                    {s.title}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {s.beats.length}개 · {fmt(s.durationSec)} {open ? "▲" : "▼"}
                  </span>
                </button>
                {open && (
                  <div style={{ padding: "4px 8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {s.beats.map((b, i) => (
                      <LineRow key={i} sceneIndex={s.index} lineIndex={i} beat={b} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function SceneMasterRow({
  sceneIndex,
  title,
  duration,
}: {
  sceneIndex: number;
  title: string;
  duration: number;
}) {
  const url = `/audio/boy-wolf/scene${sceneIndex}.mp3`;
  return (
    <div
      style={{
        background: "oklch(0.22 0.02 60)",
        border: "1px solid oklch(0.35 0.03 60)",
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          <span style={{ opacity: 0.6, marginRight: 6 }}>씬 {sceneIndex}</span>
          {title}
        </div>
        <a
          href={url}
          download
          style={{ fontSize: 11, opacity: 0.7, color: "inherit", textDecoration: "none" }}
        >
          ⬇ {fmt(duration)}
        </a>
      </div>
      <audio controls preload="none" src={url} style={{ width: "100%", height: 34 }} />
    </div>
  );
}

function LineRow({
  sceneIndex,
  lineIndex,
  beat,
}: {
  sceneIndex: number;
  lineIndex: number;
  beat: Beat;
}) {
  const file = lineFilename(lineIndex, beat.who);
  const url = `/audio/boy-wolf/scene${sceneIndex}/tts/${file}`;
  return (
    <div
      style={{
        background: "oklch(0.18 0.02 60)",
        border: "1px solid oklch(0.3 0.03 60)",
        borderRadius: 8,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            background: "oklch(0.28 0.03 60)",
            color: speakerColor(beat.who),
            border: `1px solid ${speakerColor(beat.who)}`,
          }}
        >
          {speakerLabel(beat.who)}
        </span>
        <span style={{ fontSize: 10, opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>
          {file} · {fmt(beat.from)}–{fmt(beat.to)}
        </span>
        <a
          href={url}
          download
          style={{ marginLeft: "auto", fontSize: 10, opacity: 0.7, color: "inherit", textDecoration: "none" }}
        >
          ⬇
        </a>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.9 }}>{beat.text}</div>
      <audio controls preload="none" src={url} style={{ width: "100%", height: 32 }} />
    </div>
  );
}