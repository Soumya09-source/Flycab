export type Tier = "economy" | "standard" | "premium";

export const TIERS: Record<Tier, {
  label: string;
  tagline: string;
  multiplier: number;
  baseFare: number;
  ratePerKm: number;
  speedKmh: number;
  capacity: string;
}> = {
  economy: {
    label: "Economy",
    tagline: "Shared cabin · efficient",
    multiplier: 1,
    baseFare: 120,
    ratePerKm: 45,
    speedKmh: 110,
    capacity: "Up to 2 guests",
  },
  standard: {
    label: "Standard",
    tagline: "Private cabin · refined",
    multiplier: 1.6,
    baseFare: 200,
    ratePerKm: 70,
    speedKmh: 160,
    capacity: "Up to 3 guests",
  },
  premium: {
    label: "Premium",
    tagline: "Luxury suite · fastest route",
    multiplier: 2.6,
    baseFare: 350,
    ratePerKm: 120,
    speedKmh: 220,
    capacity: "Up to 4 guests · concierge",
  },
};

export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function priceFor(distanceKm: number, tier: Tier): number {
  const t = TIERS[tier];
  return Math.round(t.baseFare + distanceKm * t.ratePerKm * t.multiplier);
}

export function etaFor(distanceKm: number, tier: Tier): number {
  const t = TIERS[tier];
  // boarding 3 min + flight time
  return Math.max(4, Math.round(3 + (distanceKm / t.speedKmh) * 60));
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
