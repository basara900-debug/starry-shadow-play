import scene1Asset from "@/assets/town-country/scene1.png.asset.json";
import scene2Asset from "@/assets/town-country/scene2.png.asset.json";
import scene3Asset from "@/assets/town-country/scene3.png.asset.json";
import scene4Asset from "@/assets/town-country/scene4.png.asset.json";
import scene5Asset from "@/assets/town-country/scene5.png.asset.json";

export type StoryCue = {
  from: number;
  to: number;
  note: string;
};

export type StorySpeaker = "narration" | "country" | "city" | "post" | "grasshopper";

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

export const TOWN_COUNTRY_STORY: StoryProgram = {
  id: "town-country",
  title: "시골쥐와 서울쥐",
  scenes: [
    {
      id: "town-country-1",
      title: "씬 1",
      setting: "시골 풍경",
      url: scene1Asset.url,
      durationSec: 90,
      dialogueLines: [],
      cues: [
        { from: 0, to: 18, note: "시골쥐가 들판과 초가집 사이를 천천히 오가며 하루의 평온함을 보여준다." },
        { from: 18, to: 42, note: "시골 생활의 검소함과 자연의 소리를 강조하며 서울쥐의 방문 전 분위기를 깐다." },
        { from: 42, to: 68, note: "서울쥐가 도착해 주변을 둘러보며 낯선 시골 풍경에 반응할 타이밍을 남긴다." },
        { from: 68, to: 90, note: "두 쥐가 함께 대화하며 다음 장면인 서울집 초대의 동기를 만든다." },
      ],
    },
    {
      id: "town-country-2",
      title: "씬 2",
      setting: "서울쥐 집안",
      url: scene2Asset.url,
      durationSec: 90,
      dialogueLines: [],
      cues: [
        { from: 0, to: 20, note: "서울쥐가 화려한 거실을 자신 있게 소개하고 시골쥐가 넓은 실내를 둘러본다." },
        { from: 20, to: 48, note: "벽난로, 샹들리에, 가구 실루엣을 활용해 서울 생활의 풍족함을 느끼게 한다." },
        { from: 48, to: 72, note: "시골쥐가 편안함과 낯섦을 동시에 느끼는 반응 연기를 넣기 좋은 구간이다." },
        { from: 72, to: 90, note: "식당으로 이동하기 전 기대감을 올리는 연결 장면으로 마무리한다." },
      ],
    },
    {
      id: "town-country-3",
      title: "씬 3",
      setting: "식당",
      url: scene3Asset.url,
      durationSec: 90,
      dialogueLines: [],
      cues: [
        { from: 0, to: 24, note: "풍성한 음식 실루엣을 배경으로 서울쥐가 만찬을 자랑하는 흐름을 잡는다." },
        { from: 24, to: 52, note: "시골쥐가 화려한 식탁에 감탄하거나 조심스럽게 음식을 맛보는 대사 구간으로 비워 둔다." },
        { from: 52, to: 72, note: "긴장감을 만들 전조로, 외부 인기척이나 갑작스러운 정적이 들어갈 수 있다." },
        { from: 72, to: 90, note: "위협의 기운이 다가오며 복도로 달아날 이유를 강하게 만든다." },
      ],
    },
    {
      id: "town-country-4",
      title: "씬 4",
      setting: "복도",
      url: scene4Asset.url,
      durationSec: 90,
      dialogueLines: [],
      cues: [
        { from: 0, to: 18, note: "문이 줄지어 선 복도에서 도망치는 동선과 긴박한 리듬을 설계한다." },
        { from: 18, to: 48, note: "문틈, 시계, 발소리 같은 공포 요소를 살릴 수 있도록 SFX 슬롯을 비워 둔다." },
        { from: 48, to: 70, note: "서울 생활의 불안함을 시골쥐가 체감하며 가치관이 바뀌는 전환점으로 쓴다." },
        { from: 70, to: 90, note: "시골쥐가 고향으로 돌아가겠다는 결심을 굳히는 흐름으로 장면을 닫는다." },
      ],
    },
    {
      id: "town-country-5",
      title: "씬 5",
      setting: "시골쥐 집안",
      url: scene5Asset.url,
      durationSec: 90,
      dialogueLines: [],
      cues: [
        { from: 0, to: 22, note: "시골쥐가 다시 자신의 집으로 돌아와 안도하는 정서를 천천히 보여준다." },
        { from: 22, to: 52, note: "도시의 풍요보다 마음 편한 삶이 더 소중하다는 결론 대사를 담기 좋은 구간이다." },
        { from: 52, to: 76, note: "서울쥐가 남아 있거나 작별을 고하는 경우에도 대응할 수 있도록 여백을 남긴다." },
        { from: 76, to: 90, note: "교훈 또는 엔딩 내레이션을 넣고 5막 종료 후 메인 타이틀로 복귀한다." },
      ],
    },
  ],
};