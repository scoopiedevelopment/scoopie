/**
 * Global audio manager to control video audio across the app
 */

class AudioManager {
  private static instance: AudioManager;
  private activePlayers: Set<any> = new Set();

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Register a video player to be managed
   */
  registerPlayer(player: any) {
    if (player) {
      this.activePlayers.add(player);
    }
  }

  /**
   * Unregister a video player
   */
  unregisterPlayer(player: any) {
    if (player) {
      this.activePlayers.delete(player);
    }
  }

  /**
   * Mute all active video players
   */
  muteAllPlayers() {
    this.activePlayers.forEach(player => {
      try {
        if (player && typeof player.muted !== 'undefined') {
          player.muted = true;
        }
      } catch (error) {
        console.log('Error muting player:', error);
      }
    });
  }

  /**
   * Pause all active video players
   */
  pauseAllPlayers() {
    this.activePlayers.forEach(player => {
      try {
        if (player && typeof player.pause === 'function') {
          player.pause();
        }
      } catch (error) {
        console.log('Error pausing player:', error);
      }
    });
  }

  /**
   * Stop all video audio (mute and pause)
   */
  stopAllAudio() {
    this.muteAllPlayers();
    this.pauseAllPlayers();
  }

  /**
   * Clear all registered players
   */
  clearAllPlayers() {
    this.activePlayers.clear();
  }
}

export default AudioManager.getInstance();
