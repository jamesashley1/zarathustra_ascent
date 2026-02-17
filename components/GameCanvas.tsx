
import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../services/gameEngine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from '../constants';
import { GameState, MetamorphosisType } from '../types';
import { ASSETS } from '../services/assets';
import { AudioManager } from '../services/audio';

interface GameCanvasProps {
  onGameOver: (state: GameState) => void;
  onVictory: () => void;
  audioManager: AudioManager;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onVictory, audioManager }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const assetsRef = useRef<Record<string, HTMLImageElement>>({});
  const assetsLoadedRef = useRef(false);
  
  // Rain State
  const rainRef = useRef<{x: number, y: number, speed: number, len: number}[]>([]);

  useEffect(() => {
    // Initialize Rain
    for(let i=0; i<100; i++) {
        rainRef.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            speed: 15 + Math.random() * 10,
            len: 10 + Math.random() * 20
        });
    }

    // Initialize with Camel Theme
    audioManager.playTheme('CAMEL');

    const assetKeys = Object.keys(ASSETS) as Array<keyof typeof ASSETS>;
    let loadCount = 0;
    const total = assetKeys.length;
    
    const checkLoad = () => {
        loadCount++;
        if (loadCount >= total) {
            assetsLoadedRef.current = true;
        }
    };

    assetKeys.forEach(key => {
        const img = new Image();
        img.onload = checkLoad;
        img.onerror = checkLoad;
        img.src = ASSETS[key];
        assetsRef.current[key] = img;
    });

    engineRef.current = new GameEngine();
    engineRef.current.startGame();
    
    const loop = (time: number) => {
      if (!engineRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const engine = engineRef.current;
      engine.update(16); 

      if (engine.state.soundEvents.length > 0) {
          engine.state.soundEvents.forEach(evt => {
              if (evt.startsWith('THEME_CHANGE_')) {
                  const form = evt.replace('THEME_CHANGE_', '');
                  audioManager.playTheme(form);
              } else {
                  audioManager.playSfx(evt);
              }
          });
      }

      if (engine.state.gameStatus === 'GAMEOVER') {
          audioManager.stopAll();
          audioManager.playSfx('DAMAGE');
          onGameOver(engine.state);
          return;
      }
      if (engine.state.gameStatus === 'VICTORY') {
          audioManager.stopAll();
          audioManager.playSfx('VICTORY');
          onVictory();
          return;
      }

      draw(ctx, engine.state);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (engineRef.current) engineRef.current.input.cleanup();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [onGameOver, onVictory, audioManager]);


  const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
    const assets = assetsRef.current;
    
    // 1. Background Fill
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 2. Parallax Background Pattern
    if (assetsLoadedRef.current && assets['BG']) {
        ctx.save();
        const bgPattern = ctx.createPattern(assets['BG'], 'repeat');
        if (bgPattern) {
            ctx.fillStyle = bgPattern;
            ctx.translate(-state.camera.x * 0.1, 0); 
            ctx.fillRect(state.camera.x * 0.1, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        ctx.restore();
    }

    // 3. Boss Gravity Visual (Screen Tint)
    if (state.bossGravityModifier !== 0) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = state.bossGravityModifier > 0 ? '#000' : '#fff'; 
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);

    // 4. Platforms (Bricks)
    state.platforms.forEach(p => {
      if (assetsLoadedRef.current && assets['FLOOR'] && p.type === 'solid') {
         const pat = ctx.createPattern(assets['FLOOR'], 'repeat');
         if (pat) {
             ctx.fillStyle = pat;
             ctx.fillRect(p.x, p.y, p.w, p.h);
             // Shadow beneath platform
             ctx.fillStyle = 'rgba(0,0,0,0.5)';
             ctx.fillRect(p.x, p.y + p.h, p.w, 10);
         }
      } else if (p.type === 'danger') {
          // Spike logic
          ctx.fillStyle = PALETTE.bloodRed;
          for(let i=0; i<p.w; i+=32) {
             ctx.beginPath();
             ctx.moveTo(p.x + i, p.y + p.h);
             ctx.lineTo(p.x + i + 16, p.y);
             ctx.lineTo(p.x + i + 32, p.y + p.h);
             ctx.fill();
          }
      } else {
         // Generic / Door
         ctx.fillStyle = p.color;
         ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    });

    // 5. Enemies
    state.enemies.forEach(e => {
        if (e.type === 'boss_gravity') {
            if (assetsLoadedRef.current) ctx.drawImage(assets['BOSS'], e.x - 32, e.y - 20, 128, 128);
            // Boss HP Bar floating
            ctx.fillStyle = 'red';
            ctx.fillRect(e.x, e.y - 30, (e.hp/1000)*e.w, 6);
        } else if (e.type === 'loop_anchor') {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standard Walker
            if (assetsLoadedRef.current && assets['ENEMY_WALKER']) {
                ctx.drawImage(assets['ENEMY_WALKER'], e.x - 16, e.y - 16, 64, 64);
            } else {
                ctx.fillStyle = PALETTE.bloodRed;
                ctx.fillRect(e.x, e.y, e.w, e.h);
            }
        }
    });

    // 6. Projectiles
    state.projectiles.forEach(p => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        
        if (p.type === 'star') {
             // Draw Rotating Star
             ctx.translate(p.x, p.y);
             ctx.rotate(Date.now() / 100);
             ctx.beginPath();
             for (let i = 0; i < 5; i++) {
                 ctx.lineTo(Math.cos((18 + i * 72) * 0.0174) * 8, Math.sin((18 + i * 72) * 0.0174) * 8);
                 ctx.lineTo(Math.cos((54 + i * 72) * 0.0174) * 4, Math.sin((54 + i * 72) * 0.0174) * 4);
             }
             ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.w/2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    });

    // 7. Player
    const p = state.player;
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    if (state.bossGravityModifier < -1) ctx.scale(1, -1);
    ctx.scale(p.facing, 1);

    if (!(p.invincibilityTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0)) {
        if (assetsLoadedRef.current) {
            const spriteSize = 64; 
            const drawX = -spriteSize / 2;
            const drawY = -spriteSize / 2 - 8; 
            let spriteKey = '';
            const walkIndex = Math.floor(p.walkFrame) % 2 === 0 ? 1 : 2;

            switch(p.form) {
                case MetamorphosisType.CAMEL:
                    spriteKey = (p.walkFrame > 0) ? `CAMEL_WALK${walkIndex}` : 'CAMEL_IDLE';
                    break;
                case MetamorphosisType.LION:
                    if (p.isAttacking) spriteKey = 'LION_ATTACK';
                    else spriteKey = (p.walkFrame > 0) ? `LION_WALK${walkIndex}` : 'LION_IDLE';
                    break;
                case MetamorphosisType.CHILD:
                    if (p.isAttacking) spriteKey = 'CHILD_ATTACK';
                    else spriteKey = (p.walkFrame > 0) ? `CHILD_WALK${walkIndex}` : 'CHILD_IDLE';
                    break;
            }

            if (spriteKey && assets[spriteKey]) {
                // Glow for Child
                if (p.form === MetamorphosisType.CHILD) {
                   ctx.shadowBlur = 15;
                   ctx.shadowColor = PALETTE.radiantLight;
                }
                ctx.drawImage(assets[spriteKey], drawX, drawY, spriteSize, spriteSize);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            }
        }
    }
    
    // VISUALS: ATTACKS
    if (p.isAttacking) {
        ctx.fillStyle = PALETTE.radiantLight;
        ctx.shadowBlur = 20;
        ctx.shadowColor = PALETTE.deepGold;

        // CAMEL: Tremor (Ground Shockwave)
        if (p.form === MetamorphosisType.CAMEL && p.attackFrame >= 10 && p.attackFrame <= 20) {
            ctx.beginPath();
            ctx.ellipse(0, p.h/2, p.w + 20, 10, 0, 0, Math.PI * 2);
            ctx.strokeStyle = PALETTE.deepGold;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        // LION: Claw Swipe
        else if (p.form === MetamorphosisType.LION && p.attackFrame <= 8) {
            ctx.beginPath();
            ctx.arc(32, -8, 40, -Math.PI/4, Math.PI, false); 
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ef4444'; // Red slash for Lion
            ctx.stroke();
        }
        // CHILD: (Projectile handled in projectiles loop)
    }

    ctx.restore(); // Restore Player

    // 8. Particles
    state.particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.w, pt.h);
    });

    ctx.restore(); // Restore Camera

    // 9. Rain Overlay
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    rainRef.current.forEach(r => {
        r.y += r.speed;
        if (r.y > CANVAS_HEIGHT) {
            r.y = -r.len;
            r.x = Math.random() * CANVAS_WIDTH;
        }
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 2, r.y + r.len);
    });
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 10. Vignette
    const grad = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 200, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 500);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 11. HUD
    drawFancyHUD(ctx, state);
  };

  const drawFancyHUD = (ctx: CanvasRenderingContext2D, state: GameState) => {
      // Background Box for HUD
      ctx.fillStyle = PALETTE.uiFill;
      ctx.strokeStyle = PALETTE.uiBorder;
      ctx.lineWidth = 3;
      ctx.fillRect(10, 10, 260, 80);
      ctx.strokeRect(10, 10, 260, 80);

      // Portrait Box
      ctx.fillStyle = '#000';
      ctx.fillRect(20, 20, 60, 60);
      ctx.strokeRect(20, 20, 60, 60);
      
      // Draw simple portrait based on form
      ctx.font = '30px serif';
      ctx.textAlign = 'center';
      let icon = '🐪';
      if (state.player.form === MetamorphosisType.LION) icon = '🦁';
      if (state.player.form === MetamorphosisType.CHILD) icon = '👶';
      ctx.fillText(icon, 50, 60);

      // Name Text
      ctx.fillStyle = PALETTE.deepGold;
      ctx.font = '16px "Cinzel"';
      ctx.textAlign = 'left';
      ctx.fillText(state.player.form, 90, 35);

      // HP Bar Frame
      ctx.fillStyle = '#111';
      ctx.fillRect(90, 45, 160, 12);
      
      // HP Fill
      const hpPct = Math.max(0, state.player.hp / state.player.maxHp);
      ctx.fillStyle = PALETTE.bloodRed;
      ctx.fillRect(90, 45, 160 * hpPct, 12);

      // Spirit/Message Text
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '12px "IM Fell English SC"';
      ctx.fillText(state.currentLevel, 90, 75);

      // Boss Message Overlay
      if (state.messageTimer > 0) {
          ctx.save();
          ctx.font = '24px "IM Fell English SC"';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillStyle = PALETTE.radiantLight;
          ctx.fillText(state.message, CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
          ctx.restore();
      }
  };

  return (
    <div className="relative border-4 border-[#271c19] shadow-2xl rounded-sm overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="block bg-black w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default GameCanvas;
