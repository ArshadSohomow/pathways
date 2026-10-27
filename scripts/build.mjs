// Production build: bundles src/main.tsx with esbuild into dist/.
// (Vite-compatible source layout; esbuild is used so the build has a single, small dependency.)
// Asset filenames carry a content hash (main-AB12CD.js) so every release has new URLs and
// browsers can never show a stale version; index.html itself is served with no-cache.
import { build, context } from "esbuild";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const watch = process.argv.includes("--watch");
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/assets", { recursive: true });
cpSync("public", "dist", { recursive: true });

const opts = {
  entryPoints: { main: "src/main.tsx" },
  bundle: true, outdir: "dist/assets", format: "esm", target: ["es2020"],
  jsx: "automatic", minify: !watch, sourcemap: watch ? "inline" : false,
  entryNames: watch ? "[name]" : "[name]-[hash]",
  metafile: true,
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  logLevel: "info",
};

const writeHtml = (js, css) => {
  const html = readFileSync("index.html", "utf8")
    .replace("/assets/main.js", `/assets/${js}`)
    .replace("/assets/main.css", `/assets/${css}`);
  writeFileSync("dist/index.html", html);
};

if (watch) {
  writeHtml("main.js", "main.css");
  const ctx = await context(opts);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: "dist", port: 5173 });
  console.log(`Dev server: http://localhost:${port}`);
} else {
  const result = await build(opts);
  const outs = Object.keys(result.metafile.outputs).map((p) => basename(p));
  const js = outs.find((f) => f.endsWith(".js"));
  const css = outs.find((f) => f.endsWith(".css"));
  writeHtml(js, css);
  console.log(`index.html → ${js}, ${css}`);
}
