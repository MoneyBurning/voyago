import type { ChecklistItem, Interest } from "@/types/travel";

/**
 * 시스템 프롬프트의 체크리스트 지시만으로는 관심사별 준비물이 실제로 포함되지
 * 않는 경우가 관측되어, ensureDailyMeals와 같은 방식으로 interests에 맞는
 * 준비물을 코드에서 결정론적으로 추가한다.
 */
const INTEREST_CHECKLIST_ITEMS: Partial<Record<Interest, string[]>> = {
  해변: ["선크림", "래쉬가드", "워터슈즈"],
  술: ["숙취해소제"],
  사진: ["보조배터리", "메모리카드"],
  액티비티: ["운동화", "방수팩"],
};

/** interests에 해당하는 준비물을 추가한다. AI가 이미 같은 이름의 항목을 포함했다면 중복 추가하지 않는다. */
export function enrichChecklistWithInterests(items: ChecklistItem[], interests: Interest[]): ChecklistItem[] {
  const existingTexts = new Set(items.map((item) => item.text));
  const added: ChecklistItem[] = [];

  for (const interest of interests) {
    const texts = INTEREST_CHECKLIST_ITEMS[interest];
    if (!texts) continue;

    for (const text of texts) {
      if (existingTexts.has(text)) continue;
      existingTexts.add(text);
      added.push({ id: `interest-${interest}-${text}`, text, done: false, category: "관심사 맞춤" });
    }
  }

  return [...items, ...added];
}
