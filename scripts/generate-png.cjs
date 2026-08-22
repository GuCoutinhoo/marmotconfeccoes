const sharp = require('sharp');

// Create high-resolution SVG matching the user's uploaded reference image exactly
const width = 300;
const height = 900;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .title-text {
      font-family: 'Plus Jakarta Sans', 'Arial Black', 'Impact', sans-serif;
      font-weight: 900;
      fill: #EFECE6;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .reg-mark {
      font-family: 'Plus Jakarta Sans', 'Arial Black', sans-serif;
      font-weight: 900;
      fill: #D6B35A;
    }
    .sub-text {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 800;
      fill: #D6B35A;
      letter-spacing: 0.35em;
      text-transform: uppercase;
    }
  </style>

  <!-- Dark Background matching app canvas -->
  <rect width="100%" height="100%" fill="#080808" />

  <!-- Gold Dashed Vertical Line on Left -->
  <line x1="22" y1="20" x2="22" y2="865" stroke="#D6B35A" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.85" />
  
  <!-- Small Gold Square Dot at Bottom Left -->
  <rect x="19.5" y="865" width="5" height="5" fill="#D6B35A" />

  <!-- Main Vertical Text Group (Rotated -90 degrees) -->
  <!-- Center of rotation set to position text vertically in the container -->
  <g transform="translate(135, 450) rotate(-90)">
    
    <!-- "MARMOT" main title -->
    <text x="0" y="0" class="title-text" text-anchor="middle" dominant-baseline="central" font-size="82">MARMOT</text>

    <!-- "®" symbol positioned precisely above the 'T' -->
    <g transform="translate(265, -35)">
      <circle cx="0" cy="0" r="16" fill="none" stroke="#D6B35A" stroke-width="3.5" />
      <text x="0" y="1" class="reg-mark" text-anchor="middle" dominant-baseline="central" font-size="19">R</text>
    </g>

    <!-- "STREETWEAR AUTORAL // 2026" subtitle running parallel to the right -->
    <text x="-5" y="62" class="sub-text" text-anchor="middle" dominant-baseline="central" font-size="14">STREETWEAR AUTORAL // 2026</text>
    
  </g>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/marmot-title.png')
  .then(info => {
    console.log('PNG generated successfully:', info);
  })
  .catch(err => {
    console.error('Error generating PNG:', err);
  });
