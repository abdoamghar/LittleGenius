import React from "react";
import { Image } from "@/components/ui/image";
import { artFor } from "@/lib/illustrations";
import { cn } from "@/lib/utils";

/** Reusable course / lesson artwork in a soft paper frame. */
export default function SubjectArt({ artKey, className, imageClassName, rounded = "rounded-3xl", tone = "bg-cream" }) {
  const art = artFor(artKey);
  return (
    <div className={cn("relative overflow-hidden", tone, rounded, className)}>
      <Image
        src={art.url}
        alt={art.alt}
        fittingType="fit"
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </div>
  );
}