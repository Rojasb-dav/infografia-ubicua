/* ================================================================
   Infografía Ubicua - Lógica principal
   JavaScript vanilla. Sin frameworks.
   ================================================================ */

/* ---------------------------------------------------------------
   1. DATOS DE LOS PÓSTERS
   --------------------------------------------------------------- */
const POSTERS = [
  {
    id: "soporte-001",
    area: "SOPORTE",
    color: "#1E40AF",
    titulo: "Beca de Manutención 2026",
    descripcion: "Apoyo económico mensual para estudiantes de bajos recursos con promedio mínimo de 8.0",
    poster: "assets/poster_soporte.png",
    modelo3D: "assets/coin.glb",
    fechaLimite: "2026-06-30",
    fechaLimiteTexto: "30 de junio de 2026",
    requisitos: [
      "Promedio mínimo de 8.0",
      "Comprobante de ingresos familiares",
      "Constancia de estudios vigente",
      "CURP e INE",
      "Carta de exposición de motivos"
    ],
    whatsapp: "5212345678900"
  },
  {
    id: "bienestar-001",
    area: "BIENESTAR",
    color: "#15803D",
    titulo: "Atención Psicológica Gratuita",
    descripcion: "Sesiones individuales confidenciales sin costo para estudiantes activos",
    poster: "assets/poster_bienestar.png",
    modelo3D: "assets/heart.glb",
    fechaLimite: "2026-12-31",
    fechaLimiteTexto: "Inscripciones abiertas todo el semestre",
    requisitos: [
      "Ser estudiante activo",
      "Agendar cita previa",
      "Llenar formulario de valoración"
    ],
    whatsapp: "5212345678900"
  },
  {
    id: "aprendizaje-001",
    area: "APRENDIZAJE",
    color: "#B45309",
    titulo: "Tutorías Académicas Gratuitas",
    descripcion: "Asesorías grupales semanales de matemáticas y programación impartidas por estudiantes avanzados certificados",
    poster: "assets/poster_aprendizaje.png",
    modelo3D: "assets/book.glb",
    fechaLimite: "2026-05-20",
    fechaLimiteTexto: "20 de mayo de 2026",
    requisitos: [
      "Registro previo en la plataforma",
      "Asistencia mínima del 80%",
      "Llevar material del curso"
    ],
    whatsapp: "5212345678900"
  }
];

/* ---------------------------------------------------------------
   1.5 PANEL DE LOGS EN PANTALLA (captura console.*)
   --------------------------------------------------------------- */
(function setupDebugPanel() {
  const append = (level, args) => {
    const panel = document.getElementById("debug-log");
    if (!panel) return;
    const line = document.createElement("div");
    line.className = "log-line log-" + level;
    const time = new Date().toLocaleTimeString();
    line.textContent = `[${time}] ${args
      .map((a) => {
        if (a instanceof Error) return a.name + ": " + a.message;
        if (typeof a === "object") {
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }
        return String(a);
      })
      .join(" ")}`;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  };

  ["log", "info"].forEach((m) => {
    const orig = console[m].bind(console);
    console[m] = function (...args) { append("info", args); orig(...args); };
  });
  const origWarn = console.warn.bind(console);
  console.warn = function (...args) { append("warn", args); origWarn(...args); };
  const origErr = console.error.bind(console);
  console.error = function (...args) { append("error", args); origErr(...args); };

  // Captura errores no manejados
  window.addEventListener("error", (e) => {
    append("error", ["window.error:", e.message, "@", e.filename + ":" + e.lineno]);
  });
  window.addEventListener("unhandledrejection", (e) => {
    append("error", ["unhandledrejection:", e.reason && (e.reason.message || e.reason)]);
  });
})();

/* ---------------------------------------------------------------
   2. ESTADO Y CONSTANTES
   --------------------------------------------------------------- */
let currentIndex = 0; // índice del póster actual

const STORAGE_KEYS = {
  saved: "oportunidades_guardadas",
  checklist: (id) => "checklist_" + id
};

/* ---------------------------------------------------------------
   3. UTILIDADES
   --------------------------------------------------------------- */

/** Obtiene el póster actualmente seleccionado */
function getCurrentPoster() {
  return POSTERS[currentIndex];
}

/** Lee un array desde localStorage de forma segura */
function readStorageArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("localStorage corrupto en", key, e);
    return [];
  }
}

/** Escribe un valor en localStorage */
function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------------------------------------------------------------
   4. SISTEMA DE TOASTS
   --------------------------------------------------------------- */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  // Eliminar tras animación (~3s total)
  setTimeout(() => toast.remove(), 3000);
}

/* ---------------------------------------------------------------
   5. PANTALLA DE BIENVENIDA: oportunidades guardadas
   --------------------------------------------------------------- */

/** Renderiza la lista de oportunidades guardadas en la bienvenida */
function renderSavedList() {
  const list = document.getElementById("saved-list");
  const btnClear = document.getElementById("btn-clear-saved");
  const saved = readStorageArray(STORAGE_KEYS.saved);

  list.innerHTML = "";

  if (saved.length === 0) {
    list.innerHTML = '<p class="saved-empty">Aún no has guardado ninguna oportunidad</p>';
    btnClear.style.display = "none";
    return;
  }

  // Crea una tarjeta por cada item guardado
  saved.forEach((item) => {
    const card = document.createElement("div");
    card.className = "saved-item";
    card.style.borderLeftColor = item.color;

    card.innerHTML = `
      <div class="saved-item-info">
        <div class="saved-item-title">${item.titulo}</div>
        <div class="saved-item-meta">${item.area} · ${item.fechaLimiteTexto}</div>
      </div>
      <button class="saved-item-remove" data-id="${item.id}" aria-label="Eliminar">×</button>
    `;
    list.appendChild(card);
  });

  // Listeners de eliminación individual
  list.querySelectorAll(".saved-item-remove").forEach((btn) => {
    btn.addEventListener("click", () => removeSavedItem(btn.dataset.id));
  });

  btnClear.style.display = "block";
}

/** Elimina una oportunidad por id */
function removeSavedItem(id) {
  const saved = readStorageArray(STORAGE_KEYS.saved).filter((x) => x.id !== id);
  writeStorage(STORAGE_KEYS.saved, saved);
  renderSavedList();
}

/** Limpia todas las oportunidades guardadas */
function clearAllSaved() {
  if (!confirm("¿Eliminar todas las oportunidades guardadas?")) return;
  writeStorage(STORAGE_KEYS.saved, []);
  renderSavedList();
}

/* ---------------------------------------------------------------
   6. INICIO Y SALIDA DE LA EXPERIENCIA AR
   --------------------------------------------------------------- */
async function startAR() {
  // 1. Diagnóstico: verificar que las librerías cargaron
  if (typeof AFRAME === "undefined") {
    showToast("Error: A-Frame no cargó. Revisa tu conexión.", "warning");
    return;
  }
  // AR.js puede registrarse como system o component según el build
  const arjsLoaded =
    (AFRAME.systems && AFRAME.systems["arjs"]) ||
    (AFRAME.components && AFRAME.components["arjs"]) ||
    typeof THREEx !== "undefined";
  if (!arjsLoaded) {
    showToast("Error: AR.js no cargó. Revisa tu conexión.", "warning");
    return;
  }

  // 2. Pedir permiso de cámara explícitamente (en el gesto del clic).
  //    Esto garantiza que el prompt aparezca antes de que AR.js intente nada.
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    // Liberamos el stream; AR.js abrirá el suyo.
    stream.getTracks().forEach((t) => t.stop());
  } catch (err) {
    console.error("Error de cámara:", err);
    if (err.name === "NotAllowedError") {
      showToast("Permiso de cámara denegado", "warning");
    } else if (err.name === "NotFoundError") {
      showToast("No se encontró cámara en este dispositivo", "warning");
    } else {
      showToast("Cámara no disponible: " + err.name, "warning");
    }
    return;
  }

  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("ar-screen").style.display = "block";
  document.body.classList.add("ar-active");

  // 3. Inyecta la escena AR sólo ahora (tras gesto y permiso concedido).
  const container = document.getElementById("ar-scene-container");
  if (!container.querySelector("a-scene")) {
    container.innerHTML = `
      <a-scene
        vr-mode-ui="enabled: false"
        embedded
        arjs="trackingMethod: best; sourceType: webcam; debugUIEnabled: true;"
        renderer="logarithmicDepthBuffer: true; precision: medium;">

        <a-nft
          id="marker"
          type="nft"
          url="markers/marcador_generico"
          smooth="true"
          smoothCount="10"
          smoothTolerance="0.01"
          smoothThreshold="5">

          <a-plane
            id="poster-plane"
            src="${POSTERS[0].poster}"
            position="0 0.5 0"
            rotation="-90 0 0"
            width="1"
            height="1.5"
            material="transparent: true; opacity: 1">
          </a-plane>

          <a-entity
            id="model-3d"
            gltf-model="${POSTERS[0].modelo3D}"
            position="0 1.5 0"
            scale="0.3 0.3 0.3"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear">
          </a-entity>
        </a-nft>

        <a-entity camera></a-entity>
      </a-scene>
    `;

    // Listeners AR cuando la escena haya cargado
    const scene = container.querySelector("a-scene");
    if (scene.hasLoaded) {
      setupARListeners();
    } else {
      scene.addEventListener("loaded", setupARListeners);
    }
  }

  // Aplica el primer póster (overlay HTML)
  applyPoster(0);
  // Forza redimensionamiento (ayuda al canvas a calcular dimensiones)
  setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
}

function exitAR() {
  // Recargamos para liberar recursos de la cámara y AR.js de forma limpia
  window.location.reload();
}

/* ---------------------------------------------------------------
   7. APLICAR / NAVEGAR ENTRE PÓSTERS
   --------------------------------------------------------------- */

/** Aplica el póster en el índice indicado y actualiza UI + escena AR */
function applyPoster(index) {
  currentIndex = (index + POSTERS.length) % POSTERS.length;
  const p = POSTERS[currentIndex];

  // --- Escena AR ---
  const plane = document.getElementById("poster-plane");
  const model = document.getElementById("model-3d");

  if (plane) {
    plane.setAttribute("src", p.poster);
    // Reaplica animación fade-in para transición suave
    plane.classList.remove("ar-fade");
    void plane.offsetWidth; // reflow para reiniciar animación CSS
    plane.classList.add("ar-fade");
  }
  if (model) {
    model.setAttribute("gltf-model", p.modelo3D);
  }

  // --- Overlay HTML ---
  document.getElementById("poster-indicator").textContent =
    (currentIndex + 1) + "/" + POSTERS.length;
  document.getElementById("poster-area").textContent = p.area;

  // Color de fondo de la toolbar (semitransparente)
  const toolbar = document.getElementById("ar-toolbar");
  toolbar.style.background = hexToRgba(p.color, 0.85);
}

/** Convierte un color hex (#rrggbb) a rgba con alpha dado */
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function nextPoster() { applyPoster(currentIndex + 1); }
function prevPoster() { applyPoster(currentIndex - 1); }

/* ---------------------------------------------------------------
   8. ACCIONES DE LA TOOLBAR
   --------------------------------------------------------------- */

/** GUARDAR: añade la oportunidad actual al localStorage si no está */
function actionGuardar() {
  const p = getCurrentPoster();
  const saved = readStorageArray(STORAGE_KEYS.saved);

  if (saved.some((x) => x.id === p.id)) {
    showToast("Ya estaba guardado", "warning");
    return;
  }

  saved.push({
    id: p.id,
    area: p.area,
    titulo: p.titulo,
    fechaLimiteTexto: p.fechaLimiteTexto,
    color: p.color
  });
  writeStorage(STORAGE_KEYS.saved, saved);
  renderSavedList(); // por si la pantalla welcome vuelve a mostrarse
  showToast("✓ Guardado en mis oportunidades", "success");
}

/** REQUISITOS: muestra el bottom sheet con la checklist persistida */
function actionRequisitos() {
  const p = getCurrentPoster();
  const checked = readStorageArray(STORAGE_KEYS.checklist(p.id));

  document.getElementById("sheet-title").textContent =
    "📋 Requisitos - " + p.titulo;

  const body = document.getElementById("sheet-body");
  body.innerHTML = "";

  p.requisitos.forEach((req, i) => {
    const isChecked = checked.includes(i);
    const label = document.createElement("label");
    label.className = "requisito-item" + (isChecked ? " checked" : "");
    label.innerHTML = `
      <input type="checkbox" data-index="${i}" ${isChecked ? "checked" : ""} />
      <span>${req}</span>
    `;
    body.appendChild(label);
  });

  // Listener para persistir cambios de checkbox
  body.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const idx = parseInt(cb.dataset.index, 10);
      let arr = readStorageArray(STORAGE_KEYS.checklist(p.id));
      if (cb.checked) {
        if (!arr.includes(idx)) arr.push(idx);
        cb.parentElement.classList.add("checked");
      } else {
        arr = arr.filter((x) => x !== idx);
        cb.parentElement.classList.remove("checked");
      }
      writeStorage(STORAGE_KEYS.checklist(p.id), arr);
    });
  });

  document.getElementById("sheet-overlay").style.display = "block";
  document.getElementById("requisitos-sheet").style.display = "flex";
}

function closeSheet() {
  document.getElementById("sheet-overlay").style.display = "none";
  document.getElementById("requisitos-sheet").style.display = "none";
}

/** RECORDATORIO: genera y descarga un .ics con la fecha límite */
function actionRecordatorio() {
  const p = getCurrentPoster();
  // Convertir "2026-06-30" -> "20260630"
  const dt = p.fechaLimite.replaceAll("-", "");
  // Para evento de día completo, DTEND debe ser el día siguiente (RFC 5545)
  const dtEnd = addOneDay(p.fechaLimite).replaceAll("-", "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Infografia Ubicua//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:" + p.id + "@infografia-ubicua",
    "DTSTAMP:" + formatDtStamp(new Date()),
    "DTSTART;VALUE=DATE:" + dt,
    "DTEND;VALUE=DATE:" + dtEnd,
    "SUMMARY:Recordatorio - " + p.titulo,
    "DESCRIPTION:" + p.descripcion,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  // Descarga del archivo
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "recordatorio-" + p.id + ".ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast("📅 Recordatorio descargado", "success");
}

/** Suma 1 día a una fecha en formato YYYY-MM-DD */
function addOneDay(yyyymmdd) {
  const d = new Date(yyyymmdd + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Formato YYYYMMDDTHHMMSSZ para DTSTAMP */
function formatDtStamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) + "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) + "Z"
  );
}

/** CONTACTAR: abre WhatsApp con mensaje pre-cargado */
function actionContactar() {
  const p = getCurrentPoster();
  const msg = encodeURIComponent("Hola, quiero más información sobre " + p.titulo);
  const url = `https://wa.me/${p.whatsapp}?text=${msg}`;
  window.open(url, "_blank");
}

/* ---------------------------------------------------------------
   9. EVENTOS DE AR (markerFound / markerLost)
   --------------------------------------------------------------- */
function setupARListeners() {
  const marker = document.getElementById("marker");
  if (!marker) {
    console.warn("[AR] No se encontró el elemento #marker");
    return;
  }

  console.log("[AR] Listeners conectados al marcador NFT");

  // Logs útiles para diagnosticar carga de archivos NFT
  marker.addEventListener("nftLoaded", () => {
    console.log("[AR] ✅ Archivos NFT cargados correctamente");
    setMarkerStatus("📷 Apunta al marcador", false);
  });
  marker.addEventListener("arjs-nft-loaded", () => {
    console.log("[AR] ✅ NFT inicializado");
  });

  marker.addEventListener("markerFound", () => {
    console.log("[AR] 🎯 Marcador detectado");
    setMarkerStatus("✓ Marcador detectado", true);
    const plane = document.getElementById("poster-plane");
    const model = document.getElementById("model-3d");
    [plane, model].forEach((el) => {
      if (!el) return;
      el.classList.remove("ar-fade");
      void el.offsetWidth;
      el.classList.add("ar-fade");
    });
  });

  marker.addEventListener("markerLost", () => {
    console.log("[AR] Marcador perdido");
    setMarkerStatus("🔍 Buscando marcador...", false);
  });

  // Verificación de que los archivos del marcador existen y son accesibles
  ["iset", "fset", "fset3"].forEach((ext) => {
    fetch("markers/marcador_generico." + ext, { method: "HEAD" })
      .then((r) => {
        if (!r.ok) console.error(`[AR] ❌ No se pudo cargar .${ext}: HTTP ${r.status}`);
        else console.log(`[AR] ✓ .${ext} accesible (${r.headers.get("content-length")} bytes)`);
      })
      .catch((e) => console.error(`[AR] ❌ Error cargando .${ext}:`, e));
  });
}

/** Actualiza el indicador de estado del marcador en pantalla */
function setMarkerStatus(text, found) {
  const el = document.getElementById("marker-status");
  const txt = document.getElementById("marker-status-text");
  if (!el || !txt) return;
  txt.textContent = text;
  el.classList.toggle("found", !!found);
}

/* ---------------------------------------------------------------
   10. INICIALIZACIÓN
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Pantalla de bienvenida
  renderSavedList();

  document.getElementById("btn-start-ar").addEventListener("click", startAR);
  document.getElementById("btn-clear-saved").addEventListener("click", clearAllSaved);

  // Pantalla AR
  document.getElementById("btn-back").addEventListener("click", exitAR);
  document.getElementById("btn-prev").addEventListener("click", prevPoster);
  document.getElementById("btn-next").addEventListener("click", nextPoster);

  // Toolbar de acciones
  document.querySelectorAll("#ar-toolbar .toolbar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switch (btn.dataset.action) {
        case "guardar":      actionGuardar(); break;
        case "requisitos":   actionRequisitos(); break;
        case "recordatorio": actionRecordatorio(); break;
        case "contactar":    actionContactar(); break;
      }
    });
  });

  // Bottom sheet
  document.getElementById("btn-close-sheet").addEventListener("click", closeSheet);
  document.getElementById("sheet-overlay").addEventListener("click", closeSheet);

  // Toggle del panel de debug
  const dbgBtn = document.getElementById("btn-toggle-debug");
  if (dbgBtn) {
    dbgBtn.addEventListener("click", () => {
      const p = document.getElementById("debug-panel");
      const collapsed = p.classList.toggle("collapsed");
      dbgBtn.textContent = collapsed ? "+" : "−";
    });
  }
});
