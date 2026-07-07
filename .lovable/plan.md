이전 요청(씬4 도망 모션 파라미터 분리)과 이번 요청(씬3 시골쥐 순환 모션 시간/간격 변경)을 함께 반영합니다. 상수는 `src/components/StorySceneMotion.tsx` 파일 내부에 인라인으로 정의합니다.

1. 씬4 도망 모션 파라미터 분리
   - `src/components/StorySceneMotion.tsx` 상단에 `SCENE4_FLEE` 단일 상수 정의
   - 필드: sceneId, asset, startSec, endSec, fromLeftPct, toLeftPct, bottomPct, heightPct, flipX, fadeInSec
   - 기존 씬4 도망 렌더링 로직을 `SCENE4_FLEE` 값을 읽도록 변경
     - progress = clamp((t - startSec) / (endSec - startSec), 0, 1)
     - leftPct = fromLeftPct + (toLeftPct - fromLeftPct) * progress
     - transform = flipX ? "scaleX(-1)" : ""
     - opacity = min(1, (t - startSec) / fadeInSec)

2. 씬3 시골쥐 순환 모션 변경
   - 기존: `town-country-3` 씬, 52~64초, left 40%, bottom 40%, 4초 간격 순환
   - 변경: 동일 위치(left 40%, bottom 40%)에서 52~58초, 2초 간격 순환
   - 조건: `t >= 52 && t < 58`
   - 인덱스: `Math.floor((t - 52) / 2)`
   - 등장: `((t - 52) % 2) / 0.4`

3. 씬3 시골쥐 순환 모션 파라미터 분리
   - `SCENE3_COUNTRY_ALT3` 상수 정의
   - 필드: sceneId, frames, startSec, endSec, intervalSec, leftPct, bottomPct, fadeInSec
   - 렌더링 로직이 상수를 읽도록 변경

범위: `src/components/StorySceneMotion.tsx`의 씬3/씬4 관련 모션 계산 부분만 수정, 다른 씬/모션은 변경하지 않음.