/***********************
 * CONFIG
 ***********************/
const API_BASE =
  "https://divine-cherry-67d7ranking-api.viniciusxpaiva.workers.dev";

/***********************
 * HELPERS: API (sem token)
 ***********************/
async function apiRequest(path, { method = "GET", body = null } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || data?.error || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

async function apiGetState() {
  return apiRequest("/state");
}

async function apiRegisterWinner(winnerKey) {
  const data = await apiRequest("/register", {
    method: "POST",
    body: { winner: winnerKey },
  });
  return data.state;
}

async function apiUndo() {
  const data = await apiRequest("/undo", { method: "POST" });
  return data.state;
}

async function apiReset() {
  const data = await apiRequest("/reset", { method: "POST" });
  return data.state;
}

/***********************
 * UI LOGIC
 ***********************/
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
  const emoji = "🔥";

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
  if (!state.weeks || state.weeks.length === 0) {
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

/* Toast genérico */
let toastTimeout = null;
function showToast(message, duration = 2500) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  if (toastTimeout) clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, duration);
}

/***********************
 * STATE REFRESH (sempre do servidor)
 ***********************/
async function refreshAndRender() {
  const state = await apiGetState();
  render(state);
  return state;
}

/***********************
 * INITIALIZATION
 ***********************/
document.addEventListener("DOMContentLoaded", async () => {
  const btnErika = document.getElementById("btn-erika");
  const btnVinicius = document.getElementById("btn-vinicius");
  const btnUndo = document.getElementById("btn-undo");
  const btnReset = document.getElementById("btn-reset");

  // 1) Render inicial (do servidor)
  try {
    await refreshAndRender();
  } catch (e) {
    console.error(e);
    showToast("Erro ao carregar ranking (servidor).");
  }

  // 2) Registrar vencedor
  btnErika.addEventListener("click", async () => {
    try {
      const newState = await apiRegisterWinner("erika");
      render(newState);
      showToast("Vitória da Érika!");
    } catch (e) {
      showToast(e.message);
    }
  });

  btnVinicius.addEventListener("click", async () => {
    try {
      const newState = await apiRegisterWinner("vinicius");
      render(newState);
      showToast("Vitória da Érika!");
    } catch (e) {
      showToast(e.message);
    }
  });

  // 3) Undo / Reset
  btnUndo.addEventListener("click", async () => {
    try {
      const newState = await apiUndo();
      render(newState);
      showToast("Última semana desfeita.");
    } catch (e) {
      showToast(e.message);
    }
  });

  btnReset.addEventListener("click", async () => {
    const sure = confirm(
      "Tem certeza que deseja apagar TODO o histórico e zerar o placar?"
    );
    if (!sure) return;

    try {
      const newState = await apiReset();
      render(newState);
      showToast("Placar zerado.");
    } catch (e) {
      showToast(e.message);
    }
  });

  // 4) Menu ⋯
  const optionsButton = document.getElementById("options-button");
  const optionsMenu = document.getElementById("options-menu");

  optionsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    optionsMenu.classList.toggle("open");
  });

  optionsMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    optionsMenu.classList.remove("open");
  });
});
