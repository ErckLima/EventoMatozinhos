(function () {
  "use strict";

  const cfg = window.APP_CONFIG;
  const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  const TABLE = cfg.TABLE_NAME;
  const PUBLIC_VIEW = cfg.PUBLIC_VIEW_NAME;

  let session = null;
  let guests = [];
  let searchTerm = "";

  // ---------- DOM refs ----------
  const guestListEl = document.getElementById("guestList");
  const emptyStateEl = document.getElementById("emptyState");
  const guestsCountLabel = document.getElementById("guestsCountLabel");
  const searchInput = document.getElementById("searchInput");

  const paidCountEl = document.getElementById("paidCount");
  const totalCountEl = document.getElementById("totalCount");
  const progressFillEl = document.getElementById("progressFill");
  const progressPercentEl = document.getElementById("progressPercent");

  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("submitBtn");
  const formMessage = document.getElementById("formMessage");

  const adminToggle = document.getElementById("adminToggle");
  const adminModal = document.getElementById("adminModal");
  const adminBackdrop = document.getElementById("adminBackdrop");
  const adminClose = document.getElementById("adminClose");
  const loginBox = document.getElementById("loginBox");
  const adminLogged = document.getElementById("adminLogged");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginError = document.getElementById("loginError");
  const adminEmailLabel = document.getElementById("adminEmailLabel");

  const copyListBtn = document.getElementById("copyListBtn");
  const copyListMessage = document.getElementById("copyListMessage");

  // ---------- countdown ----------
  function startCountdown() {
    const target = new Date(cfg.EVENT_DATE_ISO).getTime();
    const els = {
      d: document.getElementById("cd-days"),
      h: document.getElementById("cd-hours"),
      m: document.getElementById("cd-minutes"),
      s: document.getElementById("cd-seconds"),
    };
    function tick() {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      els.d.textContent = String(days).padStart(2, "0");
      els.h.textContent = String(hours).padStart(2, "0");
      els.m.textContent = String(minutes).padStart(2, "0");
      els.s.textContent = String(seconds).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);
  }

  // Mostra "Erick L" em vez do sobrenome inteiro na lista.
  function shortName(firstName, lastName) {
    const initial = (lastName || "").trim().charAt(0).toUpperCase();
    return initial ? `${firstName} ${initial}` : firstName;
  }

  const AVATAR_COLORS = ["#f5b942", "#ef7d4f", "#e6598f", "#3ecf8e", "#7c9cf5", "#c792ea"];
  function avatarColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  // Telefone é sempre guardado como 55 + DDD + número. Formata só para exibição.
  function formatPhoneDisplay(phone) {
    const digits = (phone || "").replace(/\D/g, "");
    if (!digits.startsWith("55") || (digits.length !== 12 && digits.length !== 13)) {
      return phone;
    }
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    const splitAt = rest.length - 4;
    return `+55 (${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
  }

  // ---------- data loading ----------
  async function loadGuests() {
    const isAdmin = !!session;
    const source = isAdmin ? TABLE : PUBLIC_VIEW;
    const { data, error } = await supabase
      .from(source)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar convidados:", error);
      return;
    }
    guests = data || [];
    renderGuests();
    renderProgress();
  }

  function renderProgress() {
    const total = guests.length;
    const paid = guests.filter((g) => g.paid).length;
    const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

    paidCountEl.textContent = paid;
    totalCountEl.textContent = total;
    progressPercentEl.textContent = percent + "%";
    progressFillEl.style.width = percent + "%";
    guestsCountLabel.textContent = total === 1 ? "1 confirmado" : total + " confirmados";
  }

  function renderGuests() {
    const isAdmin = !!session;
    const term = searchTerm.trim().toLowerCase();
    const filtered = guests.filter((g) => {
      if (!term) return true;
      const full = (g.first_name + " " + g.last_name).toLowerCase();
      return full.includes(term);
    });

    guestListEl.innerHTML = "";

    if (filtered.length === 0) {
      const msg = guests.length === 0
        ? "Seja o primeiro a confirmar presença! 🎉"
        : "Nenhum convidado encontrado.";
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = msg;
      guestListEl.appendChild(p);
      return;
    }

    filtered.forEach((g) => {
      const card = document.createElement("div");
      card.className = "guest-card";

      const main = document.createElement("div");
      main.className = "guest-main";

      const avatar = document.createElement("div");
      avatar.className = "guest-avatar";
      avatar.style.background = avatarColor(g.first_name + g.last_name);
      avatar.textContent = (g.first_name[0] || "?").toUpperCase();
      main.appendChild(avatar);

      const info = document.createElement("div");
      info.className = "guest-info";

      const name = document.createElement("span");
      name.className = "guest-name";
      // Admin vê o nome completo (precisa identificar quem pagou); no
      // público o sobrenome fica abreviado.
      name.textContent = isAdmin ? `${g.first_name} ${g.last_name}` : shortName(g.first_name, g.last_name);
      name.title = `${g.first_name} ${g.last_name}`;
      info.appendChild(name);

      if (isAdmin && g.phone) {
        const phone = document.createElement("span");
        phone.className = "guest-phone";
        phone.textContent = formatPhoneDisplay(g.phone);
        info.appendChild(phone);
      }

      if (isAdmin) {
        const actions = document.createElement("div");
        actions.className = "guest-admin-actions";

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "icon-btn";
        toggleBtn.textContent = g.paid ? "Marcar não pago" : "Marcar pago";
        toggleBtn.addEventListener("click", () => togglePaid(g.id, !g.paid));
        actions.appendChild(toggleBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "icon-btn danger";
        deleteBtn.textContent = "Remover";
        deleteBtn.addEventListener("click", () => deleteGuest(g.id, `${g.first_name} ${g.last_name}`));
        actions.appendChild(deleteBtn);

        info.appendChild(actions);
      }

      main.appendChild(info);

      const badge = document.createElement("span");
      badge.className = "badge " + (g.paid ? "paid" : "pending");
      badge.textContent = g.paid ? "✅ Pago" : "⏳ Pendente";

      card.appendChild(main);
      card.appendChild(badge);
      guestListEl.appendChild(card);
    });
  }

  // ---------- validação do telefone no WhatsApp ----------

  // Normaliza o texto digitado em candidatos de número (DDD + número, sem
  // código do país) para tentar automaticamente "com e sem o 9".
  function buildPhoneCandidates(rawInput) {
    let digits = rawInput.replace(/\D/g, "");

    if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    if (digits.length < 10 || digits.length > 11) {
      return { error: "formato", candidates: [] };
    }

    const candidates = [digits];
    if (digits.length === 11 && digits[2] === "9") {
      candidates.push(digits.slice(0, 2) + digits.slice(3)); // tenta sem o 9
    } else if (digits.length === 10) {
      candidates.push(digits.slice(0, 2) + "9" + digits.slice(2)); // tenta com o 9
    }
    return { error: null, candidates };
  }

  // Chama o webhook do n8n e devolve true/false conforme o número existir no WhatsApp.
  // O webhook espera o número completo, com código do país (55).
  async function checkWhatsappExists(numeroLocal) {
    const res = await fetch(cfg.WHATSAPP_CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: "55" + numeroLocal }),
    });
    if (!res.ok) throw new Error("webhook respondeu " + res.status);

    const json = await res.json();
    const entry = Array.isArray(json) ? json[0] : json;
    const item = entry && Array.isArray(entry.data) ? entry.data[0] : null;
    return !!(item && item.exists);
  }

  // Tenta os candidatos em sequência; devolve o número validado ou null.
  async function findValidWhatsappNumber(candidates) {
    let hadNetworkError = false;
    for (const candidate of candidates) {
      try {
        const exists = await checkWhatsappExists(candidate);
        if (exists) return { number: candidate, hadNetworkError };
      } catch (err) {
        console.error("Erro ao verificar número no WhatsApp:", err);
        hadNetworkError = true;
      }
    }
    return { number: null, hadNetworkError };
  }

  // ---------- register ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // honeypot: se preenchido, é bot — ignora silenciosamente
    if (document.getElementById("website").value) return;

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const phoneInput = document.getElementById("phone").value.trim();

    if (!firstName || !lastName || !phoneInput) {
      showFormMessage("Preencha nome, sobrenome e telefone.", "error");
      return;
    }

    const { error: formatError, candidates } = buildPhoneCandidates(phoneInput);
    if (formatError) {
      showFormMessage("Telefone incompleto. Inclua o DDD, ex: (31) 90000-0000.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando número...";
    showFormMessage("Confirmando seu número no WhatsApp...", "");

    const { number: validNumber, hadNetworkError } = await findValidWhatsappNumber(candidates);

    if (!validNumber) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmar presença 🎊";
      if (hadNetworkError) {
        showFormMessage("Não conseguimos verificar seu número agora. Tente novamente em instantes.", "error");
      } else {
        showFormMessage("Não encontramos esse número no WhatsApp. Confira o DDD e tente com ou sem o 9.", "error");
      }
      return;
    }

    submitBtn.textContent = "Enviando...";

    const fullPhone = "55" + validNumber;
    const { error } = await supabase.from(TABLE).insert({
      first_name: firstName,
      last_name: lastName,
      phone: fullPhone,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar presença 🎊";

    if (error) {
      console.error(error);
      showFormMessage("Não deu pra confirmar agora. Tenta de novo em instantes.", "error");
      return;
    }

    showFormMessage("Presença confirmada! Nos vemos lá 🎉", "success");
    form.reset();
    fireConfetti();
    loadGuests();
  });

  function showFormMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message " + (type || "");
  }

  function fireConfetti() {
    if (typeof window.confetti !== "function") return;
    window.confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#f5b942", "#ef7d4f", "#e6598f"],
    });
  }

  // ---------- search ----------
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderGuests();
  });

  // ---------- admin: modal ----------
  function openModal() { adminModal.classList.remove("hidden"); }
  function closeModal() { adminModal.classList.add("hidden"); }

  adminToggle.addEventListener("click", openModal);
  adminClose.addEventListener("click", closeModal);
  adminBackdrop.addEventListener("click", closeModal);

  function showAdminUI() {
    if (session) {
      loginBox.classList.add("hidden");
      adminLogged.classList.remove("hidden");
      adminEmailLabel.textContent = session.user.email;
      adminToggle.textContent = "🔓";
      copyListBtn.classList.remove("hidden");
    } else {
      loginBox.classList.remove("hidden");
      adminLogged.classList.add("hidden");
      adminToggle.textContent = "🔒";
      copyListBtn.classList.add("hidden");
      copyListMessage.textContent = "";
    }
  }

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    loginError.textContent = "";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = "E-mail ou senha inválidos.";
      loginError.className = "form-message error";
      return;
    }
    session = data.session;
    showAdminUI();
    closeModal();
    loadGuests();
  });

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    session = null;
    showAdminUI();
    loadGuests();
  });

  copyListBtn.addEventListener("click", async () => {
    if (!session) return;

    const list = guests
      .map((g, i) => `${i + 1}. ${g.first_name} ${g.last_name} - ${formatPhoneDisplay(g.phone)}`)
      .join("\n");

    if (!list) {
      copyListMessage.textContent = "Ainda não tem nenhum convidado cadastrado.";
      copyListMessage.className = "form-message error";
      return;
    }

    try {
      await navigator.clipboard.writeText(list);
      copyListMessage.textContent = `Lista com ${guests.length} convidado(s) copiada!`;
      copyListMessage.className = "form-message success";
    } catch (err) {
      console.error("Erro ao copiar lista:", err);
      copyListMessage.textContent = "Não deu pra copiar automaticamente. Copie manualmente:\n\n" + list;
      copyListMessage.className = "form-message error";
    }
  });

  async function togglePaid(id, paid) {
    const { error } = await supabase.from(TABLE).update({ paid }).eq("id", id);
    if (error) {
      console.error(error);
      alert("Não foi possível atualizar. Confira se ainda está logado como organizador.");
      return;
    }
    loadGuests();
  }

  async function deleteGuest(id, name) {
    if (!confirm(`Remover ${name} da lista?`)) return;
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Não foi possível remover. Confira se ainda está logado como organizador.");
      return;
    }
    loadGuests();
  }

  // ---------- realtime ----------
  function subscribeRealtime() {
    supabase
      .channel("guests-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => {
        loadGuests();
      })
      .subscribe();
  }

  // ---------- init ----------
  async function init() {
    startCountdown();

    const { data } = await supabase.auth.getSession();
    session = data.session;
    showAdminUI();

    await loadGuests();
    subscribeRealtime();

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session = newSession;
      showAdminUI();
      loadGuests();
    });
  }

  init();
})();
