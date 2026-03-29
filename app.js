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

// ── Stub functions (implemented in later tasks) ─
function probeImages(slug) { /* Task 6 */ }
function renderGamesList() { /* Task 7 */ }
function openLightbox(src, idx) { /* Task 6 */ }
function closeLightbox() { /* Task 6 */ }
