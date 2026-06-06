import { useEffect, useRef, useState } from "react";
import ghA from "@/assets/scene4/gh_a.png.asset.json";
import ghB from "@/assets/scene4/gh_b.png.asset.json";
import ghC from "@/assets/scene4/gh_c.png.asset.json";
import ghD from "@/assets/scene4/gh_d.png.asset.json";
import ant1Asset from "@/assets/scene4/ant1.png.asset.json";
import ant2Asset from "@/assets/scene4/ant2.png.asset.json";
import ant3Asset from "@/assets/scene4/ant3.png.asset.json";
import ant4Asset from "@/assets/scene4/ant4.png.asset.json";
import bgmAsset from "@/assets/scene4/scene4_bgm.mp3.asset.json";
import sfxAsset from "@/assets/scene4/scene4_sfx.mp3.asset.json";

/**
 * 씬 4 — 따뜻한 오두막 안. 베짱이와 개미들의 화해와 노래.
 * 90초 루프, 끝나면 onComplete 호출.
 */
export type Scene4Speed = 1 | 2 | 0;

const ANTS = [ant1Asset.url, ant2Asset.url, ant3Asset.url, ant4Asset.url];
const LOOP_SEC = 90;

// 베짱이 포즈 스케줄 (시작초, 이미지)
const GH_SCHEDULE: { from: number; to: number; src: string }[] = [
  { from: 0,  to: 30, src: ghA.url }, // 우측 상단 1번 — 들어와서 울먹임
  { from: 30, to: 42, src: ghB.url }, // 좌측 상단 2번 — 미안/감사
  { from: 42, to: 78, src: ghC.url }, // 우측 하단 1번 — 즐거움/노래
  { from: 78, to: 90, src: ghD.url }, // 하단 중앙 — 행복한 마무리
];
function ghPose(t: number): string {
  return (GH_SCHEDULE.find((s) => t >= s.from && t < s.to) ?? GH_SCHEDULE[GH_SCHEDULE.length - 1]).src;
}

type Line = { from: number; to: number; who: "gh" | "ant" | "ants" | "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 6,  who: "narration", text: "너무도 따뜻한 집안으로 들어오자 베짱이는 너무 기뻐 눈물을 흘렸어요." },
  { from: 6,  to: 12, who: "ant", text: "베짱이야 너무 추웠지? 배고프진 않았니? 며칠동안 아무것도 먹지 못했지!" },
  { from: 12, to: 18, who: "gh",  text: "개미야 너무 춥고 배고팠어. 진즉에 니 말을 들었으면 좋을 걸 그랬어." },
  { from: 18, to: 24, who: "ant", text: "아니야, 베짱이 니 덕에 힘든 일을 해도 즐겁고 기운나게 할 수 있었어. 어서 이리로 와 같이 밥 먹자." },
  { from: 24, to: 30, who: "gh",  text: "흑, 흑, 흑. 고마워 개미야, 이렇게 반갑게 맞아줘서." },
  { from: 30, to: 36, who: "narration", text: "베짱이는 개미들의 친절에 얼은 몸을 녹이고 맛있는 밥을 배부르게 먹을 수 있었어요." },
  { from: 36, to: 42, who: "gh",  text: "고마워, 덕분에 지금 너무 행복해. 이럴 때 내 노래와 연주가 빠지면 안되지!" },
  { from: 42, to: 48, who: "narration", text: "배부르고 따뜻해진 베짱이는 신나게 연주와 노래를 부르기 시작했어요." },
  { from: 48, to: 54, who: "gh",  text: "나는 나는 베짱이, 이 들판에 제일가는 음악가, 친절한 개미들의 친구, 너무나 행복해!" },
  { from: 54, to: 60, who: "narration", text: "벽난로에서는 장작이 타닥타닥 타는 소리가 들리고, 베짱이와 개미는 같이 노래를 부르고 춤을 추었습니다." },
  { from: 60, to: 66, who: "ant", text: "베짱이야, 역시 네 노래는 모두를 즐겁게 하는 힘이 있어. 이번 겨울 우리랑 지내고 내년에도 잘 부탁해!" },
  { from: 66, to: 72, who: "gh",  text: "그래 개미야, 우린 친한 친구들이야. 나도 다음 해에는 잘 부탁해." },
  { from: 72, to: 78, who: "ants", text: "자, 이제 또 신나게 놀자구!" },
  { from: 78, to: 84, who: "gh",  text: "자, 다음 노래를 시작한다. 가자!" },
  { from: 84, to: 90, who: "narration", text: "추운 겨울이 다가와도 이제 개미와 베짱이는 아무 걱정 없이 사이좋게 행복했답니다." },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene4Motion({ speed, onComplete }: { speed: Scene4Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

  // 씬 4 BGM (밝고 행복한 음악). speed=0이면 일시정지.
  useEffect(() => {
    if (!bgmRef.current) {
      const a = new Audio(bgmAsset.url);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0.55;
      bgmRef.current = a;
    }
    const a = bgmRef.current;
    a.playbackRate = speed === 0 ? 1 : speed;
    if (speed === 0) a.pause();
    else a.play().catch(() => {});
    return () => { a.pause(); };
  }, [speed]);

  // 씬 4 벽난로 모닥불 SFX. 루프 재생.
  useEffect(() => {
    if (!sfxRef.current) {
      const a = new Audio(sfxAsset.url);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0.4;
      sfxRef.current = a;
    }
    const a = sfxRef.current;
    a.playbackRate = speed === 0 ? 1 : speed;
    if (speed === 0) a.pause();
    else a.play().catch(() => {});
    return () => { a.pause(); };
  }, [speed]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current.src = ""; bgmRef.current = null; }
      if (sfxRef.current) { sfxRef.current.pause(); sfxRef.current.src = ""; sfxRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next >= LOOP_SEC && !doneRef.current) {
          doneRef.current = true;
          onComplete?.();
        }
        return next % LOOP_SEC;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [speed, onComplete]);

  // 베짱이 포즈 — 시간대별로 결정
  const ghSrc = ghPose(t);
  const bob = Math.sin(t * 2.4) * 2;
  const sway = Math.sin(t * 1.8) * 1.5;

  // 개미들 - 식탁 주변에 모여있다가 60초부터 춤추듯 좌우로 움직임
  const dance = t >= 54 ? Math.sin(t * 3) * 4 : 0;

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

      {/* 개미들 — 화면 중앙(50%, 높이 50%) 주변에 4마리 배치. 54초부터 살짝 춤추듯 흔들림. */}
      {[
        { src: ANTS[0], left: 38, bottom: 50, h: 22, flip: false, phase: 0,   amp: 1.5 },
        { src: ANTS[1], left: 50, bottom: 56, h: 20, flip: true,  phase: 0.8, amp: 1.2 },
        { src: ANTS[2], left: 62, bottom: 50, h: 22, flip: true,  phase: 1.6, amp: 1.5 },
        { src: ANTS[3], left: 50, bottom: 42, h: 21, flip: false, phase: 2.4, amp: 1.8 },
      ].map((a, i) => (
        <img
          key={i}
          src={a.src}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${a.left + dance * (0.3 + i * 0.1)}%`,
            bottom: `${a.bottom}%`,
            height: `${a.h}%`,
            width: "auto",
            transform: `translate(-50%, ${Math.sin(t * 2.4 + a.phase) * a.amp}px)${a.flip ? " scaleX(-1)" : ""}`,
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 3px 5px oklch(0 0 0 / 0.4))",
          }}
        />
      ))}

      {/* 베짱이 — 우측 40%, 아래 10% 위치에서 시간대별 포즈 표현 */}
      <img
        src={ghSrc}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: `${40 + sway * 0.4}%`,
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
        씬 4 · {Math.floor(t)}s / {LOOP_SEC}s
      </div>

      <Subtitle line={currentLine(t)} />
    </div>
  );
}

function Subtitle({ line }: { line: Line | null }) {
  if (!line) return null;
  const palette =
    line.who === "ant" || line.who === "ants"
      ? { bg: "oklch(0.25 0.05 30 / 0.82)", fg: "oklch(0.97 0.02 80)", label: line.who === "ants" ? "개미들" : "개미" }
      : line.who === "gh"
      ? { bg: "oklch(0.32 0.12 140 / 0.82)", fg: "oklch(0.98 0.04 110)", label: "베짱이" }
      : { bg: "oklch(0.18 0 0 / 0.78)", fg: "oklch(0.95 0 0)", label: "내레이션" };
  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: "4%",
        transform: "translateX(-50%)",
        maxWidth: "84%",
        background: palette.bg,
        color: palette.fg,
        padding: "10px 16px",
        borderRadius: 12,
        fontSize: 16,
        lineHeight: 1.45,
        textAlign: "center",
        boxShadow: "0 6px 18px oklch(0 0 0 / 0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.85,
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {palette.label}
      </div>
      {line.text}
    </div>
  );
}