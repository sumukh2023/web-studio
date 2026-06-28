import {
  Gauge,
  Palette,
  Sparkles,
  Accessibility,
  Layers,
  Wand2,
} from 'lucide-react';
import { Section, SectionHeading } from '@/components/Section';
import { FeatureCard } from '@/components/FeatureCard';
import { StaggerChildren, StaggerItem } from '@/components/animations';

const features = [
  {
    icon: Gauge,
    title: 'Zero setup time',
    description:
      'Vite, TypeScript, Tailwind and the full animation stack are pre-wired. Clone and start designing.',
  },
  {
    icon: Wand2,
    title: 'Animation system',
    description:
      'Composable FadeIn, SlideUp, ScaleIn, Stagger and GSAP Reveal wrappers with shared motion tokens.',
  },
  {
    icon: Layers,
    title: 'Composable components',
    description:
      'A polished library — bento, glass cards, timeline, stats, FAQ — built to be reshaped, not rewritten.',
  },
  {
    icon: Palette,
    title: 'Token-driven theming',
    description:
      'Every color, radius and font is a CSS variable. Re-skin the entire site by editing one file.',
  },
  {
    icon: Accessibility,
    title: 'Accessible by default',
    description:
      'Semantic markup, focus states, reduced-motion support and Radix primitives baked in.',
  },
  {
    icon: Sparkles,
    title: 'Premium polish',
    description:
      'Cursor glow, aurora backdrops, spotlight cards and buttery smooth scroll — the details judges notice.',
  },
];

export function FeaturesSection() {
  return (
    <Section id="features" spacing="lg">
      <SectionHeading
        eyebrow="Why this starter"
        title="Everything you need, nothing you'll fight"
        description="A foundation tuned for speed under pressure — so the only thing left on competition day is the design."
      />
      <StaggerChildren className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <StaggerItem key={f.title}>
            <FeatureCard {...f} />
          </StaggerItem>
        ))}
      </StaggerChildren>
    </Section>
  );
}
