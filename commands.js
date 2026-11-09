window.CASTILLOS_COMMANDS = [
  {
    names: ["help"],
    description: "Muestra esta lista de comandos",
    usage: "help",
    run({ print, help }) {
      print(help());
    },
  },
  {
    names: ["echo"],
    description: "Imprime el texto",
    usage: "echo <texto>",
    run({ rest, print }) {
      print(rest);
    },
  },
  {
    names: ["clear", "cls"],
    description: "Limpia la pantalla",
    usage: "clear / cls",
    run({ terminal }) {
      terminal.replaceChildren();
    },
  },
  {
    names: ["whoami"],
    description: "Muestra el usuario",
    usage: "whoami",
    run({ print }) {
      print("usuario");
    },
  },


  {
    hidden: true,
    names: ["blackjack", "bj"],
    description: "Abre el Blackjack de fiesta",
    usage: "blackjack / bj",
    run({ open, print, windows }) {
      open(windows.blackjack);
      print("Abriendo Blackjack de fiesta...", "accent");
    },
  },
  {
    names: ["ver"],
    description: "Muestra la versión del sistema",
    usage: "ver",
    run({ print }) {
      print("castillOs 1.0");
    },
  },
  {
    names: ["about"],
    description: "Información del sistema",
    usage: "about",
    run({ print }) {
      print("castillOs — escritorio web con estética Windows 11.");
    },
  },
  {
    names: ["saludo"],
    description: "Saluda a la persona indicada",
    usage: "saludo <nombre>",
    run({ args, print }) {
      const name = args.join(" ") || "usuario";
      print(`Hola ${name}, bienvenido a castillOs.`);
    },
  },
  {
    names: ["snake"],
    description: "Abre el Snake",
    usage: "snake",
    run({ open, print, windows }) {
      open(windows.snake);
      print("Abriendo Snake ASCII...", "accent");
      print("SNAKE! Primer regalo")
    },
  },
  {
    hidden: true,
    names: ["camera", "camara"],
    description: "Abre la cámara y su mensaje",
    usage: "camera / camara",
    run({ print }) {
      if (typeof window.openCamera === "function") {
        window.openCamera();
        print("Abriendo cámara simulada...", "accent");
      } else {
        print("No se pudo abrir la cámara.", "error");
      }
    },
  },
  {
    hidden: true,
    names: ["hangman", "ahorcado"],
    description: "Abre el Ahorcado",
    usage: "hangman / ahorcado",
    run({ open, print, windows }) {
      open(windows.hangman);
      print("Abriendo Ahorcado...", "accent");
    },
  },
  {
    hidden: true,
    names: ["giftfinale"],
    description: "Mensaje final y reproductor MP3",
    usage: "giftfinale",
    run({ print }) {
      window.setTimeout(() => {
        print("preparate para lo que sigue", "accent");

        window.setTimeout(() => {
          print("3", "accent");

          window.setTimeout(() => {
            print("2", "accent");

            window.setTimeout(() => {
              print("1", "accent");

              window.setTimeout(() => {
                if (typeof window.openMusic === "function") {
                  window.openMusic();
                } else if (windows.music) {
                  open(windows.music);
                }

                const letterWindow = document.getElementById("letter-window");
                if (letterWindow) {
                  if (typeof openWindow === "function") {
                    openWindow(letterWindow);
                  } else {
                    letterWindow.classList.add("open");
                  }
                }

                print("Reproduciendo inu(D) - Pac0o.mp3", "accent");
              }, 500);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 500);
    },
  },
  {
    names: ["exit"],
    description: "Cierra la terminal",
    usage: "exit",
    run({ windows }) {
      windows.terminal.classList.remove("open");
    },
  },
];
