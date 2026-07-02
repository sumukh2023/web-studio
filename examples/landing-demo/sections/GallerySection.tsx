import { Section, SectionHeading } from '@/components/Section';
import { Gallery } from '@/components/Gallery';

const items = [
  { caption: 'Opening keynote', tall: true },
  { caption: 'Main stage' },
  { caption: 'Workshops' },
  { caption: 'Networking lounge' },
  { caption: 'After-party', tall: true },
  { caption: 'Awards night' },
];

export function GallerySection() {
  return (
    <Section spacing="lg">
      <SectionHeading
        eyebrow="Gallery"
        title="Moments worth showing"
        description="Drop in real images via the `src` prop, or ship the gradient placeholders as-is."
      />
      <div className="mt-14">
        <Gallery items={items} columns={3} />
      </div>
    </Section>
  );
}
