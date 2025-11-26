// Chave usada no localStorage
const STORAGE_KEY = "rankingErikaVinicius_v1";

function getInitialState() {
  return {
    weeks: [], // [{ weekLabel: "Semana 1 (01/01/2025)", winner: "erika" }, ...]
    totals: {
      erika: 0,
      vinicius: 0,
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed.weeks || !parsed.totals) return getInitialState();
    return parsed;
  } catch (e) {
    console.error("Erro ao carregar estado:", e);
    return getInitialState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function computeLeaderText(state) {
  const e = state.totals.erika;
  const v = state.totals.vinicius;

  if (e === 0 && v === 0) {
    return "Ninguém venceu ainda. Comecem a registrar as semanas! 🏁";
  }

  if (e === v) {
    return `Empate! Ambos têm ${e} vitória(s). ⚖️`;
  }

  const leader = e > v ? "Érika" : "Vinícius";
  const diff = Math.abs(e - v);
  const emoji = e > v ? "🔥" : "🔥";

  return `${leader} está na frente por ${diff} vitória(s)! ${emoji}`;
}

function render(state) {
  const scoreErika = document.getElementById("score-erika");
  const scoreVinicius = document.getElementById("score-vinicius");
  const leaderText = document.getElementById("leader-text");
  const weeksList = document.getElementById("weeks-list");

  const cardErika = document.getElementById("card-erika");
  const cardVinicius = document.getElementById("card-vinicius");

  scoreErika.textContent = state.totals.erika;
  scoreVinicius.textContent = state.totals.vinicius;
  leaderText.textContent = computeLeaderText(state);

  // Limpar classes de líder
  cardErika.classList.remove("is-leading");
  cardVinicius.classList.remove("is-leading");

  // Destacar quem está na frente
  const e = state.totals.erika;
  const v = state.totals.vinicius;
  if (e > v) {
    cardErika.classList.add("is-leading");
  } else if (v > e) {
    cardVinicius.classList.add("is-leading");
  }

  // Atualizar lista de semanas
  weeksList.innerHTML = "";
  if (state.weeks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nenhuma semana registrada ainda.";
    weeksList.appendChild(li);
  } else {
    state.weeks.forEach((w, idx) => {
      const li = document.createElement("li");

      const spanWeek = document.createElement("span");
      spanWeek.className = "week";
      spanWeek.textContent = `${idx + 1}. ${w.weekLabel}`;

      const spanWinner = document.createElement("span");
      spanWinner.className =
        w.winner === "erika" ? "winner-erika" : "winner-vinicius";
      spanWinner.textContent =
        w.winner === "erika" ? "Érika 🏅" : "Vinícius 🏅";

      li.appendChild(spanWeek);
      li.appendChild(spanWinner);
      weeksList.appendChild(li);
    });
  }
}

function registerWinner(winnerKey) {
  const state = loadState();

  const nextWeekNumber = state.weeks.length + 1;
  const todayStr = new Date().toLocaleDateString("pt-BR");
  const weekLabel = `Semana ${nextWeekNumber} (${todayStr})`;

  state.weeks.push({
    weekLabel,
    winner: winnerKey,
  });

  state.totals[winnerKey] += 1;

  saveState(state);
  render(state);
}

function undoLastWeek() {
  const state = loadState();
  if (state.weeks.length === 0) {
    showToast("Não há semanas para desfazer.");
    return;
  }

  const last = state.weeks[state.weeks.length - 1];
  if (last.winner === "erika") {
    state.totals.erika = Math.max(0, state.totals.erika - 1);
  } else if (last.winner === "vinicius") {
    state.totals.vinicius = Math.max(0, state.totals.vinicius - 1);
  }

  state.weeks.pop();
  saveState(state);
  render(state);
  showToast("Última semana desfeita.");
}

function resetAll() {
  const sure = confirm(
    "Tem certeza que deseja apagar TODO o histórico e zerar o placar?"
  );
  if (!sure) return;

  const state = getInitialState();
  saveState(state);
  render(state);
  showToast("Placar zerado, nova era começa agora.");
}

/* Toast genérico */
let toastTimeout = null;
function showToast(message, duration = 2500) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, duration);
}

/* Popup especial da Érika */
function openErikaConfirmModal() {
  const overlay = document.getElementById("confirm-overlay");
  overlay.classList.remove("hidden");
}

function closeErikaConfirmModal() {
  const overlay = document.getElementById("confirm-overlay");
  overlay.classList.add("hidden");
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  const btnErika = document.getElementById("btn-erika");
  const btnVinicius = document.getElementById("btn-vinicius");
  const btnUndo = document.getElementById("btn-undo");
  const btnReset = document.getElementById("btn-reset");

  const btnConfirmErika = document.getElementById("confirm-erika");
  const btnCancelErika = document.getElementById("cancel-erika");

  // Clique na Érika -> abre modal de confirmação
  btnErika.addEventListener("click", () => {
    openErikaConfirmModal();
  });

  // Confirma Érika
  btnConfirmErika.addEventListener("click", () => {
    registerWinner("erika");
    closeErikaConfirmModal();
    showToast("Olha só, vitória da Érika!");
  });

  // Cancela Érika
  btnCancelErika.addEventListener("click", () => {
    closeErikaConfirmModal();
    showToast("Ufa! Ainda bem que você conferiu.");
  });

  // Clique no Vinícius -> registra direto + mensagem divertida
  btnVinicius.addEventListener("click", () => {
    registerWinner("vinicius");
    showToast("Mais uma vitória dele hein, como pode?");
  });

  btnUndo.addEventListener("click", undoLastWeek);
  btnReset.addEventListener("click", resetAll);

  // Render inicial com estado do localStorage
  const initialState = loadState();
  render(initialState);
});

  const optionsButton = document.getElementById("options-button");
  const optionsMenu = document.getElementById("options-menu");

  // Abre/fecha o menu ao clicar no botão ⋯
  optionsButton.addEventListener("click", (event) => {
    event.stopPropagation(); // evita fechar imediatamente
    optionsMenu.classList.toggle("open");
  });

  // Evita que clique dentro do menu feche ele imediatamente
  optionsMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // Clicar em qualquer lugar fora fecha o menu
  document.addEventListener("click", () => {
    optionsMenu.classList.remove("open");
  });

