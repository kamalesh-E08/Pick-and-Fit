const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appDir = path.join(root, "app");
const routes = new Set();

function walk(dir, base = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base + "/" + entry.name);
    } else if (entry.isFile() && entry.name === "page.tsx") {
      const route = base.replace(/\\/g, "/");
      if (!route.includes("/api") && !route.includes("[")) {
        routes.add(route === "" ? "/" : route);
      }
    }
  }
}

walk(appDir, "");

const headerPath = path.join(root, "components", "header.tsx");
if (fs.existsSync(headerPath)) {
  const header = fs.readFileSync(headerPath, "utf8");
  const hrefs = [...header.matchAll(/href=\"([^\"]+)\"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (h.startsWith("/")) routes.add(h);
  }
}

const unique = [...routes].filter((r) => !r.includes("...")).sort();
const limit = 60;
const target = unique.slice(0, limit);

const withTimeout = (url, ms) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { redirect: "manual", signal: c.signal }).finally(() =>
    clearTimeout(t),
  );
};

(async () => {
  const bad = [];
  for (const r of target) {
    try {
      const res = await withTimeout("http://localhost:3000" + r, 3000);
      if (res.status >= 400) {
        bad.push({ route: r, status: res.status });
      }
    } catch (e) {
      bad.push({ route: r, status: "ERR" });
    }
  }
  console.log("UI 404/ERR routes:", bad.length ? bad : "none");
})();
