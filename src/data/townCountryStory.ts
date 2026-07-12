// 이 파일은 얇은 로더입니다.
// - 대사/자막/배경/BGM 지정: src/stories/town-country/script.json (사람 편집)
// - TTS 재생 타이밍/씬 길이: src/stories/town-country/timing.json (scripts/build-tts.py 산출)
// 자세한 authoring 가이드는 src/stories/README.md 참고.
import scriptJson from "@/stories/town-country/script.json";
import timingJson from "@/stories/town-country/timing.json";
import scene1Asset from "@/assets/town-country/scene1.jpg.asset.json";
import scene2Asset from "@/assets/town-country/scene2.jpg.asset.json";
import scene3Asset from "@/assets/town-country/scene3.jpg.asset.json";
import scene4Asset from "@/assets/town-country/scene4.jpg.asset.json";
import scene5Asset from "@/assets/town-country/scene5.jpg.asset.json";
import scene1BgmAsset from "@/assets/town-country/scene1_bgm.mp3.asset.json";
import scene2BgmAsset from "@/assets/town-country/scene2_bgm.mp3.asset.json";
import scene3BgmAsset from "@/assets/town-country/scene3_bgm.mp3.asset.json";
import scene4BgmAsset from "@/assets/town-country/scene4_bgm.mp3.asset.json";
import scene5BgmAsset from "@/assets/town-country/scene5_bgm.mp3.asset.json";

export type StoryCue = {
  from: number;
  to: number;
  note: string;
};

export type StorySpeaker =
  | "narration"
  | "country"
  | "city"
  | "post"
  // boy-wolf 스토리 화자들
  | "tom"
  | "tom_hurry"
  | "tom_sad"
  | "v_m1"
  | "v_m2"
  | "v_m3"
  | "v_w1"
  | "v_w2"
  | "villagers";

export type StoryBeat = {
  from: number;
  to: number;
  who: StorySpeaker;
  text: string;
};

export type StorySceneDefinition = {
  id: string;
  title: string;
  setting: string;
  url: string;
  durationSec: number;
  bgmUrl?: string;
  sfxUrl?: string;
  dialogueLines: string[];
  cues: StoryCue[];
  beats: StoryBeat[];
};

export type StoryProgram = {
  id: string;
  title: string;
  scenes: StorySceneDefinition[];
};

// 파일명 → 에셋 URL 조회 테이블. 새 씬 배경/BGM 을 추가하면 여기에 등록한다.
const ASSET_URLS: Record<string, string> = {
  "scene1.jpg": scene1Asset.url,
  "scene2.jpg": scene2Asset.url,
  "scene3.jpg": scene3Asset.url,
  "scene4.jpg": scene4Asset.url,
  "scene5.jpg": scene5Asset.url,
  "scene1_bgm.mp3": scene1BgmAsset.url,
  "scene2_bgm.mp3": scene2BgmAsset.url,
  "scene3_bgm.mp3": scene3BgmAsset.url,
  "scene4_bgm.mp3": scene4BgmAsset.url,
  "scene5_bgm.mp3": scene5BgmAsset.url,
};

type ScriptScene = {
  id: string;
  title: string;
  setting: string;
  background: string;
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
  if (!timing) throw new Error(`[townCountryStory] missing timing for ${s.id}`);
  return {
    id: s.id,
    title: s.title,
    setting: s.setting,
    url: ASSET_URLS[s.background] ?? "",
    durationSec: timing.durationSec,
    bgmUrl: s.bgm ? ASSET_URLS[s.bgm] : undefined,
    sfxUrl: s.sfx ? ASSET_URLS[s.sfx] : undefined,
    dialogueLines: [],
    cues: s.cues,
    beats: timing.beats,
  };
});

export const TOWN_COUNTRY_STORY: StoryProgram = {
  id: scriptJson.id,
  title: scriptJson.title,
  scenes,
};
