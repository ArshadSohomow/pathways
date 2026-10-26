// Production build: bundles src/main.tsx with esbuild into dist/.
// (Vite-compatible source layout; esbuild is used so the build has a single, small dependency.)
import { build, context } from "esbuild";
import { cpSync, mkdirSync, rmSync, copyFileSync } from "node:fs";

const watch = process.argv.includes("--watch");
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/assets", { recursive: true });
cpSync("public", "dist", { recursive: true });
copyFileSync("index.html", "dist/index.html");

const opts = {
  entryPoints: { main: "src/main.tsx" },
  bundle: true, outdir: "dist/assets", format: "esm", target: ["es2020"],
  jsx: "automatic", minify: !watch, sourcemap: watch ? "inline" : false,
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  logLevel: "info",
};
if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: "dist", port: 5173 });
  console.log(`Dev server: http://localhost:${port}`);
} else {
  await build(opts);
}
