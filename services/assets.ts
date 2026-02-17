
import { PALETTE } from '../constants';

// Helper to create data URI
const svgToDataUri = (svgString: string) => 
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

// --- Generators ---

// Camel: Hunched, heavy, pixel-art style
const createCamelSvg = (phase: 'idle' | 'walk1' | 'walk2') => {
  let l1=0, l2=0; 
  if (phase === 'walk1') { l1 = -2; l2 = 2; }
  if (phase === 'walk2') { l1 = 2; l2 = -2; }
  
  return `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Back Legs -->
  <rect x="${18+l1}" y="48" width="6" height="16" fill="#713f12" />
  <rect x="${40+l2}" y="48" width="6" height="16" fill="#713f12" />
  
  <!-- Body Main -->
  <rect x="14" y="32" width="36" height="20" fill="#a16207" />
  <!-- Hump -->
  <rect x="20" y="24" width="14" height="10" fill="#a16207" />
  
  <!-- Front Legs -->
  <rect x="${14+l2}" y="48" width="6" height="16" fill="#a16207" />
  <rect x="${44+l1}" y="48" width="6" height="16" fill="#a16207" />

  <!-- Neck -->
  <rect x="50" y="28" width="8" height="14" fill="#a16207" />
  <!-- Head -->
  <rect x="52" y="20" width="12" height="10" fill="#a16207" />
  <rect x="62" y="22" width="2" height="2" fill="#000" /> <!-- Eye -->
  
  <!-- The Burden -->
  <rect x="22" y="22" width="12" height="12" fill="#451a03" />
  <rect x="20" y="26" width="16" height="2" fill="#78350f" />
</svg>`;
};

// Lion: Mane, fierce, pixel-art style
const createLionSvg = (phase: 'idle' | 'walk1' | 'walk2' | 'attack') => {
  let l1=0, l2=0;
  let attackSwipe = '';
  
  if (phase === 'walk1') { l1 = -3; l2 = 3; }
  if (phase === 'walk2') { l1 = 3; l2 = -3; }
  if (phase === 'attack') {
      attackSwipe = `<path d="M45,25 Q55,20 60,35 T45,50" stroke="#fbbf24" stroke-width="4" fill="none" />`;
  }

  return `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Tail -->
  <rect x="8" y="35" width="4" height="12" fill="#b45309" />
  
  <!-- Back Legs -->
  <rect x="${18+l1}" y="48" width="6" height="14" fill="#92400e" />
  <rect x="${38+l2}" y="48" width="6" height="14" fill="#92400e" />
  
  <!-- Body -->
  <rect x="16" y="36" width="28" height="16" fill="#b45309" />
  
  <!-- Front Legs -->
  <rect x="${14+l2}" y="48" width="6" height="14" fill="#b45309" />
  <rect x="${42+l1}" y="48" width="6" height="14" fill="#b45309" />

  <!-- Mane -->
  <rect x="38" y="22" width="18" height="20" fill="#7f1d1d" />
  
  <!-- Face -->
  <rect x="44" y="26" width="10" height="10" fill="#b45309" />
  <rect x="50" y="28" width="2" height="2" fill="#000" />
  
  ${attackSwipe}
</svg>`;
};

// Child: Small, glowing, wheel
const createChildSvg = (phase: 'idle' | 'walk1' | 'walk2' | 'attack') => {
  let yOff = phase.includes('walk') ? (phase === 'walk1' ? -2 : 2) : 0;
  let glow = phase === 'attack' ? 0.8 : 0.4;
  
  return `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Glow -->
  <circle cx="32" cy="${32+yOff}" r="20" fill="${PALETTE.radiantLight}" fill-opacity="${glow}" />

  <!-- Body -->
  <rect x="26" y="${36+yOff}" width="12" height="14" fill="#e4e4e7" />
  
  <!-- Head -->
  <rect x="26" y="${22+yOff}" width="12" height="12" fill="#f4f4f5" />
  <rect x="34" y="${26+yOff}" width="2" height="2" fill="#000" />
  
  <!-- The Wheel -->
  <circle cx="32" cy="${32+yOff}" r="22" stroke="#fbbf24" stroke-width="2" fill="none" stroke-dasharray="4 4" opacity="0.7"/>
</svg>`;
};

// Enemy Walker: Dark Knight/Demon
const ENEMY_WALKER_SVG = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
   <!-- Armor Dark -->
   <rect x="22" y="20" width="20" height="30" fill="#3f3f46" />
   <!-- Helmet -->
   <rect x="22" y="10" width="20" height="14" fill="#27272a" />
   <!-- Eyes -->
   <rect x="28" y="16" width="2" height="2" fill="#ef4444" />
   <rect x="34" y="16" width="2" height="2" fill="#ef4444" />
   <!-- Weapon -->
   <rect x="42" y="25" width="4" height="25" fill="#71717a" />
   <rect x="38" y="35" width="12" height="4" fill="#71717a" />
</svg>
`;

// Environment: Castle Bricks
const FLOOR_TILE_SVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#2e2a42" /> <!-- Base Dark Blue -->
  <!-- Bricks -->
  <rect x="0" y="0" width="15" height="14" fill="#4c1d95" opacity="0.6"/>
  <rect x="16" y="0" width="16" height="14" fill="#4338ca" opacity="0.4"/>
  
  <rect x="0" y="16" width="8" height="14" fill="#4338ca" opacity="0.4"/>
  <rect x="9" y="16" width="14" height="14" fill="#4c1d95" opacity="0.6"/>
  <rect x="24" y="16" width="8" height="14" fill="#4338ca" opacity="0.4"/>
  
  <!-- Highlights -->
  <rect x="0" y="0" width="32" height="1" fill="#6d28d9" opacity="0.3"/>
</svg>`;

const BG_TILE_SVG = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect width="256" height="256" fill="#1e1b4b" />
  <!-- Pillars -->
  <rect x="40" y="0" width="20" height="256" fill="#0f0e17" opacity="0.5"/>
  <rect x="196" y="0" width="20" height="256" fill="#0f0e17" opacity="0.5"/>
  <!-- Arches -->
  <path d="M60,100 Q128,50 196,100" stroke="#312e81" stroke-width="4" fill="none" opacity="0.3"/>
  <!-- Texture -->
  <rect x="80" y="150" width="10" height="5" fill="#312e81" opacity="0.2"/>
  <rect x="150" y="200" width="10" height="5" fill="#312e81" opacity="0.2"/>
</svg>`;

export const ASSETS = {
  CAMEL_IDLE: svgToDataUri(createCamelSvg('idle')),
  CAMEL_WALK1: svgToDataUri(createCamelSvg('walk1')),
  CAMEL_WALK2: svgToDataUri(createCamelSvg('walk2')),
  
  LION_IDLE: svgToDataUri(createLionSvg('idle')),
  LION_WALK1: svgToDataUri(createLionSvg('walk1')),
  LION_WALK2: svgToDataUri(createLionSvg('walk2')),
  LION_ATTACK: svgToDataUri(createLionSvg('attack')),

  CHILD_IDLE: svgToDataUri(createChildSvg('idle')),
  CHILD_WALK1: svgToDataUri(createChildSvg('walk1')),
  CHILD_WALK2: svgToDataUri(createChildSvg('walk2')),
  CHILD_ATTACK: svgToDataUri(createChildSvg('attack')),

  ENEMY_WALKER: svgToDataUri(ENEMY_WALKER_SVG),
  
  BOSS: svgToDataUri(`
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="50" fill="#000" stroke="#7f1d1d" stroke-width="4"/>
  <path d="M40,60 Q64,90 88,60" fill="none" stroke="#7f1d1d" stroke-width="4"/>
  <rect x="44" y="40" width="10" height="10" fill="#ef4444"/>
  <rect x="74" y="40" width="10" height="10" fill="#ef4444"/>
</svg>`),
  FLOOR: svgToDataUri(FLOOR_TILE_SVG),
  SPIKE: svgToDataUri(`<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16,0 L32,32 L0,32 Z" fill="#7f1d1d"/></svg>`),
  BG: svgToDataUri(BG_TILE_SVG),
};
