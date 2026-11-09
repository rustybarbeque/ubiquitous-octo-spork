"use client";

import { useState } from "react";
import Image from "next/image";

/** Shown when a product's image URL is empty or fails to load. */
export const FALLBACK_PRODUCT_IMAGE = "/product-image-fallback.svg";

interface ProductImageProps {
  src: string;
  alt: string;
  /** Passed to next/image; the parent must be positioned and sized. */
  sizes: string;
  className?: string;
  /** Called when `src` fails and the fallback is shown instead. */
  onLoadError?: () => void;
}

/**
 * A product picture from any host. If the URL is broken, a local
 * placeholder is shown instead of the browser's broken-image icon.
 */
export default function ProductImage({ src, alt, sizes, className = "object-cover", onLoadError }: ProductImageProps) {
  // Remember which src failed rather than a boolean, so a new src (e.g. an
  // admin editing the URL) gets a fresh attempt without an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  const fail = () => {
    if (showFallback) return;
    setFailedSrc(src);
    onLoadError?.();
  };

  return (
    <Image
      src={showFallback ? FALLBACK_PRODUCT_IMAGE : src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={fail}
      // A server-rendered image can fail before React hydrates and attaches
      // onError; a finished load with no pixels is that missed failure.
      ref={(img) => {
        if (img && img.complete && img.naturalWidth === 0) fail();
      }}
    />
  );
}
