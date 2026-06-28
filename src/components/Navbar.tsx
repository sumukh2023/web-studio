import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarProps {
  brand?: React.ReactNode;
  links?: NavLink[];
  cta?: { label: string; href: string };
}

const defaultLinks: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Bento', href: '#bento' },
  { label: 'Stats', href: '#stats' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar({
  brand = 'Webfinity',
  links = defaultLinks,
  cta = { label: 'Get started', href: '#cta' },
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-3">
      <nav
        className={cn(
          'container flex h-14 items-center justify-between rounded-full px-4 transition-all duration-300',
          scrolled
            ? 'glass shadow-elevated'
            : 'border border-transparent bg-transparent'
        )}
      >
        <a
          href="#top"
          className="flex items-center gap-2 font-heading text-base font-bold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-black text-white">
            W
          </span>
          {brand}
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Button size="sm" variant="gradient" asChild>
            <a href={cta.href}>{cta.label}</a>
          </Button>
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="container mt-2 md:hidden"
          >
            <ul className="glass flex flex-col gap-1 rounded-2xl p-3">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-1">
                <Button variant="gradient" className="w-full" asChild>
                  <a href={cta.href} onClick={() => setOpen(false)}>
                    {cta.label}
                  </a>
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
