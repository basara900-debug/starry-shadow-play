// 얇은 로더 — src/stories/boy-wolf/{script,timing}.json 만 읽어 StoryProgram 형태로 만든다.
// 배경/BGM 에셋은 아직 미준비 상태 (사전 작업 단계). 씬 셸은 자막 + TTS 만 재생한다.
import scriptJson from "@/stories/boy-wolf/script.json";
import timingJson from "@/stories/boy-wolf/timing.json";
import bg1 from "@/assets/boy-wolf/bg_1.jpg.asset.json";
import bg2 from "@/assets/boy-wolf/bg_2.jpg.asset.json";
import bg3 from "@/assets/boy-wolf/bg_3.jpg.asset.json";
import bg4 from "@/assets/boy-wolf/bg_4.jpg.asset.json";
import type { StoryCue, StoryProgram, StorySceneDefinition, StorySpeaker } from "@/data/townCountryStory";

const ASSET_URLS: Record<string, string> = {
  "bg_1.jpg": bg1.url,
  "bg_2.jpg": bg2.url,
  "bg_3.jpg": bg3.url,
  "bg_4.jpg": bg4.url,
};

type ScriptScene = {
  id: string;
  title: string;
  setting: string;
  background?: string;
  bgm?: string;
  sfx?: string;
  cues: StoryCue[];
  dialogue: { who: StorySpeaker; text: string }[];
};
type TimingScene = {
  id: string;
  durationSec: number;
  beats: { from: number; to: number; who: StorySpeaker; text: string }[];
};

const timingById = new Map<string, TimingScene>(
  (timingJson.scenes as TimingScene[]).map((s) => [s.id, s]),
);

const scenes: StorySceneDefinition[] = (scriptJson.scenes as ScriptScene[]).map((s) => {
  const timing = timingById.get(s.id);
  if (!timing) throw new Error(`[boyWolfStory] missing timing for ${s.id}`);
  return {
    id: s.id,
    title: s.title,
    setting: s.setting,
    url: s.background ? (ASSET_URLS[s.background] ?? "") : "",
    durationSec: timing.durationSec,
    bgmUrl: undefined,
    sfxUrl: undefined,
    dialogueLines: [],
    cues: s.cues,
    beats: timing.beats,
  };
});

export const BOY_WOLF_STORY: StoryProgram = {
  id: scriptJson.id,
  title: scriptJson.title,
  scenes,
};