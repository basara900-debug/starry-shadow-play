## 양치기 소년 배경 씨트 4장 적용

업로드된 4장 배경 씨트를 씬별 매핑에 따라 boy-wolf 스토리에 연결한다.

### 씬 매핑
- `bg_1` (초원+마을+양떼): 씬 1, 4, 8
- `bg_2` (마을 광장): 씬 2, 5, 7, 9, 11
- `bg_3` (산길): 씬 3, 6, 10
- `bg_4` (실내/방): 씬 12

### 작업
1. **에셋 업로드** — `lovable-assets create` 로 4장을 `src/assets/boy-wolf/bg_{1..4}.jpg.asset.json` 으로 등록.
2. **script.json** — 각 씬에 `"background": "bg_N.jpg"` 필드를 위 매핑대로 추가.
3. **boyWolfStory.ts** — 현재는 배경/BGM 을 무시하는 스켈레톤. 다음을 반영:
   - 4개의 bg asset import + `ASSET_URLS` 룩업 테이블 추가
   - `ScriptScene` 타입에 `background` 포함, `url: ASSET_URLS[s.background] ?? ""` 로 채움
4. 검증: 각 씬에서 배경이 렌더되는지 preview 로 확인.

BGM/SFX/모션은 이번 작업에 포함하지 않는다 (배경 씨트만).
