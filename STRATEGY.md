Given your setup, you have a significant advantage:

-   **VS Code**
-   **Claude Pro + Claude Code**
-   **2.5 hours** for development
-   **1.5 hours** for presentation
-   A theme only revealed at the start

The challenge is **not coding ability**. It's **speed of execution,
visual polish, and storytelling**.

------------------------------------------------------------------------

# Before July 10

Don't practice building websites.

Practice building **systems**.

Create a reusable starter template that you can adapt to almost any
theme in minutes.

Your template should already include:

``` text
/public
/src
    components
        Navbar
        Hero
        Features
        Timeline
        Testimonials
        Footer
        CTA
        AnimatedBackground
    assets
```

Also preconfigure

-   Tailwind CSS
-   TypeScript
-   Vite
-   ESLint
-   Prettier

Everything should already run.

------------------------------------------------------------------------

# Your workflow on competition day

## First 10 minutes

Don't touch VS Code.

Think.

Ask Claude:

> We have to build a website on the theme \_\_\_\_\_.
>
> Give me 5 possible concepts.
>
> Which one is the most visually impressive?

Choose ONE.

------------------------------------------------------------------------

## Next 15 minutes

Plan the entire page.

Example

``` text
Hero

↓

Statistics

↓

Interactive section

↓

Timeline

↓

Gallery

↓

Testimonials

↓

CTA

↓

Footer
```

Only after that begin coding.

------------------------------------------------------------------------

## Then use Claude Code

Instead of asking

> Build website

Use prompts like

``` text
Create a premium Apple-style landing page.

Requirements:

- Tailwind
- Responsive
- Dark mode
- Glassmorphism
- Large typography
- Smooth scroll
- Framer Motion animations
- Sticky navbar
- Modern gradients
```

Claude Code performs much better with detailed prompts.

------------------------------------------------------------------------

# Technologies I would use

## React + Vite

Fastest development.

------------------------------------------------------------------------

## Tailwind CSS

Almost mandatory.

No writing CSS for hours.

------------------------------------------------------------------------

## Framer Motion

This is probably the biggest upgrade.

It creates

-   fade-ins
-   stagger animations
-   scroll reveals
-   hero animations
-   hover effects
-   card transitions

using only a few lines.

Examples seen on

-   Apple
-   Stripe
-   Linear
-   Vercel
-   OpenAI

------------------------------------------------------------------------

## GSAP

If you want Apple-level animation.

Examples

-   parallax
-   pinning sections
-   scroll storytelling
-   image sequences

Apple's product pages rely heavily on this type of interaction.

GSAP is more powerful than Framer Motion but also more complex.

------------------------------------------------------------------------

## Lenis

Smooth scrolling.

Apple-like feel instantly.

------------------------------------------------------------------------

## Lucide React

Beautiful icons.

------------------------------------------------------------------------

## React Three Fiber

Only if the theme benefits from 3D.

Examples

-   planets
-   AI
-   robots
-   molecules
-   engineering

Don't force it.

------------------------------------------------------------------------

## Spline

Huge recommendation.

Create interactive 3D scenes.

``` text
https://spline.design
```

Can be embedded into React in minutes.

------------------------------------------------------------------------

## LottieFiles

Professional vector animations.

Useful for

-   loading
-   success
-   AI
-   space
-   environment

------------------------------------------------------------------------

## Rive

Interactive animations.

Used by many startups.

------------------------------------------------------------------------

## Aceternity UI

One of the best component libraries.

Contains

-   animated backgrounds
-   spotlight effects
-   moving cards
-   hero sections
-   beams
-   grids

------------------------------------------------------------------------

## Magic UI

Another excellent collection.

Contains

-   dock
-   marquee
-   particles
-   animated text
-   meteors
-   orbit effects

------------------------------------------------------------------------

## Shadcn UI

Professional components.

Buttons

Dialogs

Cards

Accordions

Everything looks polished.

------------------------------------------------------------------------

## Motion Primitives

Very premium animations.

------------------------------------------------------------------------

# Design inspiration

Don't copy.

Study these before the competition.

-   Apple
-   Stripe
-   Linear
-   Vercel
-   OpenAI
-   Arc Browser
-   Notion
-   Figma
-   Framer
-   Nothing

Notice they all use:

-   lots of whitespace
-   huge headings
-   very few colors
-   subtle animations
-   rounded cards
-   blur
-   gradients
-   clean typography

------------------------------------------------------------------------

# During the 2.5 hours

I would roughly divide the time like this:

  Time           Task
  -------------- ----------------------------------
  0--10 min      Understand theme and brainstorm
  10--20 min     Decide layout and features
  20--90 min     Build complete website
  90--120 min    Add animations and polish
  120--140 min   Test responsiveness and fix bugs
  140--150 min   Prepare demo and presentation

------------------------------------------------------------------------

# Claude Code strategy

Don't ask it to generate the whole project at once.

Instead, iterate:

``` text
Create Hero.
```

↓

``` text
Improve Hero to Apple quality.
```

↓

``` text
Add premium scroll animations.
```

↓

``` text
Make typography more luxurious.
```

↓

``` text
Reduce visual clutter.
```

This incremental approach consistently produces higher-quality results.

------------------------------------------------------------------------

# Presentation round

Most teams will explain **what** they built.

You should explain **why**.

For every major design decision, connect it to the theme:

-   Why this color palette?
-   Why this typography?
-   Why these animations?
-   Why this navigation?
-   Why this user flow?
-   Why this layout?

Judges often reward thoughtful design rationale as much as visual
appeal.

------------------------------------------------------------------------

## My recommendation

Since AI appears to be allowed, treat **Claude Code as your pair
programmer, not your replacement**. You should direct architecture, UX,
and presentation while letting Claude generate and refine implementation
rapidly.

Over the next 12 days, spend 30--60 minutes each day recreating the
landing pages of companies like Apple, Stripe, Linear, Vercel, and
OpenAI. The goal isn't to memorize designs---it's to build an intuition
for spacing, typography, animation timing, and visual hierarchy. When
the theme is revealed on July 10, you'll be able to combine those
patterns into something that feels original, polished, and
competition-ready.
