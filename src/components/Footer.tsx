import { Github, Twitter, Linkedin } from 'lucide-react';
import { Section } from '@/components/Section';

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  brand?: string;
  tagline?: string;
  columns?: FooterColumn[];
}

const defaultColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Components', href: '#bento' },
      { label: 'Showcase', href: '#stats' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Guides', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
];

export function Footer({
  brand = 'Webfinity',
  tagline = 'A premium frontend starter for hackathons and design competitions.',
  columns = defaultColumns,
}: FooterProps) {
  return (
    <Section as="footer" spacing="md" className="border-t border-border">
      <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <a
            href="#top"
            className="flex items-center gap-2 font-heading text-lg font-bold"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-black text-white">
              W
            </span>
            {brand}
          </a>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {tagline}
          </p>
          <div className="mt-5 flex gap-3">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-heading text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {brand}. Built for the win.
        </p>
        <p>Crafted with React, Vite & Tailwind.</p>
      </div>
    </Section>
  );
}
