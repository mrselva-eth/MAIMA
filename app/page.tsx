'use client';

import Navbar from '@/components/navbar';
import Hero from '@/components/sections/hero';
import Features from '@/components/sections/features';
import MaimaImageSection from '@/components/sections/maima-image-section';
import HowItWorks from '@/components/sections/how-it-works';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16">
        <Hero />
        <Features />
        <MaimaImageSection />
        <HowItWorks />
      </div>

      <Footer />
    </div>
  );
}
