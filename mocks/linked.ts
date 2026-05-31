// Mocks for the X1-X6 "linked" detail screens spun out of the dead-button
// audit. Each constant matches the corresponding screen design.

export const SERVICE_JOB_DETAIL = {
  id: "sj-1",
  vendor: "Sparkle & Co.",
  initials: "SC",
  category: "Standard clean · 2 bed",
  amount: "₦18,000",
  ref: "SL-2026-04812",
  booked: "Sat · 25 May, 10:00 AM",
  completed: "Sat · 25 May, 12:40 PM",
  where: "Cedar Court 14 · Magodo GRA II",
  vendorNote:
    "Living room, kitchen and 2 baths done. Replaced the dish-sponge — the old one had given up. Hope it shows.",
  photos: ["clean-1", "clean-2", "clean-3"],
  steps: [
    { label: "Paid in", done: true },
    { label: "Locked", done: true },
    { label: "Job done", done: true },
    { label: "Released", done: false },
  ],
};

export const SIGN_DOCUMENT = {
  title: "Title-search authorisation",
  property: "Cedar Court 14",
  pages: 3,
  due: "Due tomorrow",
  body: [
    "I, Adebayo Okafor, authorise PropertyLoop's conveyancer to conduct a title search on the above property held under Cedar Court 14 GRA, Lagos.",
    "This authorisation extends to verifying the Certificate of Occupancy, encumbrances, survey plan and any pending litigation against the said property.",
    "Issued this 28th day of May, 2026.",
  ],
  signerName: "Adebayo Okafor",
};

export const OFFER_ACTION = {
  home: "Hibiscus House · 4-bed",
  agent: "Emeka",
  asking: "₦78M",
  theirCounter: "₦75.5M",
  yourFirst: "₦72.5M",
  initialCounter: "74000000",
};

export const SEARCH_RESULTS = {
  query: "Buy · Lekki",
  chips: ["₦60M–₦150M", "3+ bed", "Verified", "Duplex"],
  totalHomes: 142,
  newCount: 3,
  results: [
    {
      id: "sr-1", price: "₦78M", title: "Hibiscus House · 4-bed",
      area: "Lekki Phase 1", beds: 4, baths: 4, areaSqm: "320 m²",
      label: "4BR detached · pool", tag: "New", ppm: "243k/m²",
      imageSeed: "hibiscus-1",
    },
    {
      id: "sr-2", price: "₦95M", title: "Admiralty Heights · 4-bed",
      area: "Lekki Phase 1", beds: 4, baths: 5, areaSqm: "360 m²",
      label: "penthouse", tag: "Verified", ppm: "264k/m²",
      imageSeed: "admiralty",
    },
    {
      id: "sr-3", price: "₦62M", title: "Cedar Court 14 · 3-bed",
      area: "Lekki · Conservation", beds: 3, baths: 4, areaSqm: "240 m²",
      label: "3BR semi-detached", ppm: "258k/m²",
      imageSeed: "cedar",
    },
  ],
};
