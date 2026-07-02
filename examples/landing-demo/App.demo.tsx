import { RootLayout } from '@/layouts/RootLayout';
import { Hero } from '@/components/Hero';
import {
  FeaturesSection,
  BentoSection,
  MetricsSection,
  ShowcaseSection,
  TestimonialsSection,
  GallerySection,
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
      <GallerySection />
      <TimelineSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </RootLayout>
  );
}
