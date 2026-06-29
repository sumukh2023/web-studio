import { Section, SectionHeading } from '@/components/Section';
import { Testimonials } from '@/components/Testimonials';

const items = [
  {
    quote:
      'We re-skinned the entire starter to our theme and shipped a polished site with time to spare. The component library did the heavy lifting.',
    name: 'Ava Chen',
    role: 'Frontend Lead',
    rating: 5,
  },
  {
    quote:
      'The animation system alone is worth it — scroll reveals and smooth scrolling that feel straight off a Linear or Vercel page.',
    name: 'Leo Park',
    role: 'Design Engineer',
    rating: 5,
  },
  {
    quote:
      'Token-driven theming meant a full rebrand was a five-minute edit, not an afternoon. Exactly what you want under a deadline.',
    name: 'Mira Sol',
    role: 'Product Designer',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <Section spacing="lg" className="bg-secondary/20">
      <SectionHeading
        eyebrow="Loved by builders"
        title="What people say"
        description="A reusable quote section — swap the copy and names for any theme."
      />
      <div className="mt-14">
        <Testimonials items={items} />
      </div>
    </Section>
  );
}
