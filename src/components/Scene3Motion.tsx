import { useEffect, useRef, useState } from "react";
import gh1 from "@/assets/scene3/gh-1.png";
import gh2 from "@/assets/scene3/gh-2.png";
import gh3 from "@/assets/scene3/gh-3.png";
import bgmAsset from "@/assets/scene3/scene3_bgm.mp3.asset.json";
import sfxAsset from "@/assets/scene3/scene3_sfx.mp3.asset.json";
import { useSceneAudio, useSceneAudioState } from "@/lib/sceneAudio";
import beatsData from "@/assets/scene3-beats.json";
import { useSceneBeatPlayback, type SceneBeat } from "@/lib/sceneTts";

/**
 * 씬 3 — 겨울 배경 위의 베짱이 캐릭터.
 * 좌측 25%, 하단 10% 부근에 배치되고 8초마다 포즈가 자연스럽게 전환된다.
 */
export type Scene3Speed = 1 | 2 | 0;

const POSES = [gh1, gh2, gh3];
const POSE_INTERVAL = 8; // 초
const FADE = 0.9; // 페이드 구간(초)
const BEATS = beatsData as SceneBeat[];
const LAST_END = BEATS[BEATS.length - 1].to;
const LOOP_SEC = Math.ceil(LAST_END + 1.5);

// 모션 동기화 키 — 오두막 발견(중앙 이동), 오두막 도착(우측 이동) 비트
const HUT_SPOTTED_BEAT = BEATS.find((b) => /오두막/.test(b.text))!;
const HUT_NEAR_BEAT = BEATS.find((b) => /따뜻한 오두막 안/.test(b.text))!;

function currentLine(t: number): SceneBeat | null {
  return BEATS.find((b) => t >= b.from && t < b.to) ?? null;
}

export function Scene3Motion({ speed, onComplete }: { speed: Scene3Speed; onComplete?: () => void }) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 씬 3 BGM/SFX — 공용 오디오 버스가 볼륨/속도/일시정지/언마운트 정리까지 담당.
  useSceneAudio({
    bgm: bgmAsset.url,
    sfx: sfxAsset.url,
    bgmVolume: 0.4,
    sfxVolume: 0.4,
  });
  const audioState = useSceneAudioState();
  useSceneBeatPlayback(BEATS, t, speed, audioState);

  useEffect(() => {
    if (speed === 0) return;
    const step = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      const next = timeRef.current + dt * speed;
      if (next >= LOOP_SEC && !doneRef.current) {
        doneRef.current = true;
        window.setTimeout(() => onCompleteRef.current?.(), 0);
      }
      timeRef.current = next % LOOP_SEC;
      setT(timeRef.current);
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

  // 시간대별 위치/크기 — 대사(비트) 시작에 동기화
  // 시작 ~ HUT_SPOTTED 직전: 좌측 25%
  // HUT_SPOTTED ~ HUT_NEAR: 화면 중앙으로 이동
  // HUT_NEAR ~ 끝: 오두막 앞(우측)으로 이동
  const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const A = { left: 25, bottom: 10, height: 44 };
  const B = { left: 50, bottom: 12, height: 22 };
  const C = { left: 78, bottom: 4, height: 11 };
  const T0 = HUT_SPOTTED_BEAT.from; // 중앙으로 이동 시작
  const T1 = HUT_NEAR_BEAT.from;    // 우측 이동 시작
  const T2 = LAST_END;              // 완료
  const MOVE_A = 4; // A→B 전환 시간(초)
  const MOVE_B = 6; // B→C 전환 시간(초)
  let pos = A;
  if (t >= T0 && t < T0 + MOVE_A) {
    const k = easeInOut((t - T0) / MOVE_A);
    pos = { left: lerp(A.left, B.left, k), bottom: lerp(A.bottom, B.bottom, k), height: lerp(A.height, B.height, k) };
  } else if (t >= T0 + MOVE_A && t < T1) {
    pos = B;
  } else if (t >= T1 && t < T1 + MOVE_B) {
    const k = easeInOut((t - T1) / MOVE_B);
    pos = { left: lerp(B.left, C.left, k), bottom: lerp(B.bottom, C.bottom, k), height: lerp(B.height, C.height, k) };
  } else if (t >= T1 + MOVE_B && t < T2 + 1) {
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