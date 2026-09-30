// SC 03 · The cold email
// Pinned. Scrolling types the email (a reconstruction of the one Oscar sent at 13).
// Hit Send (or keep scrolling): the paper plane flies, Harvard replies, the recruiting
// graphic slams onto the table, and the counter ticks up to four years together.

import { reduceMotion, formatNumber } from "../core/util.js";
import { sound } from "../core/sound.js";
import { scrollTo } from "../core/smooth.js";

const { gsap, ScrollTrigger } = window;

const SUBJECT = "Recruiting graphics for your program?";
const BODY = `Hi Coach,

I'm Oscar, a 13-year-old designer from LA. I made a few recruiting graphics for Harvard Basketball. My portfolio is attached.

If you like them, I'd love to make more for your program.

Thanks,
Oscar`;

export function initEmail() {
  const section = document.getElementById("cold-email");
  const subjectEl = document.getElementById("mail-subject");
  const bodyEl = document.getElementById("mail-body");
  const sendBtn = document.getElementById("mail-send");
  const mail = document.getElementById("mail");
  const plane = document.getElementById("plane");
  const reply = document.getElementById("reply");
  const card = document.getElementById("harvard-card");
  const meeting = document.getElementById("meeting-photo");
  const odo = document.querySelector("#impressions .odo-num");

  // Small honesty note: the email text is a reconstruction.
  const note = document.createElement("span");
  note.className = "mono";
  note.style.cssText = "position:absolute;right:16px;bottom:22px;font-size:10px;color:#6b665d";
  note.textContent = "(reconstructed)";
  mail.appendChild(note);

  let typedChars = -1;
  let sent = false;

  function type(p) {
    const total = SUBJECT.length + BODY.length;
    const n = Math.round(p * total);
    if (n === typedChars) return;
    if (n > typedChars && Math.random() < 0.5) sound.key();
    typedChars = n;
    const s = Math.min(n, SUBJECT.length);
    subjectEl.textContent = SUBJECT.slice(0, s);
    const b = Math.max(0, n - SUBJECT.length);
    bodyEl.innerHTML = escapeHtml(BODY.slice(0, b)) + (p < 1 ? '<span class="caret"></span>' : "");
    sendBtn.classList.toggle("is-ready", p >= 1);
  }

  const flight = gsap.timeline({ paused: true });
  flight
    .to(mail, { scale: 0.92, rotate: -2, y: 10, duration: 0.3, ease: "power2.in" })
    .set(plane, { opacity: 1, x: 0, y: 0, rotate: 0 })
    .to(plane, {
      keyframes: [
        { x: 60, y: -40, rotate: -10, duration: 0.3 },
        { x: 220, y: -180, rotate: -25, duration: 0.35 },
        { x: 480, y: -420, rotate: -35, opacity: 0, duration: 0.4 },
      ],
      ease: "power1.in",
    })
    .to(mail, { opacity: 0.25, filter: "blur(2px)", duration: 0.4 }, "<")
    .to(reply, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(2)" }, "+=0.15")
    .fromTo(
      card,
      { opacity: 0, y: -500, rotate: -18, scale: 1.15 },
      { opacity: 1, y: 0, rotate: 4, scale: 1, duration: 0.9, ease: "bounce.out" },
      "+=0.1"
    )
    .to(card, { rotate: 2.5, duration: 0.8, ease: "elastic.out(1, 0.35)" })
    // ...and the call became a meeting: the real photo drops onto the table.
    .fromTo(meeting, { opacity: 0, y: -300, rotate: 12 }, { opacity: 1, y: 0, rotate: -7, duration: 0.7, ease: "back.out(1.6)" }, "-=0.5");

  function send() {
    if (sent) return;
    sent = true;
    sendBtn.classList.add("is-sent");
    sendBtn.textContent = "Sent ✓";
    sound.whoosh();
    flight.play(0);
    setTimeout(() => sound.chime(), 900);
  }
  function unsend() {
    if (!sent) return;
    sent = false;
    sendBtn.classList.remove("is-sent");
    sendBtn.textContent = "Send";
    flight.pause(0);
    gsap.set([reply], { opacity: 0, y: -20, scale: 0.96 });
    gsap.set([card, meeting], { opacity: 0 });
    gsap.set(mail, { opacity: 1, filter: "none", scale: 1, rotate: 0, y: 0 });
    gsap.set(plane, { opacity: 0 });
  }

  let st = null;
  sendBtn.addEventListener("click", () => {
    if (!sendBtn.classList.contains("is-ready")) return;
    send();
    // Nudge the scroll forward so the rest of the scene plays in sync.
    if (st) scrollTo(st.start + (st.end - st.start) * 0.62);
  });

  if (reduceMotion) {
    type(1);
    send();
    flight.progress(1);
    odo.textContent = "4";
    return {};
  }

  const onUpdate = (self) => {
    const p = self.progress;
    type(Math.min(1, p / 0.5));
    if (p > 0.58) send();
    else unsend();
    // The years counter runs in the last third: 0 → 4 years with Harvard MBB
    const o = Math.max(0, Math.min(1, (p - 0.66) / 0.3));
    const eased = 1 - Math.pow(1 - o, 3);
    odo.textContent = formatNumber(eased * 4);
  };
  // Desktop pins the whole scene; phones pin just the stage.
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    st = ScrollTrigger.create({ trigger: section, start: "top top", end: "+=320%", pin: true, onUpdate });
  });
  mm.add("(max-width: 860px)", () => {
    const stage = section.querySelector(".stage--email");
    st = ScrollTrigger.create({ trigger: stage, start: "top 64px", end: "+=260%", pin: true, onUpdate });
  });

  return {};
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
