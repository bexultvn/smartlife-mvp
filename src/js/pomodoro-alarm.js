let cachedAudio = null;

export function playPomodoroAlarm() {
  try {
    if (!cachedAudio) {
      cachedAudio = new Audio("/audio/pomodoro-alarm.wav");
      cachedAudio.preload = "auto";
    }

    // clone to allow overlapping playback if needed
    const sound = cachedAudio.cloneNode();
    sound.currentTime = 0;
    const playPromise = sound.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch (err) {
    // Silently ignore if audio cannot be played (e.g., browser restrictions)
  }
}
