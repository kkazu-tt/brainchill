import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AIRecommendationCard } from "@/features/dashboard/components/AIRecommendationCard";
import { BrainFatigueScoreCard } from "@/features/dashboard/components/BrainFatigueScoreCard";
import { Header } from "@/features/dashboard/components/Header";
import { TrendChartCard } from "@/features/dashboard/components/TrendChartCard";
import { WearableCards } from "@/features/dashboard/components/WearableCards";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardScreen() {
  const {
    score,
    snapshot,
    recommendation,
    trend,
    completeRecommendation,
  } = useDashboardData();

  return (
    <ScreenContainer>
      <Header />
      <BrainFatigueScoreCard score={score} />
      <WearableCards snapshot={snapshot} />
      <AIRecommendationCard
        recommendation={recommendation}
        onComplete={completeRecommendation}
      />
      <TrendChartCard trend={trend} />
    </ScreenContainer>
  );
}
