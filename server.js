require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10kb" }));

const EMAIL = process.env.EMAIL;

function fibonacci(n) {
  if (n === 0) return [];
  if (n === 1) return [0];
  const series = [0, 1];
  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
}

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function findHCF(arr) {
  return arr.reduce((a, b) => gcd(a, b));
}

function findLCM(arr) {
  const lcm = (a, b) => Math.abs((a * b) / gcd(a, b));
  return arr.reduce((a, b) => lcm(a, b));
}

/* ---------- UPDATED AI FUNCTION ---------- */
async function getAIResponse(question) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

    const response = await axios.post(url, {
      contents: [{ parts: [{ text: question }] }]
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty AI response");

    return text.trim().split(/\s+/)[0];
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
    throw new Error("AI_ERROR");
  }
}

/* ---------- MAIN API ---------- */
app.post("/bfhl", async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    if (keys.length !== 1) return res.status(400).json({ is_success: false });

    const key = keys[0];
    const value = req.body[key];
    let result;

    if (key === "fibonacci") {
      if (!Number.isInteger(value) || value < 0 || value > 1000)
        return res.status(400).json({ is_success: false });
      result = fibonacci(value);
    }

    else if (key === "prime") {
      if (!Array.isArray(value) || value.length === 0)
        return res.status(400).json({ is_success: false });
      result = value.filter(n => Number.isInteger(n) && isPrime(n));
    }

    else if (key === "hcf") {
      if (!Array.isArray(value) || value.some(n => !Number.isInteger(n)))
        return res.status(400).json({ is_success: false });
      result = findHCF(value);
    }

    else if (key === "lcm") {
      if (!Array.isArray(value) || value.some(n => !Number.isInteger(n)))
        return res.status(400).json({ is_success: false });
      result = findLCM(value);
    }

    else if (key === "AI") {
      if (typeof value !== "string" || value.trim().length === 0)
        return res.status(400).json({ is_success: false });
      result = await getAIResponse(value);
    }

    else return res.status(400).json({ is_success: false });

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data: result
    });

  } catch (err) {
    if (err.message === "AI_ERROR")
      return res.status(502).json({ is_success: false });

    res.status(500).json({ is_success: false });
  }
});

/* ---------- HEALTH CHECK ---------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

/* ---------- START SERVER ---------- */
app.listen(process.env.PORT || 3000);
