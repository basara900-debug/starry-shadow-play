## 목표
ElevenLabs 커넥션을 프로젝트에 링크해 `ELEVENLABS_API_KEY`를 서버 런타임에 주입하고, 「양치기 소년」 스크립트에 **캐릭터별 보이스 프로파일 + 씬 mood + 대사별 emotion**을 완성해 “생성 실행” 한 번이면 12씬 전체 TTS가 새로 만들어지는 상태로 준비한다. 재생·타이밍 파이프라인은 무변경.

## 1. 커넥터 링크
- `standard_connectors--connect(connector_id: "elevenlabs")` 호출 → 프로젝트에 링크 → `ELEVENLABS_API_KEY` 주입.
- `secrets--fetch_secrets` 로 확인.

## 2. `scripts/build-tts.py` 재작성 (ElevenLabs 엔진 추가)
- `script.engine` 값을 읽어 `elevenlabs` / `lovable`(기존) 분기.
- ElevenLabs 경로:
  - `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128`
  - 헤더: `xi-api-key: $ELEVENLABS_API_KEY`
  - 바디: `{ text, model_id, voice_settings, previous_text, next_text }`
  - **Request Stitching**: 같은 씬 내 직전·직후 대사를 `previous_text` / `next_text`로 전달 → 짧은 대사에서 튀는 프로소디 완화.
  - `voice_settings` 병합 순서: `voices[who].settings` ← `emotions[scene.mood]` ← `emotions[line.emotion]`.
  - 재시도 백오프(429/5xx, 3회) 포함.
- 파일 경로·이름·`timing.json` 산출·gap 로직은 그대로 유지 → 앱 코드 무변경.
- 텍스트+최종 voice_settings + voiceId 해시를 `<mp3>.hash`에 저장 → `--force` 없이 실행 시 변경분만 재생성.

## 3. 「양치기 소년」 스크립트 재구성 (`src/stories/boy-wolf/script.json`)

### 3-1. 파생 화자 정리
- 기존 `tom_hurry` / `tom_sad` 는 **`who: "tom" + emotion`** 으로 변환. `voices`에는 `tom` 하나만.

### 3-2. 캐릭터 → ElevenLabs 보이스 매핑 (기본 프리셋, 커스텀 요청 없으면 이대로 진행)

| 화자 | 설명 (원안) | Voice | Voice ID | 베이스 settings |
|---|---|---|---|---|
| narration | 80대 여성, 따뜻·지적 | Matilda | `XrExE9yKIg1WjnnlVkGX` | stability .65 / sim .8 / style .3 / speed .95 |
| tom | 10대 남자, 짓궂고 쾌활 | Callum | `N2lVS1w4EtoT3dr4eOWO` | stability .4 / sim .75 / style .55 / speed 1.0 |
| v_m1 | 30대 남자, 밝고 따뜻 | Liam | `TX3LPaxmHKxFdv7VOQHJ` | stability .5 / sim .8 / style .4 / speed 1.0 |
| v_m2 | 40대 남자, 친절·따뜻 | George | `JBFqnCBsd6RMkjVDRZzb` | stability .6 / sim .8 / style .3 / speed .97 |
| v_m3 | 20대 남자, 성격 급하고 거침 | Will | `bIHbv24MWmeRgasZH58o` | stability .3 / sim .75 / style .7 / speed 1.05 |
| v_w1 | 20대 여자, 쾌활·따뜻 | Jessica | `cgSgspJ2msm6clMCkdW9` | stability .45 / sim .8 / style .55 / speed 1.0 |
| v_w2 | 40대 여자, 침착·친절 | Sarah | `EXAVITQu4vr4xnSDxMaL` | stability .65 / sim .8 / style .3 / speed .97 |
| villagers | 여러 마을 사람의 외침 | Bill | `pqHfZKP75CvOlQylNhV4` | stability .3 / sim .7 / style .75 / speed 1.05 |

모델: `eleven_multilingual_v2` (한국어 자연스러움 우선).

### 3-3. 감정 프리셋

```
hurry   : stability .2  / style .8  / speed 1.1
sad     : stability .75 / style .25 / speed .9
excited : stability .25 / style .8  / speed 1.05
angry   : stability .2  / style .85 / speed 1.05
warm    : stability .7  / style .3  / speed .97
calm    : stability .8  / style .2  / speed .95
mischief: stability .3  / style .7  / speed 1.02
regret  : stability .8  / style .2  / speed .88
```

### 3-4. 씬별 mood + 라인 emotion 태깅
- 씬1 mood=`calm` — 톰 대사에 `mischief` (음흉한 웃음 이후).
- 씬2 mood=`excited` — v_m3 마지막 재촉 라인에 `hurry`.
- 씬3 mood=`calm` — 톰 변명 라인에 `mischief`.
- 씬4 mood=`calm` — 두 번째 외침(늑대 나타났다)에 `hurry`.
- 씬5 mood=`excited` — v_m3 `angry`.
- 씬6 mood=`excited` — 톰 웃음 라인 `mischief`, v_m1 꾸중 라인 `angry`.
- 씬7 mood=`angry` — v_w1/v_w2 라인은 `warm`으로 대비.
- 씬8 mood=`hurry` — 두 tom 라인 이미 `hurry`.
- 씬9 mood=`excited`.
- 씬10 mood=`hurry` — 톰의 `내가 지루함을…` 라인 `regret`, v_m3 `angry`.
- 씬11 mood=`sad` — 톰 세 라인 `regret`, v_w2 `warm`.
- 씬12 mood=`warm` (에필로그, 질문 톤).

## 4. 앱 코드 소폭 수정
- `src/components/StorySceneMotion.tsx`: `who` 파생 화자(`tom_hurry`, `tom_sad`) 참조가 있는 경우 자막 표시명 매핑 유지하되 내부적으로 `tom`으로 정규화.
- `src/lib/sceneTts.ts`: 변경 없음 (같은 파일명 그대로 재생).

## 5. 실행 준비
- 여기까지 마치면 사용자가 “생성” 명령을 내렸을 때 다음 한 줄로 시작 가능:
  - `python3 scripts/build-tts.py boy-wolf --force`
- 결과: `public/audio/boy-wolf/**/*.mp3` 전량 재생성, `src/stories/boy-wolf/timing.json` 자동 갱신, 상단 툴바 씬 길이 자동 반영.
- 완료 시 사용자에게 “생성 실행 준비 완료” 로 알림.

## 확인 필요
- 위 8개 캐릭터의 Voice ID 프리셋을 그대로 쓸지, 특정 캐릭터에 원하는 Voice ID를 지정할지.
- 이번 턴에서는 town-country는 건드리지 않음. 필요하면 다음에 별도 요청.
