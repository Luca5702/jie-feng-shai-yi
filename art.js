// Handcrafted "Ligne Claire" Picture-Book SVG Illustrations & Custom Icons for 《借风晒衣》
// Unified warm espresso ink (#3A2E28), consistent stroke weights, zero OS emojis.

const INK = '#3A2E28';

const CLOTHESPINS = `
  <g class="pins">
    <rect x="24" y="2" width="6.5" height="14" rx="2.2" fill="#E3AA6E" stroke="${INK}" stroke-width="2"/>
    <line x1="24.8" y1="8.5" x2="29.7" y2="8.5" stroke="${INK}" stroke-width="1.5"/>
    <rect x="49.5" y="2" width="6.5" height="14" rx="2.2" fill="#E3AA6E" stroke="${INK}" stroke-width="2"/>
    <line x1="50.3" y1="8.5" x2="55.2" y2="8.5" stroke="${INK}" stroke-width="1.5"/>
  </g>
`;

/**
 * Thin Garment (薄衫): Sunlit Breton-striped cotton tee (1 wetness)
 */
export function svgThinShirt({ pins = true } = {}) {
  return `<svg viewBox="0 0 80 84" aria-hidden="true">
    <ellipse cx="40" cy="77" rx="20" ry="3.2" fill="#3A2E28" opacity="0.08"/>
    <path d="M25 12 L8 21 L3 36 L15 41 L20 31 L20 68 Q20 72 24 72 L56 72 Q60 72 60 68 L60 31 L65 41 L77 36 L72 21 L55 12 Q40 21 25 12 Z"
      fill="#A8D8DE" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- Soft cream woven stripes -->
    <path d="M21.2 38 H58.8 M21.2 48 H58.8 M21.2 58 H58.8" stroke="#FBF6EC" stroke-width="3.6" stroke-linecap="round"/>
    <!-- Subtle damp sheen on lower hem -->
    <path d="M21 59 Q40 56 59 59 L59 68 Q59 70.8 56 70.8 L24 70.8 Q21 70.8 21 68 Z" fill="#5CA4B5" opacity="0.22"/>
    <!-- Collar -->
    <path d="M25 12 Q40 21 55 12 Q51 9.5 47 10.5 Q40 15.5 33 10.5 Q29 9.5 25 12 Z"
      fill="#FBF6EC" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <!-- Tiny stitched pocket -->
    <path d="M44 27 H52 V34 Q48 36 44 34 Z" fill="#FBF6EC" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- Re-stroke outer contour cleanly -->
    <path d="M25 12 L8 21 L3 36 L15 41 L20 31 L20 68 Q20 72 24 72 L56 72 Q60 72 60 68 L60 31 L65 41 L77 36 L72 21 L55 12"
      fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${pins ? CLOTHESPINS : ''}
  </svg>`;
}

/**
 * Thick Garment (厚衣): Cozy cable-knit persimmon pullover sweater (2 wetness -> 1 wetness)
 */
export function svgThickSweater({ wetness = 2, pins = true } = {}) {
  const dampOpacity = wetness >= 2 ? 0.26 : 0.1;
  const dampTop = wetness >= 2 ? 46 : 60;
  return `<svg viewBox="0 0 80 84" aria-hidden="true">
    <ellipse cx="40" cy="78" rx="22" ry="3.5" fill="#3A2E28" opacity="0.09"/>
    <!-- Sweater body & long sleeves -->
    <path d="M24 12 L9 21 L4 58 L15 60 L20 35 L20 69 Q20 73 24 73 L56 73 Q60 73 60 69 L60 35 L65 60 L76 58 L71 21 L56 12 Q40 20 24 12 Z"
      fill="#EC825E" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- Ribbed cuffs & waistband -->
    <path d="M4.5 53 L15.3 55 L15 60 L4 58 Z M64.7 55 L75.5 53 L76 58 L65 60 Z" fill="#D56543" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20 65 H60 V69 Q60 73 56 73 H24 Q20 73 20 69 Z" fill="#D56543" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <!-- Dampness shade on wool -->
    <path d="M21 ${dampTop} Q40 ${dampTop - 3} 59 ${dampTop} L59 71.5 H21 Z" fill="#3E6E8A" opacity="${dampOpacity}"/>
    <!-- Cable-knit chest motif -->
    <path d="M34 25 V62 M46 25 V62" stroke="#FCEEE2" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
    <path d="M37 29 L43 34 M43 29 L37 34 M37 40 L43 45 M43 40 L37 45 M37 51 L43 56 M43 51 L37 56"
      stroke="#FCEEE2" stroke-width="2.1" stroke-linecap="round" opacity="0.8"/>
    <!-- Chunky cream knit collar -->
    <path d="M24 12 Q40 21 56 12 L53 8.5 Q40 15 27 8.5 Z"
      fill="#FCEEE2" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    ${pins ? CLOTHESPINS : ''}
  </svg>`;
}

/**
 * Potted Kumquat Tree (橘树盆栽): Courtyard wind-blocking prop
 */
export function svgKumquatTree() {
  return `<svg viewBox="0 0 80 84" aria-hidden="true">
    <ellipse cx="40" cy="76" rx="20" ry="3.8" fill="#3A2E28" opacity="0.12"/>
    <!-- Terracotta pot -->
    <path d="M26 54 H54 L50 74 Q49.5 76 47 76 H33 Q30.5 76 30 74 Z"
      fill="#D97A54" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="23" y="48" width="34" height="7" rx="3" fill="#E88E68" stroke="${INK}" stroke-width="2.3"/>
    <!-- Trunk -->
    <path d="M38 48 V37 M42 48 V39" stroke="#7D563C" stroke-width="3.2" stroke-linecap="round"/>
    <!-- Layered sage & olive foliage -->
    <circle cx="27" cy="31" r="12" fill="#5D9467" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="53" cy="31" r="12" fill="#5D9467" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="40" cy="21" r="14.5" fill="#74AD7B" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="38" cy="33" r="11" fill="#74AD7B"/>
    <!-- Leaf highlight -->
    <path d="M33 14 Q40 10 47 14" fill="none" stroke="#A6CFA8" stroke-width="2.4" stroke-linecap="round"/>
    <!-- Golden kumquats -->
    <circle cx="30" cy="28" r="4.2" fill="#F4A83B" stroke="${INK}" stroke-width="1.9"/>
    <circle cx="48" cy="24" r="4.4" fill="#F4A83B" stroke="${INK}" stroke-width="1.9"/>
    <circle cx="43" cy="36" r="4.0" fill="#F4A83B" stroke="${INK}" stroke-width="1.9"/>
    <circle cx="29" cy="26.8" r="1" fill="#FFF8E8"/>
    <circle cx="47" cy="22.8" r="1" fill="#FFF8E8"/>
  </svg>`;
}

export function svgWaterDrop(dry = false) {
  return `<svg class="drop-ic${dry ? ' is-dry' : ''}" viewBox="0 0 12 15" aria-hidden="true">
    <path d="M6 1.2 C6 1.2 1.2 6.8 1.2 9.6 A4.8 4.5 0 0 0 10.8 9.6 C10.8 6.8 6 1.2 6 1.2 Z"
      fill="${dry ? '#DFD6C7' : '#58A8BE'}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
    ${dry ? '' : '<circle cx="4.5" cy="9.2" r="1.1" fill="#fff" opacity="0.85"/>'}
  </svg>`;
}

export function svgSunStamp(active = true) {
  const fill = active ? '#F3B643' : '#E7DEC9';
  const ray = active ? '#E89238' : '#D5CBB6';
  return `<svg class="sun-stamp${active ? ' is-on' : ''}" viewBox="0 0 36 36" aria-hidden="true">
    <g stroke="${ray}" stroke-width="2.4" stroke-linecap="round">
      <line x1="18" y1="2.5" x2="18" y2="6.2"/>
      <line x1="18" y1="29.8" x2="18" y2="33.5"/>
      <line x1="2.5" y1="18" x2="6.2" y2="18"/>
      <line x1="29.8" y1="18" x2="33.5" y2="18"/>
      <line x1="7" y1="7" x2="9.7" y2="9.7"/>
      <line x1="26.3" y1="26.3" x2="29" y2="29"/>
      <line x1="29" y1="7" x2="26.3" y2="9.7"/>
      <line x1="9.7" y1="26.3" x2="7" y2="29"/>
    </g>
    <circle cx="18" cy="18" r="8.8" fill="${fill}" stroke="${INK}" stroke-width="2.1"/>
    ${active ? '<circle cx="15.5" cy="15.5" r="1.8" fill="#FFF8E6" opacity="0.8"/>' : ''}
  </svg>`;
}

export function svgWindArrow(dir) {
  const rot = { W: 0, S: -90, E: 180, N: 90 }[dir] ?? 0;
  return `<svg class="wind-arrow-ic" viewBox="0 0 24 24" style="transform:rotate(${rot}deg)" aria-hidden="true">
    <path d="M3.5 12 H19 M13.5 6.5 L19.5 12 L13.5 17.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export const ICONS = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 L8 12 L14.5 18.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/></svg>`,
  undo: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 L4.5 11.5 L9 16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 11.5 H14.5 A5 5 0 0 1 14.5 21.5 H12" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>`,
  restart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 7 V3 M19 7 H15" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.4 7 A7.5 7.5 0 1 0 19.5 13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>`,
  hint: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 A6 6 0 0 1 15.5 14.1 V16.5 H8.5 V14.1 A6 6 0 0 1 12 3.2 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9.5 19.8 H14.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  clip: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3.5 L11.5 3.5 L11 20.5 L8 20.5 Z M12.5 3.5 L15.5 3.5 L16 20.5 L13 20.5 Z" fill="#E3AA6E" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="10.5" r="2.1" fill="#FBF6EC" stroke="currentColor" stroke-width="1.8"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.5 H8.5 L13.5 5.5 V18.5 L8.5 14.5 H5 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M16.8 8.8 A4.8 4.8 0 0 1 16.8 15.2 M19.5 6.5 A8 8 0 0 1 19.5 17.5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.5 H8.5 L13.5 5.5 V18.5 L8.5 14.5 H5 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M16.5 9.5 L21 14 M21 9.5 L16.5 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="11" width="12" height="9.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M8.5 11 V8 A3.5 3.5 0 0 1 15.5 8 V11" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>`,
  workshop: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L14.2 8.8 L20.5 9.3 L15.7 13.3 L17.2 19.4 L12 16.1 L6.8 19.4 L8.3 13.3 L3.5 9.3 L9.8 8.8 Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/></svg>`,
  hand: `<svg class="guide-hand" viewBox="0 0 48 48" aria-hidden="true"><path d="M18 22V9a3 3 0 0 1 6 0v11l1-.2V16a3 3 0 0 1 6 0v4.6l.8-.1a3 3 0 0 1 5.2 2V33c0 7-5 11-11 11h-2c-4 0-6.5-1.8-8.6-4.6L9.2 31a3 3 0 0 1 4.6-3.8L18 31z" fill="#FFFDF8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
};

export function renderGarmentMarkup(type, wetness, { ghost = false, drops = true, pins = true } = {}) {
  const svg = type === 'H' ? svgThickSweater({ wetness, pins }) : svgThinShirt({ pins });
  const dropPips = drops
    ? `<div class="drop-pips">${Array.from({ length: wetness }, () => svgWaterDrop(false)).join('')}</div>`
    : '';
  return `<div class="garment-art type-${type}${ghost ? ' is-ghost' : ''}">${svg}${dropPips}</div>`;
}
