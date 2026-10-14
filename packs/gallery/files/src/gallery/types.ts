export type Photo = {
  /** Stable and unique: the lightbox crossfades by it. */
  id: string;
  /** A path under public/, so the images pack can serve AVIF/WebP. */
  src: string;
  /** What the photo shows, for screen readers. Never "image of". */
  alt: string;
  /** Intrinsic size: reserves the space (no layout shift) and sets aspect. */
  width: number;
  height: number;
  /** Optional caption; names the lightbox dialog for screen readers. */
  caption?: string;
};
