// Minimal types for the parts of the `zipcodes` package we use (its bundled ZIP data).
declare module "zipcodes" {
  type ZipCode = { zip: string; latitude: number; longitude: number; city: string; state: string; country: string };
  const zipcodes: { codes: Record<string, ZipCode> };
  export default zipcodes;
}
