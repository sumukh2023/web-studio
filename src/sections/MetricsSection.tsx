import { Section } from '@/components/Section';
import { Stats } from '@/components/Stats';
import { Marquee } from '@/components/Marquee';
import { FadeIn } from '@/components/animations';

const stats = [
  { value: 2.5, suffix: 'h', label: 'To design & build', decimals: 1 },
  { value: 40, suffix: '+', label: 'Reusable exports' },
  { value: 60, suffix: 'fps', label: 'Animation target' },
  { value: 100, suffix: '%', label: 'TypeScript' },
];

const logos = [
  'Apple',
  'Stripe',
  'Linear',
  'Framer',
  'Vercel',
  'Notion',
  'Arc',
];

export function MetricsSection() {
  return (
    <Section id="stats" spacing="lg">
      <FadeIn>
        <Stats stats={stats} />
      </FadeIn>

      <FadeIn delay={0.1} className="mt-16">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground/70">
          Quality benchmarked against
        </p>
        <Marquee className="mt-6">
          {logos.map((logo) => (
            <span
              key={logo}
              className="font-heading text-2xl font-semibold text-muted-foreground/40 transition-colors hover:text-foreground"
            >
              {logo}
            </span>
          ))}
        </Marquee>
      </FadeIn>
    </Section>
  );
}
