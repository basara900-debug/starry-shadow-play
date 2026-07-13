## 목표
ElevenLabs `eleven_multilingual_v2`로 TTS를 교체해 한국어 자연스러움을 확보하고, **캐릭터별 목소리 프로파일 + 씬/대사별 감정 오버라이드**를 스크립트에서 선언적으로 지정한다. 재생 로직·타이밍 파이프라인은 그대로 유지한다.

## 사전 준비 (사용자 조작)
1. ElevenLabs 스탠다드 커넥터 연결 → `ELEVENLABS_API_KEY` 주입.
2. 필요 시 [Voice Library](https://elevenlabs.io/voice-library)에서 원하는 한국어/다국어 보이스 ID를 골라 알려주기. 기본값은 아래 프리셋으로 채운다.

## 스크립트 스키마 확장 (`src/stories/<id>/script.json`)

```json
{
  "engine": "elevenlabs",
  "model": "eleven_multilingual_v2",
  "gapSec": 0.5,
  "voices": {
    "narration": {
      "voiceId": "XrExE9yKIg1WjnnlVkGX",   // Matilda: 따뜻·지적
      "settings": { "stability": 0.6, "similarity_boost": 0.8, "style": 0.35, "speed": 0.95 }
    },
    "tom":     { "voiceId": "IKne3meq5aSn9XLyUdCD", "settings": { "stability": 0.35, "style": 0.55 } },
    "country": { "voiceId": "Xb7hH8MSUJpSbSDYk0k2", "settings": { "stability": 0.4,  "style": 0.5 } },
    "city":    { "voiceId": "TX3LPaxmHKxFdv7VOQHJ", "settings": { "stability": 0.35, "style": 0.6 } }
    // …
  },
  "emotions": {
    "hurry":   { "stability": 0.2, "style": 0.75, "speed": 1.1 },
    "sad":     { "stability": 0.75, "style": 0.25, "speed": 0.9 },
    "excited": { "stability": 0.25, "style": 0.8,  "speed": 1.05 },
    "angry":   { "stability": 0.2, "style": 0.85, "speed": 1.05 },
    "warm":    { "stability": 0.7, "style": 0.3,  "speed": 0.97 },
    "calm":    { "stability": 0.8, "style": 0.2,  "speed": 0.95 }
  },
  "scenes": [
    {
      "id": "boy-wolf-11",
      "mood": "sad",                // 씬 전역 감정 (선택)
      "dialogue": [
        { "who": "tom",  "emotion": "sad",   "text": "휘슬아…" },
        { "who": "narration",             "text": "…" }
      ]
    }
  ]
}
```

- 병합 순서: `voices[who].settings` → `emotions[scene.mood]` → `emotions[line.emotion]` (뒤가 앞을 덮어씀).
- 기존 파생 화자(`tom_hurry`, `tom_sad`)는 마이그레이션 스크립트로 `who: "tom" + emotion` 형태로 변환.

## 빌드 스크립트 재작성 (`scripts/build-tts.py`)

- 엔진 분기: `script.engine === "elevenlabs"`이면 ElevenLabs 경로.
- 엔드포인트: `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128`
- 헤더: `xi-api-key: $ELEVENLABS_API_KEY`
- 바디: `{ text, model_id, voice_settings, previous_text, next_text }`
- **Request Stitching**: 같은 씬 안에서 직전·직후 대사 텍스트를 `previous_text` / `next_text`로 넘겨 억양·프로소디 연속성 확보 (대사가 짧고 많아 로봇처럼 들리는 문제를 크게 완화).
- 저장 경로·파일명(`public/audio/<id>/scene<N>/tts/<idx>_<who>.mp3`)·`timing.json` 산출 로직은 유지 → 앱 코드 무변경.
- `--force` 없이 실행 시: 신규/변경된 대사만 재생성 (텍스트+설정 해시를 파일 옆 `.hash`에 저장해 판정).

## 적용 범위 & 마이그레이션
1. `town-country/script.json` — 화자 4명, 씬 5개 → 보이스 매핑 + 씬 mood 추가.
2. `boy-wolf/script.json` — 화자 12개 → `tom_hurry/tom_sad` 등 감정 접미 화자를 `who=tom + emotion` 으로 정규화. 씬 8/9/10에 `mood: "hurry"`, 씬 11에 `mood: "sad"` 프리셋 적용.
3. `--force`로 두 카세트 전부 재생성 → `timing.json` 갱신. 씬 길이가 상단 타임라인에 그대로 반영됨.

## 앱/재생 코드
- 변경 없음. `sceneTts.ts`는 동일한 mp3 파일을 그대로 재생.
- `StorySceneMotion`에서 `boy-wolf`의 파생 화자 참조가 있으면 `who=tom`로 단일화하되 자막 표시명은 그대로 유지 (자막용 화자 라벨 매핑 소폭 수정).

## 문서
- `src/stories/README.md`에 ElevenLabs 프리셋·감정 태그 사용법과 스티칭 동작을 1페이지 추가.

## 트레이드오프
- 크레딧 사용량이 늘어난다 (multilingual_v2 기준). 스티칭은 컨텍스트로만 쓰이고 별도 과금 X.
- `eleven_turbo_v2_5`로 낮추면 절반 비용·약간 낮은 자연스러움. 필요 시 씬/화자 단위로 선택 가능하게 `model` 오버라이드 필드도 함께 지원.

## 확인 필요
- 두 카세트 모두 즉시 재생성할지, 아니면 `boy-wolf` 씬 1만 샘플 생성해 톤 확인 후 확대할지.
- 위 기본 보이스 ID 프리셋을 그대로 쓸지, 특정 캐릭터에 원하는 Voice ID가 있는지.
