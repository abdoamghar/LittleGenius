import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

/** The guide character, used sparingly for one short encouraging line. */
const PIP_ART = {
  wave: { src: "/learning-art/pip-wave.webp", alt: "Pip the fox waving hello." },
  celebrate: { src: "/learning-art/pip-celebrate.webp", alt: "Pip the fox celebrating." },
  think: { src: "/learning-art/pip-think.webp", alt: "Pip the fox thinking." },
  read: { src: "/learning-art/pip-read.webp", alt: "Pip the fox reading a book." },
  help: { src: "/learning-art/pip-help.webp", alt: "Pip the fox encouraging a learner." },
};

export default function GuidanceNote({ message, action, className, mood = "wave" }) {
  const art = PIP_ART[mood] || PIP_ART.wave;
  return (
    <aside className={cn("lg-card flex items-center gap-4 border-sun-200 bg-gradient-to-br from-paper to-sun-50 p-4 md:p-5", className)}>
      <Image
        src={art.src}
        alt={art.alt}
        fittingType="fit"
        className="h-20 w-20 shrink-0 rounded-2xl bg-sun-100/70 object-contain p-1"
      />
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-500">Pip the guide</p>
        <p className="text-sm font-semibold leading-relaxed text-ink">{message}</p>
        {action}
      </div>
    </aside>
  );
}
