import { Section, SectionHeading } from '@/components/Section';
import { FAQ } from '@/components/FAQ';

const items = [
  {
    question: 'How fast can I theme this for a new brief?',
    answer:
      'Every visual decision lives in CSS variables in globals.css and tailwind.config.ts — colors, radius, fonts. Edit a handful of tokens and the whole site re-skins instantly.',
  },
  {
    question: 'Which animation library should I reach for?',
    answer:
      'Framer Motion drives the declarative wrappers (FadeIn, SlideUp, Stagger). GSAP powers the Reveal helper for scroll choreography. Lenis adds smooth scrolling globally. Use whichever fits the moment.',
  },
  {
    question: 'Is it accessible and responsive out of the box?',
    answer:
      'Yes — semantic HTML, visible focus rings, reduced-motion handling, and Radix primitives for the interactive bits. Layouts are mobile-first and scale up via a centered container.',
  },
  {
    question: 'Can I add more shadcn/ui components later?',
    answer:
      'Absolutely. components.json is configured, so `npx shadcn@latest add <component>` drops new primitives straight into src/components/ui with the right aliases.',
  },
];

export function FAQSection() {
  return (
    <Section id="faq" spacing="lg">
      <SectionHeading
        eyebrow="FAQ"
        title="The details, answered"
        description="Everything you'd want to know before the timer starts."
      />
      <div className="mt-12">
        <FAQ items={items} />
      </div>
    </Section>
  );
}
