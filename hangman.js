(() => {
  const root = document.getElementById("hangman-window");
  if (!root) {
    return;
  }

  const wordEl = root.querySelector("#hangman-word");
  const keyboardEl = root.querySelector("#hangman-keyboard");
  const messageEl = root.querySelector("#hangman-message");
  const statusEl = root.querySelector("#hangman-status");
  const progressEl = root.querySelector("#hangman-progress");
  const restartBtn = root.querySelector("#hangman-restart");
  const parts = Array.from(root.querySelectorAll("#hangman-parts .part"));

  const RANDOM_WORDS = [
    "CASTILLO",
    "AMIGO",
    "REGALO",
    "FIESTA",
    "SORPRESA",
    "MUSICA",
    "AMOR",
    "ESTRELLA",
    "CORAZON",
    "ALEGRIA",
    "RECUERDO",
    "SONRISA",
    "FUTURO",
    "DESTINO",
    "VENTANA",
    "TECLADO",
    "PANTALLA",
    "RATON",
    "LIBRO",
    "CAMINO",
    "ESTACION",
    "CIUDAD",
    "MONTANA",
    "RIO",
    "BOSQUE",
    "PLAYA",
    "NUBE",
    "SOL",
    "LUNA",
    "ESTRELLA",
    "PLANETA",
    "GALAXIA",
    "UNIVERSO",
    "TIEMPO",
    "ESPACIO",
    "MEMORIA",
    "SILENCIO",
    "VOZ",
    "LUZ",
    "SOMBRA",
  ];

  const TOTAL_WORDS = 5;
  const MAX_MISTAKES = 6;
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // ====== EDITA AQUÍ EL MENSAJE FINAL ======
  const HANGMAN_MESSAGE = `si, este fue el ultimo miniregalitoxd

  perdon por tan corta experiencia, se que talves se merecia más, pero aun queda algo por dar...
  command: giftFinale`

  let words = [];
  let currentIndex = 0;
  let currentWord = "";
  let guessed = new Set();
  let mistakes = 0;
  let locked = false;

  function randomWord() {
    return RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
  }

  function buildWords() {
    words = [];

    for (let i = 0; i < TOTAL_WORDS - 1; i += 1) {
      words.push(randomWord());
    }

    words.push("CUMPLE");
  }

  function setMessage(text) {
    if (messageEl) {
      messageEl.textContent = text;
    }
  }

  function renderWord() {
    if (!wordEl) {
      return;
    }

    wordEl.replaceChildren();

    for (const letter of currentWord) {
      const span = document.createElement("span");
      span.className = "hangman-letter";
      span.textContent = guessed.has(letter) ? letter : "";
      wordEl.appendChild(span);
    }
  }

  function renderParts() {
    parts.forEach((part, index) => {
      part.classList.toggle("is-visible", index < mistakes);
    });
  }

  function renderKeyboard() {
    if (!keyboardEl) {
      return;
    }

    keyboardEl.replaceChildren();

    for (const letter of ALPHABET) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hangman-key";
      button.textContent = letter;

      if (guessed.has(letter)) {
        button.disabled = true;
        button.classList.add(
          currentWord.includes(letter) ? "is-right" : "is-wrong"
        );
      }

      button.addEventListener("click", () => guess(letter));
      keyboardEl.appendChild(button);
    }
  }

  function updateStatus() {
    if (statusEl) {
      statusEl.textContent = `Adivina la palabra ${currentIndex + 1}`;
    }

    if (progressEl) {
      progressEl.textContent = `Palabra ${currentIndex + 1} de ${TOTAL_WORDS}`;
    }
  }

  function isWordComplete() {
    return [...currentWord].every((letter) => guessed.has(letter));
  }

  function nextWord() {
    currentIndex += 1;

    if (currentIndex >= words.length) {
      locked = true;
      if (statusEl) {
        statusEl.textContent = "¡Ganaste!";
      }
      setMessage("Has adivinado las 5 palabras.");

      const resultWindow = document.getElementById("hangman-result-window");
      const resultText = document.getElementById("hangman-result-text");
      if (resultText) {
        resultText.textContent = HANGMAN_MESSAGE;
      }
      if (resultWindow && typeof openWindow === "function") {
        openWindow(resultWindow);
      } else if (resultWindow) {
        resultWindow.classList.add("open");
      }
      return;
    }

    currentWord = words[currentIndex];
    guessed = new Set();
    mistakes = 0;
    locked = false;

    renderWord();
    renderParts();
    renderKeyboard();
    updateStatus();
    setMessage("Nueva palabra. ¡Sigue así!");
  }

  function guess(letter) {
    if (locked || guessed.has(letter)) {
      return;
    }

    guessed.add(letter);

    if (currentWord.includes(letter)) {
      renderWord();
      renderKeyboard();

      if (isWordComplete()) {
        locked = true;
        setMessage("¡Palabra correcta!");

        window.setTimeout(() => {
          nextWord();
        }, 900);
      } else {
        setMessage("Bien. Sigue adivinando.");
      }
    } else {
      mistakes = Math.min(mistakes + 1, MAX_MISTAKES);
      renderParts();
      renderKeyboard();

      if (mistakes >= MAX_MISTAKES) {
        locked = true;
        setMessage(`Perdiste. La palabra era: ${currentWord}`);

        window.setTimeout(() => {
          resetGame();
        }, 1800);
      } else {
        setMessage(`Te quedan ${MAX_MISTAKES - mistakes} intentos.`);
      }
    }
  }

  function resetGame() {
    buildWords();
    currentIndex = 0;
    currentWord = words[0];
    guessed = new Set();
    mistakes = 0;
    locked = false;

    renderWord();
    renderParts();
    renderKeyboard();
    updateStatus();
    setMessage("Adivina la palabra.");
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", resetGame);
  }

  resetGame();
})();
