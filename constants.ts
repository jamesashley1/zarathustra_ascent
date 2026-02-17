
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const TILE_SIZE = 32;

export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 12;

export enum InputKeys {
  LEFT = 'ArrowLeft',
  RIGHT = 'ArrowRight',
  UP = 'ArrowUp',
  DOWN = 'ArrowDown',
  JUMP = ' ',
  ATTACK = 'x',
  SWITCH_NEXT = 'c',
  SWITCH_PREV = 'v',
  RESTART = 'r',
}

export const PALETTE = {
  void: '#0f0e17', // Darker void
  background: '#2e2a42', // Dark purple/blue bg
  floor: '#1c192e', // Darker floor
  bloodRed: '#9f1239', // Richer red
  deepGold: '#fbbf24', // Brighter gold for UI
  gothicGrey: '#52525b', // Structure grey
  marbleWhite: '#f4f4f5', // Highlights
  radiantLight: '#fffbeb', // Attack glow
  uiBorder: '#78350f', // Dark wood/leather
  uiFill: '#271c19', // Dark UI background
};

export const LEVELS = {
  PROLOGUE: 'The Tightrope Walker',
  METAMORPHOSES: 'The Three Metamorphoses',
  VISION: 'The Vision and the Enigma',
};
