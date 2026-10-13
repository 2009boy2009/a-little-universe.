// ========================================
// A LITTLE UNIVERSE — MESSAGES + MUSIC
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const revealButton = document.getElementById("reveal-button");
  const todayContent = document.getElementById("today-content");
  const todayDate = document.getElementById("today-date");
  const revealHint = document.getElementById("reveal-hint");
  const archiveList = document.getElementById("archive-list");
  const archiveCount = document.getElementById("archive-count");
  const archiveEmpty = document.getElementById("archive-empty");

  // Use the visitor's local date.
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

  let messages = {};
  let revealed = false;

  function getMessageText(entry) {
    if (typeof entry === "string") return entry;
    return entry?.message || entry?.content || "";
  }

  function getMessageTitle(entry) {
    return typeof entry === "object" && entry?.title
      ? entry.title
      : "A little note for today";
  }

  function showMessage(entry) {
    todayContent.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = getMessageTitle(entry);

    const paragraph = document.createElement("p");
    paragraph.textContent = getMessageText(entry);

    todayContent.append(title, paragraph);
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

      const dateLabel = document.createElement("p");
      dateLabel.className = "archive-date";
      dateLabel.textContent = entry?.dateLabel || formatDate(date);

      const title = document.createElement("h3");
      title.className = "archive-title";
      title.textContent = getMessageTitle(entry);

      const paragraph = document.createElement("p");
      paragraph.textContent = getMessageText(entry);

      item.append(dateLabel, title, paragraph);
      archiveList.appendChild(item);
    });
  }

  // Load daily messages from messages.json.
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

      if (!messages || typeof messages !== "object") {
        throw new Error("Unexpected messages.json format");
      }

      showArchive();

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

  // Reveal button.
  if (revealButton) {
    revealButton.addEventListener("click", () => {
      const entry = messages[todayKey];

      if (!getMessageText(entry)) {
        if (revealHint) {
          revealHint.textContent =
            "Today's note isn't in messages.json yet, bro. ✨";
        }
        return;
      }

      if (!revealed) {
        showMessage(entry);
        revealed = true;
        revealButton.innerHTML = 'Message revealed <span>♡</span>';

        if (revealHint) {
          revealHint.textContent = "A little thought, just for you. ✨";
        }
      } else {
        showMessage(entry);
      }
    });
  }

  // Background music — keep music.mp3 beside index.html.
  const music = new Audio("./music.mp3");
  music.loop = true;
  music.volume = 0.7;
  music.preload = "auto";

  const musicButton = document.getElementById("music-toggle");
  const musicStatus = document.getElementById("music-status");

  if (musicButton) {
    musicButton.addEventListener("click", async () => {
      try {
        if (music.paused) {
          await music.play();
          musicButton.textContent = "Pause music ♫";

          if (musicStatus) {
            musicStatus.textContent = "Now playing ♫";
          }
        } else {
          music.pause();
          musicButton.textContent = "Play music ♫";

          if (musicStatus) {
            musicStatus.textContent = "Paused for a moment";
          }
        }
      } catch (error) {
        console.error("Audio playback failed:", error);

        musicButton.textContent = "Tap to retry ♫";

        if (musicStatus) {
          musicStatus.textContent =
            "Couldn't play music. Check music.mp3.";
        }
      }
    });

    music.addEventListener("ended", () => {
      musicButton.textContent = "Play music ♫";
    });
  }

  loadMessages();
});
