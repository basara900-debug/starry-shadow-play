확인한 내용부터 솔직히 말하면, 이번에는 원인 후보가 꽤 명확합니다.

## 현재 확인된 사실

- `timing.json`의 씬 6~12 타이밍은 실제 씬별 마스터 MP3 길이와 거의 정확히 일치합니다.
  - 예: 씬 6 `durationSec 42.88초`, 실제 `scene6.mp3 42.88초`
  - 씬 7 `54.75초`, 실제 `scene7.mp3 54.75초`
- 대사 간 간격도 현재는 모두 `0.25초`로 일정합니다. 즉, 사용자가 의심한 “0.5초 간극 설정” 자체가 현재 런타임 데이터에 남아 문제를 만드는 증거는 보이지 않습니다.
- 실제로 더 수상한 부분은 `/src/routes/index.tsx`의 `TheaterStage`에 남아 있는 별도 자동 씬 전환 타이머입니다.

## 유력한 원인

`TheaterStage` 안에 다음 로직이 있습니다.

```ts
// 자동 씬 전환: 1x = 8s, 2x = 4s, paused = 정지
if (sceneIndex === 0) return;
if (sceneIndex === 1) return;
if (sceneIndex === 2) return;
if (sceneIndex === 3) return;
if (sceneIndex === 4) return;
setInterval(() => setSceneIndex(i => i + 1), 8000)
```

이 로직은 씬 1~5만 예외 처리하고, 씬 6부터는 실제 음성 길이와 무관하게 8초마다 다음 씬으로 넘깁니다.

그래서 사용자가 말한 증상과 정확히 맞습니다.

- 씬 6부터 앞부분 일부만 재생됨
- 전체 대사가 끝나기 전에 강제 다음 씬으로 넘어감
- MP3 자체는 정상
- 타이밍 데이터도 정상인데 재생이 끝나지 않음

## 수정 계획

1. `TheaterStage`의 8초/4초짜리 legacy 자동 전환 타이머를 제거하거나, 최소한 `town-country` / `boy-wolf` 같은 `storyProgram` 카세트에는 적용되지 않게 막겠습니다.
2. `boy-wolf`는 이미 `StorySceneMotion`이 `scene.durationSec` 기준으로 `onComplete`를 호출하므로, 씬 전환은 이 경로 하나만 사용하게 정리하겠습니다.
3. 중복 전환을 막기 위해 자동 전환 책임을 다음처럼 분리하겠습니다.

```text
ants-grasshopper 구형 Scene1~5Motion -> 각 컴포넌트 onComplete
boy-wolf / town-country StorySceneMotion -> timing.json durationSec 기반 onComplete
업로드된 일반 이미지 씬만 -> 필요 시 기존 8초 자동 넘김 유지
```

4. 수정 후 Playwright로 양치기 소년 씬 6에 직접 진입해 최소 10초 이상 머물러도 강제 전환되지 않는지 확인하고, 가능하면 씬 6 전체 길이 기준으로 다음 씬으로 넘어가는지도 로그/DOM 상태로 검증하겠습니다.

## 이번에 원인을 모른다면?

이번 점검 기준으로는 “원인을 모른다”가 아니라, 코드상으로 씬 6부터 8초 강제 전환되는 로직이 확인됐습니다. 이 부분이 현재 증상을 설명하는 가장 직접적인 원인입니다.