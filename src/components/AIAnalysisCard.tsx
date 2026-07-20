import { Sparkles } from "lucide-react";
import type { AIAnalysis, TravelInput } from "@/types/travel";

interface AIAnalysisCardProps {
  input: TravelInput;
  aiAnalysis: AIAnalysis;
  /** 예상 만족도 (%) — score.satisfaction을 그대로 사용 */
  satisfaction: number;
}

/** 한글 단어가 받침으로 끝나는지 확인해 을/를 조사를 고른다 */
function hasBatchim(word: string): boolean {
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return false;
  return (lastChar - 0xac00) % 28 !== 0;
}

/** 결과 페이지 최상단 "AI가 분석했습니다" 카드 */
export default function AIAnalysisCard({ input, aiAnalysis, satisfaction }: AIAnalysisCardProps) {
  const particle = hasBatchim(input.people) ? "을" : "를";

  return (
    <section className="rounded-3xl border border-gold/30 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          🤖
        </span>
        <p className="font-display text-xl text-white">AI가 분석했습니다</p>
      </div>

      <p className="mt-4 text-white">
        안녕하세요! {input.people}
        {particle} 위한 {input.duration} {input.destination} 여행을 설계했습니다.
      </p>

      {aiAnalysis.analysis ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="mb-1 text-xs text-subtext">관심사 분석</p>
          <p className="font-mono text-sm text-gold">{aiAnalysis.analysis}</p>
        </div>
      ) : null}

      {aiAnalysis.aiComment ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-subtext">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-gold" />
          {aiAnalysis.aiComment}
        </p>
      ) : null}

      {aiAnalysis.reasons.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {aiAnalysis.reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4">
        <span className="text-sm text-subtext">예상 만족도</span>
        <span className="font-mono text-2xl font-bold text-gold">{satisfaction}%</span>
      </div>
    </section>
  );
}
