import { Boxes, Cpu, Globe2, Rocket } from 'lucide-react';
import { Section, SectionHeading } from '@/components/Section';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import { SlideUp } from '@/components/animations';

export function BentoSection() {
  return (
    <Section id="bento" spacing="lg" className="bg-secondary/20">
      <SectionHeading
        eyebrow="Component library"
        title="A bento built for storytelling"
        description="Mix spans and rows to compose dense, magazine-style layouts in minutes."
      />

      <SlideUp className="mt-14">
        <BentoGrid className="auto-rows-[minmax(200px,auto)]">
          <BentoCard
            colSpan={2}
            rowSpan={2}
            eyebrow="Featured"
            title="Design that performs"
            description="Lighthouse-friendly out of the box. Smooth 60fps animations that never block the main thread."
            className="justify-between"
          >
            <div className="mt-6 flex items-end gap-2">
              {[40, 65, 50, 80, 70, 95].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-full rounded-md bg-gradient-to-t from-primary/40 to-accent/60"
                />
              ))}
            </div>
          </BentoCard>

          <BentoCard
            eyebrow="Speed"
            title="Instant HMR"
            description="Vite's dev server keeps you in flow."
          >
            <Rocket className="mt-4 h-8 w-8 text-primary" />
          </BentoCard>

          <BentoCard
            eyebrow="Composable"
            title="40+ exports"
            description="Import once from a single barrel."
          >
            <Boxes className="mt-4 h-8 w-8 text-accent" />
          </BentoCard>

          <BentoCard
            colSpan={2}
            eyebrow="Responsive"
            title="Looks right on every screen"
            description="Mobile-first utilities and a centered container scale the whole layout with zero extra work."
          >
            <Globe2 className="mt-4 h-8 w-8 text-primary" />
          </BentoCard>

          <BentoCard
            eyebrow="Powered by"
            title="Modern stack"
            description="React 18, TS, Tailwind."
          >
            <Cpu className="mt-4 h-8 w-8 text-accent" />
          </BentoCard>
        </BentoGrid>
      </SlideUp>
    </Section>
  );
}
