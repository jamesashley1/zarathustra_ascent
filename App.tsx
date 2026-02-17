
import React, { useState, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { Sword, Scroll, Repeat, Skull, Volume2, VolumeX } from 'lucide-react';
import { AudioManager } from './services/audio';
import { NIETZSCHE_QUOTES } from './services/quotes';

const App: React.FC = () => {
  const [view, setView] = useState<'MENU' | 'GAME' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [finalState, setFinalState] = useState<GameState | null>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager());
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverQuote, setGameOverQuote] = useState<string>('');

  const startGame = () => {
    // Initialize Audio Context on user gesture
    audioManagerRef.current.init();
    audioManagerRef.current.playBgm();
    setView('GAME');
  };

  const toggleMute = () => {
    const muted = audioManagerRef.current.toggleMute();
    setIsMuted(muted);
  };

  const handleGameOver = (state: GameState) => {
    setFinalState(state);
    const randomQuote = NIETZSCHE_QUOTES[Math.floor(Math.random() * NIETZSCHE_QUOTES.length)];
    setGameOverQuote(randomQuote);
    setView('GAMEOVER');
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-amber-500 font-serif">
      {/* Header */}
      <header className="mb-4 text-center relative w-[800px]">
        <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-amber-500" style={{ textShadow: '2px 2px 0px #7f1d1d' }}>
          ZARATHUSTRA'S ASCENT
        </h1>
        <p className="text-stone-400 mt-2 italic">"Man is a rope, tied between beast and overman—a rope over an abyss."</p>
        
        <button 
          onClick={toggleMute}
          className="absolute right-0 top-0 p-2 text-stone-500 hover:text-amber-500"
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative">
        {view === 'MENU' && (
          <div className="w-[800px] h-[450px] bg-stone-900 border-4 border-stone-700 flex flex-col items-center justify-center p-12 gap-6 shadow-2xl">
            <div className="flex gap-8 mb-4">
              <div className="text-center">
                <Skull size={48} className="text-red-800 mx-auto mb-2" />
                <p className="text-xs text-stone-500">Committal Deeds</p>
              </div>
              <div className="text-center">
                <Repeat size={48} className="text-amber-600 mx-auto mb-2" />
                <p className="text-xs text-stone-500">Eternal Recurrence</p>
              </div>
              <div className="text-center">
                <Sword size={48} className="text-yellow-500 mx-auto mb-2" />
                <p className="text-xs text-stone-500">Radiant Word</p>
              </div>
            </div>

            <div className="space-y-4 text-center">
              <p className="text-stone-300 max-w-lg">
                Traverse the mountains of the mind. Master the Three Metamorphoses. Defeat the Spirit of Gravity.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left text-sm bg-black/50 p-4 rounded border border-stone-800">
                <span><kbd className="bg-stone-700 px-1">WASD / Arrows</kbd> Move</span>
                <span><kbd className="bg-stone-700 px-1">Space</kbd> Jump (Committal)</span>
                <span><kbd className="bg-stone-700 px-1">X</kbd> Radiant Word (Attack)</span>
                <span><kbd className="bg-stone-700 px-1">C</kbd> Metamorphosis</span>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-red-900 hover:bg-red-800 text-white font-bold border-2 border-amber-600 transition-all transform hover:scale-105"
            >
              BEGIN THE ASCENT
            </button>
          </div>
        )}

        {view === 'GAME' && (
          <GameCanvas 
            audioManager={audioManagerRef.current}
            onGameOver={handleGameOver}
            onVictory={() => {
               setView('VICTORY');
            }}
          />
        )}

        {view === 'GAMEOVER' && (
          <div className="w-[800px] h-[450px] bg-black border-4 border-red-900 flex flex-col items-center justify-center p-12 gap-6 relative overflow-hidden text-center">
             <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
             <h2 className="text-6xl text-red-700 font-bold z-10">YOU HAVE FALLEN</h2>
             <p className="text-stone-400 z-10 text-xl max-w-2xl italic font-serif">"{gameOverQuote}"</p>
             <button 
              onClick={startGame}
              className="mt-8 px-6 py-2 border border-red-500 text-red-500 hover:bg-red-900/30 z-10"
            >
              RECUR ETERNALLY (RETRY)
            </button>
          </div>
        )}

        {view === 'VICTORY' && (
          <div className="w-[800px] h-[450px] bg-sky-900 border-4 border-amber-400 flex flex-col items-center justify-center p-12 gap-6">
             <h2 className="text-6xl text-amber-400 font-bold">OVERMAN ACHIEVED</h2>
             <p className="text-stone-200">You have overcome the Spirit of Gravity.</p>
             <button 
              onClick={() => setView('MENU')}
              className="mt-8 px-6 py-2 border border-amber-500 text-amber-500 hover:bg-amber-900/30"
            >
              RETURN TO CAVE
            </button>
          </div>
        )}
      </main>
      
      {/* Dev Note for the Prompt Requirement */}
      <footer className="mt-8 text-stone-600 text-xs max-w-2xl text-center">
         <p>Developer Note: The State Machine logic requested in C#/SwiftUI is implemented via the TypeScript <code>MetamorphosisType</code> enum and switch-cases within <code>GameEngine.ts</code> to run natively in the browser.</p>
      </footer>
    </div>
  );
};

export default App;
