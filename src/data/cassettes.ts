export type Cassette = {
  id: string;
  title: string;
  subtitle: string;
  /** 카세트 라벨 색상 (oklch 두 단계 그라데이션) */
  hueA: string;
  hueB: string;
  /** 사용자가 구매한 카세트인지 */
  purchased: boolean;
  /** 개발/업데이트 빌드에 새로 추가/수정된 카세트인지 */
  isUpdate: boolean;
  /** 가장 최근에 업데이트된 날짜 (yyyy-mm-dd) */
  updatedAt: string;
};

export const CASSETTES: Cassette[] = [
  {
    id: "town-country",
    title: "시골쥐와 서울쥐",
    subtitle: "그림자 연극 5막 구성",
    hueA: "oklch(0.8 0.1 75)",
    hueB: "oklch(0.48 0.09 45)",
    purchased: true,
    isUpdate: true,
    updatedAt: "2026-06-15",
  },
  {
    id: "boy-wolf",
    title: "양치기 소년",
    subtitle: "거짓말과 진심, 12막 구성",
    hueA: "oklch(0.82 0.11 130)",
    hueB: "oklch(0.42 0.10 145)",
    purchased: true,
    isUpdate: true,
    updatedAt: "2026-07-12",
  },
  {
    id: "ants-grasshopper",
    title: "개미와 베짱이",
    subtitle: "여름 노래와 겨울 식량의 우화",
    hueA: "oklch(0.78 0.14 145)",
    hueB: "oklch(0.52 0.12 155)",
    purchased: true,
    isUpdate: false,
    updatedAt: "2025-09-10",
  },
  {
    id: "ocean-whale",
    title: "고래의 노래",
    subtitle: "바다 속 깊은 우정",
    hueA: "oklch(0.74 0.12 220)",
    hueB: "oklch(0.40 0.10 235)",
    purchased: false,
    isUpdate: false,
    updatedAt: "2025-11-22",
  },
  {
    id: "snow-fox",
    title: "눈여우 마을",
    subtitle: "첫눈이 내리던 날",
    hueA: "oklch(0.92 0.04 240)",
    hueB: "oklch(0.66 0.08 245)",
    purchased: false,
    isUpdate: true,
    updatedAt: "2026-05-05",
  },
  {
    id: "fire-dragon",
    title: "꼬마 용의 일기",
    subtitle: "용기를 배우는 이야기",
    hueA: "oklch(0.78 0.16 35)",
    hueB: "oklch(0.48 0.16 25)",
    purchased: false,
    isUpdate: true,
    updatedAt: "2026-05-19",
  },
];