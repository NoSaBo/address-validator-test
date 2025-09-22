import fetch from "node-fetch";

const API_BASE = "https://api.zippopotam.us/us";

export async function getCityStateFromZip(zip) {
  try {
    const res = await fetch(`${API_BASE}/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      city: data.places[0]["place name"],
      state: data.places[0]["state abbreviation"],
    };
  } catch {
    return null;
  }
}

export async function getZipsForCityState(city, state) {
  try {
    const res = await fetch(
      `${API_BASE}/${state.toLowerCase()}/${city.toLowerCase()}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.places.map((p) => p["post code"]);
  } catch {
    return [];
  }
}
