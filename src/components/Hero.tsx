import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/assets/AuroraBackground';
import { containerVariants, childVariants } from '@/utils/motion';

export interface HeroProps {
  badge?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function Hero({
  badge = 'Webfinity 2026 Starter',
  title = (
    <>
      Ship <span className="text-gradient-brand">award-winning</span> sites
      <br className="hidden sm:block" /> before the clock runs out.
    </>
  ),
  subtitle = 'A premium, reusable frontend foundation — animation system, component library, and design tokens — so competition day is pure design and build.',
  primaryCta = { label: 'Explore components', href: '#features' },
  secondaryCta = { label: 'View the bento', href: '#bento' },
}: HeroProps) {
  return (
    <section
      id="top"
      className="relative flex min-h-[92vh] items-center overflow-hidden pt-28"
    >
      <AuroraBackground />

      <div className="container relative z-10">
        <motion.div
          variants={containerVariants(0.12, 0.1)}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={childVariants} className="flex justify-center">
            <Badge variant="glass" className="mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {badge}
            </Badge>
          </motion.div>

          <motion.h1
            variants={childVariants}
            className="text-gradient font-display text-4xl font-extrabold leading-[1.05] tracking-tightest sm:text-6xl md:text-7xl"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={childVariants}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {subtitle}
          </motion.p>

          <motion.div
            variants={childVariants}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button variant="gradient" size="lg" className="group" asChild>
              <a href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <a href={secondaryCta.href}>{secondaryCta.label}</a>
            </Button>
          </motion.div>

          <motion.p
            variants={childVariants}
            className="mt-8 text-xs uppercase tracking-widest text-muted-foreground/70"
          >
            React · Vite · Tailwind · Framer Motion · GSAP · Lenis
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
