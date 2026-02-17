
import { GameState, Player, MetamorphosisType, Projectile, Particle, Entity, Rect, Enemy } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, TERMINAL_VELOCITY, InputKeys, PALETTE, TILE_SIZE, LEVELS } from '../constants';
import { InputManager } from './input';
import { generateLevel } from './levelGenerator';

export class GameEngine {
  state: GameState;
  input: InputManager;
  lastTime: number = 0;

  constructor() {
    this.input = new InputManager();
    this.state = this.getInitialState(LEVELS.PROLOGUE);
  }

  getInitialState(levelName: string): GameState {
    const { platforms, enemies, playerStart, loopConfig } = generateLevel(levelName);
    return {
      currentLevel: levelName,
      player: {
        id: 'player',
        x: playerStart.x,
        y: playerStart.y,
        w: 32,
        h: 48, // Standard height
        vx: 0,
        vy: 0,
        color: PALETTE.deepGold,
        form: MetamorphosisType.CAMEL, // Start as Camel
        facing: 1,
        isGrounded: false,
        hp: 100,
        maxHp: 100,
        spirit: 10,
        attackCooldown: 0,
        invincibilityTimer: 0,
        isAttacking: false,
        attackFrame: 0,
        walkFrame: 0,
      },
      platforms,
      enemies,
      projectiles: [],
      particles: [],
      camera: { x: 0, y: 0 },
      gameStatus: 'MENU',
      bossGravityModifier: 0,
      message: "Space to Jump. C to Transform.",
      messageTimer: 300,
      loopConfig,
      soundEvents: []
    };
  }

  startGame() {
    this.state = this.getInitialState(LEVELS.PROLOGUE);
    this.state.gameStatus = 'PLAYING';
    this.state.soundEvents.push('TRANSFORM'); 
  }

  restartLevel() {
      this.state = this.getInitialState(this.state.currentLevel);
      this.state.gameStatus = 'PLAYING';
  }

  update(deltaTime: number) {
    if (this.state.gameStatus !== 'PLAYING') return;
    
    // Clear previous frame sounds
    this.state.soundEvents = [];

    const { player, loopConfig } = this.state;

    // --- Animation State Update ---
    if (player.isGrounded && Math.abs(player.vx) > 0.1) {
        player.walkFrame += 0.25; 
    } else {
        if (player.isGrounded) player.walkFrame = 0;
    }

    // --- Eternal Recurrence Loop Logic ---
    if (loopConfig && loopConfig.active) {
        if (player.x > loopConfig.endX) {
            player.x = loopConfig.startX + (player.x - loopConfig.endX);
            this.showMessage("The Moment Recurs... Break the Anchor.");
        }
    }

    // --- State Machine: Metamorphoses ---
    if (this.input.isPressed(InputKeys.SWITCH_NEXT)) {
      this.cycleForm(player);
    }
    
    // Apply Form Attributes
    let moveSpeed = 4;
    let jumpPower = -10;
    let totalGravity = GRAVITY * (1.0 + this.state.bossGravityModifier); 
    
    switch (player.form) {
      case MetamorphosisType.CAMEL:
        moveSpeed = 2.5; 
        jumpPower = -8; 
        if (totalGravity > 0) totalGravity *= 1.2; 
        player.w = 40;
        player.h = 48;
        player.color = '#d97706'; 
        break;
      case MetamorphosisType.LION:
        moveSpeed = 6; // Lion is faster
        jumpPower = -11; 
        player.w = 32;
        player.h = 48;
        player.color = '#b91c1c'; 
        break;
      case MetamorphosisType.CHILD:
        moveSpeed = 3.5;
        jumpPower = -9;
        if (totalGravity > 0) totalGravity *= 0.7; 
        player.w = 24; 
        player.h = 24;
        player.color = PALETTE.marbleWhite; 
        break;
    }

    // --- Physics: Movement ---
    // Only allow movement input if not in the middle of a heavy attack start-up (Camel)
    const movementLocked = player.form === MetamorphosisType.CAMEL && player.isAttacking && player.attackFrame < 10;
    
    if (!movementLocked) {
        if (player.isGrounded) {
           if (this.input.isDown(InputKeys.LEFT) || this.input.isDown('a') || this.input.isDown('A')) {
            player.vx = -moveSpeed;
            player.facing = -1;
          } else if (this.input.isDown(InputKeys.RIGHT) || this.input.isDown('d') || this.input.isDown('D')) {
            player.vx = moveSpeed;
            player.facing = 1;
          } else {
            player.vx = 0;
          }

          if (this.input.isPressed(InputKeys.JUMP)) {
            if (totalGravity < 0) {
                player.vy = -jumpPower; // Jump Down
            } else {
                player.vy = jumpPower; // Jump Up
            }
            player.isGrounded = false;
            this.state.soundEvents.push(`JUMP_${player.form}`);
          }
        } else {
           // Air Control
           const airAccel = 0.5;
           if (this.input.isDown(InputKeys.LEFT) || this.input.isDown('a') || this.input.isDown('A')) {
              player.vx -= airAccel;
              player.facing = -1;
           } else if (this.input.isDown(InputKeys.RIGHT) || this.input.isDown('d') || this.input.isDown('D')) {
              player.vx += airAccel;
              player.facing = 1;
           }
           player.vx = Math.max(Math.min(player.vx, moveSpeed), -moveSpeed);
        }
    }

    // Apply Gravity
    player.vy += totalGravity;
    
    if (totalGravity > 0) {
        player.vy = Math.min(player.vy, TERMINAL_VELOCITY);
    } else {
        player.vy = Math.max(player.vy, -TERMINAL_VELOCITY);
    }

    // Apply Velocity
    player.x += player.vx;
    this.handleCollisions(player, 'x');
    player.y += player.vy;
    this.handleCollisions(player, 'y', totalGravity);

    // --- UNIQUE COMBAT MECHANICS ---
    if (player.attackCooldown > 0) player.attackCooldown--;
    
    if (player.isAttacking) {
        player.attackFrame++;
        
        // LION: Lunge Forward during attack
        if (player.form === MetamorphosisType.LION && player.attackFrame < 8) {
             player.vx = player.facing * 8; // Burst of speed
             player.x += player.vx; // Apply immediately
             this.handleCollisions(player, 'x');
        }

        const maxFrame = player.form === MetamorphosisType.CAMEL ? 25 : 15;
        if (player.attackFrame > maxFrame) {
            player.isAttacking = false;
        }
    } else if (this.input.isPressed(InputKeys.ATTACK) && player.attackCooldown === 0) {
        player.isAttacking = true;
        player.attackFrame = 0;
        
        // Dispatch sound
        this.state.soundEvents.push(`ATTACK_${player.form}`);

        // Set Cooldowns based on form
        if (player.form === MetamorphosisType.CAMEL) player.attackCooldown = 50; // Slow
        else if (player.form === MetamorphosisType.LION) player.attackCooldown = 25; // Fast
        else player.attackCooldown = 40; // Medium

        // CHILD: Spawn Projectile Immediately
        if (player.form === MetamorphosisType.CHILD) {
             this.state.projectiles.push({
                 id: `star_${Date.now()}`,
                 x: player.x + (player.facing === 1 ? player.w : 0),
                 y: player.y + player.h/2 - 8,
                 w: 16, h: 16,
                 vx: player.facing * 8,
                 vy: 0,
                 color: PALETTE.radiantLight,
                 type: 'star',
                 owner: 'player',
                 ttl: 60
             });
        }
    }

    // --- ATTACK HITBOX LOGIC ---
    if (player.isAttacking) {
        let attackRect: Rect | null = null;
        let damage = 20;

        // CAMEL: Tremor (Area of Effect around player)
        // Active frames: 10-20 (Slow startup)
        if (player.form === MetamorphosisType.CAMEL && player.attackFrame >= 10 && player.attackFrame <= 20) {
            attackRect = {
                x: player.x - 40,
                y: player.y + player.h - 20, // Near feet
                w: player.w + 80,
                h: 40
            };
            damage = 40; // Heavy Damage
        }
        
        // LION: Claw Swipe (Frontal)
        // Active frames: 2-8
        if (player.form === MetamorphosisType.LION && player.attackFrame >= 2 && player.attackFrame <= 8) {
             attackRect = {
                x: player.facing === 1 ? player.x + player.w : player.x - 60,
                y: player.y,
                w: 60,
                h: player.h
            };
            damage = 25;
        }

        if (attackRect) {
            this.state.enemies.forEach(enemy => {
                if (this.rectIntersect(attackRect!, enemy)) {
                    this.damageEnemy(enemy, damage); 
                    // Knockback enemy
                    enemy.vx = player.facing * 5;
                    
                    if (enemy.type === 'loop_anchor' && this.state.loopConfig) {
                        this.state.loopConfig.active = false;
                        this.showMessage("The Circle is Broken! Ascend!");
                        this.state.soundEvents.push('BREAK');
                        this.damageEnemy(enemy, 999);
                    }
                }
            });
        }
    }

    this.updateEnemies();
    this.updateProjectiles();
    this.updateParticles();

    if (player.y > CANVAS_HEIGHT + 200 || player.y < -200) {
        this.killPlayer();
    }

    // Camera
    const targetCamX = player.x - CANVAS_WIDTH / 3;
    this.state.camera.x += (targetCamX - this.state.camera.x) * 0.1;
    this.state.camera.x = Math.max(0, this.state.camera.x);

    if (this.state.messageTimer > 0) this.state.messageTimer--;

    this.input.update();
  }

  cycleForm(player: Player) {
      this.state.soundEvents.push('TRANSFORM');
      
      // Determine next form
      if (player.form === MetamorphosisType.CAMEL) {
          player.form = MetamorphosisType.LION;
          this.showMessage("THE LION: I Will!");
      } else if (player.form === MetamorphosisType.LION) {
          player.form = MetamorphosisType.CHILD;
          this.showMessage("THE CHILD: A New Beginning!");
      } else {
          player.form = MetamorphosisType.CAMEL;
          this.showMessage("THE CAMEL: Thou Shalt!");
      }
      
      // Notify Audio Manager (indirectly via event queue in React comp, 
      // but we need to ensure the audio manager knows the *new* form.
      // We'll handle this in the Canvas component by checking state changes 
      // or we can push a specific event like 'THEME_CHANGE_LION')
      this.state.soundEvents.push(`THEME_CHANGE_${player.form}`);

      for(let i=0; i<10; i++) {
          this.spawnParticle(player.x + player.w/2, player.y + player.h/2, PALETTE.deepGold);
      }
  }

  showMessage(msg: string) {
      this.state.message = msg;
      this.state.messageTimer = 120;
  }

  handleCollisions(entity: Entity, axis: 'x' | 'y', currentGravity: number = GRAVITY) {
    for (const plat of this.state.platforms) {
      if (this.rectIntersect(entity, plat)) {
        if (plat.type === 'danger') {
            if (entity.id === 'player') this.damagePlayer(20);
            return;
        }
        if (plat.type === 'door') {
             if (entity.id === 'player' && plat.targetLevel) {
                 this.state = this.getInitialState(plat.targetLevel);
                 this.state.gameStatus = 'PLAYING';
                 this.state.soundEvents.push('TRANSFORM');
                 this.state.soundEvents.push(`THEME_CHANGE_${this.state.player.form}`);
             }
             return;
        }

        if (axis === 'x') {
          if (entity.vx > 0) {
            entity.x = plat.x - entity.w;
          } else if (entity.vx < 0) {
            entity.x = plat.x + plat.w;
          }
          entity.vx = 0;
        } else {
          // Y Axis Collision handling with Gravity Direction
          if (currentGravity >= 0) {
              if (entity.vy > 0) { // Falling Down
                entity.y = plat.y - entity.h;
                if (entity.id === 'player') (entity as Player).isGrounded = true;
                entity.vy = 0;
              } else if (entity.vy < 0) { // Jumping Up
                 entity.y = plat.y + plat.h;
                 entity.vy = 0;
              }
          } else {
              if (entity.vy < 0) { // Falling Up towards ceiling
                  entity.y = plat.y + plat.h;
                  if (entity.id === 'player') (entity as Player).isGrounded = true;
                  entity.vy = 0;
              } else if (entity.vy > 0) { // Jumping "Down"
                  entity.y = plat.y - entity.h;
                  entity.vy = 0;
              }
          }
        }
      }
    }
  }

  updateEnemies() {
      const { player } = this.state;
      this.state.enemies = this.state.enemies.filter(e => e.hp > 0);
      
      this.state.enemies.forEach(e => {
          if (e.type === 'walker') {
               if (e.patrolCenter && e.patrolRange) {
                   if (e.x > e.patrolCenter + e.patrolRange) e.vx = -1;
                   if (e.x < e.patrolCenter - e.patrolRange) e.vx = 1;
               }
               e.x += e.vx;
          } 
          else if (e.type === 'boss_gravity') {
              this.updateBoss(e);
          }

          if (e.type !== 'loop_anchor' && this.rectIntersect(this.state.player, e)) {
              this.damagePlayer(10);
          }
      });
  }

  updateBoss(boss: Enemy) {
      if (boss.bossTimer === undefined) boss.bossTimer = 0;
      if (boss.bossPhase === undefined) boss.bossPhase = 0;
      
      boss.bossTimer++;

      const PHASE_DURATION = 600; 

      if (boss.bossTimer > PHASE_DURATION) {
          boss.bossTimer = 0;
          boss.bossPhase = (boss.bossPhase + 1) % 4;
          this.state.soundEvents.push('TRANSFORM'); // Audio cue for phase change
          
          switch(boss.bossPhase) {
              case 1: 
                  this.state.bossGravityModifier = 1.0; 
                  this.showMessage("SPIRIT OF GRAVITY: Submit to the Weight!");
                  break;
              case 2: 
                  this.state.bossGravityModifier = -2.0; 
                  this.showMessage("SPIRIT OF GRAVITY: Lose your footing!");
                  break;
              case 3: 
                  this.state.bossGravityModifier = 0;
                  this.showMessage("SPIRIT OF GRAVITY: I am the Dwarf!");
                  break;
              default:
                  this.state.bossGravityModifier = 0;
                  break;
          }
      }

      boss.y = 200 + Math.sin(Date.now() / 300) * 30; 
      
      const dx = this.state.player.x - boss.x;
      if (Math.abs(dx) > 10) boss.x += Math.sign(dx) * 1.5;

      if (boss.bossTimer % 120 === 0) { 
          this.state.projectiles.push({
              id: `p_${Date.now()}`,
              x: boss.x + boss.w/2,
              y: boss.y + boss.h/2,
              w: 16, h: 16,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#4a0404',
              type: 'gravity_orb',
              owner: 'enemy',
              ttl: 180
          });
      }
  }

  updateProjectiles() {
      this.state.projectiles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.ttl--;
          
          // Star Projectile Logic (Sine Wave Motion)
          if (p.type === 'star') {
              p.y += Math.sin(Date.now() / 100) * 2;
          }

          // Homing Logic for Gravity Orbs
          if (p.type === 'gravity_orb' && this.state.enemies.some(e => e.type === 'boss_gravity' && e.bossPhase === 3)) {
              const dx = this.state.player.x - p.x;
              const dy = this.state.player.y - p.y;
              p.vx += dx * 0.001;
              p.vy += dy * 0.001;
          }

          // Collision Player vs Enemy Proj
          if (p.owner === 'enemy' && this.rectIntersect(p, this.state.player)) {
              this.damagePlayer(15);
              p.ttl = 0;
          }

          // Collision Player Proj (Star) vs Enemy
          if (p.owner === 'player') {
              this.state.enemies.forEach(e => {
                  if (this.rectIntersect(p, e)) {
                      this.damageEnemy(e, 15); // Light damage but safe range
                      p.ttl = 0;
                      // Star breaking loop
                      if (e.type === 'loop_anchor' && this.state.loopConfig) {
                          this.state.loopConfig.active = false;
                          this.showMessage("The Star Breaks the Circle!");
                          this.state.soundEvents.push('BREAK');
                          this.damageEnemy(e, 999);
                      }
                  }
              });
          }
      });
      this.state.projectiles = this.state.projectiles.filter(p => p.ttl > 0);
  }

  updateParticles() {
      this.state.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
      });
      this.state.particles = this.state.particles.filter(p => p.life > 0);
  }

  spawnParticle(x: number, y: number, color: string) {
      this.state.particles.push({
          x, y, w: 4, h: 4,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 30,
          color
      });
  }

  damageEnemy(enemy: Enemy, amount: number) {
      enemy.hp -= amount;
      this.spawnParticle(enemy.x, enemy.y, '#fff');
      if (enemy.hp <= 0) {
           if (enemy.type === 'boss_gravity') {
               this.state.gameStatus = 'VICTORY';
               this.state.soundEvents.push('VICTORY');
           }
      }
  }

  damagePlayer(amount: number) {
      const { player } = this.state;
      if (player.invincibilityTimer > 0) return;
      
      this.state.soundEvents.push('DAMAGE');
      if (player.form === MetamorphosisType.CAMEL) amount = Math.floor(amount / 2);

      player.hp -= amount;
      player.invincibilityTimer = 60;
      player.vy = -5; 
      player.vx = -player.facing * 5; 
      player.isGrounded = false;
      
      if (player.hp <= 0) {
          this.killPlayer();
      }
  }

  killPlayer() {
      this.state.gameStatus = 'GAMEOVER';
  }

  rectIntersect(r1: Rect, r2: Rect) {
    return !(r2.x >= r1.x + r1.w || 
             r2.x + r2.w <= r1.x || 
             r2.y >= r1.y + r1.h || 
             r2.y + r2.h <= r1.y);
  }
}
