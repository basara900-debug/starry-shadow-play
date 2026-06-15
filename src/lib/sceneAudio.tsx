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
 * 핵심 원칙(부 결정성 차단):
 * - 트랙의 생성/소멸/재생/일시정지/볼륨/속도는 모두 버스가 소유한다.
 * - 씬 컴포넌트는 "지금 이 URL을 활성화하라" 라고 선언만 한다(refCount).
 * - 활성 URL은 항상 재생, 비활성 URL은 항상 일시정지 — 매 상태변화·등록·해지
 *   시점에 모든 트랙을 일괄 재조정(reconcile)한다.
 * - 씬 전환 시 cleanup → mount 순서로 인한 play()/pause() race(특히 React
 *   StrictMode의 더블 이펙트)에서도 오디오가 끊기지 않도록, refCount가 0이
 *   될 때만 일시정지하고, 새 마운트가 같은 URL을 다시 활성화하면 재생을
 *   유지한다.
 * - useSceneTrack은 React 렌더링과 무관하게 트랙을 다시 만들지 않는다(트랙은
 *   URL당 하나만 생성·재사용). 음원 첫 90초를 자르는 maxDurationSec 가드도
 *   버스가 일괄 관리한다.
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

type TrackEntry = {
  audio: HTMLAudioElement;
  kind: TrackKind;
  loop: boolean;
  baseVolume: number;
  maxDurationSec: number;
  refCount: number;
  raf: number | null;
};

type Ctx = {
  /** 현재 값을 동기적으로 읽기 위한 ref. 렌더링 외부에서 호출 안전. */
  read: () => SceneAudioState;
  /** 값 변경. 즉시 모든 트랙에 통보된다. */
  patch: (p: Partial<SceneAudioState>) => void;
  subscribe: (fn: Listener) => () => void;
  acquire: (
    url: string,
    kind: TrackKind,
    opts: { loop: boolean; baseVolume: number; maxDurationSec: number }
  ) => () => void;
  primeTracks: (urls: Array<string | undefined | null>) => void;
};

const SceneAudioContext = createContext<Ctx | null>(null);

function createTrack(url: string) {
  const a = new Audio(url);
  a.preload = "auto";
  a.crossOrigin = "anonymous";
  return a;
}

function unlockPausedTrack(a: HTMLAudioElement) {
  if (!a.paused) return;
  const muted = a.muted;
  const volume = a.volume;
  a.muted = true;
  a.volume = 0;
  a.play()
    .then(() => {
      a.pause();
      try { a.currentTime = 0; } catch { /* noop */ }
      a.muted = muted;
      a.volume = volume;
    })
    .catch(() => {
      a.muted = muted;
      a.volume = volume;
    });
}

export function SceneAudioProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef<SceneAudioState>({ ...DEFAULT_STATE });
  const listenersRef = useRef<Set<Listener>>(new Set());
  const tracksRef = useRef<Map<string, TrackEntry>>(new Map());

  // 트랙 하나에 현재 상태를 적용한다. 활성(refCount>0)인지에 따라 재생/일시정지를
  // 결정한다. play() 호출이 중첩되어도 안전하도록 Promise를 swallow한다.
  const reconcileTrack = useCallback((entry: TrackEntry) => {
    const s = stateRef.current;
    const a = entry.audio;
    a.loop = entry.loop;
    a.volume = Math.max(0, Math.min(1, resolveVolume(s, entry.kind) * entry.baseVolume));
    a.playbackRate = resolveRate(s);
    const shouldPlay = entry.refCount > 0 && s.speed !== 0;
    if (shouldPlay) {
      if (a.paused) {
        const p = a.play();
        if (p && typeof p.catch === "function") p.catch(() => { /* autoplay 잠금 대기 */ });
      }
    } else {
      if (!a.paused) {
        try { a.pause(); } catch { /* noop */ }
      }
    }
  }, []);

  const reconcileAll = useCallback(() => {
    for (const entry of tracksRef.current.values()) reconcileTrack(entry);
  }, [reconcileTrack]);

  const startMonitor = useCallback((entry: TrackEntry) => {
    if (entry.raf != null) return;
    const tick = () => {
      const a = entry.audio;
      if (entry.maxDurationSec > 0 && a.currentTime >= entry.maxDurationSec) {
        if (entry.loop) {
          try { a.currentTime = 0; } catch { /* noop */ }
        } else {
          try { a.pause(); } catch { /* noop */ }
        }
      }
      entry.raf = requestAnimationFrame(tick);
    };
    entry.raf = requestAnimationFrame(tick);
  }, []);

  const stopMonitor = useCallback((entry: TrackEntry) => {
    if (entry.raf != null) {
      cancelAnimationFrame(entry.raf);
      entry.raf = null;
    }
  }, []);

  const ensureEntry = useCallback(
    (
      url: string,
      kind: TrackKind,
      opts: { loop: boolean; baseVolume: number; maxDurationSec: number }
    ): TrackEntry => {
      let entry = tracksRef.current.get(url);
      if (!entry) {
        entry = {
          audio: createTrack(url),
          kind,
          loop: opts.loop,
          baseVolume: opts.baseVolume,
          maxDurationSec: opts.maxDurationSec,
          refCount: 0,
          raf: null,
        };
        tracksRef.current.set(url, entry);
      } else {
        // 마지막 등록자의 옵션을 따라간다.
        entry.kind = kind;
        entry.loop = opts.loop;
        entry.baseVolume = opts.baseVolume;
        entry.maxDurationSec = opts.maxDurationSec;
      }
      return entry;
    },
    []
  );

  const acquire = useCallback(
    (
      url: string,
      kind: TrackKind,
      opts: { loop: boolean; baseVolume: number; maxDurationSec: number }
    ) => {
      const entry = ensureEntry(url, kind, opts);
      entry.refCount += 1;
      // 처음 활성화될 때만 처음으로 되감는다. 이미 재생 중인 트랙(동일 URL을
      // 사용하는 다른 씬)이면 끊지 않고 그대로 이어 재생한다.
      if (entry.refCount === 1) {
        try { entry.audio.currentTime = 0; } catch { /* noop */ }
        startMonitor(entry);
      }
      reconcileTrack(entry);
      return () => {
        entry.refCount = Math.max(0, entry.refCount - 1);
        if (entry.refCount === 0) {
          stopMonitor(entry);
          try {
            entry.audio.pause();
            entry.audio.currentTime = 0;
          } catch { /* noop */ }
        }
      };
    },
    [ensureEntry, reconcileTrack, startMonitor, stopMonitor]
  );

  const primeTracks = useCallback(
    (urls: Array<string | undefined | null>) => {
      for (const url of urls) {
        if (!url) continue;
        const entry = ensureEntry(url, "bgm", {
          loop: true,
          baseVolume: 1,
          maxDurationSec: 90,
        });
        if (stateRef.current.unlocked) unlockPausedTrack(entry.audio);
      }
    },
    [ensureEntry]
  );

  const ctx = useMemo<Ctx>(
    () => ({
      read: () => stateRef.current,
      patch: (p) => {
        stateRef.current = { ...stateRef.current, ...p };
        for (const fn of listenersRef.current) fn(stateRef.current);
        reconcileAll();
      },
      subscribe: (fn) => {
        listenersRef.current.add(fn);
        return () => {
          listenersRef.current.delete(fn);
        };
      },
      acquire,
      primeTracks,
    }),
    [acquire, primeTracks, reconcileAll]
  );

  // 첫 사용자 제스처에서 unlocked=true. 이후 트랙이 새로 mount되어도
  // 즉시 play()를 시도할 수 있다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onGesture = () => {
      ctx.patch({ unlocked: true });
      for (const entry of tracksRef.current.values()) unlockPausedTrack(entry.audio);
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
 * 씬에서 사용. URL 하나당 한 번만 호출하면 된다. 트랙 자체는 버스가 소유하므로
 * 동일 URL을 여러 곳에서 acquire해도 재생이 끊기지 않고 refCount만 증가한다.
 */
export function useSceneTrack(
  url: string | undefined | null,
  kind: TrackKind,
  opts?: { loop?: boolean; baseVolume?: number; maxDurationSec?: number }
) {
  const ctx = useCtx();
  const loop = opts?.loop ?? true;
  const baseVolume = opts?.baseVolume ?? 1;
  const maxDurationSec = opts?.maxDurationSec ?? 90;

  useEffect(() => {
    if (!url) return;
    const release = ctx.acquire(url, kind, { loop, baseVolume, maxDurationSec });
    return release;
  }, [url, kind, loop, baseVolume, maxDurationSec, ctx]);
}

export function usePrimeSceneAudio(urls: Array<string | undefined | null>) {
  const ctx = useCtx();
  useEffect(() => {
    ctx.primeTracks(urls);
  }, [ctx, urls]);
}

/**
 * BGM/SFX를 묶어서 등록하는 편의 훅.
 */
export function useSceneAudio(opts: {
  bgm?: string;
  sfx?: string;
  bgmVolume?: number;
  sfxVolume?: number;
  maxDurationSec?: number;
}) {
  const maxDurationSec = opts.maxDurationSec ?? 90;
  useSceneTrack(opts.bgm ?? null, "bgm", { baseVolume: opts.bgmVolume ?? 1, maxDurationSec });
  useSceneTrack(opts.sfx ?? null, "sfx", { baseVolume: opts.sfxVolume ?? 1, maxDurationSec });
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
