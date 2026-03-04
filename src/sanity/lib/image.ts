import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { sanityClient } from './client';

// ─── Builder ──────────────────────────────────────────────────────────────────

const builder = createImageUrlBuilder(sanityClient);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return a Sanity image URL builder instance for a given source.
 *
 * Chain builder methods for transformations:
 * ```ts
 * urlFor(thumbnail).width(640).height(360).format('webp').url()
 * ```
 *
 * @param source - A Sanity image object, asset reference, or asset ID string.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ─── Next.js Image props ──────────────────────────────────────────────────────

export interface SanityImageProps {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  placeholder: 'blur';
}

/**
 * Generate Next.js `<Image>` compatible props from a Sanity image source.
 *
 * Automatically produces:
 * - A full-quality image URL at the requested dimensions.
 * - A 10×proportional low-quality blurDataURL for the `blur` placeholder.
 *
 * @param source - Sanity image source.
 * @param width  - Target render width in pixels.
 * @param height - Target render height in pixels.
 *
 * @example
 * ```tsx
 * import Image from 'next/image';
 * import { imageProps } from '@/sanity/lib/image';
 *
 * <Image {...imageProps(course.thumbnail, 640, 360)} alt={course.thumbnail.alt} />
 * ```
 */
export function imageProps(
  source: SanityImageSource,
  width: number,
  height: number,
): SanityImageProps {
  const blurWidth = Math.round(width / 64);

  return {
    src: urlFor(source).width(width).height(height).format('webp').url(),
    width,
    height,
    blurDataURL: urlFor(source)
      .width(blurWidth)
      .height(Math.round((blurWidth * height) / width))
      .quality(20)
      .format('webp')
      .url(),
    placeholder: 'blur',
  };
}

/**
 * Generate a srcSet-friendly array of image URLs at common breakpoints.
 * Useful for responsive images outside of Next.js `<Image>`.
 *
 * @param source  - Sanity image source.
 * @param widths  - Array of widths to generate (defaults to standard breakpoints).
 * @param height  - Optional fixed height (maintains aspect ratio if omitted).
 */
export function srcSet(
  source: SanityImageSource,
  widths: number[] = [320, 640, 960, 1280, 1920],
  height?: number,
): string {
  return widths
    .map((w) => {
      const b = urlFor(source).width(w).format('webp');
      const url = height ? b.height(Math.round((w * height) / widths[widths.length - 1]!)).url() : b.url();
      return `${url} ${w}w`;
    })
    .join(', ');
}
