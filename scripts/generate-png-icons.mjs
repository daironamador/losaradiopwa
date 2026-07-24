import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const iconsDir = join(import.meta.dirname, "..", "public", "icons");
const svgPath = join(iconsDir, "icon.svg");
const svgBuffer = readFileSync(svgPath);

async function generate() {
  await sharp(svgBuffer).resize(192, 192).png().toFile(join(iconsDir, "icon-192.png"));
  await sharp(svgBuffer).resize(512, 512).png().toFile(join(iconsDir, "icon-512.png"));
  console.log("✅ PNG icons generated: icon-192.png, icon-512.png");
}

generate().catch(console.error);
