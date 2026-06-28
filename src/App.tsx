import { RootLayout } from '@/layouts/RootLayout';
import { Hero } from '@/components/Hero';
import {
  FeaturesSection,
  BentoSection,
  MetricsSection,
  ShowcaseSection,
  TimelineSection,
  FAQSection,
  CTASection,
} from '@/sections';

export default function App() {
  return (
    <RootLayout>
      <Hero />
      <FeaturesSection />
      <BentoSection />
      <MetricsSection />
      <ShowcaseSection />
      <TimelineSection />
      <FAQSection />
      <CTASection />
    </RootLayout>
  );
}
