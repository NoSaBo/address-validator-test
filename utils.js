import axios from "axios";
import { fuzzy } from "fast-fuzzy";

const US_STATES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const COMMON_SUFFIXES = [
  "ST",
  "STREET",
  "RD",
  "ROAD",
  "AVE",
  "AVENUE",
  "BLVD",
  "BOULEVARD",
  "LN",
  "LANE",
  "DR",
  "DRIVE",
  "WAY",
  "PL",
  "PLACE",
  "CT",
  "COURT",
];

const ZIP_RE = /(\d{5})(?:-\d{4})?/;

export function parseAddress(text) {
  const parsed = {
    street: null,
    number: null,
    city: null,
    state: null,
    zip_code: null,
  };
  let notes = [];

  const zipMatch = text.match(ZIP_RE);
  if (zipMatch) parsed.zip_code = zipMatch[1];

  // naive parse: split by comma
  const parts = text.split(",").map((p) => p.trim());
  if (parts[0]) {
    const numStreet = parts[0].split(" ");
    if (!isNaN(parseInt(numStreet[0]))) {
      parsed.number = numStreet[0];
      parsed.street = numStreet.slice(1).join(" ");
    } else {
      parsed.street = parts[0];
    }
  }
  if (parts[1]) parsed.city = parts[1];
  if (parts[2]) {
    const stateZip = parts[2].split(" ");
    const stateToken = stateZip[0].toUpperCase();
    parsed.state = fuzzyStateMatch(stateToken);
    if (!parsed.state) notes.push("state_not_recognized");
  }

  if (parsed.street) {
    const tokens = parsed.street.toUpperCase().split(" ");
    const last = tokens[tokens.length - 1];
    const match = COMMON_SUFFIXES.find((s) => fuzzy(last, s) > 0.8);
    if (match && match !== last) {
      tokens[tokens.length - 1] = match;
      parsed.street = tokens.join(" ");
      notes.push("street_suffix_corrected");
    }
  }

  const filled = Object.values(parsed).filter(Boolean).length;
  const confidence = Math.min(0.95, 0.2 + 0.2 * filled);

  return { parsed, confidence, notes: notes.length ? notes.join("; ") : null };
}

function fuzzyStateMatch(val) {
  if (!val) return null;
  if (US_STATES[val]) return val;
  const entry = Object.entries(US_STATES).find(
    ([abbr, name]) =>
      fuzzy(val, abbr) > 0.8 || fuzzy(val, name.toUpperCase()) > 0.8
  );
  return entry ? entry[0] : null;
}

export async function validateWithZippopotamus(parsed) {
  if (!parsed.zip_code) return { ok: false, zpNotes: "no_zip" };
  try {
    const resp = await axios.get(
      `https://api.zippopotam.us/us/${parsed.zip_code}`
    );
    if (resp.status !== 200) return { ok: false, zpNotes: "zip_not_found" };
    const place = resp.data.places?.[0];
    if (!place) return { ok: false, zpNotes: "no_places" };

    let cityOk = true;
    let stateOk = true;
    const notes = [];
    if (
      parsed.city &&
      parsed.city.toUpperCase() !== place["place name"].toUpperCase()
    ) {
      cityOk = false;
      notes.push(`city_mismatch (expected ${place["place name"]})`);
    }
    if (
      parsed.state &&
      parsed.state.toUpperCase() !== place["state abbreviation"].toUpperCase()
    ) {
      stateOk = false;
      notes.push(`state_mismatch (expected ${place["state abbreviation"]})`);
    }

    return {
      ok: cityOk && stateOk,
      zpNotes: notes.length ? notes.join("; ") : "zip_verified",
    };
  } catch (e) {
    return { ok: false, zpNotes: "zippopotamus_unreachable" };
  }
}
