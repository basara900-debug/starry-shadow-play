# 동화(스토리 프로그램) 만드는 순서

새 그림자 연극 카세트를 만들 때는 아래 순서를 따르세요. 사전 작업(1–3)은
반복적이고 자동화되어 있고, 씬 연출(4–7)이 개발자의 재량 영역입니다.

## 폴더 규칙

```
src/stories/<story-id>/
  script.json     ← 사람 편집 (씬·화자·대사·배경·BGM)
  timing.json     ← scripts/build-tts.py 산출 (직접 수정 금지)
public/audio/<story-id>/scene<N>/tts/
  00_<who>.mp3    ← scripts/build-tts.py 산출
  01_<who>.mp3
  ...
src/assets/<story-id>/
  scene1.jpg.asset.json, scene1_bgm.mp3.asset.json, 캐릭터 시트 등
```

## 사전 작업

### 1. 스토리보드 (`script.json`) 작성

씬 순서대로 `dialogue` 배열에 화자와 대사만 입력합니다. **시간은 안 씁니다.**
`voices` 에서 화자별 목소리를 지정합니다.

```json
{
  "id": "my-story",
  "title": "제목",
  "voices": {
    "narration": { "voice": "shimmer", "instructions": "따뜻하고 지적인 톤" },
    "hero":      { "voice": "onyx",    "instructions": "쾌활한 소년 톤" }
  },
  "gapSec": 0.5,
  "scenes": [
    {
      "id": "my-story-1",
      "title": "씬 1",
      "setting": "숲",
      "background": "scene1.jpg",
      "bgm": "scene1_bgm.mp3",
      "cues": [],
      "dialogue": [
        { "who": "narration", "text": "옛날 옛적에..." },
        { "who": "hero",      "text": "안녕!" }
      ]
    }
  ]
}
```

### 2. TTS + 타이밍 산출

```bash
python3 scripts/build-tts.py my-story
```

- 각 대사를 Lovable AI TTS 로 합성해 `public/audio/<id>/scene<N>/tts/` 에 저장.
- `ffprobe` 로 실제 길이 측정 → **대사 사이 0.5초 gap** 을 넣은 `timing.json` 생성.
- 이미 생성된 mp3 는 건너뜁니다. 전체 재생성은 `--force`.

### 3. 씬 길이 확인

`timing.json` 에 산출된 `durationSec` = 마지막 대사 종료 + 0.5초. 앱을 켜면
상단 재생 툴바에 이 값이 그대로 표시되므로 별도 조정 불필요.

### 4. 배경·BGM 에셋 등록

`lovable-assets create --file <경로> > src/assets/<story-id>/<파일>.asset.json`
로 CDN 에 올린 뒤, 로더(`src/data/<story>Story.ts` 의 `ASSET_URLS` 테이블)
에 파일명을 등록. `script.json` 에는 파일명만 씁니다.

## 씬 연출 (개발자 재량)

### 5. 캐릭터 시트 배치 & 모션

캐릭터 시트 asset 을 import 해서 `StorySceneMotion.tsx`(현행) 또는 스토리별
`scene<N>.motion.tsx` 신규 파일에서 시간 조건부 JSX 로 렌더합니다.

모션 시간 구간은 `SCENE_MOTIONS` 카탈로그에도 함께 등록하세요.
`DevMotionToolbar` 가 자동으로 트랙을 그리고 **겹침/공백**을 시각 경고로
표시해 줍니다 — 씬을 처음부터 재생하며 눈으로 찾지 않아도 됩니다.

### 6. SFX 삽입

씬 모션 파일 안에서 특정 시간대에 `<audio>` 재생 또는 `useSceneAudio` 로
삽입합니다.

### 7. BGM

`script.json` 의 `bgm` 필드만 채우면 씬 셸이 씬 재생 동안 자동 루프합니다.

## 카세트 등록

`src/data/cassettes.ts` 에 새 항목을 추가하면 메인 화면 리스트에 노출됩니다.

## 대사 한 줄 수정할 때

1. `script.json` 대사 편집
2. `python3 scripts/build-tts.py <id> --force` (또는 해당 mp3 만 지우고 재실행)
3. 앱 새로고침 — mp3·자막 시간·씬 길이가 모두 자동으로 재조정됩니다.

## 주의: `town-country` 는 레거시 타이밍 유지

`town-country` 는 스크립트 도입 전에 손으로 조립된 스토리라, `timing.json`
에는 기존 mp3 와 캐릭터 모션 시간에 맞춰진 타이밍이 그대로 보존되어 있습니다.
새 대사를 추가하거나 처음부터 다시 조립할 게 아니라면 `build-tts.py` 를 이
스토리에 재실행하지 마세요 (모션 시간과 어긋납니다).