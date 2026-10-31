
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

  const todayKey = (() => {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  })();

  function formatDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);

    return Number.isNaN(date.getTime())
      ? dateKey
      : date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
  }

  if (todayDate) {
    todayDate.textContent = formatDate(todayKey);
  }

  function getMessageText(entry) {
    if (typeof entry === "string") return entry;
    return entry?.message || entry?.content || "";
  }

  function getMessageTitle(entry) {
    return entry?.title || "A little note for today";
  }

  function getMusicPath(entry) {
    if (!entry || typeof entry !== "object") return "";
    return typeof entry.music === "string" ? entry.music.trim() : "";
  }

  function setButtonState(button, playing) {
    if (!button) return;

    button.classList.toggle("is-playing", playing);
    button.setAttribute("aria-pressed", String(playing));
    button.innerHTML = playing
      ? '<span class="music-symbol">Ⅱ</span>'
      : '<span class="music-symbol">♫</span>';

    button.setAttribute(
      "aria-label",
      playing ? "Pause song" : "Play song"
    );
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
  }

  async function playTrack(path, button) {
    if (!path || !button) return;

    const resolvedPath = new URL(path, document.baseURI).href;

    // Pause the currently playing song.
    if (activeSongPath === resolvedPath && !audio.paused) {
      audio.pause();
      return;
    }

    // Resume the same song if it was paused.
    if (activeSongPath === resolvedPath && audio.paused) {
      activeButton = button;

      try {
        await audio.play();
      } catch (error) {
        console.error("Music playback failed:", error);
        resetActiveButton();
      }

      return;
    }

    // Stop the previous song before starting another.
    stopCurrentMusic();

    activeButton = button;
    activeSongPath = resolvedPath;
    audio.src = resolvedPath;

    button.innerHTML = '<span class="music-symbol">…</span>';

    try {
      await audio.play();
    } catch (error) {
      console.error("Music playback failed:", error);
      resetActiveButton();
    }
  }

  audio.addEventListener("play", () => {
    if (activeButton) {
      setButtonState(activeButton, true);
    }
  });

  audio.addEventListener("pause", () => {
    if (activeButton) {
      setButtonState(activeButton, false);
    }
  });

  audio.addEventListener("ended", () => {
    resetActiveButton();
  });

  audio.addEventListener("error", () => {
    console.error("The selected music file could not be loaded.");

    if (activeButton) {
      resetActiveButton();
    }
  });

  function setupTodayMusic(entry) {
    if (!todayPlay) return;

    const path = getMusicPath(entry);

    if (!path) {
      todayPlay.hidden = true;
      todayPlay.onclick = null;
      return;
    }

    todayPlay.hidden = false;
    setButtonState(todayPlay, false);
    todayPlay.onclick = () => playTrack(path, todayPlay);
  }

  function showMessage(entry) {
    if (!todayContent) return;

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
    button.innerHTML = '<span class="music-symbol">♫</span>';
    button.setAttribute("aria-label", "Play this archived song");

    button.addEventListener("click", () => {
      playTrack(path, button);
    });

    return button;
  }

  function showArchive() {
    if (!archiveList) return;

    archiveList.replaceChildren();

    const previousDates = Object.keys(messages)
      .filter(date =>
        date < todayKey && getMessageText(messages[date])
      )
      .sort((a, b) => b.localeCompare(a));

    if (archiveCount) {
      archiveCount.textContent =
        `${previousDates.length} ${
          previousDates.length === 1 ? "note" : "notes"
        }`;
    }

    if (archiveEmpty) {
      archiveEmpty.classList.toggle(
        "hidden",
        previousDates.length > 0
      );
    }

    previousDates.forEach(date => {
      const entry = messages[date];

      const item = document.createElement("article");
      item.className = "archive-item";

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

      toggle.addEventListener("click", () => {
        const isOpen = item.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      heading.appendChild(toggle);

      const musicButton = createArchiveMusicButton(entry);

      if (musicButton) {
        heading.appendChild(musicButton);
      }

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

      // Today's button uses ONLY today's own music entry.
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
      todayContent.classList.remove("message-arrived");
      void todayContent.offsetWidth;
      todayContent.classList.add("message-arrived");
      revealButton.setAttribute("aria-expanded", "true");

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
                          



  // Subtle pointer parallax gives the existing CSS universe a little depth.
  // It intentionally affects only the background sky, never the password portal.
  const sky = document.querySelector(".sky");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (sky && !reduceMotion.matches) {
    let pointerFrame = 0;
    const moveSky = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5);
      const y = (event.clientY / window.innerHeight - 0.5);
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        sky.style.setProperty("--drift-nebula-x", `${-x * 13}px`);
        sky.style.setProperty("--drift-nebula-y", `${-y * 10}px`);
        sky.style.setProperty("--drift-moon-x", `${-x * 20}px`);
        sky.style.setProperty("--drift-moon-y", `${-y * 16}px`);
        sky.style.setProperty("--drift-stars-a-x", `${x * 5}px`);
        sky.style.setProperty("--drift-stars-a-y", `${y * 4}px`);
        sky.style.setProperty("--drift-stars-b-x", `${x * 9}px`);
        sky.style.setProperty("--drift-stars-b-y", `${y * 7}px`);
        sky.style.setProperty("--drift-stars-c-x", `${x * 14}px`);
        sky.style.setProperty("--drift-stars-c-y", `${y * 11}px`);
        sky.style.setProperty("--drift-aurora-x", `${x * 8}px`);
        sky.style.setProperty("--drift-aurora-y", `${y * 6}px`);
      });
    };
    window.addEventListener("pointermove", moveSky, { passive: true });
    window.addEventListener("pointerleave", () => {
      sky.style.removeProperty("--drift-nebula-x");
      sky.style.removeProperty("--drift-nebula-y");
      sky.style.removeProperty("--drift-moon-x");
      sky.style.removeProperty("--drift-moon-y");
      sky.style.removeProperty("--drift-stars-a-x");
      sky.style.removeProperty("--drift-stars-a-y");
      sky.style.removeProperty("--drift-stars-b-x");
      sky.style.removeProperty("--drift-stars-b-y");
      sky.style.removeProperty("--drift-stars-c-x");
      sky.style.removeProperty("--drift-stars-c-y");
      sky.style.removeProperty("--drift-aurora-x");
      sky.style.removeProperty("--drift-aurora-y");
    }, { passive: true });
  }
