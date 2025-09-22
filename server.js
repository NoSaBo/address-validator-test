import express from "express";
import bodyParser from "body-parser";
import { validateAddress } from "./validator.js";

const app = express();
app.use(bodyParser.json());

app.post("/validate-address", async (req, res) => {
  const { address } = req.body;

  if (!address || typeof address !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'address' field" });
  }

  try {
    const result = await validateAddress(address);
    res.json(result);
  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send('Address Validator API - POST /validate { "address": "..."}');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Address Validator running at http://localhost:${PORT}`);
});
