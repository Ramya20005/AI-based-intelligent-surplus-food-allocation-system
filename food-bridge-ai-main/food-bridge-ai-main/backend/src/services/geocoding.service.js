import { validCoordinates } from "../utils/geo.js";

const geocodingProvider = (process.env.GEOCODING_PROVIDER || "osm").toLowerCase();

const parseCoordinates = (payload) => {
  const latitude = Number(payload?.lat);
  const longitude = Number(payload?.lon);

  if (!validCoordinates(latitude, longitude)) {
    throw new Error("Geocoding returned invalid coordinates.");
  }

  return { latitude, longitude };
};

const geocodeWithOsm = async (address) => {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", address);
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": process.env.GEOCODING_USER_AGENT || "food-bridge-ai/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding provider failed (${response.status}).`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Unable to geocode the provided address.");
  }

  return parseCoordinates(results[0]);
};

export const geocodeAddress = async (address) => {
  const normalizedAddress = String(address || "").trim();
  if (!normalizedAddress) {
    throw new Error("Address is required for geocoding.");
  }

  if (geocodingProvider === "osm") {
    return geocodeWithOsm(normalizedAddress);
  }

  throw new Error(`Unsupported geocoding provider: ${geocodingProvider}`);
};
