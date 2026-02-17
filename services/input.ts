export class InputManager {
  keys: Set<string> = new Set();
  pressed: Set<string> = new Set(); // Keys pressed this frame

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default browser scrolling for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (!this.keys.has(e.key)) {
      this.pressed.add(e.key);
    }
    this.keys.add(e.key);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key);
  };

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  isPressed(key: string): boolean {
    return this.pressed.has(key);
  }

  update() {
    this.pressed.clear();
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}