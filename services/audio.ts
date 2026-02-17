
export class AudioManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isMuted = false;
  currentForm: string = 'CAMEL';

  // MP3 State
  bgmBuffer: AudioBuffer | null = null;
  bgmSource: AudioBufferSourceNode | null = null;
  usingMp3 = false;

  // Sequencer State (Fallback)
  isPlaying = false;
  nextNoteTime = 0;
  beatCount = 0;
  timerID: number | null = null;
  droneOsc: OscillatorNode | null = null;
  droneGain: GainNode | null = null;

  constructor() {
    const resumeAudio = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          console.log("AudioContext resumed by user interaction");
        });
      }
    };
    
    if (typeof window !== 'undefined') {
        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
    }
  }

  async init() {
    if (this.ctx) return; 

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Master volume
    this.masterGain.connect(this.ctx.destination);
    
    // Attempt to load the MP3 immediately
    await this.attemptLoadMp3();
  }

  async attemptLoadMp3() {
      // Strategy: Try the user-specified path in music folder, with fallback to potential typo correction
      const candidates = [
          "music/PixelGrailOverture.mp3",  // Typo correction (Grail vs Graid)
          "/music/PixelGrailOverture.mp3", 
          "PixelGraidOverture.mp3",        // Root fallback
          "PixelGrailOverture.mp3"         // Root typo correction
      ];

      console.log("[Audio] Attempting to find BGM...");

      for (const src of candidates) {
          try {
              const response = await fetch(src);
              if (response.ok) {
                  const contentType = response.headers.get("content-type");
                  // Basic check to ensure we didn't get an HTML 404 page disguised as 200
                  if (contentType && contentType.includes("text/html")) {
                      console.warn(`[Audio] Found ${src} but content-type is text/html. Skipping.`);
                      continue;
                  }

                  const arrayBuffer = await response.arrayBuffer();
                  if (this.ctx) {
                      try {
                          const decoded = await this.ctx.decodeAudioData(arrayBuffer);
                          this.bgmBuffer = decoded;
                          this.usingMp3 = true;
                          console.log(`[Audio] Success! Loaded BGM from: ${src}`);

                          // HOT SWAP: If game already started playing fallback synth, switch to MP3 now
                          if (this.isPlaying) {
                              console.log("[Audio] Hot-swapping from Synth to MP3...");
                              this.playBgm();
                          }
                          return;
                      } catch (decodeErr) {
                          console.warn(`[Audio] Found file at ${src} but failed to decode.`, decodeErr);
                      }
                  }
              }
          } catch (e) {
              // Ignore network errors and try next candidate
          }
      }
      
      console.warn("[Audio] Could not load MP3. Falling back to Procedural Synth.");
      this.usingMp3 = false;
  }

  playBgm() {
      if (!this.ctx) this.init();
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      
      // Stop any existing sounds to prevent overlap (and clears isPlaying)
      this.stopAll();
      this.isPlaying = true; // Set isPlaying TRUE after stopAll cleared it

      if (this.usingMp3 && this.bgmBuffer) {
          console.log("[Audio] Starting MP3 Loop");
          this.startMp3Loop();
      } else {
          console.log("[Audio] Starting Sequencer (Fallback)");
          this.startSequencer();
          if (!this.droneOsc) this.startDrone();
      }
  }

  // --- MP3 ENGINE ---

  startMp3Loop() {
      if (!this.ctx || !this.bgmBuffer) return;
      
      try {
          this.bgmSource = this.ctx.createBufferSource();
          this.bgmSource.buffer = this.bgmBuffer;
          this.bgmSource.loop = true;
          this.bgmSource.connect(this.masterGain!);
          
          this.applyMp3Effects();
          
          this.bgmSource.start(0);
      } catch (e) {
          console.error("[Audio] Error starting MP3 source:", e);
      }
  }

  applyMp3Effects() {
       if (!this.bgmSource) return;
       // Nietzschean Speed Control for MP3
       // Camel = Slow/Heavy, Lion = Fast/Energetic, Child = Normal
       if (this.currentForm === 'CAMEL') this.bgmSource.playbackRate.value = 0.85; 
       else if (this.currentForm === 'LION') this.bgmSource.playbackRate.value = 1.15; 
       else this.bgmSource.playbackRate.value = 1.0; 
  }

  // --- SEQUENCER ENGINE (FALLBACK) ---

  startSequencer() {
      const lookahead = 25.0; 
      const scheduleAheadTime = 0.1; 

      const scheduler = () => {
          if (!this.ctx || !this.isPlaying || this.usingMp3) {
              // If stopped or switched to MP3, kill sequencer
              return; 
          }

          while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
              this.scheduleNote(this.nextNoteTime);
              this.nextNote();
          }
          this.timerID = window.setTimeout(scheduler, lookahead);
      };

      if (this.ctx) {
          this.nextNoteTime = this.ctx.currentTime;
          scheduler();
      }
  }

  nextNote() {
      const secondsPerBeat = 60.0 / this.getBPM();
      this.nextNoteTime += secondsPerBeat;
      this.beatCount++;
  }

  getBPM() {
      switch (this.currentForm) {
          case 'LION': return 240; 
          case 'CHILD': return 180; 
          case 'CAMEL': default: return 60; 
      }
  }

  scheduleNote(time: number) {
      const beat = this.beatCount;

      if (this.currentForm === 'CAMEL') {
          if (beat % 2 === 0) {
              this.playSynthNote(65.41, time, 0.5, 'sawtooth', 0.4); // C2
          } else {
              this.playSynthNote(69.30, time, 0.2, 'square', 0.2); // C#2
          }
      } 
      else if (this.currentForm === 'LION') {
          const bassPattern = [65.41, 65.41, 77.78, 65.41]; 
          const note = bassPattern[beat % 4];
          this.playSynthNote(note, time, 0.1, 'sawtooth', 0.4);
          
          if (beat % 4 === 2) this.playNoise(time, 0.1);

          if (Math.random() > 0.7) {
              const melodyNotes = [130.81, 155.56, 174.61, 196.00, 233.08]; 
              const rndNote = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
              this.playSynthNote(rndNote, time, 0.1, 'square', 0.2);
          }
      } 
      else if (this.currentForm === 'CHILD') {
          const arp = [261.63, 329.63, 392.00, 493.88, 523.25]; 
          const idx = beat % 8 < 5 ? beat % 8 : 8 - (beat % 8);
          const note = arp[idx % arp.length];
          
          this.playSynthNote(note * 2, time, 0.3, 'sine', 0.2);
          if (beat % 4 === 0) this.playSynthNote(note, time, 0.8, 'triangle', 0.1);
      }
      this.updateDrone();
  }

  // --- SYNTHESIS INSTRUMENTS ---

  startDrone() {
      if (!this.ctx || !this.masterGain || this.usingMp3) return;
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      
      this.droneOsc.type = 'triangle';
      this.droneOsc.frequency.value = 32.70; 
      this.droneGain.gain.value = 0.1;
      
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();
  }

  updateDrone() {
      if (!this.droneOsc || !this.droneGain || !this.ctx) return;
      const t = this.ctx.currentTime;
      
      if (this.currentForm === 'CAMEL') {
          this.droneOsc.frequency.setTargetAtTime(32.70, t, 0.1); 
          this.droneGain.gain.setTargetAtTime(0.3, t, 0.5);
      } else if (this.currentForm === 'LION') {
           this.droneOsc.frequency.setTargetAtTime(32.70, t, 0.1); 
           this.droneGain.gain.setTargetAtTime(0.1, t, 0.1); 
      } else {
           this.droneOsc.frequency.setTargetAtTime(130.81, t, 1); 
           this.droneGain.gain.setTargetAtTime(0.05, t, 1);
      }
  }

  playSynthNote(freq: number, time: number, duration: number, type: OscillatorType, vol: number) {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + duration + 0.1);
  }

  playNoise(time: number, duration: number) {
      if (!this.ctx || !this.masterGain) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
  }

  // --- API ---

  playTheme(form: string) {
    this.currentForm = form;
    if (this.usingMp3) {
        this.applyMp3Effects();
    }
    // Synth auto-updates based on currentForm property
  }

  playSfx(type: string) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    if (type === 'TRANSFORM') {
        const notes = [174.61, 246.94, 311.13, 415.30];
        notes.forEach((freq) => {
             this.playSynthNote(freq, t, 1.5, 'triangle', 0.2);
        });
        return;
    }
    
    if (type === 'JUMP_CAMEL') {
        this.playSynthNote(100, t, 0.2, 'sine', 0.3);
    } else if (type === 'DAMAGE') {
        this.playSynthNote(80, t, 0.3, 'sawtooth', 0.5);
    } else if (type.startsWith('ATTACK')) {
        this.playNoise(t, 0.1);
    } else if (type === 'VICTORY') {
        this.playSynthNote(523.25, t, 0.5, 'triangle', 0.5); 
        this.playSynthNote(659.25, t + 0.2, 0.5, 'triangle', 0.5); 
        this.playSynthNote(783.99, t + 0.4, 1.0, 'triangle', 0.5); 
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
        if (this.ctx) this.ctx.suspend();
        this.isPlaying = false;
    } else {
        if (this.ctx) this.ctx.resume();
        this.isPlaying = true;
    }
    return this.isMuted;
  }

  stopAll() {
      this.isPlaying = false;
      if (this.bgmSource) {
          try { this.bgmSource.stop(); } catch(e) {}
          this.bgmSource = null;
      }
      if (this.droneOsc) {
          try { this.droneOsc.stop(); } catch(e) {}
          this.droneOsc = null;
      }
      if (this.timerID) {
          clearTimeout(this.timerID);
      }
  }
}
