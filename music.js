(() => {
  const root = document.getElementById("music-window");
  if (!root) {
    return;
  }

  const audio = root.querySelector("#music-audio");
  const playBtn = root.querySelector("#music-play");
  const timeEl = root.querySelector("#music-time");
  const progressFill = root.querySelector("#music-progress-fill");
  const titleEl = root.querySelector("#music-title");
  const bars = Array.from(root.querySelectorAll(".music-bars span"));
  const artistEl = root.querySelector("#music-artist");
  const albumEl = root.querySelector("#music-album");

  if (!audio || !playBtn) {
    return;
  }

  // ====== EDITA AQUÍ LOS DATOS DE LA CANCIÓN ======
  const MUSIC_META = {
    title: "Pac0o",
    artist: "inu(D)",
    album: "Pac0o · DINU",
    startAt: 2,
  };

  // ====== EDITA AQUÍ LAS FOTOS DEL FINAL ======
  const FINAL_IMAGES = [
    "imgs/1E29262A-808A-424C-B750-37209ADE9437.jpg",
    "imgs/32 sin t\u00EDtulo_20261108152931.png",
    "imgs/4D448369-6A98-4A4F-911B-1921E64D0B1E.jpg",
    "imgs/511ff1c9-8000-4449-b1e6-c2b8483420e5.jpg",
    "imgs/7775D37A-4651-40E3-A437-DC73C657ED7B.jpg",
    "imgs/7ADA301A-BA17-494F-BDAB-6E7BE83032BE.jpg",
    "imgs/82838FAB-3DAD-4D5D-B9CD-86B71E8A407D.jpg",
    "imgs/85D6FB71-24F2-4B7A-B070-6B6CB1ABBB38.jpg",
    "imgs/8d18de68-fe90-4124-9517-ab9e276d95c1.jpg",
    "imgs/A89288F0-FCEA-4B2F-8CC7-C6BB3C66AF82.jpg",
    "imgs/C0802B61-425F-4CDE-A83F-CA94B03C6654.jpg",
    "imgs/C2AAD706-08FF-47B1-BBE0-440D1C555224.jpg",
    "imgs/c6732577-f89a-4cc7-8761-76cbafbba90a.jpg",
    "imgs/db34324a-1580-43fc-b4cd-02d06d4407b6.jpg",
    "imgs/E9415B3F-8020-4760-978F-DC62F6664033.jpg",
    "imgs/e954d3e8-1aa0-48c2-bce5-3b813274b184.jpg",
    "imgs/ECA6C9FC-31BD-45F8-9485-E6516DED7241.jpg",
  ];

  const FINAL_MODE_AT = 133; // 2:13
  const VIRUS_START = 78; // 1:18

  const FINAL_MESSAGES = [
    "Mira hasta donde has llegado",
    "este es tu presente y pronto lo q te acompañará en el futuro",
    "se que aveces da miedo crecer",
    "pero es parte de vivir",
    "eres una persona increible",
    "gracis por tanto amor",
    "no solo yo te amo, sino tmb todos tus amigos",
    "ha sido un gusto hasta hoy el poder verte crecer",
    "no es el un regalo fisico, sino un regalo del que sé me recordarás por siempre",
    "te amo demasiado Andres",
    "gracias x ser",
  ];

  const WARNING_MESSAGES = [
    "Perdon por lo que viene",
    "no tuve mejores cositas para poner",
    "pero bueXd",
    "listo?",
  ];

  if (titleEl) titleEl.textContent = MUSIC_META.title;
  if (artistEl) artistEl.textContent = MUSIC_META.artist;
  if (albumEl) albumEl.textContent = MUSIC_META.album;

  let audioContext = null;
  let analyser = null;
  let sourceNode = null;
  let dataArray = null;
  let visualizerFrame = null;

  function setupVisualizer() {
    if (analyser) {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (error) {
      analyser = null;
    }
  }

  function updateVisualizer() {
    if (!analyser || !dataArray || !bars.length) {
      return;
    }

    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, index) => {
      const value = dataArray[index % dataArray.length] / 255;
      const height = 20 + value * 80;
      bar.style.height = `${height}%`;
      bar.style.transform = "none";
    });

    visualizerFrame = window.requestAnimationFrame(updateVisualizer);
  }

  function startVisualizer() {
    if (visualizerFrame) {
      window.cancelAnimationFrame(visualizerFrame);
    }
    visualizerFrame = window.requestAnimationFrame(updateVisualizer);
  }

  function stopVisualizer() {
    if (visualizerFrame) {
      window.cancelAnimationFrame(visualizerFrame);
      visualizerFrame = null;
    }
    bars.forEach((bar) => {
      bar.style.height = "20%";
    });
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function updateTime() {
    if (timeEl) {
      timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }

    if (progressFill && Number.isFinite(audio.duration) && audio.duration > 0) {
      progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  }

  function setPlayingState() {
    playBtn.textContent = audio.paused ? "PLAY" : "PAUSA";
  }

  function startPlayback() {
    if (!audio.src) {
      return;
    }

    setupVisualizer();

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    if (audio.currentTime < MUSIC_META.startAt) {
      audio.currentTime = MUSIC_META.startAt;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }

    setPlayingState();
    updateTime();
    startVisualizer();
  }

  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      startPlayback();
    } else {
      audio.pause();
      setPlayingState();
      stopVisualizer();
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    if (audio.currentTime < MUSIC_META.startAt) {
      audio.currentTime = MUSIC_META.startAt;
    }
    updateTime();
  });

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("play", () => {
    setPlayingState();
    startVisualizer();
  });
  audio.addEventListener("pause", () => {
    setPlayingState();
    stopVisualizer();
  });
  audio.addEventListener("ended", () => {
    setPlayingState();
    stopVisualizer();
  });

  let finalModeActive = false;
  let finalImageIndex = 0;
  let finalImageTimer = null;
  let finalOverlay = null;
  let virusActive = false;

  function updateVirusCountdown() {
    const win = document.getElementById("virus-window");
    if (!win) {
      return;
    }

    const el = win.querySelector(".virus-countdown");
    if (!el) {
      return;
    }

    const remaining = Math.max(0, Math.ceil(FINAL_MODE_AT - audio.currentTime));
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    el.textContent = `${minutes}:${seconds}`;
  }

  function openVirusMode() {
    if (virusActive || document.body.classList.contains("music-black")) {
      return;
    }

    const win = document.getElementById("virus-window");
    if (!win) {
      return;
    }

    virusActive = true;
    win.style.left = "50%";
    win.style.top = "50%";
    win.style.transform = "translate(-50%, -50%)";
    win.dataset.placed = "true";

    if (typeof openWindow === "function") {
      openWindow(win);
    } else {
      win.classList.add("open");
    }
    if (typeof focusWindow === "function") {
      focusWindow(win);
    }
    win.style.zIndex = "999999";
    updateVirusCountdown();
  }

  function closeVirusMode() {
    const win = document.getElementById("virus-window");
    if (win) {
      win.classList.remove("open");
    }
    virusActive = false;
  }

  function ensureFinalOverlay() {
    if (finalOverlay) {
      return finalOverlay;
    }

    finalOverlay = document.createElement("div");
    finalOverlay.className = "music-final-overlay";
    finalOverlay.innerHTML = `
      <div class="music-final-gradient"></div>
      <div class="music-final-bars"></div>
      <img class="music-final-image" alt="">
    `;
    const finalImg = finalOverlay.querySelector(".music-final-image");
    if (finalImg) {
      finalImg.onerror = () => {
        finalImg.style.display = "none";
      };
    }
    document.body.appendChild(finalOverlay);
    return finalOverlay;
  }

  function startFinalMode() {
    if (finalModeActive || document.body.classList.contains("music-black")) {
      return;
    }

    finalModeActive = true;
    closeVirusMode();
    document.querySelectorAll('[id^="warning-window-"]').forEach((win) => {
      win.classList.remove("open");
      win.remove();
    });
    document.body.classList.add("music-final-mode");

    const wallpaper = document.querySelector(".wallpaper");
    if (wallpaper) {
      wallpaper.style.display = "none";
    }

    const baseWindow = document.getElementById("photo-window");
    if (!baseWindow || !FINAL_IMAGES.length) {
      return;
    }

    const remaining = Math.max(1, (audio.duration || 217) - FINAL_MODE_AT - 16);
    const interval = Math.max(500, (remaining * 1000) / Math.max(1, FINAL_IMAGES.length));

    const orderedImages = [...FINAL_IMAGES];
    for (let i = orderedImages.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedImages[i], orderedImages[j]] = [orderedImages[j], orderedImages[i]];
    }

    const total = orderedImages.length;
    const cols = Math.max(1, Math.ceil(Math.sqrt(total * (window.innerWidth / Math.max(1, window.innerHeight - 80)))));
    const rows = Math.max(1, Math.ceil(total / cols));
    const cells = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        cells.push({ r, c });
      }
    }
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    orderedImages.forEach((src, index) => {
      window.setTimeout(() => {
        const clone = baseWindow.cloneNode(true);
        clone.id = `photo-window-${index}`;
        clone.classList.add("photo-window");
        const img = clone.querySelector("img");
        if (img) {
          img.src = src;
          img.id = "";
        }
        clone.style.width = "auto";
        clone.style.height = "auto";
        document.body.appendChild(clone);

        const margin = 16;
        const usableW = Math.max(1, window.innerWidth - margin * 2);
        const usableH = Math.max(1, window.innerHeight - 48 - margin * 2);
        const cellW = usableW / cols;
        const cellH = usableH / rows;
        const cell = cells[index % cells.length];
        const winW = clone.offsetWidth || 400;
        const winH = clone.offsetHeight || 300;
        const jitterX = Math.max(0, cellW - winW);
        const jitterY = Math.max(0, cellH - winH);
        let left = margin + cell.c * cellW + Math.random() * jitterX;
        let top = margin + cell.r * cellH + Math.random() * jitterY;
        left = Math.min(left, Math.max(margin, window.innerWidth - winW - margin));
        top = Math.min(top, Math.max(margin, window.innerHeight - 48 - winH - margin));
        clone.style.left = `${Math.round(left)}px`;
        clone.style.top = `${Math.round(top)}px`;
        clone.dataset.placed = "true";

        if (typeof window.makeDraggable === "function") {
          window.makeDraggable(clone);
        }
        clone.addEventListener("pointerdown", () => {
          if (typeof focusWindow === "function") {
            focusWindow(clone);
          }
        });

        if (typeof openWindow === "function") {
          openWindow(clone);
        } else {
          clone.classList.add("open");
        }
        if (typeof focusWindow === "function") {
          focusWindow(clone);
        }
        clone.style.zIndex = "50000";
      }, 500 + index * interval);
    });
  }

  function stopFinalMode() {
    finalModeActive = false;
    document.body.classList.remove("music-final-mode");
    if (finalImageTimer) {
      window.clearInterval(finalImageTimer);
      finalImageTimer = null;
    }
  }

  audio.addEventListener("timeupdate", () => {
    if (document.body.classList.contains("music-black")) {
      return;
    }

    if (!finalModeActive && audio.currentTime >= FINAL_MODE_AT) {
      startFinalMode();
    }

    if (!finalModeActive && audio.currentTime >= VIRUS_START) {
      if (!virusActive) {
        openVirusMode();
      }
      updateVirusCountdown();
    } else if (virusActive) {
      closeVirusMode();
    }

    if (!finalModeActive && audio.currentTime >= 83) {
      if (!warningActive) {
        startWarningMode();
      }
      if (warningActive) {
        while (
          shownWarnings < warningSchedule.length &&
          audio.currentTime >= warningSchedule[shownWarnings].at
        ) {
          const item = warningSchedule[shownWarnings];
          showMessage(item.text, 100 + shownWarnings, true, "warning-window", "99999");
          shownWarnings += 1;
        }
      }
    }

    if (finalModeActive && audio.duration - audio.currentTime <= 16) {
      document.querySelectorAll('[id^="photo-window-"]').forEach((win) => {
        win.classList.remove("open");
        win.remove();
      });
    }
  });

  audio.addEventListener("ended", () => {
    stopFinalMode();
    document.body.classList.add("music-black");
    document.querySelectorAll(".window.open").forEach((win) => {
      win.classList.remove("open");
      win.remove();
    });
  });

  // TEMPORAL: atajo para saltar a 2:09
  window.addEventListener("keydown", (event) => {
    if (event.shiftKey && event.key.toLowerCase() === "t") {
      event.preventDefault();
      audio.currentTime = 129;
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    }

    if (event.shiftKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = Math.max(0, audio.duration - 20);
      }
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    }
  });

  let messageModeActive = false;
  let messageSchedule = [];
  let shownMessages = 0;
  let warningActive = false;
  let warningSchedule = [];
  let shownWarnings = 0;

  function showMessage(text, index, centered = true, idPrefix = "message-window", zIndex = "99999") {
    const baseWindow = document.getElementById("message-window");
    if (!baseWindow) {
      return;
    }

    const clone = baseWindow.cloneNode(true);
    clone.id = `${idPrefix}-${index}`;
    clone.classList.add("message-window");
    const p = clone.querySelector(".message-text");
    if (p) {
      p.textContent = text;
    }
    document.body.appendChild(clone);

    if (centered) {
      clone.style.left = "50%";
      clone.style.top = "50%";
      clone.style.transform = "translate(-50%, -50%)";
    } else {
      const margin = 20;
      const maxLeft = Math.max(margin, window.innerWidth - 420);
      const maxTop = Math.max(margin, window.innerHeight - 220);
      clone.style.left = `${Math.round(margin + Math.random() * (maxLeft - margin))}px`;
      clone.style.top = `${Math.round(margin + Math.random() * (maxTop - margin))}px`;
    }
    clone.dataset.placed = "true";

    if (typeof window.makeDraggable === "function") {
      window.makeDraggable(clone);
    }
    if (typeof openWindow === "function") {
      openWindow(clone);
    } else {
      clone.classList.add("open");
    }
    if (typeof focusWindow === "function") {
      focusWindow(clone);
    }
    clone.style.zIndex = zIndex;
  }

  function startMessageMode() {
    if (messageModeActive) {
      return;
    }

    messageModeActive = true;
    const startAt = 150;
    const endAt = (audio.duration || 217) - 16;
    const interval = Math.max(1, (endAt - startAt) / Math.max(1, FINAL_MESSAGES.length));

    messageSchedule = FINAL_MESSAGES.map((text, index) => ({
      text,
      at: startAt + index * interval,
    }));
    shownMessages = 0;
  }

  function startWarningMode() {
    if (warningActive) {
      return;
    }

    warningActive = true;
    const startAt = 83;
    const endAt = FINAL_MODE_AT;
    const interval = Math.max(1, (endAt - startAt) / Math.max(1, WARNING_MESSAGES.length));

    warningSchedule = WARNING_MESSAGES.map((text, index) => ({
      text,
      at: startAt + index * interval,
    }));
    shownWarnings = 0;
  }

  function showFinalMessage() {
    const baseWindow = document.getElementById("message-window");
    if (!baseWindow) {
      return;
    }

    const clone = baseWindow.cloneNode(true);
    clone.classList.add("message-window", "final-message");
    const p = clone.querySelector(".message-text");
    if (p) {
      p.textContent = "feliz cumpleaños <3";
    }
    clone.style.left = "50%";
    clone.style.top = "50%";
    clone.style.transform = "translate(-50%, -50%)";
    clone.dataset.placed = "true";
    document.body.appendChild(clone);
    if (typeof openWindow === "function") {
      openWindow(clone);
    } else {
      clone.classList.add("open");
    }
    if (typeof focusWindow === "function") {
      focusWindow(clone);
    }
    clone.style.zIndex = "999999";
  }

  audio.addEventListener("timeupdate", () => {
    if (document.body.classList.contains("music-black")) {
      return;
    }

    if (!messageModeActive && audio.currentTime >= 150) {
      startMessageMode();
    }

    if (messageModeActive) {
      while (
        shownMessages < messageSchedule.length &&
        audio.currentTime >= messageSchedule[shownMessages].at
      ) {
        const item = messageSchedule[shownMessages];
        showMessage(item.text, shownMessages);
        shownMessages += 1;
      }
    }

    if (finalModeActive && audio.duration - audio.currentTime <= 16) {
      document.querySelectorAll('[id^="photo-window-"]').forEach((win) => {
        win.classList.remove("open");
        win.remove();
      });

      document.querySelectorAll(".message-window").forEach((win) => {
        if (!win.classList.contains("final-message")) {
          win.classList.remove("open");
          win.remove();
        }
      });

      document.querySelectorAll(".window.open").forEach((win) => {
        if (!win.classList.contains("final-message")) {
          win.classList.remove("open");
        }
      });

      if (!window.__finalMessageShown) {
        window.__finalMessageShown = true;
        showFinalMessage();
      }
    }
  });

  function openMusic() {
    if (typeof openWindow === "function") {
      openWindow(root);
    } else {
      root.classList.add("open");
    }

    window.setTimeout(() => {
      startPlayback();
    }, 150);
  }

  window.openMusic = openMusic;
})();
