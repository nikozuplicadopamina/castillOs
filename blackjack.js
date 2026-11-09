(() => {
  const root = document.getElementById("blackjack-window");
  if (!root) {
    return;
  }

  const dealerHandEl = root.querySelector("#bj-dealer-hand");
  const playerHandEl = root.querySelector("#bj-player-hand");
  const dealerScoreEl = root.querySelector("#bj-dealer-score");
  const playerScoreEl = root.querySelector("#bj-player-score");
  const messageEl = root.querySelector("#bj-message");
  const chipsEl = root.querySelector("#bj-chips");
  const betEl = root.querySelector("#bj-bet");
  const dealBtn = root.querySelector("#bj-deal");
  const hitBtn = root.querySelector("#bj-hit");
  const standBtn = root.querySelector("#bj-stand");
  const doubleBtn = root.querySelector("#bj-double");
  const resetBtn = root.querySelector("#bj-reset");
  const betButtons = Array.from(root.querySelectorAll("[data-bet]"));
  const confettiEl = root.querySelector("#bj-confetti");
  const shopEl = root.querySelector("#bj-shop");
  const shopToggleBtn = root.querySelector("#bj-shop-toggle");
  const shopCloseBtn = root.querySelector("#bj-shop-close");
  const shopStatusEl = root.querySelector("#bj-shop-status");
  const buyLuckBtn = root.querySelector("#bj-buy-luck");
  const buyShieldBtn = root.querySelector("#bj-buy-shield");
  const buyTicketBtn = root.querySelector("#bj-buy-ticket");
  const rewardWindow = document.getElementById("blackjack-reward-window");
  const rewardLink = document.getElementById("bj-reward-link");

  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const START_CHIPS = 100;
  const DEALER_STAND = 17;
  const SHOP_COSTS = { luck: 25, shield: 35, ticket: 200 };
  const REWARD_URL = "page.html";

  let chips = START_CHIPS;
  let bet = 10;
  let deck = [];
  let playerHand = [];
  let dealerHand = [];
  let phase = "betting";
  let dealerHidden = false;
  let currentBet = 0;
  let canDouble = false;
  let dealerTimer = null;
  let luckActive = false;
  let shieldActive = false;

  function buildDeck() {
    deck = [];

    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit });
      }
    }

    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  function drawCard() {
    if (deck.length === 0) {
      buildDeck();
    }

    return deck.pop();
  }

  function cardValue(card) {
    if (card.rank === "A") {
      return 11;
    }

    if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
      return 10;
    }

    return Number(card.rank);
  }

  function handValue(hand) {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      total += cardValue(card);
      if (card.rank === "A") {
        aces += 1;
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  }

  function isBlackjack(hand) {
    return hand.length === 2 && handValue(hand) === 21;
  }

  function makeCardElement(card, hidden) {
    const cardEl = document.createElement("div");
    cardEl.className = "bj-card";

    if (hidden) {
      cardEl.classList.add("bj-card--back");
      cardEl.setAttribute("aria-label", "Carta oculta");
      return cardEl;
    }

    const red = card.suit === "♥" || card.suit === "♦";
    cardEl.classList.add(red ? "bj-card--red" : "bj-card--black");
    cardEl.setAttribute("aria-label", `${card.rank} de ${card.suit}`);

    const top = document.createElement("span");
    top.className = "bj-corner";
    top.textContent = card.rank;

    const topSuit = document.createElement("span");
    topSuit.textContent = card.suit;
    top.append(topSuit);

    const center = document.createElement("span");
    center.className = "bj-suit";
    center.textContent = card.suit;

    const bottom = document.createElement("span");
    bottom.className = "bj-corner bj-corner--bottom";
    bottom.textContent = card.rank;

    const bottomSuit = document.createElement("span");
    bottomSuit.textContent = card.suit;
    bottom.append(bottomSuit);

    cardEl.append(top, center, bottom);
    return cardEl;
  }

  function renderHand(container, hand, hideSecond) {
    container.replaceChildren();

    hand.forEach((card, index) => {
      container.appendChild(makeCardElement(card, hideSecond && index === 1));
    });
  }

  function updateControls() {
    const canBet = phase === "betting" || phase === "roundOver";

    betButtons.forEach((button) => {
      const value = Number(button.dataset.bet);
      button.disabled = !canBet || chips < value;
      button.classList.toggle("bj-btn--selected", value === bet);
    });

    dealBtn.disabled = !(canBet && chips >= bet && bet > 0);
    dealBtn.textContent = phase === "roundOver" ? "OTRA MANO" : "REPARTIR";
    hitBtn.disabled = phase !== "player";
    standBtn.disabled = phase !== "player";
    doubleBtn.disabled = !(
      phase === "player" &&
      canDouble &&
      playerHand.length === 2 &&
      chips >= currentBet
    );
  }

  function render() {
    renderHand(dealerHandEl, dealerHand, dealerHidden);
    renderHand(playerHandEl, playerHand, false);

    dealerScoreEl.textContent = dealerHand.length
      ? dealerHidden
        ? "?"
        : String(handValue(dealerHand))
      : "—";
    playerScoreEl.textContent = playerHand.length ? String(handValue(playerHand)) : "—";

    chipsEl.textContent = `Caramelos: ${chips}`;
    betEl.textContent = `Apuesta: ${
      phase === "player" || phase === "dealer" ? currentBet : bet
    }`;
    updateControls();
    updateShop();
  }

  function canShop() {
    return phase === "betting" || phase === "roundOver";
  }

  function setShopOpen(open) {
    if (!shopEl) {
      return;
    }

    shopEl.classList.toggle("is-open", open);
    if (shopToggleBtn) {
      shopToggleBtn.textContent = open ? "CERRAR TIENDA" : "TIENDA";
    }
  }

  function updateShopButton(button, active, cost) {
    if (!button) {
      return;
    }

    const affordable = chips >= cost;
    const shopping = canShop();

    button.disabled = !shopping || active || !affordable;

    if (active) {
      button.textContent = "ACTIVO";
    } else if (!affordable) {
      button.textContent = "SIN SALDO";
    } else if (!shopping) {
      button.textContent = "EN JUEGO";
    } else {
      button.textContent = "COMPRAR";
    }
  }

  function updateShop() {
    updateShopButton(buyLuckBtn, luckActive, SHOP_COSTS.luck);
    updateShopButton(buyShieldBtn, shieldActive, SHOP_COSTS.shield);
    updateShopButton(buyTicketBtn, false, SHOP_COSTS.ticket);

    if (shopStatusEl) {
      const effects = [];
      if (luckActive) {
        effects.push("Poción activa");
      }
      if (shieldActive) {
        effects.push("Escudo activo");
      }
      shopStatusEl.textContent = effects.length
        ? effects.join(" · ")
        : "Sin efectos activos.";
    }
  }

  function buyLuck() {
    if (!canShop() || luckActive || chips < SHOP_COSTS.luck) {
      return;
    }

    chips -= SHOP_COSTS.luck;
    luckActive = true;
    setMessage("Poción de suerte activa: la próxima mano ganadora paga el doble.");
    render();
  }

  function buyShield() {
    if (!canShop() || shieldActive || chips < SHOP_COSTS.shield) {
      return;
    }

    chips -= SHOP_COSTS.shield;
    shieldActive = true;
    setMessage("Escudo activo: la próxima mano perdida te devolverá la apuesta.");
    render();
  }

  function buyTicket() {
    if (!canShop() || chips < SHOP_COSTS.ticket) {
      return;
    }

    chips -= SHOP_COSTS.ticket;
    setMessage("Boleto dorado canjeado. Abriendo premio...");
    render();
    setShopOpen(false);

    if (rewardWindow) {
      if (typeof openWindow === "function") {
        openWindow(rewardWindow);
      } else {
        rewardWindow.classList.add("open");
      }
    }
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function launchConfetti() {
    confettiEl.replaceChildren();
    const colors = ["#e0245e", "#ffd86b", "#4cc2ff", "#56e07e", "#ff9f1c", "#ffffff"];

    for (let i = 0; i < 42; i += 1) {
      const piece = document.createElement("span");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--bj-color", colors[i % colors.length]);
      piece.style.setProperty("--bj-delay", `${Math.random() * 0.5}s`);
      piece.style.setProperty("--bj-duration", `${1.4 + Math.random() * 1.2}s`);
      confettiEl.appendChild(piece);
    }

    window.setTimeout(() => confettiEl.replaceChildren(), 3200);
  }

  function finishRound(result, text) {
    if (dealerTimer) {
      window.clearTimeout(dealerTimer);
      dealerTimer = null;
    }

    phase = "roundOver";
    dealerHidden = false;
    canDouble = false;

    if (result === "blackjack" || result === "win") {
      const baseWinnings =
        result === "blackjack" ? Math.round(currentBet * 1.5) : currentBet;
      let winnings = baseWinnings;
      let bonusText = "";

      if (luckActive) {
        winnings *= 2;
        luckActive = false;
        bonusText = " La poción de suerte duplicó tus ganancias.";
      }

      chips += currentBet + winnings;
      setMessage(`${text} +${winnings} caramelos.${bonusText}`);
      launchConfetti();
    } else if (result === "push") {
      chips += currentBet;
      setMessage(text);
    } else {
      let shieldText = "";

      if (shieldActive) {
        chips += currentBet;
        shieldActive = false;
        shieldText = " El escudo te devolvió la apuesta.";
      }

      setMessage(`${text}${shieldText} Te quedan ${chips} caramelos.`);
    }

    render();
  }

  function finishByComparison() {
    const playerTotal = handValue(playerHand);
    const dealerTotal = handValue(dealerHand);

    if (dealerTotal > 21) {
      finishRound("win", `La banca se pasó con ${dealerTotal}. ¡Ganaste!`);
    } else if (playerTotal > dealerTotal) {
      finishRound("win", `¡Ganaste! ${playerTotal} contra ${dealerTotal}.`);
    } else if (playerTotal === dealerTotal) {
      finishRound("push", `Empate a ${playerTotal}. Recuperas tu apuesta.`);
    } else {
      finishRound("lose", `La banca gana con ${dealerTotal} contra ${playerTotal}.`);
    }
  }

  function dealerStep() {
    if (phase !== "dealer") {
      return;
    }

    if (handValue(dealerHand) < DEALER_STAND) {
      dealerHand.push(drawCard());
      render();
      dealerTimer = window.setTimeout(dealerStep, 650);
      return;
    }

    finishByComparison();
  }

  function stand() {
    if (phase !== "player") {
      return;
    }

    phase = "dealer";
    dealerHidden = false;
    canDouble = false;
    setMessage("Turno de la banca...");
    render();
    dealerTimer = window.setTimeout(dealerStep, 550);
  }

  function hit() {
    if (phase !== "player") {
      return;
    }

    canDouble = false;
    playerHand.push(drawCard());
    const total = handValue(playerHand);

    if (total > 21) {
      finishRound("bust", "Te pasaste de 21. La banca gana esta mano.");
      return;
    }

    if (total === 21) {
      setMessage("21 exacto. La banca juega...");
      render();
      stand();
      return;
    }

    setMessage("Pide otra carta o plántate.");
    render();
  }

  function doubleDown() {
    if (
      phase !== "player" ||
      !canDouble ||
      playerHand.length !== 2 ||
      chips < currentBet
    ) {
      return;
    }

    chips -= currentBet;
    currentBet *= 2;
    canDouble = false;
    playerHand.push(drawCard());

    if (handValue(playerHand) > 21) {
      finishRound("bust", "Doblaste y te pasaste de 21. La banca gana.");
      return;
    }

    setMessage("Doblaste tu apuesta. La banca juega...");
    render();
    stand();
  }

  function startRound() {
    if (dealerTimer) {
      window.clearTimeout(dealerTimer);
      dealerTimer = null;
    }

    setShopOpen(false);

    if (chips < bet) {
      setMessage("No tienes caramelos suficientes. Baja la apuesta o reinicia.");
      render();
      return;
    }

    if (deck.length < 15) {
      buildDeck();
    }

    phase = "player";
    dealerHidden = true;
    currentBet = bet;
    canDouble = true;
    chips -= currentBet;
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];

    if (isBlackjack(playerHand)) {
      dealerHidden = false;

      if (isBlackjack(dealerHand)) {
        finishRound("push", "Empate con blackjack. Recuperas tu apuesta.");
      } else {
        finishRound("blackjack", "¡BLACKJACK! Doble celebración y pago 3:2.");
      }
      return;
    }

    setMessage("Tu turno: pide carta o plántate.");
    render();
  }

  function resetGame() {
    if (dealerTimer) {
      window.clearTimeout(dealerTimer);
      dealerTimer = null;
    }

    chips = START_CHIPS;
    bet = 10;
    deck = [];
    playerHand = [];
    dealerHand = [];
    phase = "betting";
    dealerHidden = false;
    currentBet = 0;
    canDouble = false;
    luckActive = false;
    shieldActive = false;
    setShopOpen(false);
    confettiEl.replaceChildren();
    setMessage("Juego reiniciado. Elige tu apuesta y pulsa REPARTIR.");
    render();
  }

  betButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (phase !== "betting" && phase !== "roundOver") {
        return;
      }

      const value = Number(button.dataset.bet);
      if (chips < value) {
        return;
      }

      bet = value;
      setMessage(`Apuesta ajustada a ${bet} caramelos.`);
      render();
    });
  });

  dealBtn.addEventListener("click", startRound);
  hitBtn.addEventListener("click", hit);
  standBtn.addEventListener("click", stand);
  doubleBtn.addEventListener("click", doubleDown);
  resetBtn.addEventListener("click", resetGame);

  if (shopToggleBtn && shopEl) {
    shopToggleBtn.addEventListener("click", () => {
      setShopOpen(!shopEl.classList.contains("is-open"));
    });
  }

  if (shopCloseBtn) {
    shopCloseBtn.addEventListener("click", () => setShopOpen(false));
  }

  if (buyLuckBtn) {
    buyLuckBtn.addEventListener("click", buyLuck);
  }

  if (buyShieldBtn) {
    buyShieldBtn.addEventListener("click", buyShield);
  }

  if (buyTicketBtn) {
    buyTicketBtn.addEventListener("click", buyTicket);
  }

  if (rewardLink) {
    rewardLink.href = REWARD_URL;
  }

  render();
})();
