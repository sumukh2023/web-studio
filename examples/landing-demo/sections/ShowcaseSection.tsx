import { ArrowRight, Heart, Star, Download } from 'lucide-react';
import { Section, SectionHeading } from '@/components/Section';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/assets/Avatar';
import { HoverLift, SlideUp } from '@/components/animations';

const people = ['Ava Chen', 'Leo Park', 'Mira Sol', 'Noah Reed'];

export function ShowcaseSection() {
  return (
    <Section spacing="lg">
      <SectionHeading
        eyebrow="Primitives"
        title="Buttons, badges & surfaces"
        description="The building blocks, each themeable via the same design tokens."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {/* Buttons */}
        <SlideUp>
          <GlassCard className="h-full" spotlight={false}>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Buttons
            </h3>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="gradient">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="default">Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="glass">Glass</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="secondary" size="sm">
                Small
              </Button>
              <Button size="icon" variant="outline" aria-label="Favorite">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </SlideUp>

        {/* Badges */}
        <SlideUp delay={0.08}>
          <GlassCard className="h-full" spotlight={false}>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Badges
            </h3>
            <div className="mt-5 flex flex-wrap gap-3">
              <Badge>
                <Star className="h-3 w-3" /> Default
              </Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="glass">Glass</Badge>
              <Badge variant="muted">Muted</Badge>
            </div>
            <h3 className="mt-8 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Avatars
            </h3>
            <div className="mt-5 flex -space-x-3">
              {people.map((p) => (
                <Avatar key={p} name={p} />
              ))}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background">
                +9
              </span>
            </div>
          </GlassCard>
        </SlideUp>

        {/* Interactive card */}
        <SlideUp delay={0.16}>
          <HoverLift className="h-full">
            <GlassCard className="flex h-full flex-col justify-between">
              <div>
                <Badge variant="accent" className="mb-4">
                  Pro tip
                </Badge>
                <h3 className="font-heading text-xl font-semibold tracking-tight">
                  Hover me
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  This card lifts with a soft spring and reveals a
                  cursor-tracking spotlight — composed from HoverLift +
                  GlassCard.
                </p>
              </div>
              <Button variant="outline" className="mt-6 w-full">
                <Download className="h-4 w-4" /> Download assets
              </Button>
            </GlassCard>
          </HoverLift>
        </SlideUp>
      </div>
    </Section>
  );
}
