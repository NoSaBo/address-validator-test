import fetch from "node-fetch";
import { validateAddress } from "./validator.js";

// DEBUG flag
const DEBUG = true;

const testCases = [
  {
    input: "1600 Amphitheatre Parkway, Mountain View, CA 94043",
    expect: "valid",
  },
  {
    input: "1 Infinite Loop, Cupertino, CA 95014",
    expect: "valid",
  },
  {
    input: "350 Fifth Ave, New York, NY 10118",
    expect: "corrected",
  },
  {
    input: "1234 Fake Street, Springfield, IL 62704",
    expect: "unverifiable",
  },
  {
    input: "Belmont, MA 02478",
    expect: "corrected",
  },
  {
    input: "742 Evergreen Terrace, Springfield, OR 97477",
    expect: "valid",
  },
  {
    input: "1600 Pennsylvania Ave NW, Washington, DC 20500",
    expect: "valid",
  },
  {
    input: "Sprngfield, OR 97477",
    expect: "corrected",
  },
  {
    input: "San Fran, CA 94103",
    expect: "corrected",
  },
  {
    input: "123 Main St, Los Angeles, CA",
    expect: "valid",
  },
];

(async () => {
  for (const test of testCases) {
    console.log("\n---------------------------------------");
    console.log(`🔹 Input:   ${test.input}`);

    try {
      const result = await validateAddress(test.input, {
        debug: DEBUG,
      });

      console.log(`📦 Result:  ${JSON.stringify(result, null, 2)}`);
      console.log(`✅ Expect:  ${test.expect}`);

      if (result.status === test.expect) {
        console.log("   ✅ PASS");
      } else {
        console.log("   ❌ FAIL");
      }
    } catch (err) {
      console.error("   💥 ERROR:", err.message);
    }
  }
})();
