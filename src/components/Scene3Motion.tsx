import antEmotions from "@/assets/scene3/ant-emotions.jpg";

/**
 * 씬 3 모션 — 캐릭터 시트를 배경 좌측 25% 부근, 하단에서 위로 10% 부근에 배치.
 */
export type Scene3Speed = 1 | 2 | 0;

export function Scene3Motion({ speed: _speed }: { speed: Scene3Speed }) {
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <img
        src={antEmotions}
        alt=""
        draggable={false}
        className="absolute"
        style={{
          left: "25%",
          bottom: "10%",
          height: "40%",
          width: "auto",
          transform: "translateX(-50%)",
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 4px 8px oklch(0 0 0 / 0.4))",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}