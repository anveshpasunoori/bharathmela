// US metros with large Indian communities. Listings belong to one metro;
// "Use my location" picks the nearest one.
export const METROS = [
  { id: "bay-area", name: "SF Bay Area", state: "CA", lat: 37.55, lng: -122.0 },
  { id: "los-angeles", name: "Los Angeles", state: "CA", lat: 34.05, lng: -118.24 },
  { id: "seattle", name: "Seattle", state: "WA", lat: 47.61, lng: -122.33 },
  { id: "dallas", name: "Dallas–Fort Worth", state: "TX", lat: 32.9, lng: -96.9 },
  { id: "houston", name: "Houston", state: "TX", lat: 29.76, lng: -95.37 },
  { id: "austin", name: "Austin", state: "TX", lat: 30.27, lng: -97.74 },
  { id: "chicago", name: "Chicago", state: "IL", lat: 41.88, lng: -87.63 },
  { id: "atlanta", name: "Atlanta", state: "GA", lat: 33.75, lng: -84.39 },
  { id: "new-jersey", name: "New York / New Jersey", state: "NJ", lat: 40.52, lng: -74.41 },
  { id: "dc", name: "Washington DC", state: "VA", lat: 38.9, lng: -77.2 },
  { id: "boston", name: "Boston", state: "MA", lat: 42.36, lng: -71.06 },
  { id: "raleigh", name: "Raleigh–Durham", state: "NC", lat: 35.85, lng: -78.8 },
  { id: "phoenix", name: "Phoenix", state: "AZ", lat: 33.45, lng: -112.07 },
  { id: "detroit", name: "Detroit", state: "MI", lat: 42.48, lng: -83.2 },
] as const;

export const DEFAULT_METRO = "bay-area";

export function metroName(id: string) {
  const m = METROS.find((m) => m.id === id);
  return m ? `${m.name}, ${m.state}` : id;
}

export function isMetro(id: string | undefined): id is string {
  return !!id && METROS.some((m) => m.id === id);
}

export function nearestMetro(lat: number, lng: number) {
  let best: (typeof METROS)[number] = METROS[0];
  let bestDist = Infinity;
  for (const m of METROS) {
    // Equirectangular approximation is plenty for picking the nearest metro.
    const x = (m.lng - lng) * Math.cos(((m.lat + lat) / 2) * (Math.PI / 180));
    const y = m.lat - lat;
    const d = x * x + y * y;
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best;
}
