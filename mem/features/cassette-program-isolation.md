---
name: 카세트 프로그램 격리 규칙
description: 각 카세트는 자체 완결된 프로그램(씬·모션·대사·BGM·SFX)이며 다른 카세트로 절대 새지 않아야 한다. TheaterStage에서 program 디스크리미네이터로 각 씬 컴포넌트를 게이팅한다.
type: feature
---

# 카세트 프로그램 격리

- 카세트 = 하나의 완결 프로그램. 모션·대사·나레이션·BGM·SFX·씬 목록을 모두 자체적으로 소유한다.
- `TheaterStage` 안에서 `program: "ants-grasshopper" | "town-country" | null` 같은 디스크리미네이트 유니언으로 분기하고, Scene 컴포넌트 JSX 블록 각각을 `program === "<id>" && ...` 로 감싼다. 절대로 두 프로그램이 공유하는 단일 boolean(`hasMotionProgram` 같은 것)을 만들지 않는다.
- 카세트 id 매핑:
  - `ants-grasshopper` → Scene1Motion ~ Scene5Motion
  - `town-country` → StorySceneMotion + TOWN_COUNTRY_STORY 데이터
- 자유 업로드 UI(+씬 추가/현재 씬 삭제/전체 비우기)는 `program === null` 일 때만 노출.
- 기본 삽입 카세트(`DEFAULT_CASSETTE_ID`)는 `ants-grasshopper`.
- TheaterStage 언마운트 시 공용 오디오 버스 speed를 1로 복원해 메인 타이틀 설정을 오염시키지 않는다. 새 프로그램이 추가 오디오 상태를 변경하면 동일하게 복원해야 한다.
- 버그 시그널: 카세트 A를 삽입했는데 카세트 B의 모션/대사가 함께 재생되면 거의 항상 위의 공유 boolean 안티패턴 때문이다.