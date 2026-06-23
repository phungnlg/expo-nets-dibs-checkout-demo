import fs from "node:fs";
import path from "node:path";

// Load .env (dependency-free) as a side effect on import. Imported before the
// routers so their module-scope process.env reads see the keys. Without a .env
// the app stays in sandbox mode; with NEXI_SECRET_KEY/NEXI_CHECKOUT_KEY set it
// goes live against the Nexi test API.
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}
