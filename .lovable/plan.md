# 양치기 소년 재생 안정화 (2단계)

## 1단계: 타이밍 오버랩 조정 (데이터 재계산)

**대상:** `src/stories/boy-wolf/timing.json`

- 스크립트로 각 개별 대사 MP3(`public/audio/boy-wolf/scene<N>/tts/*.mp3`)를 `ffprobe`로 실측.
- 씬별 `beats[]` 재계산 규칙:
  - 대사 사이 무음 간격: 0.25초 → **0.4초**로 통일 (자연스러운 호흡).
  - 각 대사의 `from`은 앞 대사 `to` + 0.4초. `to`는 `from` + 실측 길이.
- `durationSec`은 마지막 대사 `to` + **0.6초 여유**로 재설정.
- 씬별 마스터 MP3(`scene<N>.mp3`)도 동일한 0.4초 간격으로 재생성해 데이터와 오디오가 일치하도록 맞춤.

## 2단계: 포스트 전환 동기화 (코드)

**대상:** `src/components/StorySceneMotion.tsx`, `src/lib/sceneTts.ts`

- `useSceneMasterVoice`가 이미 노출하는 상태(`playing`, `error`, `ended` 등)를 활용해 다음 정보를 새로 반환:
  - `hasFinished: boolean` — 실제 `<audio>`가 `ended` 이벤트를 받았거나 error 폴백이 완료된 상태.
- `StorySceneMotion`의 씬 진행 로직 수정:
  - 씬 진입 후 음성 `readyState >= 2`가 될 때까지 내부 타이머 카운트다운 **지연 시작**.
  - `onComplete` 호출 조건을 다음으로 변경:
    ```
    (timerElapsed >= durationSec) AND (voice.hasFinished OR voice.error)
    ```
  - 음성이 durationSec보다 길게 남아 있으면 타이머가 만료돼도 대기.
  - 음성이 error인 경우는 폴백 재생 종료 시점 기준으로 진행 (기존 동작 유지).
- 마지막 씬은 `onComplete` 대신 정지 상태로 종료 (기존 동작 유지).

## 검증

- Playwright로 boy-wolf 카세트를 삽입 → 씬 6 진입 → 다음 조건 확인:
  1. 씬 6 마스터 MP3(약 42.88s)의 마지막 대사까지 재생됨.
  2. `[TTS] play ok scene6.mp3`, `[TTS] ended scene6.mp3` 로그가 순서대로 출력.
  3. `ended` 이후에만 씬 7로 전환.
- 씬 7~12까지 순차 확인.

## 되돌리기 안전장치

- timing.json 변경은 데이터만 바꾸므로 롤백 시 이전 값 복원만으로 충분.
- 코드 변경은 음성이 error인 경로에서 기존 폴백 동작을 유지하므로, 음성 파일이 없어도 씬은 여전히 진행됨.

## 이번 계획이 다루지 않는 것

- 음성 재녹음/보이스 교체 (별도 작업).
- `/audio` 페이지 UI 변경 (별도 작업).
