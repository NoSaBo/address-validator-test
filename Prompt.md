### I was playing with a reverse way to recreate the project

It didn't go that well, but works great as summary (not completely updated though)

```
You are an expert backend engineer. Build a Node.js + Express API project for U.S. address validation with the following requirements:

## Project Prompt – Address Validator

### Requirements

1. **Folder structure**:

1. **Folder structure**:
address-validator/
│── server.js             # Express server, routes
│── censusService.js      # Fetch/cache Census city + ZIP data
│── zippopotamService.js  # Fetch ZIP info from Zippopotam
│── validator.js          # Core validation logic
│── test.js               # Debug/test harness
│── package.json
│── README.md


2. **API endpoint**:
- `POST /validate-address`
- Body: `{ "address": "<string>" }`
- Returns JSON with:
  - `input` → original input
  - `status` → `"valid" | "corrected" | "unverifiable"`
  - `normalized` → parsed/standardized address object
  - `corrections` → list of corrections (if any)

3. **Parsing**:
- Extract street, city, state, ZIP from input string.
- Ensure state is normalized to **2-letter USPS codes**.

4. **Census preload and refresh**:
- On startup, load **all U.S. states**:
  - API: `https://api.census.gov/data/2021/pep/population?get=NAME&for=state:*`
  - Example row: `["Oklahoma","40"]`
- For each state, load **cities/places**:
  - API: `https://api.census.gov/data/2019/pep/population?get=NAME&for=place:*&in=state:06`
  - Example row: `["Clayton city, California","06","13882"]`
- Store in memory: `{ stateCode → { stateName, cities[] } }`.
- Add config variable `CENSUS_REFRESH_INTERVAL` (in ms or hours) to periodically refresh this data.

5. **Validation logic**:
- First parse input into components.
- Check if city/state exist in cached Census dataset.
- If ZIP is provided:
  - Validate via **Zippopotam.us** (`/us/{zip}`).
  - If city/state + ZIP match → `valid`.
  - If mismatch but correctable → `corrected`.
- If ZIP is missing:
  - Try Census dataset (city+state → place).
  - If still missing, fallback to **Zippopotam**:
    - `city+state → ZIP`
    - or `ZIP → city+state`.

6. **Error tolerance**:
- Use **fastest-levenshtein** for small typos in city/state names.
- Use **fast-fuzzy** for abbreviations/partial matches.
- Example corrections:
  - `"Sprngfield, OR"` → `"Springfield, OR"`.
  - `"San Fran, CA"` → `"San Francisco, CA"`.
  - `"Los Angeles City, CA"` → `"Los Angeles, CA"`.

7. **Output rules**:
- If all parts are valid → `status = valid`.
- If corrections were needed → `status = corrected`.
- If missing/unresolvable parts → `status = unverifiable`.

8. **Debug mode**:
- `test.js` should run a suite of test cases and print:
  - Input
  - Parsed components
  - Census match results
  - Zippopotam results
  - Which correction strategy was used
  - Final status vs. expected
```

[Back to README](./README.md)