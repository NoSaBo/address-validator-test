import { getStates } from "./censusService.js";
import {
  getCityStateFromZip,
  getZipsForCityState,
} from "./zippopotamService.js";

function normalizeAddressParts(address) {
  return address
    .replace(/([A-Z]{2})(\d{5})/, "$1 $2") // split CA94105 → CA 94105
    .split(/[,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function parseAddress(freeform) {
  if (!freeform) return {};

  const parts = normalizeAddressParts(freeform);
  let street, city, state, zip;

  if (parts.length >= 3) {
    // Example: "742 Evergreen Terrace, Springfield, OR 97477"
    street = parts[0];
    city = parts[1];

    const stateZip = parts.slice(2).join(" "); // e.g. "OR 97477"
    const match = stateZip.match(/^([A-Za-z]{2,})\s+(\d{5})(?:-\d{4})?$/);
    if (match) {
      state = match[1];
      zip = match[2];
    } else {
      state = stateZip.trim();
    }
  } else if (parts.length === 2) {
    // Example: "742 Evergreen Terrace, Springfield OR 97477"
    street = parts[0];
    const match = parts[1].match(/^(.*)\s+([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/i);
    if (match) {
      city = match[1].trim();
      state = match[2].toUpperCase();
      zip = match[3];
    } else {
      city = parts[1];
    }
  } else {
    // Fallback: only street
    street = parts[0];
  }

  // Last-resort: extract ZIP from end of freeform
  if (!zip) {
    const zipMatch = freeform.match(/(\d{5})(?:-\d{4})?$/);
    if (zipMatch) zip = zipMatch[1];
  }

  return { street, city, state, zip };
}

function buildResponse({
  input,
  status,
  parsed,
  corrections = {},
  final = {},
}) {
  return {
    input,
    status,
    parsed,
    corrections,
    final,
  };
}

function makeStandardized(street, city, state, zip) {
  let parts = [];
  if (street) parts.push(street);
  if (city && state) parts.push(`${city}, ${state}${zip ? " " + zip : ""}`);
  else {
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zip) parts.push(zip);
  }
  return parts.join(", ");
}

export async function validateAddress(address, { debug = false } = {}) {
  let { street, city, state, zip } = parseAddress(address);
  const states = await getStates();

  if (debug) console.log("🔍 Parsed:", { street, city, state, zip });

  const normalizeState = (input) => {
    if (!input) return null;
    const found = states.find(
      (s) =>
        s.code === input.toUpperCase() ||
        s.name.toLowerCase() === input.toLowerCase()
    );
    return found ? found.code : input.toUpperCase?.() || input;
  };

  let corrections = {};

  // 1) ZIP present -> use Zippopotam first
  if (zip) {
    const zipInfo = await getCityStateFromZip(zip);
    if (debug) console.log("🌎 Zippopotam ZIP lookup:", zipInfo);

    if (!zipInfo) {
      return buildResponse({
        input: address,
        status: "unverifiable",
        parsed: { street, city, state, zip },
      });
    }

    if (!city) city = zipInfo.city;
    if (!state) state = zipInfo.state;
    const stateCode = normalizeState(state);

    if (
      zipInfo.city.toLowerCase() !== (city || "").toLowerCase() ||
      zipInfo.state.toUpperCase() !== (stateCode || "").toUpperCase()
    ) {
      corrections.city = zipInfo.city;
      corrections.state = zipInfo.state;
      return buildResponse({
        input: address,
        status: "corrected",
        parsed: { street, city, state, zip },
        corrections,
        final: {
          street,
          city: zipInfo.city,
          state: zipInfo.state,
          zip,
          standardized: makeStandardized(
            street,
            zipInfo.city,
            zipInfo.state,
            zip
          ),
        },
      });
    }

    return buildResponse({
      input: address,
      status: "valid",
      parsed: { street, city, state, zip },
      final: {
        street,
        city,
        state: stateCode,
        zip,
        standardized: makeStandardized(street, city, stateCode, zip),
      },
    });
  }

  // 2) No ZIP -> require city + state
  if (!city || !state) {
    return buildResponse({
      input: address,
      status: "unverifiable",
      parsed: { street, city, state, zip },
    });
  }

  const stateCode = normalizeState(state);

  const censusCities = states.find((s) => s.code === stateCode)?.cities ?? [];
  const censusMatch = censusCities.some(
    (c) => c.toLowerCase() === city.toLowerCase()
  );

  if (censusMatch) {
    return buildResponse({
      input: address,
      status: "valid",
      parsed: { street, city, state, zip },
      final: {
        street,
        city,
        state: stateCode,
        zip,
        standardized: makeStandardized(street, city, stateCode, zip),
      },
    });
  }

  const zipsForCity = await getZipsForCityState(city, stateCode);
  if (debug) console.log("🏙️ Zips for city/state (ZIP missing):", zipsForCity);

  if (zipsForCity && zipsForCity.length === 1) {
    corrections.zip = zipsForCity[0];
    return buildResponse({
      input: address,
      status: "corrected",
      parsed: { street, city, state, zip },
      corrections,
      final: {
        street,
        city,
        state: stateCode,
        zip: zipsForCity[0],
        standardized: makeStandardized(street, city, stateCode, zipsForCity[0]),
      },
    });
  }

  return buildResponse({
    input: address,
    status: "unverifiable",
    parsed: { street, city, state, zip },
  });
}
