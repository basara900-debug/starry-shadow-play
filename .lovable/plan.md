## 원인 (코드 확인 결과)

- `src/lib/sceneTts.ts`의 재생 방식이 **대사 하나당 `<audio>.src` 를 통째로 교체**하는 구조. 브라우저는 매 대사 전환마다 새로운 mp3를 로드·디코드해야 하고, 이 지연(모바일 100~500ms) 동안 다음 대사의 첫 음절이 잘려서 "끊김"으로 들림.
- `timing.json`은 모든 대사 사이에 **0.5초 하드 갭**이 박혀 있음 (총 105 대사 × 0.5s ≈ 52초의 강제 침묵). 대사 간격이 부자연스럽게 벌어짐.
- rAF 기반 `t`가 `useEffect` 의존성이라 매 프레임 effect가 재실행됨 → 대사 경계에서 `pause()/currentTime=0/play()` race가 튀는 경우 있음.

## 해결 방향: 씬별 통합 마스터 mp3 재생

씬 1개당 mp3 1개만 로드해서 처음~끝까지 연속 재생하면 `src` 스왑이 없어져 대사 사이 지연이 완전히 사라지고, 갭도 파일 안에 정확한 무음으로 박히므로 재생기 상태와 무관하게 자연스럽게 이어짐.

### 1. 빌드: 씬별 마스터 mp3 생성
- `scripts/build-tts.py`가 조각 mp3 생성 후 `ffmpeg concat`으로 **씬당 `scene.mp3` 하나**를 만들도록 확장.
- 대사 사이 무음은 config로 조정 (기본 **0.25초**로 축소, 필요 시 씬/캐릭터별 override).
- 무음은 `anullsrc` 필터로 정확히 삽입 → `timing.json`의 `from/to`가 마스터 파일 오프셋과 1:1 일치.
- 출력 경로: `public/audio/boy-wolf/scene1.mp3` 등. 기존 조각 파일은 남겨두어 재빌드/디버깅에 재사용.

### 2. 재생: `useSceneMasterVoice` 훅으로 재작성
- `src/lib/sceneTts.ts` 를 대체:
  - 씬 마운트 시 마스터 mp3 하나를 공유 `<audio>` 에 실어 preload.
  - 씬이 재생 중일 때만 `.play()`, `t` 가 씬 duration을 벗어나면 `.pause()`.
  - **매 프레임 `currentTime`을 강제로 맞추지 않음**. 자연 재생을 신뢰하고, `speed` 변경·seek(dev 툴바)·씬 전환일 때만 `currentTime = t` 로 동기화.
  - `speed` 변경 → `playbackRate` 즉시 반영. `speed=0` → pause.
- 자막(`beat = scene.beats.find(...)`)은 기존대로 `t` 기반 유지 → 파일 오프셋과 일치하므로 그대로 싱크됨.

### 3. 씬 전환 지연 제거
- `primeSceneTts` 를 마스터 mp3용으로 바꿔 **다음 씬 마스터를 미리 fetch** (link preload 또는 hidden `<audio preload="auto">`).
- 씬 전환 시 이전 마스터 pause + 새 마스터 currentTime=0 → 즉시 play. src 스왑이 씬당 1회로 줄어들며 모바일에서도 매끄러움.

### 4. `timing.json` 재생성
- 새 갭(0.25s)으로 다시 계산되므로 각 씬 duration이 소폭 짧아짐 (씬 1: 88.5s → 약 85.4s 등).
- 자막·모션 툴바가 그대로 새 타이밍을 읽음.

### 5. 검증
- 브라우저에서 씬 1~3 이어 재생하며 대사 간 무음 길이·자막 싱크 확인.
- 모바일 뷰포트(현재 411×735)에서 씬 전환 첫 대사의 첫 음절이 잘리지 않는지 확인.
- Dev 툴바로 임의 시점 seek 시 마스터 파일이 해당 초로 정확히 점프하는지 확인.

## 기술 세부

```text
public/audio/boy-wolf/
├── scene1/tts/00_narration.mp3   ← 기존 조각 (유지)
├── scene1/tts/silence_025.mp3    ← ffmpeg anullsrc, 0.25s
├── scene1.mp3                    ← 신규 마스터 (조각 + 무음 concat)
└── ...
```

ffmpeg concat 예:
```
ffmpeg -f concat -safe 0 -i list.txt -c copy scene1.mp3
# list.txt = 00.mp3 / silence.mp3 / 01.mp3 / silence.mp3 / ...
```

`useSceneMasterVoice` 시그니처(개념):
```ts
useSceneMasterVoice({
  url: `/audio/boy-wolf/scene${n}.mp3`,
  t, speed, audioState,
  durationSec: scene.durationSec,
})
```

## 영향 범위

- 수정: `scripts/build-tts.py`, `src/lib/sceneTts.ts`, `src/components/StorySceneMotion.tsx`(훅 교체 및 primeSceneTts 호출 변경), `src/routes/index.tsx`(prime 호출부).
- 데이터: `src/stories/boy-wolf/timing.json` 재생성, `public/audio/boy-wolf/scene*.mp3` 신규 생성.
- 기존 조각 mp3, `boy-wolf-full.mp3`, 자막 배열, 모션 상수는 변경 없음.
