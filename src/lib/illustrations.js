// Original LittleGenius illustration set (hand-painted paper-cut style).
// Kept separate from the interface so the same art can be reused across screens.
// Nothing here carries interface text — every label on screen stays editable text.

const base = "https://media.base44.com/images/public/6ada74345789608109017990/";

export const illustrations = {
  plantScience: {
    url: base + "53b03eac6_generated_image.png",
    alt: "Paper-cut seedling sprouting from a small pot beside a paper sun and watering can.",
  },
  fractions: {
    url: base + "23f70c49d_generated_image.png",
    alt: "Paper-cut pie cut into equal slices with one slice lifted slightly apart.",
  },
  reading: {
    url: base + "c7baf13c4_generated_image.png",
    alt: "Open paper-cut book with paper birds and leaves rising out of the pages.",
  },
  plantCycle: {
    url: base + "c4c5323de_generated_image.png",
    alt: "Four paper-cut stages of a plant, from a single seed to an open flower.",
  },
  guide: {
    url: base + "a66a7924e_generated_image.png",
    alt: "Guide character: a small paper-cut fox waving a paw.",
  },
  fractionTiles: {
    url: base + "f717aefa2_generated_image.png",
    alt: "Paper-cut fraction tiles showing one whole, halves, quarters and thirds.",
  },
  storyGarden: {
    url: base + "a3d12a808_generated_image.png",
    alt: "Girl reading on a paper-cut hill with a small dog curled up beside her.",
  },
};

/** Art used by each subject, so a course always shows the same picture. */
export const subjectArt = {
  Science: "plantScience",
  Maths: "fractions",
  Reading: "reading",
};

export function artFor(key) {
  return illustrations[key] || illustrations.guide;
}