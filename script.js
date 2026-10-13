/* Commander Vrax — edit this block when the real values arrive.
   ca: a 0x address with 40 hex characters. Anything else stays "TBA".
   twitter: a full https link. Leave "" and the X buttons stay placeholders.
   Set telegram to false when there is no Telegram. That removes every Telegram control.
   Buy and chart URLs are written only when ca is a real address. */
const SITE = {
  ca: "0x0cdd8573965b6c5aa2e28d6d96eeee8a8755f3ce",
  twitter: "https://x.com/vraxrh_X",
  telegram: false,
  chainSlug: "robinhood"
};

const copyTimers = new WeakMap();

function isRealCa(value) {
  return /^0x[a-fA-F0-9]{40}$/.test((value || "").trim());
}

function isHttpUrl(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function buyUrl(ca) {
  return `https://app.uniswap.org/swap?chain=robinhood&outputCurrency=${ca}`;
}

function chartUrl(ca) {
  return `https://dexscreener.com/${SITE.chainSlug}/${ca}`;
}

function copyWithFallback(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, area.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  if (!ok) throw new Error("copy failed");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* Permission can fail even on a user click. Try the legacy path. */
    }
  }
  copyWithFallback(text);
}

function showCopied(button) {
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;
  button.textContent = "Copied!";
  button.classList.add("is-copied");
  const status = document.querySelector("[data-copy-status]");
  if (status) status.textContent = "Copied contract address.";
  clearTimeout(copyTimers.get(button));
  copyTimers.set(button, setTimeout(() => {
    button.textContent = original;
    button.classList.remove("is-copied");
    if (status) status.textContent = "";
  }, 1600));
}

function applyContract() {
  const ca = (SITE.ca || "").trim();
  const real = isRealCa(ca);
  const shown = real ? ca : "TBA";

  document.querySelectorAll("[data-ca]").forEach((node) => {
    node.textContent = shown;
    node.title = shown;
  });

  document.querySelectorAll("[data-buy]").forEach((link) => {
    if (!real) return;
    link.href = buyUrl(ca);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.removeAttribute("aria-disabled");
  });

  const chartLink = document.querySelector("[data-chart-link]");
  if (chartLink && real) {
    chartLink.href = chartUrl(ca);
    chartLink.target = "_blank";
    chartLink.rel = "noopener noreferrer";
    chartLink.removeAttribute("aria-disabled");
  }

  const frame = document.querySelector("[data-chart-frame]");
  if (frame && real && !frame.querySelector("iframe")) {
    const iframe = document.createElement("iframe");
    iframe.title = "VRAX live chart on DexScreener";
    iframe.src = `${chartUrl(ca)}?embed=1&theme=dark&trades=0&info=0`;
    iframe.loading = "lazy";
    iframe.allow = "fullscreen";
    frame.replaceChildren(iframe);
  }

  const note = document.querySelector("[data-ca-note]");
  if (note) {
    note.textContent = real
      ? "ETH pays the gas. Uniswap is the swap. Buy Now opens the pair for the published contract."
      : "ETH pays the gas. Uniswap is the swap. The contract on this page reads TBA until it is published.";
  }
}

function removeSocial(name) {
  document.querySelectorAll(`[data-social="${name}"]`).forEach((node) => {
    const block = node.closest("[data-social-block]");
    if (block) block.remove();
    else node.remove();
  });
}

function applySocial(name, value) {
  if (value === false) {
    removeSocial(name);
    return;
  }
  if (!isHttpUrl(value)) return;
  const url = value.trim();
  document.querySelectorAll(`[data-social="${name}"]`).forEach((link) => {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.removeAttribute("aria-disabled");
  });
}

function bindCopy() {
  const shown = () => {
    const node = document.querySelector("[data-ca]");
    return (node && node.textContent.trim()) || "TBA";
  };
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await copyText(shown());
        showCopied(button);
      } catch {
        const original = button.dataset.label || button.textContent;
        button.dataset.label = original === "Copied!" ? "Copy" : original;
        button.textContent = "Failed";
        clearTimeout(copyTimers.get(button));
        copyTimers.set(button, setTimeout(() => {
          button.textContent = "Copy";
        }, 1400));
      }
    });
  });
}

function bindPlaceholders() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[aria-disabled='true']");
    if (link) event.preventDefault();
  });
}

function bindMenu() {
  const button = document.querySelector("[data-menu]");
  const panel = document.querySelector("[data-menu-panel]");
  if (!button || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  button.addEventListener("click", () => setOpen(panel.hidden));
  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}

function bindScrollSpy() {
  const links = [...document.querySelectorAll("[data-nav]")];
  const sections = [...new Set(links.map((link) => document.querySelector(link.getAttribute("href"))))].filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      links.forEach((link) => {
        const active = link.getAttribute("href") === id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

applyContract();
applySocial("twitter", SITE.twitter);
applySocial("telegram", SITE.telegram);
bindCopy();
bindPlaceholders();
bindMenu();
bindScrollSpy();
