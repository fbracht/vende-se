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
let lightboxImages = [];
let lightboxIndex = 0;

// ── Boot ───────────────────────────────────────
async function init() {
  try {
    const res = await fetch('games.json');
    games = await res.json();
    await Promise.all([renderCarousel(), renderGamesList()]);
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
async function renderCarousel() {
  const stage = document.getElementById('carousel-stage');
  if (!games.length) return;
  const index = currentIndex;
  const game = games[index];

  const { boxArt, gallery } = await probeImages(game.slug);
  if (currentIndex !== index) return;

  stage.innerHTML = buildCardHTML(game, boxArt, index);
  updateArrows();
  renderGallery(game.slug, gallery);

  // Refresh active thumb in games list
  document.querySelectorAll('.game-thumb').forEach((el, i) => {
    el.classList.toggle('game-thumb--active', i === index);
  });
}

function buildCardHTML(game, boxArt = null, index = currentIndex) {
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

  const boxArtCol = boxArt
    ? `<div class="card-box-art"><img src="${e(boxArt)}" alt="Box art de ${e(game.nome)}" loading="lazy" /></div>`
    : '';

  return `
    <article class="game-card${boxArt ? ' game-card--with-art' : ''}" data-slug="${e(game.slug)}">
      <div class="card-counter">${index + 1} / ${games.length}</div>

      <div class="card-meta">
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
          <!-- images injected by renderGallery() -->
        </div>

        <div class="card-cta">
          ${ctaBtn}
        </div>
      </div>

      ${boxArtCol}
    </article>
  `;
}

function renderGallery(slug, images) {
  const container = document.getElementById(`gallery-${slug}`);
  if (!container || images.length === 0) return;

  const grid = document.createElement('div');
  grid.className = 'gallery-grid';

  images.forEach((src, idx) => {
    const btn = document.createElement('button');
    btn.className = 'gallery-thumb-btn';
    btn.type = 'button';
    btn.dataset.src = src;
    btn.dataset.idx = String(idx);
    btn.dataset.images = JSON.stringify(images);
    btn.setAttribute('aria-label', `Ver imagem ${idx + 1}`);

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Imagem ${idx + 1} de ${escapeHTML(slug)}`;
    img.loading = 'lazy';

    btn.appendChild(img);
    grid.appendChild(btn);
  });

  container.appendChild(grid);
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
  } else if (e.target.closest('#lightbox-prev')) {
    lightboxNavigate(-1);
  } else if (e.target.closest('#lightbox-next')) {
    lightboxNavigate(+1);
  } else if (e.target.closest('.gallery-thumb-btn')) {
    const btn = e.target.closest('.gallery-thumb-btn');
    openLightbox(btn.dataset.src, btn.dataset.idx, JSON.parse(btn.dataset.images));
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

// ── Games list ─────────────────────────────────
async function renderGamesList() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;

  const boxArts = await Promise.all(
    games.map(g => probeImageSrc(g.slug, 1))
  );

  grid.innerHTML = '';
  games.forEach((g, i) => {
    const boxArt = boxArts[i];

    const btn = document.createElement('button');
    btn.className = [
      'game-thumb',
      boxArt ? 'game-thumb--with-art' : '',
      g.vendido ? 'game-thumb--sold' : '',
      i === currentIndex ? 'game-thumb--active' : ''
    ].filter(Boolean).join(' ');
    btn.type = 'button';
    btn.dataset.index = String(i);
    btn.setAttribute('aria-label', g.nome + (g.vendido ? ' (Vendido)' : ''));

    if (boxArt) {
      const artDiv = document.createElement('div');
      artDiv.className = 'thumb-art';
      const img = document.createElement('img');
      img.src = boxArt;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.loading = 'lazy';
      artDiv.appendChild(img);
      btn.appendChild(artDiv);
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'game-thumb-name';
    nameSpan.textContent = g.nome;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'game-thumb-price';
    priceSpan.textContent = g.vendido ? 'Vendido' : `R$\u00a0${g.preco}`;

    btn.appendChild(nameSpan);
    btn.appendChild(priceSpan);
    grid.appendChild(btn);
  });
}

// ── Image gallery ──────────────────────────────
async function probeImageSrc(slug, n) {
  for (const ext of ['jpg', 'jpeg']) {
    const src = `jogos/${encodeURIComponent(slug)}/${n}.${ext}`;
    if (await imageExists(src)) return src;
  }
  return null;
}

async function probeImages(slug) {
  const boxArt = await probeImageSrc(slug, 1);

  const gallery = [];
  for (let i = 2; i <= 20; i++) {
    const src = await probeImageSrc(slug, i);
    if (!src) break;
    gallery.push(src);
  }

  return { boxArt, gallery };
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
function openLightbox(src, idx, images) {
  lightboxImages = images || [src];
  lightboxIndex  = parseInt(idx, 10);
  const lb = document.getElementById('lightbox');
  updateLightboxImage();
  lb.showModal();
}

function updateLightboxImage() {
  const img  = document.getElementById('lightbox-img');
  const prev = document.getElementById('lightbox-prev');
  const next = document.getElementById('lightbox-next');
  img.src = lightboxImages[lightboxIndex];
  img.alt = `Imagem ${lightboxIndex + 1} de ${lightboxImages.length}`;
  prev.disabled = lightboxIndex === 0;
  next.disabled = lightboxIndex === lightboxImages.length - 1;
}

function lightboxNavigate(dir) {
  const newIdx = lightboxIndex + dir;
  if (newIdx < 0 || newIdx >= lightboxImages.length) return;
  lightboxIndex = newIdx;
  updateLightboxImage();
}

function closeLightbox() {
  document.getElementById('lightbox').close();
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb.open) return;
  if (e.key === 'Escape') lb.close();
  if (e.key === 'ArrowLeft')  lightboxNavigate(-1);
  if (e.key === 'ArrowRight') lightboxNavigate(+1);
});
