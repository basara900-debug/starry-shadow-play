## 목표
사용자가 elevenlabs.io/voice-library 에서 골라 준 Voice ID로 8개 배역의 보이스를 재매핑하고 전체 12씬 TTS를 다시 생성한다.

## 준비
사용자가 다음 8개 항목에 대해 각각 Voice ID(20자 영숫자)를 알려준다.

1. narration — 80대 노년 여성, 지적·따뜻
2. tom — 10대 남자 소년, 짓궂고 쾌활 (씬8~10 급함, 씬11 슬픔/후회는 emotion으로 처리)
3. v_m1 — 30대 남자, 쾌활·따뜻
4. v_m2 — 40대 남자, 친절·따뜻
5. v_m3 — 20대 남자, 성격 급하고 거친 톤
6. v_w1 — 20대 여자, 쾌활·따뜻
7. v_w2 — 40대 여자, 침착·친절
8. villagers — 여러 마을 사람 외침용(남성 중장년 추천)

+ 모델은 한국어에 강한 `eleven_multilingual_v2` 유지 권장. 사용자가 다른 모델(`eleven_turbo_v2_5` 등)을 지정하면 그것으로.

## 실행 단계
1. `src/stories/boy-wolf/script.json` 의 `voices.{who}.voiceId` 8개를 사용자가 준 ID로 교체. `settings`(stability/style/speed) 는 캐릭터 톤에 맞춰 그대로 유지하되 필요 시 미세 조정.
2. `python3 scripts/build-tts.py boy-wolf --force` 실행 → `.mp3.hash` 가 voiceId 변경을 감지해 111개 파일 전부 재생성, `timing.json` 자동 갱신.
3. 씬 1과 씬 11(감정 대비가 큰 씬)의 대표 라인 몇 개를 샘플 재생용으로 안내 → 사용자가 프리뷰에서 톤 확인.
4. 톤이 안 맞는 배역이 있으면 해당 `who` 만 Voice ID 재교체 → `--force` 없이 재실행 → 해당 라인만 diff 재생성.

## 사용자 응답 형식 예시
아래 형식으로 붙여주면 그대로 반영합니다. 모두 채우지 않아도 됩니다 — 준 것만 교체.

```
narration: <voiceId>
tom: <voiceId>
v_m1: <voiceId>
v_m2: <voiceId>
v_m3: <voiceId>
v_w1: <voiceId>
v_w2: <voiceId>
villagers: <voiceId>
model: eleven_multilingual_v2   # 선택
```

## 참고 — 지금 잘못 매핑된 원인
`voices.narration.voiceId = XrExE9yKIg1WjnnlVkGX` (Matilda, 실제 20~30대 여성),
`voices.tom.voiceId = N2lVS1w4EtoT3dr4eOWO` (Callum, 실제 40대 남성) 등 기본 라이브러리 라벨과 실제 프로필이 달라 요청한 연령대와 어긋난 결과가 나왔습니다. Voice ID 자체를 교체하지 않으면 stability/style 튜닝만으로는 연령대를 바꿀 수 없습니다.
