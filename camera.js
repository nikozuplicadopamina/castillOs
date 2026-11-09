(() => {
  const cameraWindow = document.getElementById("camera-window");
  if (!cameraWindow) {
    return;
  }

  // ====== EDITA AQUÍ EL MENSAJE DE LA VENTANA ======
  const CAMERA_MESSAGE = `este es de los peores regalos dentro de esta app, ojalá que ha este paso sepa un poco de lo que va el conseguir cada miniregalo, entonces continue.
Link siguiente: https://open.spotify.com/playlist/5SOaWOgIyDIrGfTJspMXCp?si=GapoPbJaQyq6od-HvHVHIQ&utm_source=copy-link&pi=FrQ5COtISNCow `;

  const messageWindow = document.getElementById("camera-message-window");
  const messageText = document.getElementById("camera-message-text");
  const cameraStage = cameraWindow.querySelector(".camera-stage");
  const cameraLabel = cameraWindow.querySelector(".camera-label");
  const feedCanvas = document.getElementById("camera-feed");
  const drawCanvas = document.getElementById("camera-draw");
  const videoEl = document.getElementById("camera-video");
  const sizeInput = document.getElementById("camera-size");
  const clearBtn = document.getElementById("camera-clear");
  const colorButtons = Array.from(document.querySelectorAll(".camera-color"));

  if (!feedCanvas || !drawCanvas) {
    return;
  }

  const feedCtx = feedCanvas.getContext("2d");
  const drawCtx = drawCanvas.getContext("2d");

  let currentColor = "#ff4d4d";
  let brushSize = Number(sizeInput?.value) || 4;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  if (messageText) {
    const escaped = CAMERA_MESSAGE
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    messageText.innerHTML = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  let cameraStream = null;
  let cameraStarting = false;

  function setCameraLabel(text) {
    if (cameraLabel) {
      cameraLabel.textContent = text;
    }
  }

  function stopCamera() {
    const stream = cameraStream;
    cameraStream = null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoEl) {
      videoEl.pause();
      videoEl.srcObject = null;
    }

    if (cameraStage) {
      cameraStage.classList.remove("is-live");
    }

    setCameraLabel("CAM 01 · SEÑAL SIMULADA");
  }

  async function startCamera() {
    if (cameraStream || cameraStarting) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !videoEl) {
      setCameraLabel("CAM 01 · SIN ACCESO A CÁMARA");
      return;
    }

    cameraStarting = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!cameraWindow.classList.contains("open")) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStream = stream;
      videoEl.srcObject = stream;

      try {
        await videoEl.play();
      } catch {}

      if (cameraStage) {
        cameraStage.classList.add("is-live");
      }
      setCameraLabel("CAM 01 · EN VIVO");
    } catch (error) {
      console.warn("No se pudo activar la cámara:", error);
      if (cameraStage) {
        cameraStage.classList.remove("is-live");
      }
      setCameraLabel("CAM 01 · CÁMARA NO DISPONIBLE");
    } finally {
      cameraStarting = false;
    }
  }

  function setDrawingStyle() {
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";
    drawCtx.strokeStyle = currentColor;
    drawCtx.lineWidth = brushSize;
  }

  function getPoint(event) {
    const rect = drawCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (drawCanvas.width / rect.width),
      y: (event.clientY - rect.top) * (drawCanvas.height / rect.height),
    };
  }

  function startDrawing(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    drawing = true;
    setDrawingStyle();

    const point = getPoint(event);
    lastX = point.x;
    lastY = point.y;

    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(lastX + 0.01, lastY);
    drawCtx.stroke();

    try {
      drawCanvas.setPointerCapture(event.pointerId);
    } catch {}

    event.preventDefault();
  }

  function continueDrawing(event) {
    if (!drawing) {
      return;
    }

    setDrawingStyle();

    const point = getPoint(event);
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(point.x, point.y);
    drawCtx.stroke();

    lastX = point.x;
    lastY = point.y;
    event.preventDefault();
  }

  function stopDrawing(event) {
    if (!drawing) {
      return;
    }

    drawing = false;

    try {
      if (drawCanvas.hasPointerCapture(event.pointerId)) {
        drawCanvas.releasePointerCapture(event.pointerId);
      }
    } catch {}
  }

  drawCanvas.addEventListener("pointerdown", startDrawing);
  drawCanvas.addEventListener("pointermove", continueDrawing);
  drawCanvas.addEventListener("pointerup", stopDrawing);
  drawCanvas.addEventListener("pointercancel", stopDrawing);
  drawCanvas.addEventListener("pointerleave", stopDrawing);

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentColor = button.dataset.color || "#ff4d4d";
      colorButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });

  if (sizeInput) {
    sizeInput.addEventListener("input", () => {
      brushSize = Number(sizeInput.value) || 4;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });
  }

  function drawFeed(time) {
    const w = feedCanvas.width;
    const h = feedCanvas.height;
    const t = time / 1000;
    const shakeX = Math.sin(t * 0.7) * 1.2;
    const shakeY = Math.cos(t * 0.5) * 0.8;

    feedCtx.save();
    feedCtx.translate(shakeX, shakeY);

    const background = feedCtx.createLinearGradient(0, 0, 0, h);
    background.addColorStop(0, "#1b2228");
    background.addColorStop(0.62, "#0d1114");
    background.addColorStop(1, "#060708");
    feedCtx.fillStyle = background;
    feedCtx.fillRect(-4, -4, w + 8, h + 8);

    const wx = 96;
    const wy = 64;
    const ww = 420;
    const wh = 250;

    feedCtx.fillStyle = "#0b0f14";
    feedCtx.fillRect(wx, wy, ww, wh);

    feedCtx.strokeStyle = "rgba(170, 175, 185, 0.35)";
    feedCtx.lineWidth = 6;
    feedCtx.strokeRect(wx, wy, ww, wh);

    feedCtx.lineWidth = 3;
    feedCtx.beginPath();
    feedCtx.moveTo(wx + ww / 2, wy);
    feedCtx.lineTo(wx + ww / 2, wy + wh);
    feedCtx.moveTo(wx, wy + wh / 2);
    feedCtx.lineTo(wx + ww, wy + wh / 2);
    feedCtx.stroke();

    feedCtx.beginPath();
    feedCtx.arc(wx + 86, wy + 60, 22, 0, Math.PI * 2);
    feedCtx.fillStyle = "rgba(235, 235, 245, 0.75)";
    feedCtx.fill();

    for (let i = 0; i < 18; i += 1) {
      const buildingX = wx + 14 + i * 22;
      const buildingHeight = 18 + ((i * 37) % 60);

      feedCtx.fillStyle = "rgba(10, 12, 16, 0.9)";
      feedCtx.fillRect(
        buildingX,
        wy + wh - buildingHeight - 10,
        16,
        buildingHeight
      );

      for (let j = 0; j < 3; j += 1) {
        if ((i + j) % 2 === 0) {
          feedCtx.fillStyle = "rgba(180, 185, 195, 0.35)";
          feedCtx.fillRect(
            buildingX + 4,
            wy + wh - buildingHeight - 6 + j * 8,
            3,
            3
          );
        }
      }
    }

    feedCtx.fillStyle = "#0a0a0c";
    feedCtx.beginPath();
    feedCtx.moveTo(0, h * 0.72);
    feedCtx.lineTo(w, h * 0.72);
    feedCtx.lineTo(w, h);
    feedCtx.lineTo(0, h);
    feedCtx.closePath();
    feedCtx.fill();

    feedCtx.fillStyle = "#121418";
    feedCtx.fillRect(w * 0.55, h * 0.76, 150, 58);
    feedCtx.strokeStyle = "rgba(170, 175, 185, 0.22)";
    feedCtx.lineWidth = 2;
    feedCtx.strokeRect(w * 0.55, h * 0.76, 150, 58);

    feedCtx.beginPath();
    feedCtx.arc(w * 0.78, h * 0.79, 22, 0, Math.PI * 2);
    feedCtx.fillStyle = "#101418";
    feedCtx.fill();
    feedCtx.stroke();

    feedCtx.fillStyle = "#0d1014";
    feedCtx.beginPath();
    feedCtx.ellipse(760, 360, 46, 70, -0.2, 0, Math.PI * 2);
    feedCtx.fill();
    feedCtx.fillRect(744, 390, 32, 80);

    const scanY = (t * 70) % h;
    const scan = feedCtx.createLinearGradient(0, scanY - 24, 0, scanY + 24);
    scan.addColorStop(0, "rgba(180, 185, 195, 0)");
    scan.addColorStop(0.5, "rgba(180, 185, 195, 0.06)");
    scan.addColorStop(1, "rgba(180, 185, 195, 0)");
    feedCtx.fillStyle = scan;
    feedCtx.fillRect(0, scanY - 24, w, 48);

    feedCtx.fillStyle = "rgba(255, 255, 255, 0.06)";
    for (let i = 0; i < 220; i += 1) {
      feedCtx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }

    const vignette = feedCtx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.25,
      w / 2,
      h / 2,
      h * 0.85
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.65)");
    feedCtx.fillStyle = vignette;
    feedCtx.fillRect(0, 0, w, h);

    feedCtx.restore();
  }

  let lastFrame = 0;

  function animate(time) {
    const live = cameraStage?.classList.contains("is-live");
    if (
      cameraWindow.classList.contains("open") &&
      !live &&
      time - lastFrame > 70
    ) {
      drawFeed(time);
      lastFrame = time;
    }
    requestAnimationFrame(animate);
  }

  drawFeed(0);
  requestAnimationFrame(animate);

  function openCamera() {
    if (messageText) {
      const escaped = CAMERA_MESSAGE
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    messageText.innerHTML = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    }

    if (typeof openWindow === "function") {
      openWindow(cameraWindow);
      if (messageWindow) {
        openWindow(messageWindow);
      }
    } else {
      cameraWindow.classList.add("open");
      if (messageWindow) {
        messageWindow.classList.add("open");
      }
    }

    if (messageWindow && !messageWindow.dataset.offsetPlaced) {
      const margin = 18;
      const left = Math.max(
        margin,
        window.innerWidth - messageWindow.offsetWidth - margin
      );
      const top = Math.max(72, Math.round(window.innerHeight * 0.16));
      messageWindow.style.left = `${left}px`;
      messageWindow.style.top = `${top}px`;
      messageWindow.dataset.offsetPlaced = "true";
    }

    startCamera();
  }

  const cameraVisibility = new MutationObserver(() => {
    if (cameraWindow.classList.contains("open")) {
      startCamera();
    } else {
      stopCamera();
    }
  });

  cameraVisibility.observe(cameraWindow, {
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("pagehide", stopCamera);

  window.openCamera = openCamera;
})();
