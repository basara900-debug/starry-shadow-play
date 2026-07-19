# 음성 노이즈 · 씬7+ 조기 종료 원인과 수정 계획

## 진단 (확인된 사실)

1. **조각 mp3는 모노(1채널) 44.1kHz** — ElevenLabs가 그렇게 내려줌.
   ```
   scene7/tts/00_narration.mp3  channels=1  channel_layout=mono
   scene7/tts/01_v_m1.mp3       channels=1  channel_layout=mono
   ```
2. **무음(silence)은 스테레오** — `build-tts.py`가 `anullsrc=r=44100:cl=stereo` 로 생성.
3. **`ffmpeg` concat 필터는 모든 입력의 sample_rate · channels · layout이 일치해야** 정상 동작. 불일치 시 무음 스테레오와 대사 모노가 이어붙으며 프레임이 깨져
   - 재생 중 **지직거리는 노이즈**가 삽입되고,
   - 일부 mp3 디코더는 깨진 프레임 이후 스트림을 조기 종료(EOS)해서 **씬7+ 에서 앞 몇 대사만 나오고 audio가 끝나버림**.
4. 브라우저 오디오가 조기 종료해도 `StorySceneMotion` 의 RAF 타이머는 벽시계 기준으로 계속 진행 → `t`가 `durationSec`에 도달하면 `onComplete` 호출 → **다음 씬으로 자동 전환**. 사용자가 관찰한 정확한 증상.
5. 마스터 파일 길이 자체는 `timing.json` 과 일치 (예: scene7 = 54.75s). 즉 concat 자체는 성공했지만 프레임 품질이 손상된 상태.

## 수정 (한 파일만 손대면 됨)

### `scripts/build-tts.py` — `build_scene_master` 재작성

concat 이전에 모든 오디오 스트림을 **공통 포맷으로 정규화** 한다. `aformat` 필터를 각 입력에 적용해서 44.1kHz / 스테레오 / fltp 로 통일한 뒤 concat.

```text
[silence] aformat=... asplit=N → [s0..sN]
[beat_k]  aformat=... → [b0..bN-1]
[s0][b0][s1][b1]...[sN] concat=n=2N+1:v=0:a=1[out]
```

- `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo` 를 모든 입력에 삽입 (모노 → 스테레오 업믹스 포함).
- 최종 인코딩은 기존 그대로 `-c:a libmp3lame -b:a 128k -ar 44100 -ac 2`.
- 재빌드는 이미 캐시된 조각 mp3를 재사용하므로 ElevenLabs 재호출·크레딧 소모 없음.

### 재빌드 & 검증

빌드 모드로 전환되면 다음을 순서대로 실행:

1. 기존 마스터 삭제: `rm public/audio/boy-wolf/scene*.mp3`
2. 마스터만 재생성:  `python3 scripts/build-tts.py boy-wolf` (조각은 hash 일치 → skip, `build_scene_master` 만 재실행)
3. 각 씬 마스터의 길이·채널 확인 (`ffprobe`) — channels=2, duration 이 이전 값과 ±0.05s 내로 유지되는지.
4. 미리보기에서 씬7~12를 처음부터 재생하여 노이즈 소실 및 대사 끝까지 재생되는지 확인.

## 후속(선택) 개선 — 이번 판에는 포함하지 않음

- 마스터 오디오가 아직 로드되지 않았거나 정지된 경우 `StorySceneMotion` RAF 를 대기시키기 (모바일 저속망 안전장치). 이번 이슈의 근본 원인이 아니므로 별도 요청 시 진행.

## 기대 결과

- 대사 사이 지지직 노이즈 제거.
- 씬7~12 도 마지막 대사까지 정상 재생 후 다음 씬 전환.
- 코드/렌더 로직·`timing.json` 변경 없음, 파이썬 빌드 스크립트 한 파일만 수정.
