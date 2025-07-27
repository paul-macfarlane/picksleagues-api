import sharp from "sharp";
import fs from "fs";
import path from "path";

const publicDir = "./public";
const svgPath = path.join(publicDir, "favicon.svg");

// Read the SVG file
let svgContent = fs.readFileSync(svgPath, "utf8");

// Replace currentColor with a specific color for PNG generation
svgContent = svgContent.replace(/stroke="currentColor"/g, 'stroke="#2563eb"');

// Function to create PNG favicon
async function createFavicon(size, filename) {
  const buffer = Buffer.from(svgContent);

  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, filename));

  console.log(`Created ${filename} (${size}x${size})`);
}

// Function to create ICO file (multi-size)
async function createIco() {
  const buffer = Buffer.from(svgContent);

  // Create a 32x32 PNG first
  const png32 = await sharp(buffer).resize(32, 32).png().toBuffer();

  // For now, just copy the 32x32 PNG as ICO
  // In a real implementation, you'd want to create a proper ICO file
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), png32);
  console.log("Created favicon.ico (32x32)");
}

// Generate all favicons
async function generateFavicons() {
  try {
    console.log("Generating favicons from SVG...");

    // Create PNG favicons
    await createFavicon(16, "favicon-16x16.png");
    await createFavicon(32, "favicon-32x32.png");
    await createFavicon(180, "apple-touch-icon.png");
    await createFavicon(192, "android-chrome-192x192.png");
    await createFavicon(512, "android-chrome-512x512.png");

    // Create ICO file
    await createIco();

    console.log("✅ All favicons generated successfully!");
  } catch (error) {
    console.error("❌ Error generating favicons:", error);
  }
}

generateFavicons();
