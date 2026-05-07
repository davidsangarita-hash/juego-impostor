// ═══════════════════════════════════════════════════════════
//  IMPOSTOR FC — Cliente v3.0
// ═══════════════════════════════════════════════════════════

const socket = io();

const state = {
  myId: null,
  myName: "",
  myAvatar: 0,
  selectedMode: "futbol",
  currentRoom: null,
  isHost: false,
  isReady: false,
  isImpostor: false,
  myWord: null,
  myHint: null,
  myImage: null,
  timerInterval: null,
  voteTimerInterval: null,
  hasVoted: false,
  hasSubmittedWord: false,
  xp: parseInt(localStorage.getItem("xp") || "0"),
  level: parseInt(localStorage.getItem("level") || "1"),
};

const AVATARS = ["⚽","🦁","🐉","🦅","🐺","🦊","🦈","🐯","🦋","🔥"];

const MODES_META = {
  futbol:    { label:"⚽ Fútbol"    },
  peliculas: { label:"🎬 Películas" },
  famosos:   { label:"⭐ Famosos"   },
  ciudades:  { label:"🌍 Ciudades"  },
  animales:  { label:"🦁 Animales"  },
  comidas:   { label:"🍕 Comidas"   },
  mixto:     { label:"🎲 Mixto"     },
};

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
}

function showToast(msg, duration, type) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast toast-" + (type || "default");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add("hidden"), duration || 3000);
}

function formatTime(s) {
  s = Math.max(0, s);
  return ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + (s % 60)).slice(-2);
}

function addXP(amount) {
  if (!amount) return;
  state.xp += amount;
  while (state.xp >= state.level * 1000) {
    state.xp -= state.level * 1000;
    state.level++;
    showToast("🏆 ¡Subiste a nivel " + state.level + "!", 4000, "success");
  }
  localStorage.setItem("xp", state.xp);
  localStorage.setItem("level", state.level);
  updateXPBadge();
}

function updateXPBadge() {
  var max = state.level * 1000;
  $("xp-level").textContent = state.level;
  $("xp-current").textContent = state.xp.toLocaleString();
  $("xp-next").textContent = max.toLocaleString();
  $("xp-bar").style.width = Math.round((state.xp / max) * 100) + "%";
}

function fireConfetti() {
  var colors = ["#00FF87","#FFD700","#00C3FF","#FF4757","#ffffff"];
  for (var i = 0; i < 80; i++) {
    var p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = (Math.random() * 100) + "%";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = (Math.random() * 1.8) + "s";
    p.style.animationDuration = (1.4 + Math.random() * 1.6) + "s";
    p.style.width = (5 + Math.random() * 9) + "px";
    p.style.height = (5 + Math.random() * 9) + "px";
    p.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    document.body.appendChild(p);
    setTimeout(function(el) { el.remove(); }, 4000, p);
  }
}

function setImage(imgEl, wrapEl, url) {
  if (url) {
    imgEl.src = url;
    imgEl.onerror = function() { wrapEl.classList.add("hidden"); };
    imgEl.onload  = function() { wrapEl.classList.remove("hidden"); };
  } else {
    wrapEl.classList.add("hidden");
  }
}

// ═══════════════════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════════════════
function buildAvatarRow(containerId) {
  var row = $(containerId);
  row.innerHTML = "";
  AVATARS.forEach(function(av, i) {
    var div = document.createElement("div");
    div.className = "avatar-opt" + (i === state.myAvatar ? " selected" : "");
    div.textContent = av;
    div.addEventListener("click", function() {
      row.querySelectorAll(".avatar-opt").forEach(function(d) { d.classList.remove("selected"); });
      div.classList.add("selected");
      state.myAvatar = i;
    });
    row.appendChild(div);
  });
}
buildAvatarRow("avatar-row-home");

$("btn-create").addEventListener("click", function() {
  var name = $("home-name").value.trim().toUpperCase();
  if (!name) return showToast("⚠️ Ingresa tu nombre primero", 2500, "warn");
  state.myName = name;
  socket.emit("create_room", {
    name: name,
    avatar: state.myAvatar,
    settings: { mode: state.selectedMode, impostors: 1, duration: 10 }
  });
});

$("btn-join-open").addEventListener("click", function() {
  var p = $("join-panel");
  p.classList.toggle("hidden");
  if (!p.classList.contains("hidden")) $("join-code").focus();
});

$("btn-join-confirm").addEventListener("click", doJoin);
$("join-code").addEventListener("keyup", function(e) { if (e.key === "Enter") doJoin(); });
$("home-name").addEventListener("keyup", function(e) { if (e.key === "Enter") $("btn-create").click(); });

function doJoin() {
  var name = $("home-name").value.trim().toUpperCase();
  var code = $("join-code").value.trim().toUpperCase();
  if (!name) return showToast("⚠️ Ingresa tu nombre primero", 2500, "warn");
  if (code.length !== 5) return showToast("⚠️ Código de 5 caracteres", 2500, "warn");
  state.myName = name;
  socket.emit("join_room", { code: code, name: name, avatar: state.myAvatar });
}

// ═══════════════════════════════════════════════════════════
//  LOBBY — Mode Grid
// ═══════════════════════════════════════════════════════════
function buildModeGrid() {
  var grid = $("mode-grid");
  if (!grid) return;
  grid.innerHTML = "";
  Object.entries(MODES_META).forEach(function(entry) {
    var key = entry[0], meta = entry[1];
    var btn = document.createElement("button");
    btn.className = "mode-btn" + (key === state.selectedMode ? " active" : "");
    btn.textContent = meta.label;
    btn.dataset.mode = key;
    btn.addEventListener("click", function() {
      if (!state.isHost) return;
      state.selectedMode = key;
      grid.querySelectorAll(".mode-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      socket.emit("update_settings", {
        code: state.currentRoom.code,
        settings: getSettingsFromForm()
      });
    });
    grid.appendChild(btn);
  });
}

function getSettingsFromForm() {
  return {
    mode: state.selectedMode,
    impostors: parseInt($("cfg-impostors") ? $("cfg-impostors").value : "1"),
    duration: parseInt($("cfg-duration") ? $("cfg-duration").value : "10"),
  };
}

function renderLobby(room) {
  state.currentRoom = room;
  $("room-code-display").textContent = room.code;

  var me = null;
  room.players.forEach(function(p) { if (p.id === socket.id) me = p; });
  if (!me) return;
  state.isHost = me.isHost;
  state.isReady = me.ready;

  // Sincronizar settings del server
  if (room.settings) {
    state.selectedMode = room.settings.mode || "futbol";
    if ($("cfg-impostors")) $("cfg-impostors").value = room.settings.impostors;
    if ($("cfg-duration"))  $("cfg-duration").value  = room.settings.duration;
  }

  // Habilitar/deshabilitar controles
  var canEdit = state.isHost;
  [$("cfg-impostors"), $("cfg-duration")].forEach(function(el) {
    if (el) el.disabled = !canEdit;
  });

  // Rebuild mode grid con estado correcto
  buildModeGrid();
  $("mode-grid").querySelectorAll(".mode-btn").forEach(function(b) {
    b.disabled = !canEdit;
    b.style.opacity = canEdit ? "1" : "0.5";
    b.style.cursor  = canEdit ? "pointer" : "default";
  });

  // Jugadores grid
  var grid = $("players-grid");
  grid.innerHTML = "";
  var readyCount = 0;
  room.players.forEach(function(p) {
    if (p.ready || p.isHost) readyCount++;
    var card = document.createElement("div");
    card.className = "player-card" + (p.isHost ? " host-card" : "") + (p.ready ? " ready-card" : "");
    card.innerHTML =
      (p.isHost ? '<div class="host-crown">👑</div>' : "") +
      '<div class="player-avatar">' + (AVATARS[p.avatar] || "⚽") + '</div>' +
      '<div class="player-name">' + p.name + '</div>' +
      '<div class="player-status ' + (p.isHost ? "host" : (p.ready ? "ready" : "")) + '">' +
        (p.isHost ? "HOST" : (p.ready ? "READY ✓" : "ESPERANDO...")) +
      '</div>';
    grid.appendChild(card);
  });

  $("players-ready").textContent = readyCount;
  $("players-total").textContent = room.players.length;

  // Botones acción
  var readyBtn = $("btn-ready");
  readyBtn.textContent = state.isReady ? "✓ LISTO" : "○ MARCAR LISTO";
  readyBtn.classList.toggle("active", state.isReady);
  $("btn-start").classList.toggle("hidden", !state.isHost);
  $("btn-ready").classList.toggle("hidden", state.isHost);
  $("btn-force-vote").classList.toggle("hidden", !(state.isHost && room.state === "playing"));
}

// Listeners lobby
$("btn-copy-code").addEventListener("click", function() {
  var code = $("room-code-display").textContent;
  navigator.clipboard.writeText(code).then(function() {
    showToast("✅ Código copiado: " + code, 2000, "success");
  });
});

$("btn-ready").addEventListener("click", function() {
  socket.emit("toggle_ready", { code: state.currentRoom.code });
});

$("btn-start").addEventListener("click", function() {
  socket.emit("start_game", { code: state.currentRoom.code });
});

$("btn-force-vote").addEventListener("click", function() {
  socket.emit("force_vote", { code: state.currentRoom.code });
});

$("btn-leave-lobby").addEventListener("click", function() {
  socket.disconnect();
  window.location.reload();
});

["cfg-impostors", "cfg-duration"].forEach(function(id) {
  var el = $(id);
  if (!el) return;
  el.addEventListener("change", function() {
    if (!state.isHost) return;
    socket.emit("update_settings", { code: state.currentRoom.code, settings: getSettingsFromForm() });
  });
});

// Chat lobby
$("btn-send-chat").addEventListener("click", sendLobbyChat);
$("chat-input").addEventListener("keyup", function(e) { if (e.key === "Enter") sendLobbyChat(); });
function sendLobbyChat() {
  var text = $("chat-input").value.trim();
  if (!text || !state.currentRoom) return;
  socket.emit("send_chat", { code: state.currentRoom.code, text: text });
  $("chat-input").value = "";
}

function appendChatMsg(containerId, msg) {
  var container = $(containerId);
  if (!container) return;
  var div = document.createElement("div");
  if (msg.system) {
    div.className = "chat-msg system-msg";
    div.textContent = msg.text;
  } else {
    div.className = "chat-msg";
    var isMine = msg.playerId === socket.id;
    div.innerHTML =
      '<span class="msg-author"' + (isMine ? ' style="color:var(--gold)"' : "") + ">" +
      msg.playerName + "</span>" + msg.text;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ═══════════════════════════════════════════════════════════
//  PANTALLA JUEGO
// ═══════════════════════════════════════════════════════════
function startGameScreen(data) {
  state.isImpostor    = data.isImpostor;
  state.myWord        = data.word;
  state.myHint        = data.hint;
  state.myImage       = data.image || null;
  state.hasVoted      = false;
  state.hasSubmittedWord = false;

  showScreen("game");

  $("game-round-num").textContent = data.round;
  $("game-category").textContent  = data.category;

  // Role card
  var roleCard = $("role-card");
  if (data.isImpostor) {
    roleCard.classList.add("impostor");
    $("role-badge").textContent = "⚠ IMPOSTOR";
    $("role-badge").classList.add("impostor");
    $("role-title").textContent = "¡ERES EL IMPOSTOR!";
    $("word-display").classList.add("hidden");
    $("word-image-wrap").classList.add("hidden");
    $("impostor-msg").classList.remove("hidden");
  } else {
    roleCard.classList.remove("impostor");
    $("role-badge").textContent = "✦ AGENTE";
    $("role-badge").classList.remove("impostor");
    $("role-title").textContent = "PROTEGE LA PALABRA";
    $("word-display").classList.remove("hidden");
    $("impostor-msg").classList.add("hidden");
    $("word-value").textContent = data.word;
    $("word-hint").textContent  = data.hint;
    // Imagen de referencia
    setImage($("word-image"), $("word-image-wrap"), data.image);
  }

  // Reset panel palabras
  $("word-submit-input").value    = "";
  $("word-submit-input").disabled = false;
  $("btn-submit-word").disabled   = false;
  $("word-submit-row").classList.remove("hidden");
  $("word-sent-notice").classList.add("hidden");
  $("words-list").innerHTML = "";
  $("game-chat-messages").innerHTML = "";

  // Timer
  var remaining = data.duration;
  clearInterval(state.timerInterval);
  $("game-timer").classList.remove("urgent");
  $("game-timer").textContent = formatTime(remaining);

  state.timerInterval = setInterval(function() {
    remaining--;
    $("game-timer").textContent = formatTime(remaining);
    if (remaining <= 60) $("game-timer").classList.add("urgent");
    if (remaining <= 0) clearInterval(state.timerInterval);
  }, 1000);

  // Botón forzar voto (solo host, en game topbar)
  var bfg = $("btn-force-vote-game");
  if (bfg) bfg.classList.toggle("hidden", !state.isHost);
}

// Palabras de la ronda
function renderWordsPanel(players, roundWords) {
  var list = $("words-list");
  if (!list) return;
  list.innerHTML = "";
  players.filter(function(p) { return !p.eliminated; }).forEach(function(p) {
    var submitted = roundWords && roundWords[p.id];
    var row = document.createElement("div");
    row.className = "word-row " + (submitted ? "has-word" : "pending");
    row.innerHTML =
      '<span class="wr-avatar">' + (AVATARS[p.avatar] || "⚽") + '</span>' +
      '<span class="wr-name">' + p.name + (p.isHost ? " 👑" : "") + '</span>' +
      (submitted
        ? '<span class="wr-word">' + submitted + '</span>'
        : '<span class="wr-pending">✍ escribiendo...</span>');
    list.appendChild(row);
  });
}

// Submit word
$("btn-submit-word").addEventListener("click", submitWord);
$("word-submit-input").addEventListener("keyup", function(e) { if (e.key === "Enter") submitWord(); });

function submitWord() {
  if (state.hasSubmittedWord) return;
  var text = $("word-submit-input").value.trim();
  if (!text) return showToast("⚠️ Escribe una palabra primero", 2000, "warn");
  state.hasSubmittedWord = true;
  $("word-submit-input").disabled = true;
  $("btn-submit-word").disabled   = true;
  $("word-submit-row").classList.add("hidden");
  $("word-sent-notice").classList.remove("hidden");
  socket.emit("submit_word", { code: state.currentRoom.code, word: text });
  showToast("✅ ¡Palabra enviada!", 2000, "success");
}

// Chat juego
$("btn-send-game-chat").addEventListener("click", sendGameChat);
$("game-chat-input").addEventListener("keyup", function(e) { if (e.key === "Enter") sendGameChat(); });
function sendGameChat() {
  var text = $("game-chat-input").value.trim();
  if (!text || !state.currentRoom) return;
  socket.emit("send_chat", { code: state.currentRoom.code, text: text });
  $("game-chat-input").value = "";
}

// Forzar voto desde topbar (host)
var bfg = $("btn-force-vote-game");
if (bfg) {
  bfg.addEventListener("click", function() {
    socket.emit("force_vote", { code: state.currentRoom.code });
  });
}

// Jugadores vivos
function renderAlivePlayers(players) {
  var container = $("alive-players");
  if (!container) return;
  container.innerHTML = "";
  players.forEach(function(p) {
    var div = document.createElement("div");
    div.className = "alive-player" + (p.eliminated ? " eliminated" : "");
    div.innerHTML =
      '<span class="ap-avatar">' + (AVATARS[p.avatar] || "⚽") + '</span>' +
      '<span class="ap-name">' + p.name + (p.isHost ? " 👑" : "") + '</span>' +
      '<span class="ap-score">' + (p.score || 0) + " XP</span>";
    container.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════
//  VOTACIÓN
// ═══════════════════════════════════════════════════════════
function openVoting(data) {
  state.hasVoted = false;
  clearInterval(state.timerInterval);
  clearInterval(state.voteTimerInterval);

  $("modal-vote").classList.remove("hidden");
  $("votes-cast").textContent  = 0;
  $("votes-total").textContent = data.players.length;

  // Mostrar imagen + palabra en el modal de votación
  var voteImgWrap = $("vote-image-wrap");
  if (data.image) {
    setImage($("vote-image"), voteImgWrap, data.image);
    voteImgWrap.classList.remove("hidden");
  } else {
    voteImgWrap.classList.add("hidden");
  }
  // La palabra se revela después de votar (la ponemos como ????)
  $("vote-word-reveal").textContent = "???? — ¿Quién es el IMPOSTOR?";

  // Construir cards de votación
  var grid = $("vote-grid");
  grid.innerHTML = "";

  // Opción saltar
  var skipCard = document.createElement("div");
  skipCard.className = "vote-card";
  skipCard.innerHTML = '<div class="vc-avatar">🤷</div><div class="vc-name">SALTAR</div><div class="vc-skip">No votar</div>';
  skipCard.addEventListener("click", function() { castVote("skip", skipCard, grid); });
  grid.appendChild(skipCard);

  data.players.forEach(function(p) {
    if (p.id === socket.id) return; // no puedes votarte a ti mismo
    var card = document.createElement("div");
    card.className = "vote-card";
    card.innerHTML =
      '<div class="vc-avatar">' + (AVATARS[p.avatar] || "⚽") + '</div>' +
      '<div class="vc-name">' + p.name + '</div>' +
      (p.roundWord ? '<div class="vc-word">"' + p.roundWord + '"</div>' : "");
    card.addEventListener("click", function() { castVote(p.id, card, grid); });
    grid.appendChild(card);
  });

  // Countdown
  var t = data.timeLeft;
  $("vote-timer").textContent = t;
  $("vote-timer").classList.remove("urgent");

  state.voteTimerInterval = setInterval(function() {
    t--;
    $("vote-timer").textContent = t;
    if (t <= 10) $("vote-timer").classList.add("urgent");
    if (t <= 0) clearInterval(state.voteTimerInterval);
  }, 1000);
}

function castVote(targetId, card, grid) {
  if (state.hasVoted) return;
  state.hasVoted = true;
  grid.querySelectorAll(".vote-card").forEach(function(c) { c.classList.remove("voted"); });
  card.classList.add("voted");
  socket.emit("cast_vote", { code: state.currentRoom.code, targetId: targetId });
  showToast("🗳️ ¡Voto registrado!", 2000, "success");
}

// ═══════════════════════════════════════════════════════════
//  RESULTADOS
// ═══════════════════════════════════════════════════════════
function showResults(data) {
  clearInterval(state.voteTimerInterval);
  $("modal-vote").classList.add("hidden");
  $("modal-result").classList.remove("hidden");
  document.querySelectorAll(".waiting-host").forEach(function(e) { e.remove(); });

  var header    = $("result-header");
  var reveal    = $("result-reveal");
  var scoresDiv = $("result-scores");

  // Header principal
  if (data.gameOver) {
    if (data.winner === "crew") {
      header.innerHTML = "🏆 ¡EL EQUIPO GANÓ!";
      header.className = "result-header crew-win";
      fireConfetti();
    } else {
      header.innerHTML = "👺 IMPOSTORES GANAN";
      header.className = "result-header impostors-win";
    }
  } else {
    if (data.tied) {
      header.innerHTML = "🤝 EMPATE — Nadie eliminado";
      header.className = "result-header";
    } else {
      header.innerHTML = data.wasImpostor ? "✅ ¡IMPOSTOR ELIMINADO!" : "❌ VOTACIÓN INCORRECTA";
      header.className = "result-header " + (data.wasImpostor ? "crew-win" : "impostors-win");
    }
    if (data.wasImpostor) fireConfetti();
  }

  // Imagen de la palabra en resultados
  var imgHtml = "";
  if (data.image) {
    imgHtml = '<div class="result-image-wrap"><img src="' + data.image + '" class="result-image" onerror="this.parentNode.style.display=\'none\'" /></div>';
  }

  var impostorNames = data.players
    .filter(function(p) { return data.impostorIds.includes(p.id); })
    .map(function(p) { return p.name; }).join(", ");

  reveal.innerHTML =
    imgHtml +
    '<div class="reveal-row">' +
      (data.eliminated
        ? "🚪 <strong>" + data.eliminated.name + "</strong> fue eliminado — " +
          (data.wasImpostor ? "✅ Era el impostor" : "❌ No era el impostor")
        : (data.tied ? "🤝 Hubo empate en votos, nadie sale" : "🤷 Nadie fue eliminado")) +
    '</div>' +
    '<div class="reveal-row">📖 La palabra era: <strong class="reveal-word">' + data.word + '</strong></div>' +
    '<div class="reveal-row">👺 Impostor(es): <strong class="reveal-imp">' + impostorNames + '</strong></div>';

  // Tabla scores
  scoresDiv.innerHTML = "";
  var sorted = data.players.slice().sort(function(a, b) {
    return (data.scores[b.id] || 0) - (data.scores[a.id] || 0);
  });
  var medals = ["🥇", "🥈", "🥉"];
  sorted.forEach(function(p, i) {
    var isImp = data.impostorIds.includes(p.id);
    var isMe  = p.id === socket.id;
    var row   = document.createElement("div");
    row.className = "score-row" + (i === 0 ? " top" : "") + (isMe ? " me" : "");
    row.innerHTML =
      '<span class="sr-pos">'    + (medals[i] || ("#" + (i + 1))) + '</span>' +
      '<span class="sr-avatar">' + (AVATARS[p.avatar] || "⚽")    + '</span>' +
      '<span class="sr-name">'   + p.name + (isMe ? " <em>(tú)</em>" : "") + '</span>' +
      '<span class="sr-tag '     + (isImp ? "impostor" : "crew")   + '">' +
        (isImp ? "IMPOSTOR" : "AGENTE") + '</span>' +
      '<span class="sr-score">'  + (data.scores[p.id] || 0) + " XP</span>";
    scoresDiv.appendChild(row);
  });

  // XP al jugador
  var myScore = data.scores[socket.id] || 0;
  if (myScore > 0) {
    addXP(myScore);
    showToast("+" + myScore + " XP ganados 🔥", 3000, "success");
  }

  // Botones — solo host controla el flujo
  $("btn-next-round").classList.toggle("hidden", !state.isHost || data.gameOver);
  $("btn-back-lobby").classList.toggle("hidden", !state.isHost);

  if (!state.isHost) {
    var w = document.createElement("p");
    w.className = "waiting-host";
    w.textContent = "⏳ Esperando decisión del host...";
    $("result-actions").appendChild(w);
  }
}

$("btn-next-round").addEventListener("click", function() {
  $("modal-result").classList.add("hidden");
  document.querySelectorAll(".waiting-host").forEach(function(e) { e.remove(); });
  socket.emit("start_game", { code: state.currentRoom.code });
});

$("btn-back-lobby").addEventListener("click", function() {
  $("modal-result").classList.add("hidden");
  document.querySelectorAll(".waiting-host").forEach(function(e) { e.remove(); });
  socket.emit("return_lobby", { code: state.currentRoom.code });
});

// ═══════════════════════════════════════════════════════════
//  SOCKET EVENTS
// ═══════════════════════════════════════════════════════════
socket.on("connect", function() {
  state.myId = socket.id;
  updateXPBadge();
});

socket.on("room_created", function(data) {
  state.currentRoom = data.room;
  showScreen("lobby");
  buildModeGrid();
  renderLobby(data.room);
  showToast("✅ Sala creada — Código: " + data.code, 4000, "success");
});

socket.on("room_joined", function(data) {
  state.currentRoom = data.room;
  showScreen("lobby");
  buildModeGrid();
  renderLobby(data.room);
  showToast("✅ Unido a sala: " + data.code, 3000, "success");
});

socket.on("join_error", function(msg) { showToast("❌ " + msg, 3000, "error"); });

socket.on("room_update", function(room) {
  state.currentRoom = room;
  if (room.state === "lobby") {
    showScreen("lobby");
    renderLobby(room);
  } else {
    renderAlivePlayers(room.players);
    renderWordsPanel(room.players, room.roundWords);
    var bfg = $("btn-force-vote-game");
    if (bfg) bfg.classList.toggle("hidden", !(state.isHost && room.state === "playing"));
  }
});

socket.on("game_start", function(data) {
  $("modal-vote").classList.add("hidden");
  $("modal-result").classList.add("hidden");
  document.querySelectorAll(".waiting-host").forEach(function(e) { e.remove(); });
  startGameScreen(data);
});

socket.on("word_submitted", function(data) {
  appendChatMsg("game-chat-messages", {
    system: true,
    text: "✍ " + data.playerName + ' dijo: "' + data.word + '"'
  });
});

socket.on("voting_start", function(data) {
  clearInterval(state.timerInterval);
  openVoting(data);
});

socket.on("vote_update", function(data) {
  $("votes-cast").textContent  = data.voted;
  $("votes-total").textContent = data.total;
});

socket.on("voting_result", function(data) {
  clearInterval(state.voteTimerInterval);
  showResults(data);
  if (data.players) renderAlivePlayers(data.players);
});

socket.on("chat_msg", function(msg) {
  appendChatMsg("chat-messages", msg);
  appendChatMsg("game-chat-messages", msg);
});

socket.on("error_msg", function(msg) { showToast("⚠️ " + msg, 3000, "warn"); });
socket.on("disconnect", function() { showToast("❌ Desconectado del servidor", 5000, "error"); });