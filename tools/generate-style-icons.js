import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const styles = [
  { id: "style-01", label: "A", background: "#111827", accent: "#f59e0b", text: "#ffffff" },
  { id: "style-02", label: "B", background: "#1e1b4b", accent: "#818cf8", text: "#ffffff" },
  { id: "style-03", label: "C", background: "#064e3b", accent: "#34d399", text: "#ffffff" },
  { id: "style-04", label: "D", background: "#7f1d1d", accent: "#f87171", text: "#ffffff" },
  { id: "style-05", label: "E", background: "#4a044e", accent: "#e879f9", text: "#ffffff" },
  { id: "style-06", label: "F", background: "#713f12", accent: "#facc15", text: "#ffffff" },
  { id: "style-07", label: "G", background: "#164e63", accent: "#22d3ee", text: "#ffffff" },
  { id: "style-08", label: "H", background: "#312e81", accent: "#c4b5fd", text: "#ffffff" },
  { id: "style-09", label: "I", background: "#14532d", accent: "#86efac", text: "#ffffff" },
  { id: "style-10", label: "J", background: "#881337", accent: "#fb7185", text: "#ffffff" },
  { id: "style-11", label: "K", background: "#0f172a", accent: "#38bdf8", text: "#ffffff" },
  { id: "style-12", label: "L", background: "#3b0764", accent: "#c084fc", text: "#ffffff" },
  { id: "style-13", label: "M", background: "#422006", accent: "#fdba74", text: "#ffffff" },
  { id: "style-14", label: "N", background: "#134e4a", accent: "#5eead4", text: "#ffffff" },
  { id: "style-15", label: "O", background: "#1f2937", accent: "#d1d5db", text: "#ffffff" },
  { id: "style-16", label: "P", background: "#450a0a", accent: "#fca5a5", text: "#ffffff" },
];

function iconSvg(style, value) {
  const fontSize = value < 10 ? 86 : 70;
  return `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="14" fill="${style.background}"/>
  <rect x="8" y="8" width="34" height="34" rx="8" fill="${style.accent}"/>
  <text x="25" y="26" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="${style.background}">${style.label}</text>
  <text x="50%" y="73" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${style.text}">${value}</text>
</svg>
`;
}

async function main() {
  const stylesDir = join(process.cwd(), "assets", "styles");
  await rm(stylesDir, { recursive: true, force: true });

  for (const style of styles) {
    const styleDir = join(stylesDir, style.id);
    await mkdir(styleDir, { recursive: true });

    for (let value = 0; value <= 99; value += 1) {
      await writeFile(join(styleDir, `counter-${value}.svg`), iconSvg(style, value));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
