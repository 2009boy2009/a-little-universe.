
document.addEventListener("DOMContentLoaded", () => {
  const revealButton = document.getElementById("reveal-button");
  const todayContent = document.getElementById("today-content");
  const todayDate = document.getElementById("today-date");
  const revealHint = document.getElementById("reveal-hint");
  const archiveList = document.getElementById("archive-list");
  const archiveCount = document.getElementById("archive-count");
  const archiveEmpty = document.getElementById("archive-empty");

  const todayPlay = document.getElementById("today-play");

  const audio = new Audio();
  audio.preload = "none";

  let messages = {};
  let activeButton = null;
  let activeSongPath = "";

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

  if (todayDate) {
    todayDate.textContent = formatDate(todayKey);
  }

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

    try {
      return decodeURIComponent(filename)
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");
    } catch {
      return filename.replace(/\.[^/.]+$/, "");
    }
  }

  function setButtonState(button, playing) {
    if (!button) return;

    button.classList.toggle("is-playing", playing);

    if (button === todayPlay) {
      button.innerHTML = playing
        ? '<span class="music-symbol">Ⅱ</span>'
        : '<span class="music-symbol">♫</span>';

      button.setAttribute(
        "aria-label",
        playing ? "Pause today's song" : "Play today's song"
      );

      button.title = playing ? "Pause song" : "Play song";
    } else {
      button.textContent = playing ? "Ⅱ" : "♫";
      button.setAttribute(
        "aria-label",
        playing ? "Pause this archived song" : "Play this archived song"
      );

      button.title = playing ? "Pause song" : "Play song";
    }
  }

  function resetActiveButton() {
    if (activeButton) {
      setButtonState(activeButton, false);
    }

    activeButton = null;
    activeSongPath = "";
  }

  function stopCurrentMusic() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    resetActiveButton();
    document.body.classList.remove("music-playing");
  }

  async function playTrack(path, button) {
    if (!path || !button) return;

    const resolvedPath = new URL(path, document.baseURI).href;

    // Tapping the currently playing song pauses it.
    if (
      activeSongPath === resolvedPath &&
      !audio.paused
    ) {
      audio.pause();
      return;
    }

    // Tapping the same paused song resumes it.
    if (
      activeSongPath === resolvedPath &&
      audio.paused
    ) {
      activeButton = button;

      try {
        await audio.play();
      } catch (error) {
        console.error("Music playback failed:", error);
        document.body.classList.remove("music-playing");
      }

      return;
    }

    // Stop the previous song before starting another.
    stopCurrentMusic();

    activeButton = button;
    activeSongPath = resolvedPath;

    audio.src = resolvedPath;

    setButtonState(button, false);
    button.textContent = "…";

    try {
      await audio.play();
    } catch (error) {
      console.error("Music playback failed:", error);

      resetActiveButton();
      document.body.classList.remove("music-playing");

      button.textContent = "♫";

      if (button === todayPlay) {
        button.innerHTML = '<span class="music-symbol">♫</span>';
      }

      if (revealHint) {
        revealHint.textContent =
          "Couldn't play this song. Please check its filename and path.";
      }
    }
  }

  audio.addEventListener("play", () => {
    document.body.classList.add("music-playing");

    if (activeButton) {
      setButtonState(activeButton, true);
    }
  });

  audio.addEventListener("pause", () => {
    document.body.classList.remove("music-playing");

    if (activeButton) {
      setButtonState(activeButton, false);
    }
  });

  audio.addEventListener("ended", () => {
    document.body.classList.remove("music-playing");
    resetActiveButton();
  });

  audio.addEventListener("error", () => {
    document.body.classList.remove("music-playing");

    if (activeButton) {
      const failedButton = activeButton;
      resetActiveButton();

      if (failedButton === todayPlay) {
        failedButton.innerHTML = '<span class="music-symbol">♫</span>';
      } else {
        failedButton.textContent = "♫";
      }
    }
  });

  function setupTodayMusic(entry) {
    const path = getMusicPath(entry);

    if (!path || !todayPlay) {
      todayPlay.hidden = true;
      todayPlay.onclick = null;
      return;
    }

    todayPlay.hidden = false;
    todayPlay.innerHTML = '<span class="music-symbol">♫</span>';
    todayPlay.onclick = () => playTrack(path, todayPlay);
  }

  function showMessage(entry) {
    todayContent.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = getMessageTitle(entry);

    const paragraph = document.createElement("p");
    paragraph.textContent = getMessageText(entry);

    todayContent.append(title, paragraph);
  }

  function createArchiveMusicButton(entry) {
    const path = getMusicPath(entry);

    if (!path) return null;

    const button = document.createElement("button");

    button.className = "archive-music-button";
    button.type = "button";
    button.textContent = "♫";
    button.setAttribute("aria-label", "Play this archived song");
    button.title = entry.musicTitle || getSongName(path);

    button.addEventListener("click", () => {
      playTrack(path, button);
    });

    return button;
  }

  function showArchive() {
    if (!archiveList) return;

    archiveList.replaceChildren();

    const previousDates = Object.keys(messages)
      .filter((date) =>
        date < todayKey && getMessageText(messages[date])
      )
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

      // Archive heading
      const heading = document.createElement("div");
      heading.className = "archive-heading";

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

      // Small music button beside the archived date
      const musicButton = createArchiveMusicButton(entry);

      toggle.addEventListener("click", () => {
        const isOpen = item.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      heading.appendChild(toggle);

      if (musicButton) {
        heading.appendChild(musicButton);
      }

      // Archive message body
      const body = document.createElement("div");
      body.className = "archive-body";

      const paragraph = document.createElement("p");
      paragraph.className = "archive-message";
      paragraph.textContent = getMessageText(entry);

      body.appendChild(paragraph);

      item.append(heading, body);
      archiveList.appendChild(item);
    });
  }

  async function loadMessages() {
    if (revealButton) {
      revealButton.disabled = true;
    }

    try {
      const response = await fetch("./messages.json", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Could not load messages.json (${response.status})`
        );
      }

      const data = await response.json();

      messages = data.messages || data;

      if (
        !messages ||
        typeof messages !== "object" ||
        Array.isArray(messages)
      ) {
        throw new Error("Unexpected messages.json format");
      }

      showArchive();
      setupTodayMusic(messages[todayKey]);

      if (revealButton) {
        revealButton.disabled = false;
      }

      if (!getMessageText(messages[todayKey])) {
        if (revealHint) {
          revealHint.textContent =
            "Today's note hasn't been added yet.";
        }
      } else if (revealHint) {
        revealHint.textContent =
          "A little note, just for today.";
      }

    } catch (error) {
      console.error("Message loading failed:", error);

      if (revealHint) {
        revealHint.textContent =
          "Couldn't load the notes. Please check messages.json.";
      }

      if (revealButton) {
        revealButton.disabled = true;
      }
    }
  }

  if (revealButton) {
    revealButton.addEventListener("click", () => {
      const entry = messages[todayKey];

      if (!getMessageText(entry)) {
        if (revealHint) {
          revealHint.textContent =
            "Today's note isn't in messages.json yet. ✨";
        }
        return;
      }

      showMessage(entry);

      revealButton.innerHTML =
        'Message revealed <span>♡</span>';

      if (revealHint) {
        revealHint.textContent =
          "A little thought, just for you. ✨";
      }
    });
  }

  loadMessages();
});
      
