import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import useMeasure from 'react-use-measure';
import { cn } from '@/utils/cn';

export type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  className?: string;
};

type SliderStyle = CSSProperties & {
  '--infinite-slider-duration': string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 100,
  speedOnHover,
  direction = 'horizontal',
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerRef, container] = useMeasure();
  const [unitRef, unit] = useMeasure();
  const [groupRef, group] = useMeasure();
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fonts = document.fonts;

    if (!fonts) {
      setFontsReady(true);
      return;
    }

    void fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const viewportSize =
    direction === 'horizontal' ? container.width : container.height;
  const unitSize = direction === 'horizontal' ? unit.width : unit.height;
  const repetitions = unitSize
    ? Math.max(1, Math.ceil((viewportSize + gap) / (unitSize + gap)))
    : 1;
  const loopDistance = direction === 'horizontal' ? group.width : group.height;
  const duration = loopDistance > 0 && speed > 0 ? loopDistance / speed : 1;
  const ready = fontsReady && loopDistance > 0 && speed > 0;

  const setPlaybackRate = useCallback((rate: number) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      return;

    for (const animation of trackRef.current?.getAnimations() ?? []) {
      animation.updatePlaybackRate(rate);
    }
  }, []);

  const hoverProps =
    speedOnHover && speedOnHover > 0 && speed > 0
      ? {
          onPointerEnter: () => setPlaybackRate(speedOnHover / speed),
          onPointerLeave: () => setPlaybackRate(1),
        }
      : {};

  const trackStyle: SliderStyle = {
    '--infinite-slider-duration': `${duration}s`,
    animationDirection: reverse ? 'reverse' : 'normal',
    animationPlayState: ready ? 'running' : 'paused',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
  };
  const groupStyle: CSSProperties = {
    gap: `${gap}px`,
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    ...(direction === 'horizontal'
      ? { paddingRight: `${gap}px` }
      : { paddingBottom: `${gap}px` }),
  };
  const unitStyle: CSSProperties = {
    gap: `${gap}px`,
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
  };

  const groupContent = (duplicate: boolean) =>
    Array.from({ length: repetitions }, (_, index) => (
      <div
        key={index}
        ref={!duplicate && index === 0 ? unitRef : undefined}
        aria-hidden={duplicate || index > 0 ? true : undefined}
        className="flex shrink-0"
        style={unitStyle}
      >
        {children}
      </div>
    ));

  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)}>
      <div
        ref={trackRef}
        className={cn(
          'flex w-max will-change-transform motion-reduce:transform-none motion-reduce:animate-none',
          direction === 'horizontal'
            ? 'animate-infinite-slider-x'
            : 'animate-infinite-slider-y'
        )}
        style={trackStyle}
        {...hoverProps}
      >
        <div ref={groupRef} className="flex shrink-0" style={groupStyle}>
          {groupContent(false)}
        </div>
        <div aria-hidden="true" className="flex shrink-0" style={groupStyle}>
          {groupContent(true)}
        </div>
      </div>
    </div>
  );
}
