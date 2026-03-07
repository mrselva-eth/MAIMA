'use client';

import Navbar from '@/components/sections/navbar';
import Hero from '@/components/sections/hero';
import SupportedOperations from '@/components/sections/supported-operations';
import Features from '@/components/sections/features';
import MaimaImageSection from '@/components/sections/maima-image-section';
import Integrations from '@/components/sections/integrations';
import HowItWorks from '@/components/sections/how-it-works';
import CtaSection from '@/components/sections/cta-section';
import ApiDevelopers from '@/components/sections/api-developers';
import Footer from '@/components/sections/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16">
        <Hero />
        <SupportedOperations />
        <Features />
        <MaimaImageSection />
        <Integrations />
        <HowItWorks />
        <ApiDevelopers />
        <CtaSection />
      </div>

      <Footer />
    </div>
  );
}
