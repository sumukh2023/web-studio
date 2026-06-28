import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/utils/cn';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  items: FAQItem[];
  className?: string;
}

/** A clean accordion FAQ built on Radix. */
export function FAQ({ items, className }: FAQProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn('mx-auto w-full max-w-2xl', className)}
      defaultValue="item-0"
    >
      {items.map((item, i) => (
        <AccordionItem key={item.question} value={`item-${i}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
