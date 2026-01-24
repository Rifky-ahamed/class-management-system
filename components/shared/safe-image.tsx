"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
}

export const SafeImage = ({ src, alt, onError, ...props }: SafeImageProps) => {
  const [imageSrc, setImageSrc] = useState(src || "/placeholder.png");

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageSrc("/placeholder.png");
    onError?.(e);
  };

  return <Image src={imageSrc} alt={alt} onError={handleError} {...props} />;
};
