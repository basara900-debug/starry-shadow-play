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
import { useSceneAudio } from "@/lib/sceneAudio";

/**
 * 씬 4 — 따뜻한 오두막 안. 베짱이와 개미들의 화해와 노래.
 * 90초 루프, 끝나면 onComplete 호출.
 */
export type Scene4Speed = 1 | 2 | 0;

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

// 개미 포즈 스케줄 (베짱이 좌측 30%에서 시간대별로 표정 변화)
const ANT_SCHEDULE: { from: number; to: number; src: string }[] = [
  { from: 0,  to: 6,  src: antA.url },
  { from: 6,  to: 12, src: antB.url },
  { from: 12, to: 18, src: antC.url },
  { from: 18, to: 36, src: antD.url },
  { from: 36, to: 72, src: antE.url },
  { from: 72, to: 90, src: antF.url },
];
function antPose(t: number): string {
  return (ANT_SCHEDULE.find((s) => t >= s.from && t < s.to) ?? ANT_SCHEDULE[ANT_SCHEDULE.length - 1]).src;
}

// 배경 개미들 — 화면 수평 50%, 상단 40% 지점을 중심으로 마름모(다이아) 배치
const BG_ANTS: { src: string; left: number; top: number; bob: number; sway: number }[] = [
  { src: ant1.url, left: 50, top: 32, bob: 0.0, sway: 0.0 }, // 위
  { src: ant2.url, left: 42, top: 40, bob: 0.7, sway: 0.5 }, // 왼쪽
  { src: ant3.url, left: 58, top: 40, bob: 1.4, sway: 1.0 }, // 오른쪽
  { src: ant4.url, left: 50, top: 48, bob: 2.1, sway: 1.5 }, // 아래
];

type Line = { from: number; to: number; who: "gh" | "ant" | "ants" | "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 6,  who: "narration", text: "너무나도 따뜻한 집안으로 들어오자 베짱이는 기뻐서 눈물을 흘렸어요." },
  { from: 6,  to: 12, who: "ant", text: "베짱이야 너무 춥고 배고프진 않았니? 그 동안 어떻게 지냈어?" },
  { from: 12, to: 18, who: "gh",  text: "고마워 개미야! 춥고 배고파서 무섭고 힘들었어! 진즉에 너의 말을 들었으면 좋을 걸 그랬어!" },
  { from: 18, to: 24, who: "ant", text: "아니야, 베짱이야! 니 덕에 힘든 일을 해도 즐겁게 할 수 있었어, 이리로 와서 같이 밥 먹자!" },
  { from: 24, to: 30, who: "gh",  text: "고마워 개미야, 아 너무 맛있다! 우걱우걱, 이것도 맛있고, 저것도 맛있다!" },
  { from: 30, to: 36, who: "narration", text: "베짱이는 개미들의 친절에 추운 몸을 녹이고 맛있는 밥을 배부르게 먹을 수 있게 되었어요." },
  { from: 36, to: 42, who: "gh",  text: "고마워 덕분에 지금 너무 행복해, 이럴 때에는 신나는 노래가 빠지면 안되지" },
  { from: 42, to: 48, who: "narration", text: "이제 배부르고 따뜻해진 베짱이가 행복해져서 신나게 노래를 부르기 시작했어요" },
  { from: 48, to: 54, who: "gh",  text: "나는 나는 베짱이! 이 들판에서 제일가는 음악가, 친절한 개미들은 나의 친구, 우리는 너무나 행복해" },
  { from: 54, to: 60, who: "narration", text: "벽난로에서는 장작이 타닥타닥 타는 소리가 들렸고. 베짱이와 개미는 같이 노래를 부르고 춤을 추었습니다" },
  { from: 60, to: 66, who: "ant", text: "베짱이야 역시 네 노래는 모두를 즐겁게 하는 힘이 있어! 이번겨울 동안은 우리랑 같이 지내자!" },
  { from: 66, to: 72, who: "gh",  text: "정말 고마워, 개미야! 너희는 좋은 친구들이야, 정말로 잘 부탁해!" },
  { from: 72, to: 78, who: "ants", text: "그래 그럼 이제 또 신나게 춤추고 놀고 난 뒤에 배부르게 먹자구!" },
  { from: 78, to: 84, who: "gh",  text: "자! 이제 다음 노래를 시작합니다! 원, 투, 쓰리, 가자!" },
  { from: 84, to: 90, who: "narration", text: "추운 겨울이지만, 개미와 베짱이는 아무 걱정 없이 사이좋게 행복했답니다" },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene4Motion({ speed, onComplete }: { speed: Scene4Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // 공용 오디오 버스에 씬 4 BGM/SFX 등록.
  useSceneAudio({
    bgm: bgmAsset.url,
    sfx: sfxAsset.url,
    bgmVolume: 1.0,
    sfxVolume: 0.7,
  });

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