import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-border', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-5 text-left font-heading text-base font-medium transition-all hover:text-primary [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

type AccordionContentProps = React.ComponentPropsWithoutRef<'div'> & {
  open: boolean;
};

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, children, open, style, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () =>
      setContentHeight(content.getBoundingClientRect().height);
    measure();

    if (!window.ResizeObserver) return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role="region"
      aria-hidden={!open}
      {...(open ? {} : ({ inert: '' } as Record<string, string>))}
      data-state={open ? 'open' : 'closed'}
      className="faq-content overflow-hidden text-sm transition-[height] ease-out [transition-duration:250ms] motion-reduce:[transition-duration:0ms]"
      style={{ ...style, height: open ? contentHeight : 0 }}
      {...props}
    >
      <div
        ref={contentRef}
        className={cn('pb-5 pr-8 text-muted-foreground', className)}
      >
        {children}
      </div>
    </div>
  );
});
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
