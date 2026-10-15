// Inline SVG illustrations for the ads, in the brand colours.
const ink = '#1E2A23', forest = '#2E5A44', gold = '#B5843A', clay = '#A9503A', paper = '#F5EEDF';

export const logo = `<svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${forest}"/><path d="M32 50V27M32 36l-9-8M32 32l9-8M32 42l-11-5M32 40l11-6" stroke="${paper}" stroke-width="3.2" stroke-linecap="round" fill="none"/><circle cx="32" cy="19" r="5" fill="${gold}"/></svg>`;

const person = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><circle cx="${x}" cy="${y - r * 0.18}" r="${r * 0.34}" fill="${paper}" opacity=".9"/><path d="M${x - r * 0.55} ${y + r * 0.62} a${r * 0.55} ${r * 0.45} 0 0 1 ${r * 1.1} 0" fill="${paper}" opacity=".9"/>`;

export const visuals = {
  mix: `<svg viewBox="0 0 640 560"><rect x="20" y="40" width="600" height="480" rx="22" fill="#fff" stroke="${ink}" stroke-width="4"/>
      <text x="60" y="110" font-family="Caladea, serif" font-size="36" font-weight="700" fill="${ink}">Where we come from</text>
      <g transform="translate(60 140)"><rect width="520" height="44" rx="22" fill="${paper}"/>
        <rect width="260" height="44" rx="22" fill="${forest}"/><rect x="240" width="140" height="44" fill="${gold}"/><rect x="380" width="100" height="44" fill="${clay}"/></g>
      ${[['Mexico', '50%', forest], ['Ireland', '25%', gold], ['Scotland', '19%', clay], ['Not yet known', '6%', '#cfc8b8']].map(([c, v, col], i) =>
        `<circle cx="78" cy="${248 + i * 66}" r="16" fill="${col}"/><text x="110" y="${260 + i * 66}" font-family="Inter, sans-serif" font-size="32" fill="${ink}">${c}</text><text x="580" y="${260 + i * 66}" font-family="Inter, sans-serif" font-size="32" font-weight="700" fill="${ink}" text-anchor="end">${v}</text>`).join('')}</svg>`,
  related: `<svg viewBox="0 0 640 560">${person(140, 120, 60, gold)}${person(500, 120, 60, gold)}${person(140, 300, 52, forest)}${person(500, 300, 52, forest)}${person(140, 460, 46, clay)}${person(500, 460, 46, clay)}
      <path d="M200 120h240M140 180v68M500 180v68M140 352v62M500 352v62" stroke="${ink}" stroke-width="5" fill="none" opacity=".6"/>
      <rect x="215" y="420" width="210" height="80" rx="40" fill="#fff" stroke="${gold}" stroke-width="5"/><text x="320" y="455" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="${ink}" text-anchor="middle">second</text><text x="320" y="485" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="${ink}" text-anchor="middle">cousins</text></svg>`,
  tree: `<svg viewBox="0 0 600 600"><g stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75">
      <path d="M300 560V330"/><path d="M300 420C240 380 170 360 120 300"/><path d="M300 400C360 360 430 350 480 290"/><path d="M300 340C280 280 230 230 200 170"/><path d="M300 340C320 280 370 230 400 170"/>
      <path d="M300 560c-30 10-70 12-110 6M300 560c30 10 70 12 110 6M300 560c-10 14-30 24-60 30M300 560c10 14 30 24 60 30" stroke="${gold}"/></g>
      ${person(120, 270, 48, forest)}${person(480, 262, 48, clay)}${person(200, 150, 44, gold)}${person(400, 150, 44, forest)}${person(300, 300, 54, clay)}</svg>`,
  wave: `<svg viewBox="0 0 600 600"><rect x="235" y="90" width="130" height="250" rx="65" fill="${forest}"/><path d="M190 270a110 110 0 0 0 220 0" stroke="${ink}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M300 380v70M240 455h120" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
      ${[40,90,140,460,510,560].map((x, i) => `<rect x="${x - 12}" y="${300 - [60,120,80,100,140,70][i]}" width="24" height="${[60,120,80,100,140,70][i] * 2}" rx="12" fill="${i % 2 ? gold : clay}" opacity=".85"/>`).join('')}
      <text x="300" y="545" font-family="Caladea, serif" font-size="40" font-style="italic" fill="${ink}" text-anchor="middle">"Tell me about your mother…"</text></svg>`,
  import: `<svg viewBox="0 0 640 600"><rect x="30" y="170" width="190" height="240" rx="14" fill="#fff" stroke="${ink}" stroke-width="5"/><path d="M170 170v50h50" fill="none" stroke="${ink}" stroke-width="5"/>
      <text x="125" y="330" font-family="Carlito, sans-serif" font-weight="700" font-size="54" fill="${clay}" text-anchor="middle">.GED</text>
      <path d="M250 290h120" stroke="${gold}" stroke-width="12" stroke-linecap="round"/><path d="M350 255l45 35-45 35" fill="none" stroke="${gold}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <g stroke="${ink}" stroke-width="5" opacity=".7"><path d="M520 200v80M470 280h100M470 280v70M570 280v70"/></g>
      ${person(520, 170, 40, forest)}${person(470, 380, 38, clay)}${person(570, 380, 38, gold)}
      <text x="520" y="480" font-family="Carlito, sans-serif" font-size="34" fill="${forest}" font-weight="700" text-anchor="middle">2 minutes</text></svg>`,
  book: `<svg viewBox="0 0 640 520"><path d="M320 110C250 70 140 60 50 80v350c90-20 200-10 270 30z" fill="#fff" stroke="${ink}" stroke-width="5"/><path d="M320 110c70-40 180-50 270-30v350c-90-20-200-10-270 30z" fill="#fff" stroke="${ink}" stroke-width="5"/>
      <text x="185" y="170" font-family="Caladea, serif" font-size="34" font-weight="700" fill="${forest}" text-anchor="middle">Chapter One</text>
      ${[210,245,280,315,350].map((y) => `<path d="M95 ${y}h${170 - (y % 3) * 10}" stroke="${ink}" stroke-width="5" opacity=".35" stroke-linecap="round"/>`).join('')}
      <circle cx="455" cy="200" r="60" fill="${gold}" opacity=".85"/>${person(455, 200, 48, clay)}
      ${[300,335,370].map((y) => `<path d="M375 ${y}h170" stroke="${ink}" stroke-width="5" opacity=".35" stroke-linecap="round"/>`).join('')}</svg>`,
  evidence: `<svg viewBox="0 0 640 560"><rect x="20" y="40" width="600" height="480" rx="22" fill="#fff" stroke="${ink}" stroke-width="4"/>
      <text x="60" y="110" font-family="Caladea, serif" font-size="40" font-weight="700" fill="${ink}">Rosa Vega (1902–1980)</text>
      <rect x="60" y="135" width="290" height="50" rx="25" fill="#DCEBDF"/><text x="80" y="170" font-family="Carlito, sans-serif" font-size="28" font-weight="700" fill="${forest}">Strong match · 86/100</text>
      ${[['✓','Surname matches exactly', forest],['✓','Birth year 1902 matches',forest],['✓','Birth place: Oaxaca',forest],['✗','Death place differs',clay]].map(([m,t,c],i) => `<text x="60" y="${255 + i * 64}" font-family="Carlito, sans-serif" font-size="38" font-weight="700" fill="${c}">${m}</text><text x="110" y="${255 + i * 64}" font-family="Carlito, sans-serif" font-size="32" fill="${ink}">${t}</text>`).join('')}</svg>`,
  shield: `<svg viewBox="0 0 600 600"><path d="M300 60l200 70v150c0 140-90 230-200 270C190 510 100 420 100 280V130z" fill="${forest}"/><path d="M300 100l160 56v126c0 115-72 190-160 225-88-35-160-110-160-225V156z" fill="none" stroke="${gold}" stroke-width="6"/>
      <path d="M220 300l55 55 110-120" fill="none" stroke="${paper}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  records: `<svg viewBox="0 0 640 560"><rect x="40" y="60" width="380" height="440" rx="10" fill="#fff" stroke="${ink}" stroke-width="5"/>
      <text x="230" y="125" font-family="Caladea, serif" font-size="40" font-weight="700" fill="${ink}" text-anchor="middle">The Daily Herald</text><path d="M70 145h320" stroke="${ink}" stroke-width="4"/>
      ${[185,220,255,290,325,360,395,430].map((y, i) => `<path d="M75 ${y}h${i % 3 === 0 ? 150 : 310}" stroke="${ink}" stroke-width="6" opacity=".3" stroke-linecap="round"/>`).join('')}
      <circle cx="430" cy="330" r="110" fill="${paper}" fill-opacity=".6" stroke="${gold}" stroke-width="20"/><path d="M510 410l90 90" stroke="${gold}" stroke-width="30" stroke-linecap="round"/>
      <text x="430" y="342" font-family="Caladea, serif" font-size="38" font-style="italic" fill="${clay}" text-anchor="middle">Vega</text></svg>`,
};
