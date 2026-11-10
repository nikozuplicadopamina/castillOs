const bootScreen = document.getElementById("boot-screen");
const lockScreen = document.getElementById("lock-screen");
const pinInput = document.getElementById("lock-pin-input");
const lockError = document.getElementById("lock-error");
const lockTime = document.getElementById("lock-time");
const lockDate = document.getElementById("lock-date");

function updateLockClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  if (lockTime) lockTime.textContent = `${h}:${m}`;
  if (lockDate) {
    lockDate.textContent = now.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }
}

setTimeout(() => {
  if (bootScreen) bootScreen.classList.add("lock-hidden");
  if (lockScreen) lockScreen.classList.remove("lock-hidden");
  updateLockClock();
  if (pinInput) pinInput.focus();
}, 4000);

setInterval(updateLockClock, 1000);

if (pinInput) {
  function tryUnlock() {
    if (lockError) lockError.textContent = "";
    if (pinInput.value === "0911") {
      if (lockScreen) lockScreen.classList.add("lock-unlocking");
      setTimeout(() => {
        document.body.classList.add("unlocked");
        if (lockScreen) lockScreen.classList.add("lock-hidden");
      }, 600);
    } else {
      if (lockError) lockError.textContent = "PIN incorrecto";
      pinInput.value = "";
    }
  }

  pinInput.addEventListener("input", () => {
    if (lockError) lockError.textContent = "";
  });

  pinInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      tryUnlock();
    }
  });
}
