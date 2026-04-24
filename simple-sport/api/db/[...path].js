const SUPABASE_URL = "https://ebczaoptweskqzuzrmls.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViY3phb3B0d2Vza3F6dXpybWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTMxODEsImV4cCI6MjA5MTA2OTE4MX0.Q5wqENM29xaLdVdoG8Gx6Pl49WZSQIGfe2704fa-vNc";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Prefer");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { path, ...query } = req.query;
  const tablePath = Array.isArray(path) ? path.join("/") : path || "";
  const queryString = new URLSearchParams(query).toString();
  const url = `${SUPABASE_URL}/rest/v1/${tablePath}${queryString ? "?" + queryString : ""}`;

  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Prefer": "return=representation"
  };

  let body = undefined;
  if (req.method !== "GET" && req.method !== "DELETE" && req.body) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(url, { method: req.method, headers, body });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
