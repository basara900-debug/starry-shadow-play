# 동화 씬 제작 파이프라인 개선안

지금 프로젝트는 "시골쥐와 서울쥐" 한 편을 직접 손으로 조립하면서 굳어진 구조라, 앞으로 새 동화를 계속 만들려면 **사전 작업 → 씬 조립 → 개발자 연출**을 분리해두는 게 좋습니다. 현재 구조는 유지하되, 반복 작업을 제거하는 4가지 개선을 제안합니다.

## 1. 스토리보드를 단일 소스로 (씬 조립 순서 #1)

**현재 문제**
- `townCountryStory.ts`에 자막(`beats`)이 손으로 박혀 있고, TTS 파일명·씬 길이·자막 시간이 서로 따로 관리됨.
- 자막 시간(`from`/`to`)을 사람이 계산해서 넣고, TTS 재생성하면 다시 손으로 맞춰야 함.

**개선**
- 새 스토리는 `src/data/stories/<id>/script.json` 하나만 사람이 편집.
  - 씬별로 `setting`, `bgmUrl`, 대사 배열(`who`, `text`)만 기입. **시간은 안 적음.**
- 이 파일이 자막·TTS·씬 길이의 유일한 진실 소스가 됨.

## 2. TTS 빌드 스크립트 표준화 (사전 작업 #2, 0.5초 간격 규칙)

**개선**
- `scripts/build-tts.ts` (또는 `.py`) 하나로 통일:
  1. `script.json` 읽어서 각 대사에 대해 Lovable AI TTS 호출 (화자별 voice 매핑 테이블 포함).
  2. 생성된 mp3를 `public/audio/<story>/scene<N>/tts/<idx>_<who>.mp3` 로 저장.
  3. `ffprobe`로 각 파일의 실제 길이 측정.
  4. **각 대사 사이 0.5초 gap** 을 넣은 타임라인 계산 후 `script.json` 옆에 `timing.json` 산출:
     ```
     beats: [{ i, who, text, file, dur, from, to }, ...]
     sceneDurationSec: <마지막 beat.to + 0.5>
     ```
- 앱 코드는 `script.json` + `timing.json` 을 합쳐서 기존 `StorySceneDefinition` 형태로 로드 → `StorySceneMotion` 은 그대로 유지.

**효과**: 대사 한 줄 바꾸면 스크립트 재실행만으로 mp3·자막 시간·씬 길이가 전부 자동 재산출.

## 3. 씬 길이·상단 타이머가 gap 포함해서 정확히 표시 (사전 작업 #3)

**현재 문제**
- `scene.durationSec` 이 손으로 넣은 값. `StorySceneMotion` 은 이 값을 그대로 루프/완료 판정에 사용.
- gap이 자막에는 있지만 총 길이 계산에는 반영 안 될 수 있음.

**개선**
- `sceneDurationSec = 마지막 beat.to + 0.5` 를 빌드 스크립트가 산출.
- 상단 재생 툴바(현재 `DevSubtitleToolbar` / `DevMotionToolbar` / 재생 컨트롤)가 이 값을 그대로 사용하므로 추가 코드 없이 gap 포함된 시간이 표시됨.
- `StorySceneMotion` 의 `onComplete` 트리거도 자동으로 맞춰짐.

## 4. 개발자 연출 레이어 명확화 (씬 조립 순서 #4~7)

배경·캐릭터 모션·SFX는 계속 개발자 재량이지만, 지금은 `StorySceneMotion.tsx` 한 파일(1100줄)에 씬 1~4가 다 들어가 있어 새 동화 추가 시 충돌이 큽니다.

**개선**
- 동화별로 분리:
  ```
  src/stories/<id>/
    script.json           ← 사람 편집
    timing.json           ← 스크립트가 생성
    scene1.motion.tsx     ← 개발자가 캐릭터/SFX 배치
    scene2.motion.tsx
    ...
    index.ts              ← 위 조각들을 StorySceneDefinition[] 로 export
  ```
- `StorySceneMotion` 은 얇은 셸(자막·TTS·BGM·타이머·완료 처리)만 담당하고, 씬별 연출 JSX는 각 씬 파일에서 렌더.
- `SCENE_MOTIONS`(모션 카탈로그)도 씬 파일 안에서 export → 여러 동화가 동시에 있어도 이름 충돌 없음.
- 배경/BGM은 `script.json`에 URL만 지정하면 셸이 알아서 처리 (#4, #7).
- SFX는 씬 모션 파일에서 특정 시간대에 삽입 (#6).

## 앞으로 새 동화 만드는 순서 (이 개선안 적용 후)

1. **스크립트 작성**: `src/stories/<id>/script.json` 에 씬·화자·대사만 입력.
2. **TTS 빌드**: `bun run build-tts <id>` → mp3 + `timing.json` 자동 생성 (0.5초 gap 자동 반영).
3. **씬 길이 확정**: 앱 실행하면 상단 툴바에 gap 포함된 정확한 씬 시간이 표시됨.
4. **배경 지정**: `script.json` 에 배경/BGM URL 추가.
5. **캐릭터 시트 배치·모션 구현**: `scene<N>.motion.tsx` 에서 개발자가 JSX 작성 (`SCENE_MOTIONS` 카탈로그 함께 갱신 → DevMotionToolbar 경고 활용).
6. **SFX 삽입**: 모션 파일에서 시간 조건부로 재생.
7. **카세트 등록**: `src/data/cassettes.ts` 에 항목 추가.

## 이번에 실제로 할 작업 (범위 확인용)

이 플랜이 승인되면 다음을 순차 진행합니다:

1. `scripts/build-tts.ts` 작성 (Lovable AI + ffprobe, gap 0.5초 로직).
2. 기존 `townCountryStory.ts` 를 `src/stories/town-country/` 구조로 마이그레이션 (동작은 동일 유지, 데이터만 분리).
3. `StorySceneMotion` 을 셸/씬 분리 리팩터.
4. README 성격의 짧은 authoring 가이드(`src/stories/README.md`).

기존 재생·자막·모션 툴바·재생 컨트롤은 건드리지 않고, 데이터·빌드 파이프라인만 정리하는 방향입니다.
