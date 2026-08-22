const sharp = require('sharp');

// Create high-res SVG reproducing the exact MARMOT vertical block letter art
const width = 400;
const height = 1400;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Metallic Gold Gradient -->
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082" />
      <stop offset="25%" stop-color="#D6B35A" />
      <stop offset="50%" stop-color="#FFF3C4" />
      <stop offset="75%" stop-color="#A8832A" />
      <stop offset="100%" stop-color="#D6B35A" />
    </linearGradient>

    <!-- Dark Marble Fill Pattern -->
    <linearGradient id="blackMarble" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="50%" stop-color="#080808" />
      <stop offset="100%" stop-color="#181818" />
    </linearGradient>

    <!-- Texture overlay noise -->
    <filter id="grunge" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
      <feColorMatrix type="matrix" values="
        0.3 0 0 0 0.05
        0 0.25 0 0 0.04
        0 0 0.1 0 0.02
        0 0 0 0.9 0" in="noise" result="coloredNoise" />
      <feComposite operator="in" in2="SourceGraphic" />
    </filter>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <g filter="url(#shadow)" text-anchor="middle" dominant-baseline="central" font-family="'Impact', 'Arial Black', 'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="200" letter-spacing="0">
    
    <!-- Letter M -->
    <g transform="translate(200, 110)">
      <text x="0" y="0" fill="url(#blackMarble)" stroke="url(#goldBorder)" stroke-width="5" stroke-linejoin="miter">M</text>
    </g>

    <!-- Letter A -->
    <g transform="translate(200, 330)">
      <text x="0" y="0" fill="url(#blackMarble)" stroke="url(#goldBorder)" stroke-width="5" stroke-linejoin="miter">A</text>
    </g>

    <!-- Letter R -->
    <g transform="translate(200, 550)">
      <text x="0" y="0" fill="url(#blackMarble)" stroke="url(#goldBorder)" stroke-width="5" stroke-linejoin="miter">R</text>
    </g>

    <!-- Letter M -->
    <g transform="translate(200, 770)">
      <text x="0" y="0" fill="url(#blackMarble)" stroke="url(#goldBorder)" stroke-width="5" stroke-linejoin="miter">M</text>
    </g>

    <!-- Letter O -->
    <g transform="translate(200, 990)">
      <text x="0" y="0" fill="url(#blackMarble)" stroke="url(#goldBorder)" stroke-width="5" stroke-linejoin="miter">O</text>
    </g>

    <!-- Letter T -->
    <g transform="translate(200, 1210)">
      <text x="0" y="0" fill="url(#blackMarble)" stroke="url(#goldBorder)" stroke-width="5" stroke-linejoin="miter">T</text>
    </g>

  </g>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/marmot-title.png')
  .then(info => {
    console.log('Successfully updated public/marmot-title.png:', info);
  })
  .catch(err => {
    console.error('Error generating PNG:', err);
  });
