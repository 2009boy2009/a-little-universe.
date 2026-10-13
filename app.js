// Background music — direct MP3 audio
const music = new Audio("music.mp3");
music.loop = true;
music.volume = 0.7;
music.preload = "auto";

const musicButton = document.getElementById("music-toggle");

if (musicButton) {
  musicButton.addEventListener("click", async () => {
    try {
      if (music.paused) {
        await music.play();
        musicButton.textContent = "Pause music ♫";
      } else {
        music.pause();
        musicButton.textContent = "Play music ♫";
      }
    } catch (error) {
      musicButton.textContent = "Tap to retry ♫";
      console.error("Audio playback failed:", error);
    }
  });
}
