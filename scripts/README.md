# Favicon Generation

This directory contains scripts for generating favicons from the source SVG file.

## Files

- `generate-favicons.js` - Script to generate all favicon formats from `public/favicon.svg`

## Usage

To regenerate all favicons from the source SVG:

```bash
npm run favicons
```

Or run directly:

```bash
node scripts/generate-favicons.js
```

## Generated Files

The script generates the following files in the `public/` directory:

- `favicon.svg` - Source SVG file (modern browsers)
- `favicon.ico` - Traditional favicon format
- `favicon-16x16.png` - Small PNG favicon
- `favicon-32x32.png` - Medium PNG favicon
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `android-chrome-192x192.png` - Android Chrome icon
- `android-chrome-512x512.png` - Android Chrome icon (large)
- `site.webmanifest` - Web app manifest

## Requirements

- Node.js
- Sharp library (`npm install sharp`)

## Notes

- The source SVG should be placed in `public/favicon.svg`
- All generated files are optimized for their respective use cases
- The web manifest is configured for PicksLeagues branding
