// Samler src/ til én selvstændig HTML-fil i dist/, klar til at publicere på claude.ai.
// Kør: node build.js
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "src");
const html = fs.readFileSync(path.join(src, "index.html"), "utf8");
const css = fs.readFileSync(path.join(src, "styles.css"), "utf8");
const demo = fs.readFileSync(path.join(src, "demo.js"), "utf8");
const js = fs.readFileSync(path.join(src, "app.js"), "utf8");

const out = html
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}</style>`)
  .replace('<script src="demo.js"></script>', () => `<script>\n${demo}</script>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${js}</script>`);

fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
const target = path.join(__dirname, "dist", "ddp-planlaegning.html");
fs.writeFileSync(target, out);
console.log("Bygget:", target);
