## 목표

사용자가 제공한 캐릭터별 감정 프롬프트를 ElevenLabs TTS 생성에 그대로 반영해서, 각 대사가 캐릭터 페르소나 + 씬 상황에 맞는 감정으로 발화되도록 파이프라인을 확장한다.

## 1. 사전 확인 필요 (실행 전 반드시)

사용자가 지정한 보이스는 라이브러리 표시 이름(`relaxing rachel`, `Adam stone`, `titan`, `mark`, `hope`, `cassidy`, `Grandma titina`)이며, ElevenLabs API는 실제 `voice_id`(예: `XrExE9yKIg1WjnnlVkGX`)가 필요하다. 현재 `script.json`의 voiceId 값들과는 다르다.

두 가지 옵션:
- (A) 사용자가 각 캐릭터의 실제 voice_id를 알려준다 (VoiceLab/Library 페이지 URL 또는 ID)
- (B) 내가 ElevenLabs API(`GET /v1/voices`, `/v1/shared-voices`)로 이름 기반 조회해서 후보를 제시 → 사용자가 승인

## 2. script.json 스키마 확장

각 캐릭터에 `persona`(공통 프롬프트) 필드를, 감정에는 `directionPrompt`(연출 지시문) 필드를 추가한다. 문장 원문은 절대 수정하지 않는다(동화 씬 제작 원칙 준수).

```json
"voices": {
  "tom": {
    "voiceId": "<확정 필요>",
    "persona": "Tom is a playful Korean boy around 10–12... standard Seoul Korean...",
    "settings": { "stability": 0.4, ... }
  },
  ...
}
"emotions": {
  "bored":     { "stability": 0.55, "style": 0.35, "speed": 0.95,
                 "directionPrompt": "Bored and restless, slow casual pace, small sighs..." },
  "mischief":  { "directionPrompt": "Mischievous excitement, bright energetic playful..." },
  "fake_remorse":{ "directionPrompt": "Fake remorse, subtle pretending..." },
  "panic":     { "directionPrompt": "Genuine fear and panic, trembling breath..." },
  "regret":    { "directionPrompt": "Deep regret, quiet emotional heartfelt..." },
  "kind_urgent":{ "directionPrompt": "Warm concerned but urgent (Village Man 1)..." },
  "fatherly_disappointed":{ "directionPrompt": "Firm but caring correction (Village Man 2)..." },
  "bold_angry":{ "directionPrompt": "Bold aggressive toward wolf (Village Man 3)..." },
  "anxious_kind":{ "directionPrompt": "Gentle trembling worry (Village Woman 1)..." },
  "motherly":  { "directionPrompt": "Soft nurturing comfort (Village Woman 2)..." },
  "grandma_narration":{ "directionPrompt": "Loving 80-year-old grandma reading a fairy tale..." }
}
```

각 대사에는 `emotion` 태그만 붙인다 (이미 일부 씬에 존재). 12개 씬 전체 대사에 감정 태그 정비 필요.

## 3. build-tts.py 확장 — 프롬프트 → 발화 반영

ElevenLabs `eleven_multilingual_v2`는 별도 프롬프트 필드가 없으므로 두 갈래로 처리:

**방식 A (권장) — 모델을 `eleven_v3`로 전환**
- v3는 인라인 오디오 태그(`[sad]`, `[excited]`, `[whispers]`, `[sighs]`)와 방향 지시를 지원한다.
- 빌드 스크립트가 대사 텍스트 앞에 `[direction: <persona 축약> | <emotion directionPrompt 축약>]` 형태의 스타일 힌트를 자동 삽입 → 원문은 그대로 유지되지만 v3 엔진이 감정을 반영.
- 한국어 지원 확인 필요(현재 v3는 alpha, 한국어 품질 사용자 확인 후 결정).

**방식 B (안전) — v2 유지 + settings 자동 매핑**
- persona/directionPrompt는 사람이 읽는 메타데이터로만 보관.
- 감정별 `stability/style/speed` 프리셋을 프롬프트 뉘앙스에 맞춰 정교화해서 감정 표현.
- 텍스트 원문은 전혀 건드리지 않음.

사용자 선택 필요: A(감정 밀도↑ 실험적) / B(안정적, 감정은 톤 조절 수준).

두 방식 공통으로 `build-tts.py`는:
- `persona + emotion.directionPrompt + text + voiceId + settings` 전체를 해시 시그니처에 포함 → 프롬프트 변경 시 자동 재생성.
- 방식 A일 때만 v3 요청 본문에 스타일 힌트를 prepend.

## 4. 씬별 감정 태깅 적용 (12씬 전 대사)

사용자 프롬프트를 근거로 각 대사에 `emotion` 태그 부여:
- 씬1 톰: `bored` → (프랭크 착상 후) `mischief` → `excited`
- 씬2 마을 사람들: `kind_urgent`, `fatherly_disappointed`, `bold_angry`, `anxious_kind`
- 씬3 톰: `fake_remorse`, 마을 사람들: `fatherly_disappointed`
- 씬4~ (2차 거짓말 반복): `mischief`, `fake_remorse` 재사용
- 늑대 실제 등장: 톰 `panic`, 마을 사람들 반응 (믿지 않음/의심)
- 마지막: 톰 `regret`, 마을 여성 `motherly`
- 나레이션 전체: `grandma_narration` 기본, 긴장 구간은 `hurry` 등으로 오버라이드

## 5. 실행 단계 (승인 후)

1. 사용자 확답: (a) 실제 voice_id 목록, (b) 방식 A vs B
2. `script.json` 업데이트: persona / emotions / 대사별 emotion 태그
3. `build-tts.py` 수정: 프롬프트 해시 반영 (+ 방식 A면 v3 요청 본문 확장)
4. `python3 scripts/build-tts.py boy-wolf --force` 실행 → 전 대사 재생성 + `timing.json` 갱신
5. 씬 재생으로 감정 반영 확인, 필요 시 특정 대사만 emotion 태그 변경 후 재빌드(해시로 변경분만 재생성)

## 확인 필요 사항

먼저 이 두 가지만 답해 주면 바로 실행 준비가 완료된다:
1. 7명 캐릭터의 **실제 ElevenLabs voice_id**를 알려줄 수 있는지, 아니면 내가 이름으로 검색해서 후보를 제시할지
2. 감정 반영 방식 **A(eleven_v3 인라인 스타일 힌트)** vs **B(v2 유지, settings 정교화)** 중 선택
