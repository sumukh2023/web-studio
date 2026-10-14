import { useId, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/utils/cn';

export interface FAQItem {
  question: string;
  /**
   * A node, not a string: some answers have to point somewhere (a link to the
   * booking page, say) and an answer that names a page without linking to it
   * makes the reader go hunting. Plain strings still work unchanged.
   */
  answer: ReactNode;
}

export interface FAQProps {
  items: FAQItem[];
  className?: string;
}

/** A clean accordion FAQ built on Radix. */
export function FAQ({ items, className }: FAQProps) {
  const [openItem, setOpenItem] = useState('item-0');
  const id = useId();

  return (
    <Accordion
      type="single"
      collapsible
      className={cn('mx-auto w-full max-w-2xl', className)}
      value={openItem}
      onValueChange={setOpenItem}
    >
      {items.map((item, i) => {
        const value = `item-${i}`;
        const triggerId = `${id}-trigger-${i}`;
        const contentId = `${id}-content-${i}`;
        const open = openItem === value;

        return (
          <AccordionItem key={item.question} value={value}>
            <AccordionTrigger id={triggerId} aria-controls={contentId}>
              {item.question}
            </AccordionTrigger>
            <AccordionContent
              id={contentId}
              aria-labelledby={triggerId}
              open={open}
            >
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
