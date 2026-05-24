import { createAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 100% public, CORS-enabled, reliable direct URLs from an open source GitHub repository
const SOUND_URLS = {
  // A clean, rapid electronic UI beep for scanning/picking (4.4 KB)
  beep: 'https://raw.githubusercontent.com/SkyStoreOFL/skys_notifications/refs/heads/main/html/sounds/info.mp3',
  // A beautiful, warm chime for order/task success confirmations (33 KB)
  success: 'https://raw.githubusercontent.com/SkyStoreOFL/skys_notifications/refs/heads/main/html/sounds/success.mp3',
  // A distinct warning error buzzer for incorrect scans or mismatches (4.8 KB)
  error: 'https://raw.githubusercontent.com/SkyStoreOFL/skys_notifications/refs/heads/main/html/sounds/error.mp3'
};

export const playSound = async (type) => {
  try {
    // 1. Check user preferences in AsyncStorage first to respect settings toggles
    if (type === 'beep') {
      const pref = await AsyncStorage.getItem('setting_beepSound');
      if (pref === 'false') return; // User turned off beep sounds
    } else if (type === 'success') {
      const pref = await AsyncStorage.getItem('setting_notifySound');
      if (pref === 'false') return; // User turned off notification sounds
    } else if (type === 'error') {
      const pref = await AsyncStorage.getItem('setting_vibrate'); // Fallback to vibrate/error alerts
      if (pref === 'false') return;
    }

    const url = SOUND_URLS[type];
    if (!url) return;

    // 2. Load and play the sound
    const playInstance = () => {
      try {
        const player = createAudioPlayer(url);
        player.play();
        
        // Unload sound from memory after it finishes playing to prevent resource leaks
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.currentTime >= status.duration && status.duration > 0) {
            subscription.remove();
            player.release();
          }
        });
      } catch (err) {
        console.warn('Failed to play sound instance:', err);
      }
    };

    if (type === 'success') {
      // Play two instances simultaneously to double the physical amplitude and perceptual loudness!
      playInstance();
      playInstance();
    } else {
      playInstance();
    }

  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};
