// ═══════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════
const htmlTag = document.documentElement;
const themeBtn = document.getElementById('themeToggle');

const savedTheme = localStorage.getItem('theme') || 'light';
htmlTag.setAttribute('data-theme', savedTheme);

themeBtn.addEventListener('click', () => {
  const next = htmlTag.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  htmlTag.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ═══════════════════════════════════════
// AUTH ADMIN — MOT DE PASSE
// ═══════════════════════════════════════
const ADMIN_PASSWORD = 'ange2025!';
const AUTH_KEY = 'al_admin_auth';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 heures

function isAdminAuthenticated() {
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  if (!auth) return false;
  if (Date.now() - auth.time > SESSION_DURATION) {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
  return true;
}

function setAdminAuth() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ time: Date.now() }));
}

function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
  updateAdminUI();
}

function updateAdminUI() {
  const isAuth = isAdminAuthenticated();
  const writeBtn = document.getElementById('openBlogModal');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminBadge = document.getElementById('adminBadge');

  if (isAuth) {
    if (writeBtn) writeBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (adminBadge) adminBadge.style.display = 'inline-flex';
  } else {
    if (writeBtn) writeBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (adminBadge) adminBadge.style.display = 'none';
  }
}

// Ouvrir modal auth
document.getElementById('openBlogModal')?.addEventListener('click', () => {
  if (!isAdminAuthenticated()) {
    openAuthModal(() => openWriteModal());
    return;
  }
  openWriteModal();
});

// Bouton connexion admin (discret, en bas de la section blog)
document.getElementById('adminLoginBtn')?.addEventListener('click', () => {
  if (isAdminAuthenticated()) {
    logoutAdmin();
  } else {
    openAuthModal(null);
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);

function openAuthModal(callback) {
  const modal = document.getElementById('authModal');
  const input = document.getElementById('authPassword');
  const error = document.getElementById('authError');
  input.value = '';
  error.style.display = 'none';
  modal.classList.add('open');

  document.getElementById('authSubmitBtn').onclick = () => {
    if (input.value === ADMIN_PASSWORD) {
      setAdminAuth();
      modal.classList.remove('open');
      updateAdminUI();
      if (callback) callback();
    } else {
      error.style.display = 'block';
      input.value = '';
    }
  };

  // Permettre Enter
  input.onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('authSubmitBtn').click();
  };
}

document.getElementById('closeAuthModal')?.addEventListener('click', () => {
  document.getElementById('authModal').classList.remove('open');
});

// ═══════════════════════════════════════
// BLOG — STOCKAGE
// ═══════════════════════════════════════
let blogPosts = JSON.parse(localStorage.getItem('ange_blog_full') || '[]');

function saveBlog() {
  localStorage.setItem('ange_blog_full', JSON.stringify(blogPosts));
}

// Migration ancien format
if (blogPosts.length && !blogPosts[0].likes) {
  blogPosts = blogPosts.map(p => ({ ...p, likes: p.likes || 0, likedBy: [], comments: p.comments || [] }));
  saveBlog();
}

const BLOG_COLORS = [
  'linear-gradient(135deg,#8b5cf6,#2dd4bf)',
  'linear-gradient(135deg,#f97316,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#10b981,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
];
const BLOG_EMOJIS = ['✍️','💡','🚀','📱','🌐','🔧','📖','⚡','🎯','🛠️'];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderBlogList() {
  const container = document.getElementById('blogContainer');
  if (!container) return;

  if (!blogPosts.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-light);">
        <i class="fas fa-feather-alt" style="font-size:3rem; opacity:0.4;"></i>
        <p style="margin-top:1rem;">Aucun article pour le moment.</p>
      </div>`;
    return;
  }

  container.innerHTML = blogPosts.slice().reverse().map((post, idx) => {
    const realIdx = blogPosts.length - 1 - idx;
    const color = BLOG_COLORS[realIdx % BLOG_COLORS.length];
    const emoji = BLOG_EMOJIS[realIdx % BLOG_EMOJIS.length];
    const isAuth = isAdminAuthenticated();

    return `
    <div class="blog-card">
      <div class="blog-card-img" style="background:${color}">${emoji}</div>
      <div class="blog-card-body">
        <div>
          <span class="badge-glow">${escapeHtml(post.category)}</span>
          <span style="font-size:0.7rem; color:var(--text-light); margin-left:6px;">${post.date || ''}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt || post.content.substring(0, 90) + '…')}</p>
        <div class="blog-actions">
          <button class="btn-outline" style="padding:0.3rem 1rem;" onclick="openFullPost(${realIdx})">
            <i class="fas fa-book-open"></i> Lire
          </button>
          ${isAuth ? `
          <div style="display:flex;gap:8px;">
            <button style="background:none;border:none;cursor:pointer;color:var(--text-light);" onclick="editPost(${realIdx})" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button style="background:none;border:none;cursor:pointer;color:#f97316;" onclick="deletePost(${realIdx})" title="Supprimer">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// MODAL ÉCRITURE
// ═══════════════════════════════════════
let editIndex = -1;

function openWriteModal(idx = -1) {
  editIndex = idx;
  const modal = document.getElementById('blogModal');
  const title = document.getElementById('modalTitle');

  if (idx >= 0) {
    const p = blogPosts[idx];
    document.getElementById('articleTitle').value = p.title;
    document.getElementById('articleCategory').value = p.category;
    document.getElementById('articleExcerpt').value = p.excerpt || '';
    document.getElementById('articleContent').value = p.content;
    title.textContent = '✏️ Modifier l\'article';
  } else {
    document.getElementById('articleTitle').value = '';
    document.getElementById('articleCategory').value = 'Dev Web';
    document.getElementById('articleExcerpt').value = '';
    document.getElementById('articleContent').value = '';
    title.textContent = '✍️ Nouvel article';
  }

  modal.classList.add('open');
}

function closeBlogModal() {
  document.getElementById('blogModal').classList.remove('open');
  editIndex = -1;
}

document.getElementById('closeModalBtn')?.addEventListener('click', closeBlogModal);
document.getElementById('cancelModalBtn')?.addEventListener('click', closeBlogModal);

document.getElementById('saveArticleBtn')?.addEventListener('click', () => {
  if (!isAdminAuthenticated()) {
    alert('Session expirée. Veuillez vous reconnecter.');
    closeBlogModal();
    return;
  }

  const title = document.getElementById('articleTitle').value.trim();
  const content = document.getElementById('articleContent').value.trim();
  if (!title || !content) { alert('Titre et contenu requis.'); return; }

  const post = {
    title,
    content,
    category: document.getElementById('articleCategory').value,
    excerpt: document.getElementById('articleExcerpt').value.trim() || title,
    date: new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }),
    likes: editIndex >= 0 ? blogPosts[editIndex].likes : 0,
    likedBy: editIndex >= 0 ? blogPosts[editIndex].likedBy : [],
    comments: editIndex >= 0 ? blogPosts[editIndex].comments : [],
  };

  if (editIndex >= 0) {
    blogPosts[editIndex] = post;
  } else {
    blogPosts.push(post);
  }

  saveBlog();
  renderBlogList();
  closeBlogModal();
});

// ═══════════════════════════════════════
// MODAL LECTURE
// ═══════════════════════════════════════
let currentPostIndex = null;

function openFullPost(idx) {
  currentPostIndex = idx;
  const post = blogPosts[idx];
  document.getElementById('readTitle').innerText = post.title;
  document.getElementById('readMeta').innerHTML = `
    <span class="badge-glow">${post.category}</span>
    <span style="margin-left:8px; font-size:0.75rem; color:var(--text-light);">${post.date || ''}</span>`;
  document.getElementById('readBody').innerText = post.content;
  document.getElementById('likeCount').innerText = post.likes || 0;

  const likeBtn = document.getElementById('likeButton');
  const userId = localStorage.getItem('reader_id') || '';
  const isLiked = (post.likedBy || []).includes(userId);
  if (isLiked) likeBtn.classList.add('liked');
  else likeBtn.classList.remove('liked');

  // Boutons admin dans la lecture
  const adminReadActions = document.getElementById('adminReadActions');
  if (adminReadActions) {
    adminReadActions.style.display = isAdminAuthenticated() ? 'flex' : 'none';
  }

  renderComments();
  document.getElementById('readModal').classList.add('open');
}

function renderComments() {
  if (currentPostIndex === null) return;
  const post = blogPosts[currentPostIndex];
  const container = document.getElementById('commentsList');
  if (!post.comments || !post.comments.length) {
    container.innerHTML = '<p style="color:var(--text-light); font-size:0.85rem;">Aucun commentaire, soyez le premier !</p>';
    return;
  }
  container.innerHTML = post.comments.map(c => `
    <div class="comment-item">
      <strong>${escapeHtml(c.author)}</strong>
      <p>${escapeHtml(c.text)}</p>
      <small>${c.date}</small>
    </div>`).join('');
}

document.getElementById('likeButton')?.addEventListener('click', () => {
  if (currentPostIndex === null) return;
  const post = blogPosts[currentPostIndex];
  let userId = localStorage.getItem('reader_id');
  if (!userId) { userId = 'id_' + Math.random().toString(36).substr(2,9); localStorage.setItem('reader_id', userId); }
  if (!post.likedBy) post.likedBy = [];
  if (post.likedBy.includes(userId)) return;
  post.likes = (post.likes || 0) + 1;
  post.likedBy.push(userId);
  saveBlog();
  document.getElementById('likeCount').innerText = post.likes;
  document.getElementById('likeButton').classList.add('liked');
});

document.getElementById('shareButton')?.addEventListener('click', () => {
  if (currentPostIndex !== null) {
    navigator.clipboard.writeText(window.location.href + '#article=' + currentPostIndex);
    alert('🔗 Lien copié !');
  }
});

document.getElementById('addCommentBtn')?.addEventListener('click', () => {
  const textarea = document.getElementById('newComment');
  const nameInput = document.getElementById('commenterName');
  const text = textarea.value.trim();
  if (!text) return;
  const author = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Visiteur';
  const post = blogPosts[currentPostIndex];
  if (!post.comments) post.comments = [];
  post.comments.push({ author, text, date: new Date().toLocaleString('fr-FR') });
  saveBlog();
  textarea.value = '';
  if (nameInput) nameInput.value = '';
  renderComments();
});

document.getElementById('closeReadModal')?.addEventListener('click', () => {
  document.getElementById('readModal').classList.remove('open');
});

// ═══════════════════════════════════════
// ACTIONS ADMIN GLOBALES
// ═══════════════════════════════════════
window.deletePost = (idx) => {
  if (!isAdminAuthenticated()) return;
  if (confirm('Supprimer cet article définitivement ?')) {
    blogPosts.splice(idx, 1);
    saveBlog();
    renderBlogList();
    document.getElementById('readModal').classList.remove('open');
  }
};

window.editPost = (idx) => {
  if (!isAdminAuthenticated()) {
    openAuthModal(() => openWriteModal(idx));
    return;
  }
  openWriteModal(idx);
};

window.openFullPost = openFullPost;

// Fermer modals en cliquant l'overlay
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('open');
  });
});

// ═══════════════════════════════════════
// FORMSPREE — CONTACT
// ═══════════════════════════════════════
const form = document.getElementById('fs-form');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const feedback = document.getElementById('formFeedback');
  try {
    const res = await fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    if (res.ok) {
      feedback.innerHTML = '<span style="color:#2dd4bf;">✓ Message envoyé avec succès !</span>';
      form.reset();
    } else throw new Error();
  } catch {
    feedback.innerHTML = '<span style="color:#f97316;">Erreur, veuillez réessayer.</span>';
  }
});

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
renderBlogList();
updateAdminUI();

// ═══════════════════════════════════════
// CARROUSEL PROJETS
// ═══════════════════════════════════════
(function () {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsContainer = document.getElementById('carouselDots');
  const counter = document.getElementById('carousel-counter');
  if (!track) return;

  const items = track.querySelectorAll('.carousel-item');
  const total = items.length;
  let current = 0;

  // Calculer combien de cartes visibles selon la largeur
  function visibleCount() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, total - visibleCount());
  }

  // Créer les dots
  function buildDots() {
    dotsContainer.innerHTML = '';
    const pages = maxIndex() + 1;
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Projet ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex()));
    const itemWidth = items[0].getBoundingClientRect().width;
    const gap = 24; // 1.5rem
    track.style.transform = `translateX(-${current * (itemWidth + gap)}px)`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= maxIndex();
    updateDots();
    if (counter) counter.textContent = (current + 1) + ' / ' + total;
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Recalcul au resize
  window.addEventListener('resize', () => { buildDots(); goTo(Math.min(current, maxIndex())); });

  // Drag / swipe
  let startX = 0, isDragging = false;
  track.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX; });
  track.addEventListener('mousemove', e => { if (isDragging) e.preventDefault(); });
  track.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });
  track.addEventListener('mouseleave', () => { isDragging = false; });

  // Touch
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Init
  buildDots();
  goTo(0);
})();
