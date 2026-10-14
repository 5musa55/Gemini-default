import { compile } from "../node_modules/@tailwindcss/node/dist/index.js";
import oxide from "../node_modules/@tailwindcss/oxide/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function buildCss() {
  const inputPath = path.join(rootDir, "app", "globals.css");
  const outputPath = path.join(rootDir, "app", "globals.compiled.css");

  const cssInput = fs.readFileSync(inputPath, "utf8");

  const compiler = await compile(cssInput, {
    base: rootDir,
    from: inputPath,
    onDependency: () => {},
  });

  const scanner = new oxide.Scanner({
    sources: [
      { base: rootDir, pattern: "app/**/*.{ts,tsx}", negated: false },
      { base: rootDir, pattern: "components/**/*.{ts,tsx}", negated: false },
      { base: rootDir, pattern: "context/**/*.{ts,tsx}", negated: false },
    ],
  });

  const candidates = scanner.scan();
  const builtCss = compiler.build(candidates);

  fs.writeFileSync(outputPath, builtCss, "utf8");
  console.log(`[build-css] Compiled Tailwind CSS: ${candidates.length} candidates, ${(builtCss.length / 1024).toFixed(1)} KB -> app/globals.compiled.css`);
}

buildCss().catch((err) => {
  console.error("[build-css] Error compiling CSS:", err);
  process.exit(1);
});

