
export enum MetamorphosisType {
  CAMEL = 'CAMEL',
  LION = 'LION',
  CHILD = 'CHILD',
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Entity extends Rect {
  id: string;
  vx: number;
  vy: number;
  color: string;
}

export interface Player extends Entity {
  form: MetamorphosisType;
  facing: 1 | -1; // 1 right, -1 left
  isGrounded: boolean;
  hp: number;
  maxHp: number;
  spirit: number;
  attackCooldown: number;
  invincibilityTimer: number;
  isAttacking: boolean;
  attackFrame: number;
  walkFrame: number;
}

export interface Enemy extends Entity {
  type: 'walker' | 'flyer' | 'boss_gravity' | 'loop_anchor';
  hp: number;
  maxHp?: number;
  patrolCenter?: number;
  patrolRange?: number;
  bossPhase?: number;
  bossTimer?: number;
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  ttl: number; // Time to live
  type: 'radiant' | 'eagle' | 'serpent' | 'gravity_orb' | 'star';
  owner: 'player' | 'enemy';
}

export interface Platform extends Rect {
  type: 'solid' | 'oneway' | 'danger' | 'door';
  targetLevel?: string;
  color: string;
}

export interface Particle extends Rect {
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface GameState {
  currentLevel: string;
  player: Player;
  platforms: Platform[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  camera: { x: number; y: number };
  gameStatus: 'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'PAUSED';
  bossGravityModifier: number; // For the Spirit of Gravity boss
  message: string;
  messageTimer: number;
  loopConfig?: {
    startX: number;
    endX: number;
    active: boolean;
  };
  soundEvents: string[]; // Queue of SFX to play this frame
}
