/**
 * Tactile Haptic Feedback Utility using standard navigator.vibrate()
 * Provides crisp physical feedback on mobile browsers & devices.
 */
export const haptics = {
  vibrate(pattern: number | number[]) {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently catch unsupported devices or permission restrictions
      }
    }
  },

  /**
   * Subtle click for button taps, slider ticks, and UI toggles
   */
  light() {
    this.vibrate(15);
  },

  /**
   * Tactile alert when turn transitions.
   * Distinct double-pulse when it's the human user's turn; light single click for other players.
   */
  turnTransition(isMyTurn: boolean = false) {
    if (isMyTurn) {
      this.vibrate([45, 60, 50]); // Distinct tactile alert for "Your Turn"
    } else {
      this.vibrate(25); // Subtle step tick for turn change
    }
  },

  /**
   * Crisp single vibration when a pawn hops to a new tile
   */
  tokenMove() {
    this.vibrate(30);
  },

  /**
   * Heavy impact vibration sequence when capturing an opponent pawn ("कट गया!")
   */
  tokenCapture() {
    this.vibrate([80, 50, 140]);
  },

  /**
   * Triumphant rhythmic vibration when reaching the center home victory triangle
   */
  tokenHome() {
    this.vibrate([40, 50, 60, 50, 120]);
  },

  /**
   * Tactile snap on dice roll launch
   */
  diceRoll() {
    this.vibrate(25);
  },
};
