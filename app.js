const $ = (sel) => document.querySelector(sel);

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(el._t);
  el._t = window.setTimeout(() => el.classList.remove("show"), 1800);
}

function setTheme(theme) {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) setTheme(saved);
}

async function loadData() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar data.json");
  return res.json();
}

function renderHero(data) {
  $("#heroPill").textContent = data.yearLabel ?? "Mi Año";
  $("#heroTitle").textContent = data.hero?.title ?? "Mi Año en Wrap";
  $("#heroSubtitle").textContent = data.hero?.subtitle ?? "";
  const img = $("#heroImage");
  const heroLink = $("#heroLightbox");
  img.src = data.hero?.image ?? img.src;
  img.alt = data.hero?.imageAlt ?? img.alt;
  heroLink.href = data.hero?.image ?? img.src;
  heroLink.dataset.title = data.hero?.title ?? "Mi Año en Wrap";
  $("#closingTitle").textContent = data.closing?.title ?? "Cierre";
  $("#closingText").textContent = data.closing?.text ?? "";
}

function renderMoments(sections) {
  const wrap = $("#momentsSections");
  wrap.innerHTML = "";

  (sections ?? []).forEach((section, sectionIdx) => {
    const block = document.createElement("section");
    block.className = "section";
    block.id = sectionIdx === 0 ? "momentos" : `momentos-${sectionIdx + 1}`;

    const head = document.createElement("div");
    head.className = "section__head";

    const title = document.createElement("h2");
    title.textContent = section.title ?? `Top ${sectionIdx + 1}`;
    head.appendChild(title);

    if (section.intro) {
      const intro = document.createElement("p");
      intro.className = "muted";
      intro.textContent = section.intro;
      head.appendChild(intro);
    }

    const container = document.createElement("div");
    container.className = "container";
    container.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "grid";

    (section.items ?? []).forEach((m, idx) => {
      const card = document.createElement("article");
      card.className = "card";
      card.setAttribute("data-aos", "fade-up");
      card.setAttribute("data-aos-delay", String(Math.min(idx * 60, 240)));

      const tags = (m.tags ?? []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");

      card.innerHTML = `
        <a class="card__media glightbox glightbox-moment" href="${escapeAttr(m.image)}" data-gallery="moments" data-title="${escapeAttr(m.title)}">
          <span class="badge">TOP ${escapeHtml(String(m.rank ?? (idx + 1)))}</span>
          <img src="${escapeAttr(m.image)}" alt="${escapeAttr(m.alt ?? m.title)}" loading="lazy" />
        </a>
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(m.title ?? "Momento")}</h3>
          <p class="card__text">${escapeHtml(m.text ?? "")}</p>
          <div class="card__tags">${tags}</div>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);
    block.appendChild(container);
    wrap.appendChild(block);
  });
}

function animateCount(el, to, suffix = "") {
  const dur = 900;
  const start = performance.now();
  const from = 0;

  function step(t) {
    const p = Math.min((t - start) / dur, 1);
    const val = Math.round(from + (to - from) * p);
    el.textContent = `${val}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderStats(stats) {
  const grid = $("#statsGrid");
  grid.innerHTML = "";

  stats.forEach((s, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "stat";
    wrap.setAttribute("data-aos", "fade-up");
    wrap.setAttribute("data-aos-delay", String(Math.min(idx * 60, 240)));

    wrap.innerHTML = `
      <p class="stat__num" data-target="${escapeAttr(String(s.value ?? 0))}" data-suffix="${escapeAttr(s.suffix ?? "")}">0</p>
      <p class="stat__label">${escapeHtml(s.label ?? "")}</p>
    `;
    grid.appendChild(wrap);
  });

  // Trigger count when visible
  const nums = grid.querySelectorAll(".stat__num");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.dataset.done) return;
      el.dataset.done = "1";
      const to = Number(el.dataset.target || "0");
      const suffix = el.dataset.suffix || "";
      animateCount(el, to, suffix);
    });
  }, { threshold: 0.35 });

  nums.forEach(n => io.observe(n));
}

function toYouTubeEmbed(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "shorts" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function renderVideos(videos) {
  const grid = $("#videosGrid");
  grid.innerHTML = "";

  videos.forEach((v, idx) => {
    const card = document.createElement("div");
    card.className = "video";
    card.setAttribute("data-aos", "fade-up");
    card.setAttribute("data-aos-delay", String(Math.min(idx * 80, 240)));

    const embedUrl = toYouTubeEmbed(v.url);
    const fallbackText = embedUrl ? "" : `<p class="video__fallback">No pude embeber este video.</p>`;

    card.innerHTML = `
      <div class="video__embed">
        ${embedUrl ? `<iframe src="${escapeAttr(embedUrl)}" title="${escapeAttr(v.caption ?? "Video")}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : ""}
      </div>
      ${fallbackText}
      <p class="video__cap">${escapeHtml(v.caption ?? "")}</p>
    `;
    grid.appendChild(card);
  });
}

function copyLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url)
    .then(() => toast("Link copiado ✅"))
    .catch(() => toast("No pude copiar el link 😅"));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, "&#96;");
}

function pickRandomMoment(moments) {
  if (!moments?.length) return null;
  return moments[Math.floor(Math.random() * moments.length)];
}

(async function main() {
  initTheme();

  $("#themeToggle").addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    setTheme(isLight ? "dark" : "light");
    toast(isLight ? "Modo oscuro 🌙" : "Modo claro ☀️");
  });

  $("#copyLink").addEventListener("click", copyLink);
  $("#copyLink2").addEventListener("click", copyLink);

  AOS.init({ once: true, duration: 650, offset: 80 });

  const data = await loadData();
  renderHero(data);

  const allMoments = (data.momentsSections ?? []).flatMap(section => section.items ?? []);
  renderMoments(data.momentsSections ?? []);
  renderStats(data.stats ?? []);
  renderVideos(data.videos ?? []);

  const lightbox = GLightbox({ selector: ".glightbox-moment", touchNavigation: true, loop: true });
  GLightbox({ selector: ".glightbox-hero", touchNavigation: true, loop: true });

  $("#shuffleMoment").addEventListener("click", () => {
    const m = pickRandomMoment(allMoments);
    if (!m) return;
    // abre en lightbox el momento random
    lightbox.openAt(allMoments.findIndex(x => x.image === m.image));
    toast(`Momento random: ${m.title}`);
  });
})();
