const sharp = require('sharp');
const path = require('path');

// Design: Black background, ivory/gold spade symbol, minimal "LC" text
// Matching the app's dark theme with accent color #e8dcc8

const SIZE = 1024;
const ADAPTIVE_SIZE = 1024; // Android adaptive icon (foreground layer)

// Main icon SVG - elegant card-themed design
const iconSvg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8dcc8"/>
      <stop offset="100%" stop-color="#c9a96e"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" rx="200" fill="url(#bg)"/>
  
  <!-- Subtle border -->
  <rect x="24" y="24" width="${SIZE - 48}" height="${SIZE - 48}" rx="180" 
        fill="none" stroke="#e8dcc8" stroke-width="2" opacity="0.15"/>

  <!-- Card shape in center -->
  <rect x="280" y="140" width="464" height="640" rx="32" 
        fill="url(#cardGrad)" stroke="#e8dcc8" stroke-width="3" opacity="0.9"
        filter="url(#shadow)"/>
  
  <!-- Inner card border -->
  <rect x="304" y="164" width="416" height="592" rx="20" 
        fill="none" stroke="#e8dcc8" stroke-width="1" opacity="0.2"/>

  <!-- Large Spade symbol -->
  <text x="512" y="520" text-anchor="middle" dominant-baseline="central"
        font-family="serif" font-size="320" fill="url(#accent)" filter="url(#glow)">♠</text>

  <!-- "LC" text at bottom of card -->
  <text x="512" y="700" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="200" font-size="72" 
        fill="#e8dcc8" letter-spacing="16" opacity="0.8">LC</text>

  <!-- Corner indices - top left -->
  <text x="320" y="220" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="300" font-size="48" fill="#e8dcc8" opacity="0.6">♠</text>

  <!-- Corner indices - bottom right (rotated) -->
  <text x="704" y="710" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="300" font-size="48" fill="#e8dcc8" opacity="0.6"
        transform="rotate(180, 704, 710)">♠</text>

  <!-- Decorative corner suits -->
  <text x="100" y="100" text-anchor="middle" font-size="40" fill="#e63946" opacity="0.12">♥</text>
  <text x="924" y="100" text-anchor="middle" font-size="40" fill="#e8dcc8" opacity="0.12">♣</text>
  <text x="100" y="924" text-anchor="middle" font-size="40" fill="#e63946" opacity="0.12">♦</text>
  <text x="924" y="924" text-anchor="middle" font-size="40" fill="#e8dcc8" opacity="0.12">♠</text>
</svg>`;

// Adaptive icon foreground (just the card + spade, no background, with padding for safe zone)
const adaptiveSvg = `
<svg width="${ADAPTIVE_SIZE}" height="${ADAPTIVE_SIZE}" viewBox="0 0 ${ADAPTIVE_SIZE} ${ADAPTIVE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8dcc8"/>
      <stop offset="100%" stop-color="#c9a96e"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Card shape - centered with safe zone padding -->
  <rect x="320" y="200" width="384" height="540" rx="28" 
        fill="url(#cardGrad)" stroke="#e8dcc8" stroke-width="3" opacity="0.9"/>
  
  <!-- Inner card border -->
  <rect x="340" y="220" width="344" height="500" rx="18" 
        fill="none" stroke="#e8dcc8" stroke-width="1" opacity="0.2"/>

  <!-- Large Spade -->
  <text x="512" y="480" text-anchor="middle" dominant-baseline="central"
        font-family="serif" font-size="280" fill="url(#accent)" filter="url(#glow)">♠</text>

  <!-- LC text -->
  <text x="512" y="650" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="200" font-size="60" 
        fill="#e8dcc8" letter-spacing="14" opacity="0.8">LC</text>

  <!-- Corner spades -->
  <text x="358" y="270" text-anchor="middle" font-size="40" fill="#e8dcc8" opacity="0.5">♠</text>
  <text x="666" y="670" text-anchor="middle" font-size="40" fill="#e8dcc8" opacity="0.5"
        transform="rotate(180, 666, 670)">♠</text>
</svg>`;

// Splash icon - just the spade, clean
const splashSvg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8dcc8"/>
      <stop offset="100%" stop-color="#c9a96e"/>
    </linearGradient>
  </defs>
  <text x="512" y="460" text-anchor="middle" dominant-baseline="central"
        font-family="serif" font-size="400" fill="url(#accent)">♠</text>
  <text x="512" y="680" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="200" font-size="80" 
        fill="#e8dcc8" letter-spacing="20" opacity="0.7">LEAST COUNT</text>
</svg>`;

async function generate() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  // Generate icon.png (1024x1024)
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // Generate adaptive-icon.png (1024x1024 foreground)
  await sharp(Buffer.from(adaptiveSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png (1024x1024)');

  // Generate favicon.png (48x48)
  await sharp(Buffer.from(iconSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // Generate splash-icon.png (1024x1024)
  await sharp(Buffer.from(splashSvg))
    .resize(1024, 1024)
    .png({ quality: 90 })
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ splash-icon.png (1024x1024)');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
