import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { HeroSection } from './sections/HeroSection';
import { LivePreviewSection } from './sections/LivePreviewSection';
import { ProblemSection } from './sections/ProblemSection';
import { IntelligenceSection } from './sections/IntelligenceSection';
import { RecoveryWorkflowSection } from './sections/RecoveryWorkflowSection';
import { FaultDemoSection } from './sections/FaultDemoSection';
import { CapabilityGridSection } from './sections/CapabilityGridSection';
import { ArchitectureSection } from './sections/ArchitectureSection';
import { ImpactSection } from './sections/ImpactSection';
import { TechStackSection } from './sections/TechStackSection';
import { SustainabilitySection } from './sections/SustainabilitySection';
import { FinalCtaSection } from './sections/FinalCtaSection';

export const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans text-[#172535] antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <LivePreviewSection />
        <ProblemSection />
        <IntelligenceSection />
        <RecoveryWorkflowSection />
        <FaultDemoSection />
        <CapabilityGridSection />
        <ArchitectureSection />
        <ImpactSection />
        <TechStackSection />
        <SustainabilitySection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
};
