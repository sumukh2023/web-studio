import { Section, SectionHeading } from '@/components/Section';
import { Timeline } from '@/components/Timeline';

const items = [
  {
    time: '00:00',
    title: 'Theme drops',
    description:
      'Clone the starter, swap the design tokens to match the brief, and you already have a themed shell.',
  },
  {
    time: '00:20',
    title: 'Wireframe with components',
    description:
      'Drop in Hero, Bento, Stats and FAQ blocks. Rearrange spans to match your concept.',
  },
  {
    time: '01:30',
    title: 'Polish & animate',
    description:
      'Layer in reveals, cursor glow and smooth scroll. The premium feel comes for free.',
  },
  {
    time: '02:30',
    title: 'Ship & present',
    description:
      'Build passes, no errors, deploy-ready for Vercel. Walk into the presentation confident.',
  },
];

export function TimelineSection() {
  return (
    <Section id="timeline" spacing="lg" className="bg-secondary/20">
      <SectionHeading
        eyebrow="Competition day"
        title="From theme to trophy in 2.5 hours"
        description="The starter is designed around the clock — every block removes a decision you'd otherwise make under pressure."
      />
      <div className="mt-16">
        <Timeline items={items} />
      </div>
    </Section>
  );
}
