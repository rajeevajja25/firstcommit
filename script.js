// ---------------------------------------------------------------------------
// Mode switching (Rewrite <-> Decode)
// ---------------------------------------------------------------------------

const tabRewrite = document.getElementById("tab-rewrite");
const tabDecode = document.getElementById("tab-decode");
const panelRewrite = document.getElementById("panel-rewrite");
const panelDecode = document.getElementById("panel-decode");

function showMode(mode) {
  const isRewrite = mode === "rewrite";
  tabRewrite.classList.toggle("is-active", isRewrite);
  tabDecode.classList.toggle("is-active", !isRewrite);
  tabRewrite.setAttribute("aria-selected", String(isRewrite));
  tabDecode.setAttribute("aria-selected", String(!isRewrite));
  panelRewrite.hidden = !isRewrite;
  panelDecode.hidden = isRewrite;
}

tabRewrite.addEventListener("click", () => showMode("rewrite"));
tabDecode.addEventListener("click", () => showMode("decode"));

// ---------------------------------------------------------------------------
// Tone chips (rewrite mode)
// ---------------------------------------------------------------------------

let selectedTone = document.querySelector(".chip.is-active").dataset.tone;

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    selectedTone = chip.dataset.tone;
  });
});

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function setHidden(el, hidden) {
  el.hidden = hidden;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

// ---------------------------------------------------------------------------
// Rewrite mode
// ---------------------------------------------------------------------------

const rewriteForm = document.getElementById("rewrite-form");
const rewriteResult = document.getElementById("rewrite-result");
const rewriteOutput = document.getElementById("rewrite-output");
const rewriteWhy = document.getElementById("rewrite-why");
const rewriteAltWrap = document.getElementById("rewrite-alt-wrap");
const rewriteAltToggle = document.getElementById("rewrite-alt-toggle");
const rewriteAlt = document.getElementById("rewrite-alt");
const rewriteError = document.getElementById("rewrite-error");
const rewriteLoading = document.getElementById("rewrite-loading");

rewriteAltToggle.addEventListener("click", () => {
  const expanded = rewriteAltToggle.getAttribute("aria-expanded") === "true";
  rewriteAltToggle.setAttribute("aria-expanded", String(!expanded));
  rewriteAlt.hidden = expanded;
  rewriteAltToggle.textContent = expanded ? "Show another option" : "Hide";
});

rewriteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("rewrite-message").value;
  const recipient = document.getElementById("rewrite-recipient").value;

  setHidden(rewriteResult, true);
  setHidden(rewriteError, true);
  setHidden(rewriteLoading, false);

  try {
    const data = await postJSON("/api/rewrite", { message, recipient, tone: selectedTone });

    rewriteOutput.textContent = data.rewritten;
    rewriteWhy.textContent = data.why || "";

    if (data.alt && data.alt.trim()) {
      rewriteAltWrap.hidden = false;
      rewriteAlt.textContent = data.alt;
      rewriteAlt.hidden = true;
      rewriteAltToggle.setAttribute("aria-expanded", "false");
      rewriteAltToggle.textContent = "Show another option";
    } else {
      rewriteAltWrap.hidden = true;
    }

    setHidden(rewriteResult, false);
  } catch (err) {
    rewriteError.textContent = err.message;
    setHidden(rewriteError, false);
  } finally {
    setHidden(rewriteLoading, true);
  }
});

// ---------------------------------------------------------------------------
// Decode mode
// ---------------------------------------------------------------------------

const decodeForm = document.getElementById("decode-form");
const decodeResult = document.getElementById("decode-result");
const decodeMeaning = document.getElementById("decode-meaning");
const decodeSubtext = document.getElementById("decode-subtext");
const decodeAmbiguous = document.getElementById("decode-ambiguous");
const decodeQuestion = document.getElementById("decode-question");
const decodeError = document.getElementById("decode-error");
const decodeLoading = document.getElementById("decode-loading");

decodeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("decode-message").value;
  const context = document.getElementById("decode-context").value;

  setHidden(decodeResult, true);
  setHidden(decodeError, true);
  setHidden(decodeLoading, false);

  try {
    const data = await postJSON("/api/decode", { message, context });

    decodeMeaning.textContent = data.meaning;

    if (data.subtext && data.subtext.trim()) {
      decodeSubtext.textContent = "Reading between the lines: " + data.subtext;
      decodeSubtext.hidden = false;
    } else {
      decodeSubtext.hidden = true;
    }

    if (data.is_ambiguous) {
      decodeQuestion.textContent = data.suggested_question || "";
      decodeAmbiguous.hidden = false;
    } else {
      decodeAmbiguous.hidden = true;
    }

    setHidden(decodeResult, false);
  } catch (err) {
    decodeError.textContent = err.message;
    setHidden(decodeError, false);
  } finally {
    setHidden(decodeLoading, true);
  }
});

// ---------------------------------------------------------------------------
// Copy buttons
// ---------------------------------------------------------------------------

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    navigator.clipboard.writeText(target.textContent).then(() => {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = original), 1500);
    });
  });
});
