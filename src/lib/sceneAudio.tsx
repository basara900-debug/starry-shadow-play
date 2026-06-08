import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/**
 * SceneAudio bus — 모든 씬의 BGM/SFX를 한 곳에서 제어한다.
 *
 * - 씬 컴포넌트는 useSceneTrack(url, kind)로 트랙을 "등록"만 한다.
 *   생성/해제/볼륨/음소거/재생속도/일시정지는 전부 버스가 책임진다.
 * - 설정 패널은 useSceneAudioControls()로 값을 즉시 갱신한다.
 * - 값 변경은 pub/sub로 모든 등록 트랙에 즉시 반영되며, 컴포넌트는
 *   다시 렌더링되지 않는다(오디오 요소만 갱신).
 *
 * 씬마다 audio 객체를 새로 만들고 cleanup을 빠뜨리면서 생겼던 트랜지션
 * 랙/잔상/음향 미실행 문제를 구조적으로 차단하는 것이 목적이다.
 */

export type SceneSpeed = 0 | 1 | 2;
export type TrackKind = "bgm" | "sfx";

export type SceneAudioState = {
  bgmVol: number;
  bgmMuted: boolean;
  sfxVol: number;
  sfxMuted: boolean;
  voiceVol: number;
  voiceMuted: boolean;
  /** 1.0 = normal, 0.5~2.0 */
  playbackRate: number;
  /** 0(정지) | 1 | 2 — 씬 재생 속도. 오디오 playbackRate에 곱해진다. */
  speed: SceneSpeed;
  /** 사용자 제스처를 받은 적이 있는지(autoplay 해제 상태) */
  unlocked: boolean;
};

const DEFAULT_STATE: SceneAudioState = {
  bgmVol: 0.55,
  bgmMuted: false,
  sfxVol: 0.6,
  sfxMuted: false,
  voiceVol: 0.8,
  voiceMuted: false,
  playbackRate: 1.0,
  speed: 1,
  unlocked: false,
};

type Listener = (s: SceneAudioState) => void;

type Ctx = {
  /** 현재 값을 동기적으로 읽기 위한 ref. 렌더링 외부에서 호출 안전. */
  read: () => SceneAudioState;
  /** 값 변경. 즉시 모든 트랙에 통보된다. */
  patch: (p: Partial<SceneAudioState>) => void;
  subscribe: (fn: Listener) => () => void;
};

const SceneAudioContext = createContext<Ctx | null>(null);

export function SceneAudioProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef<SceneAudioState>({ ...DEFAULT_STATE });
  const listenersRef = useRef<Set<Listener>>(new Set());

  const ctx = useMemo<Ctx>(
    () => ({
      read: () => stateRef.current,
      patch: (p) => {
        stateRef.current = { ...stateRef.current, ...p };
        for (const fn of listenersRef.current) fn(stateRef.current);
      },
      subscribe: (fn) => {
        listenersRef.current.add(fn);
        return () => {
          listenersRef.current.delete(fn);
        };
      },
    }),
    []
  );

  // 첫 사용자 제스처에서 unlocked=true. 이후 트랙이 새로 mount되어도
  // 즉시 play()를 시도할 수 있다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onGesture = () => {
      ctx.patch({ unlocked: true });
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [ctx]);

  return (
    <SceneAudioContext.Provider value={ctx}>{children}</SceneAudioContext.Provider>
  );
}

function useCtx(): Ctx {
  const c = useContext(SceneAudioContext);
  if (!c) throw new Error("SceneAudioProvider missing");
  return c;
}

/**
 * 설정 패널/툴바에서 사용. 값 변경은 즉시 모든 등록 트랙에 반영된다.
 * 컴포넌트가 현재 값을 표시해야 한다면 setState를 함께 두어 동기화한다.
 */
export function useSceneAudioControls() {
  const ctx = useCtx();
  return useMemo(
    () => ({
      read: ctx.read,
      patch: ctx.patch,
      setBgm: (v: number) => ctx.patch({ bgmVol: clamp01(v) }),
      setBgmMuted: (m: boolean) => ctx.patch({ bgmMuted: m }),
      setSfx: (v: number) => ctx.patch({ sfxVol: clamp01(v) }),
      setSfxMuted: (m: boolean) => ctx.patch({ sfxMuted: m }),
      setVoice: (v: number) => ctx.patch({ voiceVol: clamp01(v) }),
      setVoiceMuted: (m: boolean) => ctx.patch({ voiceMuted: m }),
      setPlaybackRate: (r: number) => ctx.patch({ playbackRate: clampRate(r) }),
      setSpeed: (s: SceneSpeed) => ctx.patch({ speed: s }),
    }),
    [ctx]
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function clampRate(v: number) {
  return Math.max(0.5, Math.min(2.0, v));
}

function resolveVolume(s: SceneAudioState, kind: TrackKind) {
  if (kind === "bgm") return s.bgmMuted ? 0 : s.bgmVol;
  return s.sfxMuted ? 0 : s.sfxVol;
}
function resolveRate(s: SceneAudioState) {
  if (s.speed === 0) return 1;
  return s.speed * s.playbackRate;
}

/**
 * 씬에서 사용. URL 하나당 한 번만 호출하면 된다.
 * - mount: Audio 객체 생성, 현재 설정 적용, play() 시도
 * - 설정 변경: 자동으로 볼륨/속도/일시정지 적용
 * - speed=0: 즉시 pause, speed>0: resume
 * - unmount: pause + src 해제로 트랜지션 잔향 차단
 */
export function useSceneTrack(
  url: string | undefined | null,
  kind: TrackKind,
  opts?: { loop?: boolean; baseVolume?: number }
) {
  const ctx = useCtx();
  const loop = opts?.loop ?? true;
  const baseVolume = opts?.baseVolume ?? 1;

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.loop = loop;
    a.preload = "auto";
    a.crossOrigin = "anonymous";

    const apply = (s: SceneAudioState) => {
      const vol = resolveVolume(s, kind) * baseVolume;
      a.volume = Math.max(0, Math.min(1, vol));
      a.playbackRate = resolveRate(s);
      if (s.speed === 0) {
        if (!a.paused) a.pause();
      } else if (a.paused) {
        a.play().catch(() => { /* autoplay locked까지 대기 */ });
      }
    };

    apply(ctx.read());
    // 첫 play 시도가 autoplay 차단으로 실패해도, 첫 제스처 후 unlocked=true가
    // 통보되므로 다시 apply()가 호출되어 play()를 재시도한다.
    const unsub = ctx.subscribe(apply);

    return () => {
      unsub();
      try {
        a.pause();
        a.removeAttribute("src");
        a.load();
      } catch { /* noop */ }
    };
  }, [url, kind, loop, baseVolume, ctx]);
}

/**
 * BGM/SFX를 묶어서 등록하는 편의 훅.
 */
export function useSceneAudio(opts: {
  bgm?: string;
  sfx?: string;
  bgmVolume?: number;
  sfxVolume?: number;
}) {
  useSceneTrack(opts.bgm ?? null, "bgm", { baseVolume: opts.bgmVolume ?? 1 });
  useSceneTrack(opts.sfx ?? null, "sfx", { baseVolume: opts.sfxVolume ?? 1 });
}

/**
 * 씬의 재생/일시정지/2배속을 외부에서 받아 버스에 반영하기 위한 훅.
 * <Scene2Motion speed={...}/> 같은 기존 prop 시그니처를 유지하면서
 * 버스에도 동일한 값을 흘려보낼 때 사용한다.
 */
export function useSyncSpeedToBus(speed: SceneSpeed) {
  const ctx = useCtx();
  useEffect(() => {
    ctx.patch({ speed });
  }, [ctx, speed]);
}
