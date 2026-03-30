// ── Security helper ────────────────────────────
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── State ──────────────────────────────────────
let games = [];
let currentIndex = 0;

// ── Boot ───────────────────────────────────────
async function init() {
  try {
    const res = await fetch('games.json');
    games = await res.json();
    renderCarousel();
    renderGamesList();
  } catch (e) {
    document.getElementById('carousel-stage').innerHTML =
      '<p style="padding:2rem;text-align:center;color:var(--color-text-muted)">Erro ao carregar jogos.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);

// ── Helpers ────────────────────────────────────
function formatPrice(n) {
  return `R$\u00a0${escapeHTML(String(n))}`;
}

function waLink(nome) {
  const msg = encodeURIComponent(`Olá, tenho interesse em ${nome}!`);
  return `https://wa.me/5535997491542?text=${msg}`;
}

// ── Carousel render ────────────────────────────
function renderCarousel() {
  const stage = document.getElementById('carousel-stage');
  if (!games.length) return;
  const game = games[currentIndex];
  stage.innerHTML = buildCardHTML(game);
  updateArrows();
  probeImages(game.slug);
  // Refresh active thumb in games list
  document.querySelectorAll('.game-thumb').forEach((el, i) => {
    el.classList.toggle('game-thumb--active', i === currentIndex);
  });
}

function buildCardHTML(game) {
  const e = escapeHTML;

  const soldBadge = game.vendido
    ? `<span class="badge badge--sold">Vendido</span>`
    : `<span class="badge badge--condition">${e(game.condicao)}</span>`;

  const metaFields = [
    game.designer && `<span class="meta-item">${e(game.designer)}</span>`,
    game.ano      && `<span class="meta-item">${e(String(game.ano))}</span>`,
    game.editora  && `<span class="meta-item">${e(game.editora)}</span>`,
    game.idade    && `<span class="meta-item">${e(game.idade)}</span>`,
  ].filter(Boolean).join('');

  const ctaBtn = game.vendido
    ? `<button class="btn btn--whatsapp" type="button" disabled>Vendido</button>`
    : `<a class="btn btn--whatsapp" href="${e(waLink(game.nome))}" target="_blank" rel="noopener">Tenho interesse!</a>`;

  return `
    <article class="game-card" data-slug="${e(game.slug)}">
      <div class="card-counter">${currentIndex + 1} / ${games.length}</div>

      <div class="card-group card-group--headline">
        <h2 class="game-title">${e(game.nome)}</h2>
        <div class="game-headline-meta">
          <span class="game-price">${formatPrice(game.preco)}</span>
          ${soldBadge}
        </div>
      </div>

      <div class="card-group card-group--play">
        ${game.jogadores ? `<span class="play-item"><span class="play-icon" aria-hidden="true">👥</span>${e(game.jogadores)} jogadores</span>` : ''}
        ${game.duracao   ? `<span class="play-item"><span class="play-icon" aria-hidden="true">⏱</span>${e(game.duracao)}</span>` : ''}
      </div>

      ${metaFields ? `<div class="card-group card-group--meta">${metaFields}</div>` : ''}

      ${game.descricao ? `<p class="game-description">${e(game.descricao)}</p>` : ''}

      <div class="game-gallery" id="gallery-${e(game.slug)}">
        <!-- images injected by probeImages() -->
      </div>

      <div class="card-cta">
        ${ctaBtn}
      </div>
    </article>
  `;
}

function updateArrows() {
  document.querySelector('.carousel-arrow--prev').disabled = currentIndex === 0;
  document.querySelector('.carousel-arrow--next').disabled = currentIndex === games.length - 1;
}

// ── Arrow navigation ───────────────────────────
document.addEventListener('click', e => {
  if (e.target.closest('.carousel-arrow--prev') && currentIndex > 0) {
    currentIndex--;
    renderCarousel();
  } else if (e.target.closest('.carousel-arrow--next') && currentIndex < games.length - 1) {
    currentIndex++;
    renderCarousel();
  } else if (e.target.closest('.game-thumb')) {
    const idx = parseInt(e.target.closest('.game-thumb').dataset.index, 10);
    currentIndex = idx;
    renderCarousel();
    document.querySelector('.carousel-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (e.target.closest('#lightbox-close') || e.target.id === 'lightbox') {
    closeLightbox();
  } else if (e.target.closest('.gallery-thumb-btn')) {
    const btn = e.target.closest('.gallery-thumb-btn');
    openLightbox(btn.dataset.src, btn.dataset.idx);
  }
});

// ── Swipe gestures ─────────────────────────────
(function initSwipe() {
  let startX = 0;
  const stage = document.getElementById('carousel-stage');

  stage.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && currentIndex < games.length - 1) { currentIndex++; renderCarousel(); }
    if (dx > 0 && currentIndex > 0) { currentIndex--; renderCarousel(); }
  }, { passive: true });
})();

// ── Stub functions (implemented in later tasks) ─
function renderGamesList() { /* Task 7 */ }

// ── Image gallery ──────────────────────────────
async function probeImages(slug) {
  const gallery = document.getElementById(`gallery-${slug}`);
  if (!gallery) return;

  const found = [];
  for (let i = 1; i <= 20; i++) {
    const src = `jogos/${encodeURIComponent(slug)}/${i}.jpg`;
    const ok = await imageExists(src);
    if (!ok) break;
    found.push(src);
  }

  if (found.length === 0) return;

  const grid = document.createElement('div');
  grid.className = 'gallery-grid';

  found.forEach((src, idx) => {
    const btn = document.createElement('button');
    btn.className = 'gallery-thumb-btn';
    btn.type = 'button';
    btn.dataset.src = src;
    btn.dataset.idx = String(idx);
    btn.setAttribute('aria-label', `Ver imagem ${idx + 1}`);

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Imagem ${idx + 1} de ${escapeHTML(slug)}`;
    img.loading = 'lazy';

    btn.appendChild(img);
    grid.appendChild(btn);
  });

  gallery.appendChild(grid);
}

function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

// ── Lightbox ───────────────────────────────────
function openLightbox(src, idx) {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  img.src = src;
  img.alt = `Imagem ${parseInt(idx, 10) + 1}`;
  lb.showModal();
}

function closeLightbox() {
  document.getElementById('lightbox').close();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const lb = document.getElementById('lightbox');
    if (lb.open) lb.close();
  }
});
