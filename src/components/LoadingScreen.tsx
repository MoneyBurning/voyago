/** AI 일정 생성 중 표시되는 로딩 화면 */
export default function LoadingScreen() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-16 text-center shadow-2xl backdrop-blur-xl">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/30" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
      </div>
      <div className="space-y-2">
        <p className="font-display text-xl text-white">AI가 여행을 설계하는 중입니다</p>
        <p className="font-mono text-sm text-subtext">
          동선 · 예산 · 숨은 맛집을 계산하고 있어요…
        </p>
      </div>
    </div>
  );
}
