## 문제 진단

씬 6부터 음성이 재생되지 않고 자막(개발 툴바에 "— (대사 없음)")이 계속 표시되며 씬이 넘어가는 문제를 조사했습니다.

**서버측 파일은 정상**:
- `public/audio/boy-wolf/scene6.mp3` ~ `scene12.mp3` 모두 유효 (스테레오 44.1kHz, `Content-Type: audio/mpeg`, 브라우저 디코드 성공, `durationSec` 일치).
- `silencedetect` 결과, 마스터 파일의 오디오 구간이 `timing.json` beats(`from`/`to`)와 정확히 일치.
- `mediumHash` 중복 없음(파일 크기가 같아 보였던 것은 우연).

**따라서 원인은 클라이언트 재생 로직에 있습니다.** 코드에서 확인된 확실한 버그 + 유력한 원인:

### 버그 1 (확실) — `a.src.endsWith(url)` 씬 번호 접미 충돌
`src/lib/sceneTts.ts` `useSceneMasterVoice`:
```ts
if (!a.src.endsWith(url)) { a.src = url; ... a.load(); }
```
- `scene1.mp3` 로딩 상태에서 `scene11.mp3`(신규)와 비교 시 `endsWith("/scene11.mp3")` = false → 교체됨(OK).
- 그러나 `scene11.mp3` → `scene1.mp3`, `scene12.mp3` → `scene2.mp3` 로 되돌아가거나, `scene6.mp3` 상태에서 이전 세션이 남긴 `scene16.mp3`(가상) 등으로 이동할 때 접미 매칭이 잘못 작동할 수 있음. 또한 씬 반복/재시작 시 src를 재로딩하지 않아 audio 요소가 이전 재생 상태에 갇힘.
- 결과: 특정 이동 순서에서 마스터 파일이 교체되지 않고 이전 씬 오디오가 이미 끝난 상태로 남아 재생이 시작되지 않음.

### 유력한 원인 2 — 자동재생 재시도 부재
- `a.play().catch(() => { /* 다음 프레임에 재시도 */ })` 라고 주석은 있지만, **실제 재시도는 없음**. 모바일에서 `load()` 직후 첫 `play()`가 `NotAllowedError`/`AbortError`로 실패하면 이후 프레임에서 이미 `a.paused === false`(재생 시도 중) 로 잘못 인식되거나 다시 호출되지 않아 침묵 상태로 남을 수 있음. 씬 1~5는 초기 unlock 상태에서 성공하지만, 씬 5→6 전환 시점(스테레오 정규화 후 첫 새로운 파일)에서 이 실패가 반복 발생 가능.

### 유력한 원인 3 — 완료 조건 조기 트리거
- `StorySceneMotion` RAF: `next >= scene.durationSec` 즉시 `onComplete()`. 
- 마스터 오디오가 로딩 지연으로 첫 프레임에 재생을 시작하지 못한 사이에도 `t`는 실시간으로 증가하므로, 씬이 계속 진행되어 자막은 "대사 없음"만 뜨고 42.88s 후 다음 씬으로 넘어가는 현상과 일치.

## 해결 방안

### 1. `useSceneMasterVoice` 견고화 (`src/lib/sceneTts.ts`)
- URL 비교를 `endsWith` 대신 **정확한 pathname 비교**로 교체 (`new URL(a.src, location.origin).pathname === url`).
- src 교체 후 `canplaythrough`(또는 `loadeddata`) 이벤트를 기다렸다가 `play()` 호출.
- `play()` 실패 시 다음 RAF에 실제로 재시도하는 카운터/플래그 추가 (예: `pendingPlayRef`).
- 씬 교체 시 `activeIdxRef`/재생 시도 상태 초기화.

### 2. 완료 조건에 오디오 상태 반영 (`src/components/StorySceneMotion.tsx`)
- RAF `next >= scene.durationSec` 조건에 "마스터 오디오가 unlocked 후에 최소 한 번 재생 시작에 성공했거나, 재생 실패로 3회 이상 fallback 되었으면" 조건 추가. 실패 케이스에서도 무한 대기하지 않도록 상한 유지.

### 3. 진단 로깅(개발 모드 한정)
- 씬 전환/`src` 교체/`play()` 성공·실패/`readyState` 변화를 `[TTS]` 접두어로 콘솔 로그. 씬 6 이슈가 여전히 재현되면 원인을 즉시 확인 가능.

### 4. 검증
- 프리뷰에서 카세트 재생 → 씬 5 → 6 → 7 순차 진행.
- 브라우저 콘솔에서 `[TTS] play ok scene6` 등의 로그 확인.
- 씬 5→6 전환 후 3초 내 음성 시작, 42.88s 후 씬 7로 자연 전환 확인.

### 기술 노트
- 접미 매칭 버그는 씬 번호에 접미(1↔11, 2↔12) 관계가 있는 스토리에서 발생하는 클래식 이슈. 다른 스토리(`town-country`, 5개 씬)에서는 무해했음.
- `play()` promise 실패 후 자동 재시도 부재는 mobile Safari + iOS Chrome의 알려진 함정.
