import { useEffect, useRef, useState } from "react";
import gh1 from "@/assets/scene3/gh-1.png";
import gh2 from "@/assets/scene3/gh-2.png";
import gh3 from "@/assets/scene3/gh-3.png";
import bgmAsset from "@/assets/scene3/scene3_bgm.mp3.asset.json";
import sfxAsset from "@/assets/scene3/scene3_sfx.mp3.asset.json";
import { useSceneAudio } from "@/lib/sceneAudio";

/**
 * 씬 3 — 겨울 배경 위의 베짱이 캐릭터.
 * 좌측 25%, 하단 10% 부근에 배치되고 8초마다 포즈가 자연스럽게 전환된다.
 */
export type Scene3Speed = 1 | 2 | 0;

const POSES = [gh1, gh2, gh3];
const POSE_INTERVAL = 8; // 초
const FADE = 0.9; // 페이드 구간(초)
const LOOP_SEC = 90;

type Line = { from: number; to: number; who: "gh" | "narration"; text: string };
const LINES: Line[] = [
  { from: 0,  to: 6,  who: "narration", text: "어느덧 시간이 지나 이제 겨울이 찾아 왔어요. 세상은 너무 춥고 눈과 바람이 불고 있어요." },
  { from: 6,  to: 12, who: "gh", text: "어 너무 추워, 팔, 다리가 떨어져 나갈 거 같아. 너무 배고파, 며칠동안 아무것도 먹지 못했어." },
  { from: 12, to: 18, who: "gh", text: "들판에 그렇게 많았던 맛있는 풀들이, 열매가, 꽃들은 다 어디로 가고 없어 졌을까." },
  { from: 18, to: 24, who: "gh", text: "아 추워, 배고파, 힘들어. 친구들아, 나랑 재미있게 놀던 친구들아 어디로 갔니?" },
  { from: 24, to: 32, who: "gh", text: "흑, 흑, 흑. 이제 곧 밤이 오면은, 나도 더 이상 버틸수는 없을꺼야." },
  { from: 32, to: 38, who: "narration", text: "베짱이는 어두워지는 하늘을 보고 지난 날을 후회한다." },
  { from: 38, to: 44, who: "gh", text: "추운 겨울을 대비해서 열심히 일해야 한다는 개미의 말을 들을걸." },
  { from: 44, to: 52, who: "gh", text: "지금쯤 개미들은 어떻게 지내고 있을까?" },
  { from: 52, to: 58, who: "narration", text: "그때 저 멀리 베짱이의 시야에 불이 환하게 켜진 오두막 집이 보였습니다. 베짱이는 오두막쪽으로 걸어 갔습니다." },
  { from: 58, to: 64, who: "narration", text: "오두막의 굴뚝에서는 모락모락 연기도 나고, 도란도란 소리도 들렸습니다. 베짱이는 창문으로 오두막 안을 보았습니다." },
  { from: 64, to: 70, who: "narration", text: "따뜻한 오두막 안에서는 개미들이 오손도손 모여서 맛있는 음식과 따뜻한 음료를 즐기고 있었습니다." },
  { from: 70, to: 76, who: "gh", text: "아 개미들 집이잖아! 따뜻한 보금자리와 맛있는 음식을 많이 가지고 있네, 부럽다!" },
  { from: 76, to: 82, who: "gh", text: "너무 춥고 배고파! 더 이상 버틸 수 없을 것 같아. 개미들아, 개미들아, 나 좀 살려줘!" },
  { from: 82, to: 90, who: "narration", text: "그때 오두막 문이 덜컥 열리고 베짱이는 개미들의 집으로 들어 가게 되었습니다." },
];

function currentLine(t: number): Line | null {
  return LINES.find((l) => t >= l.from && t < l.to) ?? null;
}

export function Scene3Motion({ speed, onComplete }: { speed: Scene3Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // 씬 3 BGM/SFX — 공용 오디오 버스가 볼륨/속도/일시정지/언마운트 정리까지 담당.
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
  }, [speed]);

  const cycle = POSE_INTERVAL * POSES.length;
  const tt = ((t % cycle) + cycle) % cycle;
  const idx = Math.floor(tt / POSE_INTERVAL);
  const localT = tt - idx * POSE_INTERVAL; // 0~POSE_INTERVAL
  const nextIdx = (idx + 1) % POSES.length;

  // 다음 포즈로의 페이드 비율 (0~1)
  const fadeIn = localT > POSE_INTERVAL - FADE
    ? (localT - (POSE_INTERVAL - FADE)) / FADE
    : 0;

  // 살짝 떨림/숨쉬는 듯한 미세 모션
  const bob = Math.sin(t * 1.6) * 0.6;
  const shiver = idx === 0 ? Math.sin(t * 22) * 0.6 : 0; // 첫 포즈(떠는 베짱이)는 가볍게 진동

  // 시간대별 위치/크기 (자연스러운 이동/스케일)
  // 0–52s: 좌측 25%, 하단 10%, 크기 44%
  // 52–64s: 화면 중앙으로 이동, 크기 22% (50%)
  // 64–90s: 오두막 앞(우측 78%)으로 대각선 아래로 이동, 크기 11% (25%)
  const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const A = { left: 25, bottom: 10, height: 44 };
  const B = { left: 50, bottom: 12, height: 22 };
  const C = { left: 78, bottom: 4, height: 11 };
  let pos = A;
  if (t >= 44 && t < 56) {
    const k = easeInOut((t - 44) / 12);
    pos = { left: lerp(A.left, B.left, k), bottom: lerp(A.bottom, B.bottom, k), height: lerp(A.height, B.height, k) };
  } else if (t >= 56 && t < 60) {
    pos = B;
  } else if (t >= 60 && t < 72) {
    const k = easeInOut((t - 60) / 12);
    pos = { left: lerp(B.left, C.left, k), bottom: lerp(B.bottom, C.bottom, k), height: lerp(B.height, C.height, k) };
  } else if (t >= 72) {
    pos = C;
  }

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div
        className="absolute"
        style={{
          left: `${pos.left}%`,
          bottom: `${pos.bottom}%`,
          height: `${pos.height}%`,
          transform: `translate(-50%, ${bob}px) translateX(${shiver}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.35))",
        }}
      >
        <div style={{ position: "relative", height: "100%" }}>
          <img
            src={POSES[idx]}
            alt=""
            draggable={false}
            style={{
              height: "100%",
              width: "auto",
              display: "block",
              opacity: 1 - fadeIn,
              transition: "opacity 80ms linear",
            }}
          />
          {fadeIn > 0 && (
            <img
              src={POSES[nextIdx]}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                height: "100%",
                width: "auto",
                display: "block",
                opacity: fadeIn,
                transition: "opacity 80ms linear",
              }}
            />
          )}
        </div>
      </div>

      {/* 대사 자막 */}
      <Subtitle line={currentLine(t)} />
    </div>
  );
}

function Subtitle({ line }: { line: Line | null }) {
  if (!line) return null;
  const palette =
    line.who === "gh"
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