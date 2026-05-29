// Map pin + sheet card mocks. Real Lekki Phase 1 coordinates so the
// initial region zooms to a sensible spot. Backend would return these
// from a /listings?bbox=... query in a real wiring.

export type MapPin = {
  id: string;
  priceLabel: string;
  latitude: number;
  longitude: number;
};

// Lekki Phase 1 centre ~ 6.4540°N, 3.4730°E. Pins spread within a
// kilometre of that point.
export const MAP_REGION = {
  latitude: 6.4540,
  longitude: 3.4730,
  latitudeDelta: 0.018,
  longitudeDelta: 0.014,
};

export const MAP_PINS: MapPin[] = [
  { id: "p1", priceLabel: "₦4.8M", latitude: 6.4548, longitude: 3.4690 },
  { id: "p2", priceLabel: "₦12M",  latitude: 6.4565, longitude: 3.4762 },
  { id: "p3", priceLabel: "₦2.4M", latitude: 6.4521, longitude: 3.4708 },
  { id: "p4", priceLabel: "₦6.5M", latitude: 6.4502, longitude: 3.4750 },
  { id: "p5", priceLabel: "₦3.5M", latitude: 6.4484, longitude: 3.4702 },
  { id: "p6", priceLabel: "₦9M",   latitude: 6.4475, longitude: 3.4759 },
];

// ─── Cards shown in the bottom sheet ─────────────────────────────
export type MapCard = {
  id: string;
  pinId: string;
  price: string;
  title: string;
  area: string;
  beds: number;
  baths: number;
  imageSeed: string;
};

export const MAP_CARDS: MapCard[] = [
  { id: "mc1", pinId: "p1", price: "₦4.8M", title: "Sandbridge Court", area: "Lekki Phase 1", beds: 3, baths: 3, imageSeed: "feat-1" },
  { id: "mc2", pinId: "p2", price: "₦12M",  title: "The Loom House",   area: "Old Ikoyi",     beds: 4, baths: 5, imageSeed: "feat-2" },
  { id: "mc3", pinId: "p3", price: "₦2.4M", title: "Marlin Studios",   area: "V.I.",          beds: 1, baths: 1, imageSeed: "feat-3" },
];

export const MAP_LOCATION = {
  label: "Lekki Phase 1",
  count: "247 homes",
};
