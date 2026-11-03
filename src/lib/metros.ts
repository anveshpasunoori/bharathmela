// US metros with large Indian communities, sorted by name. Listings belong to one metro;
// "Use my location" picks the nearest one.
export const METROS = [
  { id: "atlanta", name: "Atlanta", state: "GA", lat: 33.75, lng: -84.39, tz: "America/New_York" },
  { id: "austin", name: "Austin", state: "TX", lat: 30.27, lng: -97.74, tz: "America/Chicago" },
  { id: "boston", name: "Boston", state: "MA", lat: 42.36, lng: -71.06, tz: "America/New_York" },
  { id: "charlotte", name: "Charlotte", state: "NC", lat: 35.23, lng: -80.84, tz: "America/New_York" },
  { id: "chicago", name: "Chicago", state: "IL", lat: 41.88, lng: -87.63, tz: "America/Chicago" },
  { id: "columbus", name: "Columbus", state: "OH", lat: 39.96, lng: -83.0, tz: "America/New_York" },
  { id: "dallas", name: "Dallas–Fort Worth", state: "TX", lat: 32.9, lng: -96.9, tz: "America/Chicago" },
  { id: "denver", name: "Denver", state: "CO", lat: 39.74, lng: -104.99, tz: "America/Denver" },
  { id: "detroit", name: "Detroit", state: "MI", lat: 42.48, lng: -83.2, tz: "America/Detroit" },
  { id: "houston", name: "Houston", state: "TX", lat: 29.76, lng: -95.37, tz: "America/Chicago" },
  { id: "jacksonville", name: "Jacksonville", state: "FL", lat: 30.25, lng: -81.55, tz: "America/New_York" },
  { id: "los-angeles", name: "Los Angeles", state: "CA", lat: 34.05, lng: -118.24, tz: "America/Los_Angeles" },
  { id: "miami", name: "Miami", state: "FL", lat: 26.1, lng: -80.2, tz: "America/New_York" },
  { id: "minneapolis", name: "Minneapolis", state: "MN", lat: 44.98, lng: -93.27, tz: "America/Chicago" },
  { id: "new-jersey", name: "New York / New Jersey", state: "NJ", lat: 40.52, lng: -74.41, tz: "America/New_York" },
  { id: "orlando", name: "Orlando", state: "FL", lat: 28.54, lng: -81.38, tz: "America/New_York" },
  { id: "philadelphia", name: "Philadelphia", state: "PA", lat: 39.95, lng: -75.17, tz: "America/New_York" },
  { id: "phoenix", name: "Phoenix", state: "AZ", lat: 33.45, lng: -112.07, tz: "America/Phoenix" },
  { id: "raleigh", name: "Raleigh–Durham", state: "NC", lat: 35.85, lng: -78.8, tz: "America/New_York" },
  { id: "sacramento", name: "Sacramento", state: "CA", lat: 38.58, lng: -121.49, tz: "America/Los_Angeles" },
  { id: "san-diego", name: "San Diego", state: "CA", lat: 32.72, lng: -117.16, tz: "America/Los_Angeles" },
  { id: "bay-area", name: "SF Bay Area", state: "CA", lat: 37.55, lng: -122.0, tz: "America/Los_Angeles" },
  { id: "seattle", name: "Seattle", state: "WA", lat: 47.61, lng: -122.33, tz: "America/Los_Angeles" },
  { id: "tampa", name: "Tampa Bay", state: "FL", lat: 27.95, lng: -82.46, tz: "America/New_York" },
  { id: "dc", name: "Washington DC", state: "VA", lat: 38.9, lng: -77.2, tz: "America/New_York" },
] as const;

export const DEFAULT_METRO = "bay-area";

// Beyond this distance the nearest metro isn't really "local" for a visitor.
export const LOCAL_MILES = 60;

export function metroName(id: string) {
  const m = METROS.find((m) => m.id === id);
  return m ? `${m.name}, ${m.state}` : id;
}

export function metroTimeZone(id: string) {
  return METROS.find((m) => m.id === id)?.tz ?? "America/Los_Angeles";
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
