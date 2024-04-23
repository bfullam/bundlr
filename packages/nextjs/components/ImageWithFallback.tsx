import { useState } from "react";
import Image from "next/image";

export const ImageWithFallback = ({ src, fallback, ...props }: any) => {
  const [isErrored, setIsErrored] = useState(false);
  if (isErrored) {
    return fallback;
  }

  return <Image src={src} onError={() => setIsErrored(true)} alt={props.alt} {...props} />;
};
