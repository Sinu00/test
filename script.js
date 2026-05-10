// ── ScrollTrigger setup ───────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── Schedule flower — tracks scroll through the timeline ──────────────────
function initScheduleFlower() {
  const flower   = document.getElementById('timelineFlower');
  const timeline = document.getElementById('scheduleTimeline');
  if (!flower || !timeline) return;

  const items = timeline.querySelectorAll('.schedule-item');
  if (!items.length) return;

  const tlTop   = timeline.getBoundingClientRect().top + window.scrollY;
  const first   = items[0].getBoundingClientRect();
  const last    = items[items.length - 1].getBoundingClientRect();
  const startY  = (first.top + window.scrollY - tlTop) + first.height / 2;
  const endY    = (last.top  + window.scrollY - tlTop) + last.height  / 2;

  gsap.set(flower, { top: startY });
  gsap.to(flower, {
    top: endY,
    ease: 'none',
    scrollTrigger: {
      trigger: timeline,
      start:   'top 70%',
      end:     'bottom 30%',
      scrub:   1,
    },
  });
}

window.addEventListener('load', initScheduleFlower);

// ── Details flowers — set rotations matching hero bouquet ─────────────────
gsap.set("#detailsFlowers .df-red-small", { rotate: -18, transformOrigin: "bottom right" });
gsap.set("#detailsFlowers .df-red-large", { rotate:   8, transformOrigin: "bottom left"  });

// ── Hero entrance animation (GSAP) ───────────────────────────────────────
function animateHero(delay = 0) {
  // Set bouquet rotations via GSAP so they don't fight the y-animation
  gsap.set(".f-red-small", { rotate: -18, transformOrigin: "bottom right" });
  gsap.set(".f-red-large", { rotate:   8, transformOrigin: "bottom left"  });

  gsap.timeline({ defaults: { ease: "power3.out" }, delay })
    .from(".hero-bismillah",       { opacity: 0, y: 22, duration: 1 })
    .from(".hero-kicker",          { opacity: 0, y: 28, duration: 1.1 }, "-=0.55")
    .from(".hero-date",            { opacity: 0, y: 28, duration: 1.1 }, "-=0.65")
    .from(".hero-copy h1",         { opacity: 0, y: 44, duration: 1.5 }, "-=0.75")
    .from(".hero-flowers .flower", { opacity: 0, y: 32, duration: 1,  stagger: 0.1 }, "-=1");
}

// ── Mobile detection ──────────────────────────────────────────────────────
const isMobile = window.innerWidth < 768;

const introOverlay      = document.getElementById("introOverlay");
const invitationContent = document.getElementById("invitationContent");

function revealContent() {
  introOverlay.classList.add("overlay-hidden");
  invitationContent.classList.add("content-visible");
  invitationContent.setAttribute("aria-hidden", "false");
}

if (!isMobile) {
  invitationContent.setAttribute("aria-hidden", "false");
  // Slight delay for the video to start before text animates in
  animateHero(0.6);
} else {
  // Mobile: 4-flap cinematic envelope
  const envScene = document.getElementById("envScene");
  const sealArea = document.getElementById("sealArea");
  const sealBtn  = document.getElementById("sealBtn");
  const sealRipple = document.getElementById("sealRipple");
  let opened = false;
  let inviteMusic = null;

  function startInviteMusic() {
    if (!inviteMusic) {
      inviteMusic = new Audio("./assets/music.mp3");
      inviteMusic.loop = true;
    }
    inviteMusic.play().catch(() => {});
  }

  /* Wax seal zoom+fade (~1s), then flaps open — timings must match styles.css */
  const SEAL_EXIT_MS = 1050;
  const FLAP_LONGEST_MS = 720 + 4200; /* bottom flap delay + duration */

  sealBtn.addEventListener("click", () => {
    if (opened) return;
    opened = true;

    startInviteMusic();

    sealRipple.classList.add("is-bursting");
    sealArea.classList.add("is-tapped");

    // Hero starts as the envelope begins to open (after seal exits).
    animateHero(SEAL_EXIT_MS / 1000);

    window.setTimeout(() => {
      envScene.classList.add("is-open");
    }, SEAL_EXIT_MS);

    window.setTimeout(revealContent, SEAL_EXIT_MS + FLAP_LONGEST_MS + 320);
  });
}

// ── Countdown timer ───────────────────────────────────────────────────────
// Wedding day: 4 July 2026, 4:00 p.m. (change if your ceremony time differs).
const weddingDate = new Date("2026-07-04T16:00:00");

function pad(n) { return String(n).padStart(2, "0"); }

function tick() {
  const diff = weddingDate - Date.now();

  if (diff <= 0) {
    ["cd-days", "cd-hours", "cd-mins", "cd-secs"].forEach(
      (id) => (document.getElementById(id).textContent = "00")
    );
    return;
  }

  document.getElementById("cd-days").textContent  = pad(Math.floor(diff / 86400000));
  document.getElementById("cd-hours").textContent = pad(Math.floor((diff % 86400000) / 3600000));
  document.getElementById("cd-mins").textContent  = pad(Math.floor((diff % 3600000)  / 60000));
  document.getElementById("cd-secs").textContent  = pad(Math.floor((diff % 60000)    / 1000));
}

tick();
setInterval(tick, 1000);

// ── RSVP form (guard: form is removed if section is replaced) ────────────
const rsvpForm = document.getElementById("rsvpForm");
if (rsvpForm) {
  rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) { e.target.reportValidity(); return; }
    e.target.hidden = true;
    document.getElementById("rsvpThanks").hidden = false;
  });
}

// ── RSVP modal → Formspree (free inbox at https://formspree.io) ─────────
(function initRsvpDialog() {
  const dialog = document.getElementById("rsvpDialog");
  const openBtn = document.getElementById("rsvpOpenBtn");
  const closeX = document.getElementById("rsvpDialogCloseX");
  const form = document.getElementById("rsvpModalForm");
  const formWrap = document.getElementById("rsvpDialogFormWrap");
  const thanks = document.getElementById("rsvpDialogThanks");
  const thanksClose = document.getElementById("rsvpDialogThanksClose");
  const dismissBtn = document.getElementById("rsvpDialogDismiss");
  const errEl = document.getElementById("rsvpDialogError");
  const submitBtn = document.getElementById("rsvpDialogSubmit");
  const guestInput = document.getElementById("rsvpGuestCount");
  const guestHint = document.getElementById("rsvpGuestCountHint");

  if (!dialog || !openBtn || typeof dialog.showModal !== "function") return;

  const FORMSPREE_PLACEHOLDER = "YOUR_FORMSPREE_FORM_ID";

  function syncGuestFieldForAttend() {
    if (!form || !guestInput || !guestHint) return;
    const sel = form.querySelector('input[name="will_attend"]:checked');
    if (!sel) {
      guestInput.disabled = true;
      guestInput.value = "";
      guestHint.textContent = "Select whether you will attend first.";
      return;
    }
    if (sel.value === "Yes") {
      guestInput.disabled = false;
      guestHint.textContent = "Include yourself in the total.";
    } else {
      guestInput.disabled = true;
      guestInput.value = "";
      guestHint.textContent = "Not needed if you cannot attend.";
    }
  }

  function hideError() {
    if (!errEl) return;
    errEl.hidden = true;
    errEl.textContent = "";
  }

  function showError(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.hidden = false;
  }

  function resetModalState() {
    if (form) form.reset();
    syncGuestFieldForAttend();
    if (formWrap) formWrap.hidden = false;
    if (thanks) thanks.hidden = true;
    hideError();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit RSVP";
    }
  }

  openBtn.addEventListener("click", () => {
    resetModalState();
    dialog.showModal();
    syncGuestFieldForAttend();
  });

  if (closeX) closeX.addEventListener("click", () => dialog.close());
  if (dismissBtn) dismissBtn.addEventListener("click", () => dialog.close());
  if (thanksClose) thanksClose.addEventListener("click", () => dialog.close());

  dialog.addEventListener("close", resetModalState);

  form?.querySelectorAll('input[name="will_attend"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      hideError();
      syncGuestFieldForAttend();
    });
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const action = form.getAttribute("action") || "";
    if (action.includes(FORMSPREE_PLACEHOLDER)) {
      showError(
        "RSVP form is not connected yet. Replace YOUR_FORMSPREE_FORM_ID in index.html with your Formspree form ID (see comment above the dialog)."
      );
      return;
    }

    const attend = form.querySelector('input[name="will_attend"]:checked');
    if (!attend) {
      showError("Please choose whether you will attend.");
      return;
    }

    if (attend.value === "Yes") {
      const n = parseInt(String(guestInput?.value || "").trim(), 10);
      if (!Number.isFinite(n) || n < 1) {
        showError("Please enter how many people will attend (at least 1, including you).");
        guestInput?.focus();
        return;
      }
    } else if (guestInput) {
      guestInput.disabled = false;
      guestInput.value = "0";
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && data.error) ||
          (Array.isArray(data.errors) && data.errors[0] && data.errors[0].message) ||
          "Something went wrong. Please try again later.";
        showError(typeof msg === "string" ? msg : "Submission failed. Please try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit RSVP";
        syncGuestFieldForAttend();
        return;
      }

      if (formWrap) formWrap.hidden = true;
      if (thanks) thanks.hidden = false;
    } catch {
      showError("Network error. Check your connection and try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit RSVP";
      syncGuestFieldForAttend();
    }
  });

  syncGuestFieldForAttend();
})();
