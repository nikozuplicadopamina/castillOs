const timeEl = document.querySelector(".clock .time");
const dateEl = document.querySelector(".clock .date");

let lastDate = "";

function updateClock() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  if (date !== lastDate) {
    dateEl.textContent = date;
    lastDate = date;
  }
}

function scheduleClock() {
  updateClock();
  const now = new Date();
  const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
  window.setTimeout(scheduleClock, Math.max(250, delay));
}

scheduleClock();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateClock();
  }
});

const batteryIcon = document.querySelector(".battery-icon");
const batteryFill = document.querySelector(".battery-fill");
const systemTray = document.querySelector(".system-tray");
const batteryState = { level: 1, charging: false };

function paintBattery(level, charging) {
  const value = Math.min(1, Math.max(0, level));
  batteryState.level = value;
  batteryState.charging = charging;
  batteryFill.setAttribute("width", (10 * value).toFixed(2));
  batteryIcon.classList.toggle("charging", charging);
  batteryIcon.classList.toggle("low", !charging && value <= 0.2);
  systemTray.setAttribute(
    "aria-label",
    `Red, sonido y batería: ${Math.round(value * 100)}%${charging ? ", cargando" : ""}`
  );
}

async function initBattery() {
  if (!navigator.getBattery) {
    return;
  }

  try {
    const battery = await navigator.getBattery();
    const update = () => paintBattery(battery.level, battery.charging);

    update();
    battery.addEventListener("levelchange", update);
    battery.addEventListener("chargingchange", update);
  } catch {
    paintBattery(1, false);
  }
}

initBattery();

const networkIcon = document.querySelector(".network-icon");
const connection =
  navigator.connection ||
  navigator.mozConnection ||
  navigator.webkitConnection;

function paintNetwork() {
  let state = "wifi";

  if (!navigator.onLine) {
    state = "offline";
  } else if (connection && connection.type === "ethernet") {
    state = "ethernet";
  } else if (connection && connection.type === "none") {
    state = "offline";
  }

  networkIcon.classList.toggle("wifi", state === "wifi");
  networkIcon.classList.toggle("ethernet", state === "ethernet");
  networkIcon.classList.toggle("offline", state === "offline");
}

paintNetwork();
window.addEventListener("online", paintNetwork);
window.addEventListener("offline", paintNetwork);

if (connection && connection.addEventListener) {
  connection.addEventListener("change", paintNetwork);
}

const NOTES_KEY = "castillOs.notes";
const NOTES_VERSION_KEY = "castillOs.notesVersion";
const NOTES_VERSION = 2;
const DEFAULT_NOTES = `Este es un pequeño regalito...

Hoy es una fecha linda andresitow, x eso celebro con este regalo q le hice, espero lo disfrute :))`;

const commandConfig = Array.isArray(window.CASTILLOS_COMMANDS)
  ? window.CASTILLOS_COMMANDS
  : [];
const commandMap = new Map();

for (const command of commandConfig) {
  if (!command || !Array.isArray(command.names)) {
    continue;
  }
  for (const name of command.names) {
    commandMap.set(String(name).toLowerCase(), command);
  }
}

const terminalWindow = document.getElementById("terminal-window");
const notepadWindow = document.getElementById("notepad-window");
const blackjackWindow = document.getElementById("blackjack-window");
const terminalOutput = terminalWindow.querySelector(".terminal-output");
const terminalForm = terminalWindow.querySelector(".terminal-input-row");
const terminalInput = terminalWindow.querySelector(".terminal-input");
const notepadText = notepadWindow.querySelector(".notepad-text");
const notepadCount = notepadWindow.querySelector(".notepad-count");

const commandHistory = [];
let historyIndex = 0;
let topZ = 10;
let activeWindow = null;

function buildHelp() {
  const lines = ["Comandos de la terminal", "=======================", ""];

  for (const command of commandConfig) {
    if (!command || command.hidden || !Array.isArray(command.names)) {
      continue;
    }
    const usage = command.usage || command.names[0] || "(sin nombre)";
    const description = command.description || "";
    lines.push(`${usage.padEnd(20)}${description}`.trimEnd());
  }


  return lines.join("\n");
}

function getNotes() {
  try {
    const version = localStorage.getItem(NOTES_VERSION_KEY);
    if (version !== String(NOTES_VERSION)) {
      localStorage.removeItem(NOTES_KEY);
      localStorage.setItem(NOTES_VERSION_KEY, String(NOTES_VERSION));
      return DEFAULT_NOTES;
    }

    const saved = localStorage.getItem(NOTES_KEY);
    return saved === null ? DEFAULT_NOTES : saved;
  } catch {
    return DEFAULT_NOTES;
  }
}

function appNameForWindow(win) {
  return win.id.replace("-window", "");
}

function setTaskbarApp(app, visible) {
  const button = document.querySelector(`.taskbar-app[data-app="${app}"]`);
  if (button) {
    button.classList.toggle("is-visible", visible);
  }
}

function updateTaskbarActive() {
  document.querySelectorAll(".taskbar-app").forEach((button) => {
    const win = document.getElementById(`${button.dataset.app}-window`);
    button.classList.toggle(
      "active",
      Boolean(win && win === activeWindow && win.classList.contains("open"))
    );
  });
}

function focusWindow(win) {
  win.style.zIndex = String(++topZ);
  activeWindow = win;
  updateTaskbarActive();
}

function openWindow(win) {
  if (!win.classList.contains("open")) {
    win.classList.add("open");
    if (!win.dataset.placed) {
      const rect = win.getBoundingClientRect();
      const left = Math.max(12, (window.innerWidth - rect.width) / 2);
      const top = Math.max(12, (window.innerHeight - rect.height - 48) / 2);
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
      win.dataset.placed = "true";
    }
  }

  setTaskbarApp(appNameForWindow(win), true);
  focusWindow(win);

  if (win === terminalWindow) {
    terminalInput.focus();
  } else if (win === notepadWindow) {
    notepadText.focus();
  }
}

function makeDraggable(win) {
  const bar = win.querySelector(".window-titlebar");
  let drag = null;
  let frame = 0;

  const applyDrag = () => {
    frame = 0;
    if (!drag) {
      return;
    }

    const maxLeft = Math.max(0, window.innerWidth - drag.width);
    const maxTop = Math.max(0, window.innerHeight - 48 - drag.height);
    const left = Math.min(Math.max(0, drag.startLeft + drag.dx), maxLeft);
    const top = Math.min(Math.max(0, drag.startTop + drag.dy), maxTop);
    drag.left = left;
    drag.top = top;
    win.style.transform = `translate3d(${left - drag.startLeft}px, ${top - drag.startTop}px, 0)`;
  };

  const stopDragging = () => {
    if (!drag) {
      return;
    }

    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      applyDrag();
    }

    win.style.left = `${drag.left}px`;
    win.style.top = `${drag.top}px`;
    win.style.transform = "";
    win.classList.remove("is-dragging");
    document.body.classList.remove("is-dragging-window");
    drag = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", stopDragging);
    window.removeEventListener("blur", stopDragging);
  };

  const onPointerMove = (event) => {
    if (!drag) {
      return;
    }

    if (event.pointerType === "mouse" && event.buttons === 0) {
      stopDragging();
      return;
    }

    drag.dx = event.clientX - drag.pointerX;
    drag.dy = event.clientY - drag.pointerY;
    if (!frame) {
      frame = requestAnimationFrame(applyDrag);
    }
  };

  bar.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (event.target.closest(".window-controls") || win.classList.contains("maximized")) {
      return;
    }

    const rect = win.getBoundingClientRect();
    drag = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      dx: 0,
      dy: 0,
      startLeft: rect.left,
      startTop: rect.top,
      left: rect.left,
      top: rect.top,
      width: win.offsetWidth,
      height: win.offsetHeight,
    };

    focusWindow(win);
    win.classList.add("is-dragging");
    document.body.classList.add("is-dragging-window");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("blur", stopDragging);
    event.preventDefault();
  });
}

window.makeDraggable = makeDraggable;

document.querySelectorAll(".window").forEach((win) => {
  makeDraggable(win);
  win.addEventListener("pointerdown", () => focusWindow(win));

  win.querySelector(".win-minimize").addEventListener("click", () => {
    win.classList.remove("open");
    if (activeWindow === win) {
      activeWindow = null;
      updateTaskbarActive();
    }
  });

  win.querySelector(".win-maximize").addEventListener("click", () => {
    win.classList.toggle("maximized");
  });

  win.querySelector(".win-close").addEventListener("click", () => {
    win.classList.remove("open");
    win.classList.remove("maximized");
    setTaskbarApp(appNameForWindow(win), false);
    if (activeWindow === win) {
      activeWindow = null;
      updateTaskbarActive();
    }
  });
});

document.querySelectorAll(".desktop-icon").forEach((icon) => {
  const target = document.getElementById(`${icon.dataset.app}-window`);
  const launch = () => {
    if (target) {
      openWindow(target);
    }
  };

  icon.addEventListener("dblclick", launch);
  icon.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      launch();
    }
  });
});

document.querySelectorAll(".taskbar-app").forEach((button) => {
  const win = document.getElementById(`${button.dataset.app}-window`);
  if (!win) {
    return;
  }

  button.addEventListener("click", () => {
    if (win.classList.contains("open") && activeWindow === win) {
      win.classList.remove("open");
      activeWindow = null;
      updateTaskbarActive();
    } else {
      openWindow(win);
    }
  });
});

function printTerminal(text, className = "") {
  const line = document.createElement("div");
  line.className = `terminal-line${className ? ` ${className}` : ""}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function handleCommandError(command, error) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  printTerminal(`Error al ejecutar '${command}': ${message}`, "error");
}

function runCommand(raw) {
  const input = raw.trim();
  if (!input) {
    return;
  }

  printTerminal(`C:\\Users\\usuario> ${input}`, "echo");

  const [command, ...args] = input.split(/\s+/);
  const rest = input.slice(command.length).trim();
  const entry = commandMap.get(command.toLowerCase());

  if (!entry) {
    printTerminal(`'${command}' no se reconoce como comando. Escribe 'help'.`, "error");
    return;
  }

  if (typeof entry.run !== "function") {
    printTerminal(`El comando '${command}' no tiene una función run().`, "error");
    return;
  }

  try {
    const result = entry.run({
      command: command.toLowerCase(),
      args,
      rest,
      input,
      print: printTerminal,
      open: openWindow,
      help: buildHelp,
      notes: getNotes,
      commands: commandConfig,
      terminal: terminalOutput,
      windows: {
        terminal: terminalWindow,
        notepad: notepadWindow,
        blackjack: blackjackWindow,
        snake: document.getElementById("snake-window"),
        snakeResult: document.getElementById("snake-result-window"),
        hangman: document.getElementById("hangman-window"),
        music: document.getElementById("music-window"),
      },
      battery: batteryState,
    });

    if (result && typeof result.then === "function") {
      result.catch((error) => handleCommandError(command, error));
    }
  } catch (error) {
    handleCommandError(command, error);
  }
}

terminalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = terminalInput.value;
  terminalInput.value = "";

  if (value.trim()) {
    commandHistory.push(value);
    historyIndex = commandHistory.length;
  }

  runCommand(value);
});

terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (historyIndex > 0) {
      historyIndex -= 1;
      terminalInput.value = commandHistory[historyIndex];
    }
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex += 1;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = "";
    }
  }
});

notepadText.value = getNotes();

function updateNotepadCount() {
  notepadCount.textContent = `${notepadText.value.length} caracteres`;
}

updateNotepadCount();

notepadText.addEventListener("input", () => {
  try {
    localStorage.setItem(NOTES_KEY, notepadText.value);
  } catch {}
  updateNotepadCount();
});

if (commandConfig.length === 0) {
  printTerminal("No se pudieron cargar los comandos. Revisa commands.js.", "error");
}

printTerminal("castillOs 1.0 — escribe 'help' para ver los comandos.", "accent");
