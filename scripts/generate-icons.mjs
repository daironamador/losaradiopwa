import { writeFileSync } from "fs";
import { join } from "path";

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#0d0d0d"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35"/>
      <stop offset="100%" style="stop-color:#ffd700"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <circle cx="256" cy="220" r="80" fill="none" stroke="url(#accent)" stroke-width="8"/>
  <circle cx="256" cy="220" r="45" fill="url(#accent)"/>
  <path d="M 200 320 Q 256 360 312 320" stroke="#ff6b35" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M 180 350 Q 256 395 332 350" stroke="#ffd700" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M 160 380 Q 256 430 352 380" stroke="#ff6b35" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>
  <text x="256" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="52" fill="white">RINCONFM</text>
</svg>`;

const iconsDir = join(import.meta.dirname, "..", "public", "icons");
writeFileSync(join(iconsDir, "icon.svg"), svgIcon);
writeFileSync(
  join(iconsDir, "icon-192.svg"),
  svgIcon.replace('width="512" height="512"', 'width="192" height="192"')
);
writeFileSync(
  join(iconsDir, "icon-512.svg"),
  svgIcon.replace('width="512" height="512"', 'width="512" height="512"')
);

console.log("✅ SVG icons generated in public/icons/");
console.log(
  "💡 To generate PNG icons, use: npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192"
);
console.log(
  "💡 To generate PNG icons, use: npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512"
);
