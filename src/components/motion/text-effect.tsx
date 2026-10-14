import { cn } from '@/utils/cn';
import { readDeviceTier } from '@/hooks/useDeviceTier';
import {
  AnimatePresence,
  motion
} from 'framer-motion';
import type {
  TargetAndTransition,
  Transition,
  Variant,
  Variants,
} from 'framer-motion'
import React from 'react';

export type PresetType = 'blur' | 'fade-in-blur' | 'scale' | 'fade' | 'slide';

export type PerType = 'word' | 'char' | 'line';

export type TextEffectProps = {
  children: string;
  per?: PerType;
  as?: keyof React.JSX.IntrinsicElements;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: PresetType;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  segmentWrapperClassName?: string;
  containerTransition?: Transition;
  segmentTransition?: Transition;
  style?: React.CSSProperties;
};

const defaultStaggerTimes: Record<PerType, number> = {
  char: 0.03,
  word: 0.05,
  line: 0.1,
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
  exit: { opacity: 0 },
};

/* -------------------------------------------------------------------- *
 *  THE BLUR IS OPTIONAL, AND ON A PHONE IT IS OFF.
 *
 *  This component splits its text and animates every PIECE of it — with
 *  `per="word"` on a heading that is a dozen elements, and a landing page
 *  easily carries twenty at once. Opacity and transform are compositor
 *  properties and cost nothing per frame; `filter` is not, and forces each
 *  run to be re-rasterised on every frame it changes. Twenty text runs
 *  re-rastered per frame, next to a decoding video and a smooth-scroll loop,
 *  is the stutter that gets reported as "not smooth on my phone".
 *
 *  So the blur is treated as the garnish it is. The movement and the fade —
 *  the parts that carry the intent — run everywhere; the blur runs where it
 *  is free. `readDeviceTier()` (hooks/useDeviceTier.ts) is the one probe
 *  every effect asks, so a device gets one consistent answer about what it
 *  can afford.
 *
 *  Read at module scope, deliberately: these variants are static objects and
 *  the tier cannot change within a session, so paying for a hook and a
 *  re-render per instance would cost more than the branch saves.
 * -------------------------------------------------------------------- */
const BLUR_OK = readDeviceTier() === 'full';
const blurred = (radius: string) => (BLUR_OK ? { filter: `blur(${radius})` } : {});

const presetVariants: Record<
  PresetType,
  { container: Variants; item: Variants }
> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, ...blurred('12px') },
      visible: { opacity: 1, ...blurred('0px') },
      exit: { opacity: 0, ...blurred('12px') },
    },
  },
  'fade-in-blur': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20, ...blurred('12px') },
      visible: { opacity: 1, y: 0, ...blurred('0px') },
      exit: { opacity: 0, y: 20, ...blurred('12px') },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  },
};

const AnimationComponent: React.FC<{
  segment: string;
  variants: Variants;
  per: 'line' | 'word' | 'char';
  segmentWrapperClassName?: string;
}> = React.memo(({ segment, variants, per, segmentWrapperClassName }) => {
  /**
   * A SEGMENT THAT IS ONLY WHITESPACE MUST NOT BE AN `inline-block`.
   *
   * LOCAL MODIFICATION to the vendored component (upstream still has the bug).
   * `splitText` splits on `/(\s+)/`, so every gap between words becomes its own
   * segment. Rendered with `inline-block whitespace-pre` that gap is an ATOMIC
   * BOX: `pre` stops it collapsing and `inline-block` stops the line breaking
   * inside it, so when a line happens to wrap at that gap the space is carried
   * onto the next line and PAINTED there. Measured on a centred statement at
   * 390px: one wrapped row began 7.5px right of every other row, the exact
   * width of the carried space.
   *
   * As a plain inline span the space is ordinary collapsible whitespace in the
   * parent's inline formatting context: one space between words, and nothing at
   * all at a line end, which is what every other piece of text on the page does.
   *
   * IT IS STILL A `motion.span` WITH THE SAME `variants`, deliberately. The
   * container staggers its animated CHILDREN, so dropping these from the tree
   * would renumber every stagger index and make each heading on the site
   * animate about twice as fast — a site-wide motion change nobody asked for.
   * Keeping the element and changing only its display keeps every existing
   * timing byte-identical while the wrapping is fixed.
   */
  const isGap = per !== 'line' && /^\s+$/.test(segment);

  const content = isGap ? (
    <motion.span aria-hidden='true' variants={variants}>
      {segment}
    </motion.span>
  ) : per === 'line' ? (
      <motion.span variants={variants} className='block'>
        {segment}
      </motion.span>
    ) : per === 'word' ? (
      <motion.span
        aria-hidden='true'
        variants={variants}
        className='inline-block whitespace-pre'
      >
        {segment}
      </motion.span>
    ) : (
      <motion.span className='inline-block whitespace-pre'>
        {segment.split('').map((char, charIndex) => (
          <motion.span
            key={`char-${charIndex}`}
            aria-hidden='true'
            variants={variants}
            className='inline-block whitespace-pre'
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );

  if (!segmentWrapperClassName) {
    return content;
  }

  const defaultWrapperClassName = per === 'line' ? 'block' : 'inline-block';

  return (
    <span className={cn(defaultWrapperClassName, segmentWrapperClassName)}>
      {content}
    </span>
  );
});

AnimationComponent.displayName = 'AnimationComponent';

const splitText = (text: string, per: PerType) => {
  if (per === 'line') return text.split('\n');
  return text.split(/(\s+)/);
};

const hasTransition = (
  variant?: Variant
): variant is TargetAndTransition & { transition?: Transition } => {
  if (!variant) return false;
  return (
    typeof variant === 'object' && 'transition' in variant
  );
};

const createVariantsWithTransition = (
  baseVariants: Variants,
  transition?: Transition & { exit?: Transition }
): Variants => {
  if (!transition) return baseVariants;

  const { exit: _, ...mainTransition } = transition;

  return {
    ...baseVariants,
    visible: {
      ...baseVariants.visible,
      transition: {
        ...(hasTransition(baseVariants.visible)
          ? baseVariants.visible.transition
          : {}),
        ...mainTransition,
      },
    },
    exit: {
      ...baseVariants.exit,
      transition: {
        ...(hasTransition(baseVariants.exit)
          ? baseVariants.exit.transition
          : {}),
        ...mainTransition,
        staggerDirection: -1,
      },
    },
  };
};

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  variants,
  className,
  preset = 'fade',
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  segmentWrapperClassName,
  containerTransition,
  segmentTransition,
  style,
}: TextEffectProps) {
  const segments = splitText(children, per);
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  const baseVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };

  const stagger = defaultStaggerTimes[per] / speedReveal;

  const baseDuration = 0.3 / speedSegment;

  const customStagger = hasTransition(variants?.container?.visible ?? {})
    ? (variants?.container?.visible as TargetAndTransition).transition
        ?.staggerChildren
    : undefined;

  const customDelay = hasTransition(variants?.container?.visible ?? {})
    ? (variants?.container?.visible as TargetAndTransition).transition
        ?.delayChildren
    : undefined;

  const computedVariants = {
    container: createVariantsWithTransition(
      variants?.container || baseVariants.container,
      {
        staggerChildren: customStagger ?? stagger,
        delayChildren: customDelay ?? delay,
        ...containerTransition,
        exit: {
          staggerChildren: customStagger ?? stagger,
          staggerDirection: -1,
        },
      }
    ),
    item: createVariantsWithTransition(variants?.item || baseVariants.item, {
      duration: baseDuration,
      ...segmentTransition,
    }),
  };

  return (
    <AnimatePresence mode='popLayout'>
      {trigger && (
        <MotionTag
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={computedVariants.container}
          className={className}
          onAnimationComplete={onAnimationComplete}
          onAnimationStart={onAnimationStart}
          style={style}
        >
          {per !== 'line' ? <span className='sr-only'>{children}</span> : null}
          {segments.map((segment, index) => (
            <AnimationComponent
              key={`${per}-${index}-${segment}`}
              segment={segment}
              variants={computedVariants.item}
              per={per}
              segmentWrapperClassName={segmentWrapperClassName}
            />
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}
