# motion-budget: motion that scales with the device

Three levels, decided once and read everywhere:

| level | who gets it | what runs |
| --- | --- | --- |
| `still` | `prefers-reduced-motion`, Data Saver, <= 2 GB RAM or <= 2 cores | Final states only. Nothing moves except what carries meaning (a spinner, a progress bar). |
| `lite` | **everyone else, by default** | Cheap motion: fades, slides, colour, counters. No blur, no parallax, no continuous loops, no per-frame pointer/scroll work. |
| `full` | `?motion=full`, or capable desktops if you pass `allowFull` | Everything. |

`lite` is the default for every device on purpose: in testing,
auto-promoting "fast" devices after an idle frame sample made
them pay for every effect at once and feel *less* responsive. Nothing reads
the user agent.

## Use

The pack wraps the app for you (`src/main.tsx`). Then:

```tsx
import { useMotionBudget } from '@/motion/context';

const { rich, animated } = useMotionBudget();
{rich && <Spotlight />}                         // not affordable -> not mounted
<motion.div animate={animated ? { y: 0 } : undefined} />
```

```tsx
<div className="bg-card/90 rich:bg-card/60 rich:backdrop-blur-xl" />
<section className="lite:shadow-none still:transition-none" />
```

To promote capable desktops automatically, change the injected line to
`<MotionBudgetProvider allowFull>` in the injected `providers.push(...)` line.

Review each level deliberately with `?motion=still`, `?motion=lite`,
`?motion=full`, and run the `review-animations` skill on the `full` layer.
