
document.addEventListener("DOMContentLoaded", () => {
  const revealButton = document.getElementById("reveal-button");
  const todayContent = document.getElementById("today-content");
  const todayDate = document.getElementById("today-date");
  const revealHint = document.getElementById("reveal-hint");
  const archiveList = document.getElementById("archive-list");
  const archiveCount = document.getElementById("archive-count");
  const archiveEmpty = document.getElementById("archive-empty");

  const todayMusic = document.getElementById("today-music");
  const todaySongName = document.getElementById("today-song-name");
  const todaySongStatus = document.getElementById("today-song-status");
  const todayPlay = document.getElementById("today-play");

  const audio = new Audio();
  audio.preload = "none";

  let messages = {};
  let revealed = false;
  let activeButton = null;
  let activeStatus = null;
  let activeSongName = "";

  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateKey) => {
    const date = new Date(`${dateKey}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? dateKey
      : date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
  };

  const todayKey = getDateKey(new Date());

  if (todayDate) todayDate.textContent = formatDate(todayKey);

  function getMessageText(entry) {
    if (typeof entry === "string") return entry;
    return entry?.message || entry?.content || "";
  }

  function getMessageTitle(entry) {
    return typeof entry === "object" && entry?.title
      ? entry.title
      : "A little note for today";
  }

  function getMusicPath(entry) {
    if (!entry || typeof entry !== "object") return "";
    return typeof entry.music === "string" ? entry.music.trim() : "";
  }

  function getSongName(path) {
    const filename = path.split("/").pop() || "A little song";
    return decodeURIComponent(filename)
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ");
  }

  function stopCurrentMusic() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    if (activeButton) activeButton.textContent = "▶ Play";
    if (activeStatus) activeStatus.textContent = "A song for this day";

    activeButton = null;
    activeStatus = null;
    activeSongName = "";
  }

  async function playTrack(path, button, status, songName) {
    if (!path) return;

    // Tapping the currently playing song pauses it.
    if (audio.src && audio.src === new URL(path, document.baseURI).href &&
        !audio.paused) {
      audio.pause();
      button.textContent = "▶ Play";
      status.textContent = "Paused";
      return;
    }

    // Stop the previous song before starting another one.
    stopCurrentMusic();

    audio.src = path;
    activeButton = button;
    activeStatus = status;
    activeSongName = songName;

    button.textContent = "♫ Loading";
    status.textContent = "Loading your song...";

    try {
      await audio.play();
      button.textContent = "Ⅱ Pause";
      status.textContent = "Now playing ♫";
    } catch (error) {
      console.error("Music playback failed:", error);
      button.textContent = "▶ Play";
      status.textContent = "Couldn't play this song. Check the MP3 path.";
    }
  }

  audio.addEventListener("ended", () => {
    if (activeButton) activeButton.textContent = "▶ Play";
    if (activeStatus) activeStatus.textContent = "Finished playing";
  });

  audio.addEventListener("pause", () => {
    if (activeButton && audio.currentTime > 0 && !audio.ended) {
      activeButton.textContent = "▶ Play";
    }
  });

  function setupTodayMusic(entry) {
    const path = getMusicPath(entry);

    if (!path) {
      todayMusic.hidden = true;
      todayPlay.onclick = null;
      return;
    }

    todayMusic.hidden = false;
    const songName = entry.musicTitle || getSongName(path);

    todaySongName.textContent = songName;
    todaySongStatus.textContent = "A song for today";
    todayPlay.textContent = "▶ Play";

    todayPlay.onclick = () => {
      playTrack(path, todayPlay, todaySongStatus, songName);
    };
  }

  function showMessage(entry) {
    todayContent.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = getMessageTitle(entry);

    const paragraph = document.createElement("p");
    paragraph.textContent = getMessageText(entry);

    todayContent.append(title, paragraph);
  }

  function createArchivePlayer(entry) {
    const path = getMusicPath(entry);
    if (!path) return null;

    const player = document.createElement("div");
    player.className = "track-player";

    const icon = document.createElement("div");
    icon.className = "track-icon";
    icon.textContent = "♫";

    const info = document.createElement("div");
    info.className = "track-info";

    const name = document.createElement("strong");
    const songName = entry.musicTitle || getSongName(path);
    name.textContent = songName;

    const status = document.createElement("span");
    status.textContent = "This day's soundtrack";

    info.append(name, status);

    const button = document.createElement("button");
    button.className = "track-button";
    button.type = "button";
    button.textContent = "▶ Play";
    button.addEventListener("click", () => {
      playTrack(path, button, status, songName);
    });

    player.append(icon, info, button);
    return player;
  }

  function showArchive() {
    if (!archiveList) return;

    archiveList.replaceChildren();

    const previousDates = Object.keys(messages)
      .filter((date) => date < todayKey && getMessageText(messages[date]))
      .sort((a, b) => b.localeCompare(a));

    if (archiveCount) {
      archiveCount.textContent =
        `${previousDates.length} ${previousDates.length === 1 ? "note" : "notes"}`;
    }

    if (archiveEmpty) {
      archiveEmpty.classList.toggle("hidden", previousDates.length > 0);
    }

    previousDates.forEach((date) => {
      const entry = messages[date];
      const item = document.createElement("article");
      item.className = "archive-item";

      const toggle = document.createElement("button");
      toggle.className = "archive-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");

      const meta = document.createElement("span");
      meta.className = "archive-meta";

      const dateLabel = document.createElement("span");
      dateLabel.className = "archive-date";
      dateLabel.textContent = entry?.dateLabel || formatDate(date);

      const title = document.createElement("span");
      title.className = "archive-title";
      title.textContent = getMessageTitle(entry);

      meta.append(dateLabel, title);

      const chevron = document.createElement("span");
      chevron.className = "archive-chevron";
      chevron.textContent = "⌄";

      toggle.append(meta, chevron);

      const body = document.createElement("div");
      body.className = "archive-body";

      const paragraph = document.createElement("p");
      paragraph.className = "archive-message";
      paragraph.textContent = getMessageText(entry);
      body.appendChild(paragraph);

      const player = createArchivePlayer(entry);
      if (player) body.appendChild(player);

      toggle.addEventListener("click", () => {
        const isOpen = item.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      item.append(toggle, body);
      archiveList.appendChild(item);
    });
  }

  async function loadMessages() {
    if (revealButton) revealButton.disabled = true;

    try {
      const response = await fetch("./messages.json", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Could not load messages.json (${response.status})`);
      }

      const data = await response.json();
      messages = data.messages || data;

      if (!messages || typeof messages !== "object" || Array.isArray(messages)) {
        throw new Error("Unexpected messages.json format");
      }

      showArchive();
      setupTodayMusic(messages[todayKey]);

      if (revealButton) revealButton.disabled = false;

      if (!getMessageText(messages[todayKey])) {
        if (revealHint) {
          revealHint.textContent = "Today's note hasn't been added yet.";
        }
      } else if (revealHint) {
        revealHint.textContent = "A little note, just for today.";
      }
    } catch (error) {
      console.error("Message loading failed:", error);

      if (revealHint) {
        revealHint.textContent =
          "Couldn't load the notes. Please check messages.json.";
      }

      if (revealButton) revealButton.disabled = true;
    }
  }

  if (revealButton) {
    revealButton.addEventListener("click", () => {
      const entry = messages[todayKey];

      if (!getMessageText(entry)) {
        if (revealHint) {
          revealHint.textContent = "Today's note isn't in messages.json yet. ✨";
        }
        return;
      }

      showMessage(entry);
      revealed = true;
      revealButton.innerHTML = 'Message revealed <span>♡</span>';

      if (revealHint) {
        revealHint.textContent = "A little thought, just for you. ✨";
      }
    });
  }

  loadMessages();
});
        
