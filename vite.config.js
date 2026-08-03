import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const WOWSIMS_ORIGIN = "https://wowsims.github.io";
const BRIDGE_SCRIPT = `
<script>
  (function () {
    try {
      var pathMatch = window.location.pathname.match(/\\/classic\\/([a-z]+)/i);
      var classSlug = pathMatch && pathMatch[1] ? pathMatch[1].toLowerCase() : "";
      if (!classSlug) {
        return;
      }

      var payloadKey = "wrt-" + classSlug + "-sim-payload";
      var targetKey = "__classic_" + classSlug + "__currentSettings__";
      var payload = window.localStorage.getItem(payloadKey);

      if (payload && payload.trim()) {
        window.localStorage.setItem(targetKey, payload);
      }
    } catch (_err) {
      // Keep sim page functional even if bridge storage access fails.
    }
  })();
</script>`;

function createWowSimsProxyMiddleware() {
  return async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/wowsims/")) {
      next();
      return;
    }

    const targetPath = req.url.replace(/^\/wowsims/, "") || "/";
    const targetUrl = `${WOWSIMS_ORIGIN}${targetPath}`;

    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          Accept: req.headers.accept || "*/*",
          "User-Agent": "wow-raid-tracker-vite-proxy"
        }
      });

      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      res.statusCode = upstream.status;
      res.setHeader("content-type", contentType);
      res.setHeader("cache-control", "no-cache");

      if (contentType.includes("text/html")) {
        const html = await upstream.text();
        const bridged = html.includes("</head>")
          ? html.replace("</head>", `${BRIDGE_SCRIPT}</head>`)
          : `${BRIDGE_SCRIPT}${html}`;
        res.end(bridged);
        return;
      }

      const body = Buffer.from(await upstream.arrayBuffer());
      res.end(body);
    } catch (error) {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "WoWSims proxy failed", detail: String(error) }));
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "wrt-wowsims-proxy",
      configureServer(server) {
        server.middlewares.use(createWowSimsProxyMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createWowSimsProxyMiddleware());
      }
    }
  ],
  base: "./"
});
