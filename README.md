## Setup

1. Install:

```bash
npm install
```

2. Run:

```bash
npm start
# or
node server.js
```

3. Run tests/debug harness:

```bash
npm test
```

## API

`POST /validate-address`

Body: `{ "address": "<string>" }`

Response: `{ input, status, normalized, corrections }`

- `status`: `valid` | `corrected` | `unverifiable`

<br><br>

## Thought process

#### Problem

- We need to create an API that validates and standardizes property addresses (street, number, city, state, zip code)

#### Constraints & Assumptions

- We don't have the details that can help us define a suited solution, like:

  - If it is a core or secondary service
  - The volume of users or latency expected
  - If it's end-user facing

- I'll try to balance the requirements to be able to respond with a decent latency, low complexity and not treating this as a core service.
- I'll asume this api will be end-user facing, so we will have more flexibility on address inputs
- Since we need to validate the addresses, we need an updated dataset to be able to match street, number, city, state, zip code.

### Existent solutions

- There are a couple good solutions that already exists (google maps, smarty), but they are a paid service and it doesn't help the purpose of this exercise.
- There's USPS option that should be a proper way to create this API, but it involves a procedure to get access, and can not be used for this exercise.
- Managing typos is great using NLP options (like [node-postal](https://github.com/openvenues/node-postal) from [libpostal](https://github.com/openvenues/libpostal) libraries), but it increases complexity and it won't be easy to clone and replicate without a docker or container.

### Solution proposed

- Base idea is to "scan" the address to match all parts of the structure, and reply with a structured address format
- We can create our own solution that involves some external services:

  - Official US API [census.gov](https://www.census.gov/) for updated city, state and zip code data.
  - zippopotam library or API to get ZIP codes from state/cities and viceversa

- For typos and partials on the input, we can match it to the static data we get from Census API using fastest-levenshtein and fast-fuzzy libraries.

### Limitations

- The counterpart of using static data, is that we will **_not be able to validate properly the street name_**.
- On a real API I recommend to use the USPS, it's official and provides most of the features we need.

### Upgrades - depends on usage

- USPS Integration
- Caching Layer

### Reserch with google and AI

- I can share some of the prompts I used to find more alternatives to research:
  - `I'm creating a project with express and javascript, that validates US addresses, give me a list of robust and popular libraries that can help me manage matching names and typos for this goal`
- I used some help from copilot and chatGPT to create a boilerplate and add changes to it.
- I used AI to create a group of test cases and a small script to test it.
- I was playing with a reverse way to recreate the project (it didn't go that well, but works great as summary). If curious, you can check it at [PROMPT.md](../PROMPT.md)

