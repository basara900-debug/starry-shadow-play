import scene1Asset from "@/assets/town-country/scene1.png.asset.json";
import scene2Asset from "@/assets/town-country/scene2.png.asset.json";
import scene3Asset from "@/assets/town-country/scene3.png.asset.json";
import scene4Asset from "@/assets/town-country/scene4.png.asset.json";
import scene5Asset from "@/assets/town-country/scene5.png.asset.json";
import scene1BgmAsset from "@/assets/town-country/scene1_bgm.mp3.asset.json";
import scene2BgmAsset from "@/assets/town-country/scene2_bgm.mp3.asset.json";
import scene3BgmAsset from "@/assets/town-country/scene3_bgm.mp3.asset.json";
import scene4BgmAsset from "@/assets/town-country/scene4_bgm.mp3.asset.json";

export type StoryCue = {
  from: number;
  to: number;
  note: string;
};

export type StorySpeaker = "narration" | "country" | "city" | "post";

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
      bgmUrl: scene1BgmAsset.url,
      dialogueLines: [],
      cues: [
        { from: 0, to: 18, note: "시골쥐가 들판과 초가집 사이를 천천히 오가며 하루의 평온함을 보여준다." },
        { from: 18, to: 42, note: "시골 생활의 검소함과 자연의 소리를 강조하며 서울쥐의 방문 전 분위기를 깐다." },
        { from: 42, to: 68, note: "서울쥐가 도착해 주변을 둘러보며 낯선 시골 풍경에 반응할 타이밍을 남긴다." },
        { from: 68, to: 90, note: "두 쥐가 함께 대화하며 다음 장면인 서울집 초대의 동기를 만든다." },
      ],
      beats: [
        { from: 0,  to: 6,  who: "narration", text: "가을이 끝나가는 무렵, 수확을 끝마친 시골쥐가 들판에 서 있었습니다." },
        { from: 6,  to: 12, who: "country",   text: "올해도 무사히 수확을 끝마쳤네, 이제 겨울이 와도 걱정이 없겠어" },
        { from: 12, to: 18, who: "narration", text: "수확이 끝난 넓은 밭과 논을 보며 시골쥐는 기분 좋은 미소를 지었습니다." },
        { from: 18, to: 24, who: "country",   text: "그나저나 올 봄에 도시로 간 서울쥐는 어떻게 살고 있을까?" },
        { from: 24, to: 32, who: "country",   text: "별 탈 없이 잘 지내야 할텐데!" },
        { from: 32, to: 38, who: "narration", text: "그때 저 멀리서 우편 배달부 쥐가 시골쥐가 있는 곳으로 오고 있었습니다." },
        { from: 38, to: 44, who: "post",      text: "안녕하십니까? 시골쥐 양반 오랜 만에 뵙는 군요!" },
        { from: 44, to: 52, who: "country",   text: "아~ ! 안녕하세요? 고생이 많으시네요! 어쩐일이세요 " },
        { from: 52, to: 58, who: "post",      text: "글쎄 서울쥐가 편지를 보냈네요! 여기 있습니다. " },
        { from: 58, to: 64, who: "country",   text: "감사합니다 서울쥐가 편지를 보냈군요! 잘 받았습니다" },
        { from: 64, to: 70, who: "post",      text: "네! 그럼 저는 다음 마을로 가봐야 하니 잘 지내시길 빕니다. 그럼 이만." },
        { from: 70, to: 76, who: "narration", text: "우편 배달쥐가 떠나고 시골쥐는 서울쥐가 보낸 편지를 읽고 미소를 지었습니다." },
        { from: 76, to: 82, who: "country",   text: "서울쥐가 나를 초대 했군! 멋진 대접을 해준다고 했으니 빨리 서울쥐에게 가봐야 겠어!" },
        { from: 82, to: 90, who: "narration", text: "서울쥐의 초대에 시골쥐는 잔뜩 기대하며 짐을 챙겨 도시로 떠났습니다." },
      ],
    },
    {
      id: "town-country-2",
      title: "씬 2",
      setting: "서울쥐 집안",
      url: scene2Asset.url,
      durationSec: 90,
      bgmUrl: scene2BgmAsset.url,
      dialogueLines: [],
      cues: [
        { from: 0, to: 20, note: "서울쥐가 화려한 거실을 자신 있게 소개하고 시골쥐가 넓은 실내를 둘러본다." },
        { from: 20, to: 48, note: "벽난로, 샹들리에, 가구 실루엣을 활용해 서울 생활의 풍족함을 느끼게 한다." },
        { from: 48, to: 72, note: "시골쥐가 편안함과 낯섦을 동시에 느끼는 반응 연기를 넣기 좋은 구간이다." },
        { from: 72, to: 90, note: "식당으로 이동하기 전 기대감을 올리는 연결 장면으로 마무리한다." },
      ],
      beats: [
        { from: 0,  to: 6,  who: "narration", text: "도시에 도착한 시골쥐는 어렵사리 서울쥐가 살고 있는 집에 도착하게 되었습니다." },
        { from: 6,  to: 12, who: "city",      text: "어서와 시골쥐야! 오는 길이 힘들지 않았어?" },
        { from: 12, to: 18, who: "country",   text: "반가워 서울쥐야! 도시는 너무 복잡하고 어렵네, 하지만 네가 편지에 써 준대로 왔더니 잘 도착할 수 있었어." },
        { from: 18, to: 24, who: "city",      text: "다행이다, 먼길 오느라 힘들고 배고팠을텐데 곧 맛있는 밥을 먹으러 갈테니 잠시만 기다려줘!" },
        { from: 24, to: 32, who: "country",   text: "그래, 알았어! 하지만 지금은 식사 시간이 아닌거야?" },
        { from: 32, to: 38, who: "narration", text: "시간은 어느덧 저녁 무렵이였고, 도시 곳곳에서는 맛있는 음식 냄세가 여기저기서 나고 있었습니다" },
        { from: 38, to: 44, who: "city",      text: "응, 지금이 저녁식사 시간은 맞지! 하지만 맛있는 음식을 먹으려면 조금 기다림이 필요해!" },
        { from: 44, to: 52, who: "country",   text: "그래 얼마나 맛있는 음식이 있을지 궁금해지네!" },
        { from: 52, to: 58, who: "narration", text: "자신만만한 서울쥐와 기대에 찬 시골쥐가 서로를 바라보며 저녁식사를 기다렸습니다." },
        { from: 58, to: 64, who: "city",      text: "기대하라구 시골에서는 절대 맛보지 못했던 온갖 음식들을 먹어보게 될꺼야!" },
        { from: 64, to: 70, who: "country",   text: "그래 알았어, 서울쥐! 네 덕에 호강 한번 해 보자구!" },
        { from: 70, to: 76, who: "narration", text: "기다림의 시간이 더 지나고 난 뒤, 서울쥐는 밖에 나갔다가 한 참 뒤에 돌아왔습니다." },
        { from: 76, to: 82, who: "city",      text: "이제 음식이 준비되었어, 같이 나가자!" },
        { from: 82, to: 90, who: "narration", text: "서울쥐는 시골쥐를 데리고 밖으로 나갔습니다." },
      ],
    },
    {
      id: "town-country-3",
      title: "씬 3",
      setting: "식당",
      url: scene3Asset.url,
      durationSec: 90,
      bgmUrl: scene3BgmAsset.url,
      dialogueLines: [],
      cues: [
        { from: 0, to: 24, note: "풍성한 음식 실루엣을 배경으로 서울쥐가 만찬을 자랑하는 흐름을 잡는다." },
        { from: 24, to: 52, note: "시골쥐가 화려한 식탁에 감탄하거나 조심스럽게 음식을 맛보는 대사 구간으로 비워 둔다." },
        { from: 52, to: 72, note: "긴장감을 만들 전조로, 외부 인기척이나 갑작스러운 정적이 들어갈 수 있다." },
        { from: 72, to: 90, note: "위협의 기운이 다가오며 복도로 달아날 이유를 강하게 만든다." },
      ],
      beats: [
        { from: 0,  to: 6,  who: "narration",   text: "서울쥐가 시골쥐를 데리고 온 곳은 불이 꺼져 어두워진 식당이였습니다." },
        { from: 6,  to: 12, who: "country",     text: "너무 어두워서 잘 보이지가 않네, 여기 맛있는 음식이 있는게 맞니?" },
        { from: 12, to: 18, who: "city",        text: "물론이지, 맛있는 냄세가 느껴지지 않니? " },
        { from: 18, to: 24, who: "country",     text: " 응 냄세는 너무 좋아 어디에서 먹으면 될까?" },
        { from: 24, to: 32, who: "city",        text: "이리와봐 여기 이것 좀 먹어봐, 어때 맛있지? " },
        { from: 32, to: 38, who: "narration",   text: "서울쥐는 연신 시골쥐에게 음식을 권했고 시골쥐는 처음 먹어본 맛있는 음식에 행복했습니다." },
        { from: 38, to: 44, who: "country",     text: "이야 정말 맛있다. 서울쥐 네 덕에 너무 행복해, 네가 너무 자랑스럽고 부럽다!" },
        { from: 44, to: 52, who: "city",        text: "에헴! 그럼, 이제 이 형님의 위대함을 알게 되었군." },
        { from: 52, to: 58, who: "narration",   text: " 둘은 서로 친밀하게 대화를 하며 맛있는 음식을 마음껏 배부르게 먹고 있었습니다." },
        { from: 58, to: 64, who: "narration",   text: "갑자기 덜컥 문이 열리며 식당이 환해 졌고 서울쥐와 시골쥐는 순간 공포에 얼어 버렸습니다." },
        { from: 64, to: 70, who: "narration",   text: "문을 열고 사람이 들어오자, 서울쥐는 바로 시골쥐의 손을 잡고 복도로 도망치기 시작했습니다." },
        { from: 70, to: 76, who: "city",        text: "야! 뛰어! 잡히면 큰일난다." },
        { from: 76, to: 82, who: "country",     text: "어! 서울쥐야, 서울쥐야 대체 왜 이래!" },
        { from: 82, to: 90, who: "narration",   text: "사람의 비명 소리가 천둥처럼 울려퍼지고 우당탕탕하는 소란스러움에 시골쥐는 당황했어요." },
      ],
    },
    {
      id: "town-country-4",
      title: "씬 4",
      setting: "복도",
      url: scene4Asset.url,
      durationSec: 90,
      bgmUrl: scene4BgmAsset.url,
      dialogueLines: [],
      cues: [
        { from: 0, to: 18, note: "문이 줄지어 선 복도에서 도망치는 동선과 긴박한 리듬을 설계한다." },
        { from: 18, to: 48, note: "문틈, 시계, 발소리 같은 공포 요소를 살릴 수 있도록 SFX 슬롯을 비워 둔다." },
        { from: 48, to: 70, note: "서울 생활의 불안함을 시골쥐가 체감하며 가치관이 바뀌는 전환점으로 쓴다." },
        { from: 70, to: 90, note: "시골쥐가 고향으로 돌아가겠다는 결심을 굳히는 흐름으로 장면을 닫는다." },
      ],
      beats: [
        { from: 0,  to: 6,  who: "narration", text: "식당에서 복도로 무사하 도망친 서울쥐와 시골쥐는 기둥 뒤로 숨었어요." },
        { from: 6,  to: 12, who: "country",   text: " 서울쥐야 이게 무슨일이야? 왜 도망치는 거야?" },
        { from: 12, to: 18, who: "city",      text: "젠장, 방심했어! 이미 식사가 끝났다고 생각했는데, 다시 올 줄은 몰랐네." },
        { from: 18, to: 24, who: "country",   text: "아니 그 맛있는 밥이 서울쥐 네가 준비한게 아니라 사람의 음식이였던 거야!" },
        { from: 24, to: 30, who: "city",      text: "당연하지 도시에서 나오는 모든것은 사람의 것을 훔쳐야만 얻을 수 있어!" },
        { from: 30, to: 36, who: "narration", text: "그때 복도 저 멀리서 야옹하는 소리가 들려 왔습니다." },
        { from: 36, to: 42, who: "city",      text: "고양이다, 빨리 도망치자, 나를 따라 이리 와!" },
        { from: 42, to: 48, who: "narration", text: "고양이의 울음소리를 듣고 공포에 빠져 꼼짝도 못하던 시골쥐를 서울쥐가 강제로 끌고 도망쳤어요." },
        { from: 48, to: 54, who: "city",      text: "정신차려 시골쥐야, 넋이 나간채로 있으면 목숨을 부지하지 못해!" },
        { from: 54, to: 60, who: "narration", text: "서울쥐의 번개같은 대처에 둘은 무사히 안전하게 도망칠 수 있었습니다." },
        { from: 60, to: 66, who: "country",   text: "도시는 정말 무서운 곳이구나! 나는 도저히 여기서 지낼 수가 없을 것 같아." },
        { from: 66, to: 72, who: "city",      text: "무슨말이야! 도시처럼 살기좋은 곳이 어디 있다고 나만 정신 바짝 차리면 얼마든지 풍족하게 살 수 있다구." },
        { from: 72, to: 78, who: "country",   text: "아니야! 이렇게 무섭고 위험한 곳인 줄 알았다면 여기에 오지 않았을거야, 이만 난 시골로 돌아갈께 잘 있어!" },
        { from: 78, to: 84, who: "city",      text: "그럼 어쩔 수 없지, 더 좋고 재미있는게 많지만, 잘 가, 시골쥐야!" },
        { from: 84, to: 90, who: "narration", text: "시골쥐는 서울쥐를 뒤로 하고 아무 걱정 없고 안전한 시골집으로 돌아 갔습니다!" },
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
      beats: [
        { from: 0,  to: 6,  who: "narration", text: "어린이 여러분 이야기는 재미 있었나요?" },
        { from: 12, to: 18, who: "narration", text: "그럼 우리! 생각을 크게 하는 연습을 해 볼까요?" },
        { from: 24, to: 30, who: "narration", text: "여러분은 이 이야기를 보고 어떤 생각을 하게 되었나요?" },
        { from: 36, to: 42, who: "narration", text: "서울쥐의 도시 생활은 어떤가요? 서울쥐의 생활 방식은 정말 잘못된일까요?" },
        { from: 48, to: 54, who: "narration", text: "서울쥐는 무엇을 잘 하고 무엇을 못한걸까요?" },
        { from: 60, to: 66, who: "narration", text: "시골쥐의 시골 생활은 어떨까요? 시골쥐에게 중요한 건 어떤 생활인 것 같을까요?" },
        { from: 72, to: 78, who: "narration", text: "둘의 삶의 방식을 보고 진정 중요한 것이 무엇일까요? 고민해 보아요!" },
        { from: 84, to: 90, who: "narration", text: "엄마,아빠랑 한번 이야기를 나눠 보세요! 생각이 커질 거예요!" },
      ],
    },
  ],
};