import { AppFooter } from "@/components/layout/AppFooter";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingNav } from "@/components/landing/LandingNav";
import { Marquee } from "@/components/landing/Marquee";

// Landing estática: Server Components puros, sin JavaScript propio.
export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <FinalCta />
      </main>
      <AppFooter />
    </div>
  );
}
