import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getOnboardingData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "redditalpha · 个性化引导",
  description: "几步选择，让 redditalpha 为你生成专属的 Reddit 美股情报。",
};

export default function OnboardingPage() {
  const { sectors, tickers } = getOnboardingData();
  return <OnboardingFlow sectors={sectors} tickers={tickers} />;
}
