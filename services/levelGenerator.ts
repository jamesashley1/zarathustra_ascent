
import { Platform, Enemy, MetamorphosisType, GameState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, PALETTE, LEVELS } from '../constants';

export const generateLevel = (levelName: string) => {
  const platforms: Platform[] = [];
  const enemies: Enemy[] = [];
  let playerStart = { x: 100, y: 300 };
  let levelWidth = 2000;
  let loopConfig = undefined;

  // Floor Helper
  const createFloor = (start: number, width: number, y: number = CANVAS_HEIGHT - 32) => {
    platforms.push({ x: start, y, w: width, h: 32, type: 'solid', color: PALETTE.gothicGrey });
  };
  
  // Ceiling Helper for Boss Arena
  const createCeiling = (start: number, width: number, y: number = 0) => {
    platforms.push({ x: start, y, w: width, h: 32, type: 'solid', color: PALETTE.gothicGrey });
  };

  const createPlatform = (x: number, y: number, w: number) => {
    platforms.push({ x, y, w, h: 16, type: 'solid', color: PALETTE.gothicGrey });
  };

  const createSpikes = (x: number, y: number, w: number) => {
    platforms.push({ x, y, w, h: 16, type: 'danger', color: PALETTE.bloodRed });
  };

  if (levelName === LEVELS.PROLOGUE) {
    // TIGHTROPE WALKER LEVEL
    levelWidth = 3000;
    createFloor(0, 600);
    createPlatform(700, 350, 64);
    createPlatform(850, 300, 32); 
    createPlatform(1000, 250, 32);
    createPlatform(1200, 300, 200);
    createSpikes(600, CANVAS_HEIGHT - 16, 1000);

    enemies.push({
      id: 'e1', x: 1300, y: 250, w: 32, h: 32, vx: 1, vy: 0, color: PALETTE.bloodRed,
      type: 'walker', hp: 20, patrolCenter: 1300, patrolRange: 100
    });

    platforms.push({ x: 1500, y: 250, w: 40, h: 60, type: 'door', targetLevel: LEVELS.METAMORPHOSES, color: PALETTE.deepGold });
  } 
  
  else if (levelName === LEVELS.METAMORPHOSES) {
    // THE THREE METAMORPHOSES (TUTORIAL LEVEL)
    levelWidth = 3000;
    
    // --- Section 1: Introduction ---
    createFloor(0, 500);
    
    // --- Section 2: The Needle's Eye (Requires CHILD form) ---
    // A wall hangs down, leaving a small gap at the bottom.
    // Player Height: Camel/Lion = 48px, Child = 24px.
    // Gap Height: 38px.
    // Wall from y=0 down to y=380. Floor is at y=418.
    platforms.push({ x: 500, y: 0, w: 100, h: 380, type: 'solid', color: PALETTE.gothicGrey });
    createFloor(500, 100); // The floor under the tunnel

    createFloor(600, 400); // Landing area

    // --- Section 3: The Lion's Leap (Requires LION form) ---
    // A large pit that requires high speed/jump.
    // Gap Start: 1000. Gap End: 1220. Width: 220px.
    // Lion Jump Range > 250px. Camel/Child < 150px.
    createFloor(1220, 800);
    
    // Put some spikes in the pit so they don't just fall forever (optional, or just void)
    createSpikes(1000, CANVAS_HEIGHT - 16, 220);

    // --- Section 4: The Guardian (Combat) ---
    enemies.push({
      id: 'e2', x: 1500, y: 350, w: 48, h: 48, vx: 0.5, vy: 0, color: PALETTE.bloodRed,
      type: 'walker', hp: 80, patrolCenter: 1500, patrolRange: 150
    });

    // Exit
    platforms.push({ x: 1900, y: 350, w: 40, h: 60, type: 'door', targetLevel: LEVELS.VISION, color: PALETTE.deepGold });
  }

  else if (levelName === LEVELS.VISION) {
    // THE VISION AND THE ENIGMA
    levelWidth = 4000;
    
    // -- Intro Section --
    createFloor(0, 400);
    
    // -- The Eternal Recurrence Loop (x: 400 to 1800) --
    // A seemingly endless corridor of archways and repeating platforms.
    loopConfig = { startX: 400, endX: 1800, active: true };
    
    // The "Corridor" repeated structure
    for (let i = 0; i < 3; i++) {
        let offset = 400 + i * 500;
        createFloor(offset, 500);
        createPlatform(offset + 200, 300, 100);
        // An archway visual (just walls for now)
        platforms.push({ x: offset + 400, y: 200, w: 20, h: 200, type: 'solid', color: PALETTE.gothicGrey });
        
        // Enemies in loop
        enemies.push({
            id: `loop_walker_${i}`, x: offset + 300, y: 350, w: 32, h: 32, vx: 1, vy: 0, color: PALETTE.bloodRed,
            type: 'walker', hp: 30, patrolCenter: offset + 300, patrolRange: 100
        });
    }

    // -- The Trigger (Breaking the Loop) --
    // A "Snake" hanging from a high place near the end of the loop segment.
    // It represents the choking snake in the parable.
    createPlatform(1600, 150, 64); // High platform
    enemies.push({
        id: 'the_snake', x: 1616, y: 110, w: 32, h: 32, vx: 0, vy: 0, color: '#00ff00', // Green for snake
        type: 'loop_anchor', hp: 1, // One hit to break
    });

    // -- Post-Loop / Ascent to Arena --
    createFloor(1800, 600); // Only accessible after loop break
    // Stairs to boss
    createPlatform(2000, 350, 100);
    createPlatform(2150, 300, 100);
    createPlatform(2300, 250, 100);

    // -- Boss Arena: The Spirit of Gravity (x: 2500+) --
    const arenaStart = 2500;
    createFloor(arenaStart, 1000);
    createCeiling(arenaStart, 1000, 50); // Ceiling for reverse gravity
    
    // Walls to lock player in (conceptually, or just solid blocks)
    platforms.push({ x: arenaStart - 50, y: 0, w: 50, h: CANVAS_HEIGHT, type: 'solid', color: PALETTE.gothicGrey });
    platforms.push({ x: arenaStart + 1000, y: 0, w: 50, h: CANVAS_HEIGHT, type: 'solid', color: PALETTE.gothicGrey });

    enemies.push({
      id: 'boss_gravity', x: arenaStart + 500, y: 200, w: 64, h: 80, vx: 0, vy: 0, color: '#4a0404',
      type: 'boss_gravity', hp: 1000, maxHp: 1000, bossPhase: 0, bossTimer: 0
    });
  }

  return { platforms, enemies, playerStart, levelWidth, loopConfig };
};
