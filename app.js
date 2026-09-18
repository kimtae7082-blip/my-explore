const state = {
  items: [],
  sort: 'top',
  type: 'all',
  query: '',
  likes: JSON.parse(localStorage.getItem('exploreLikes') || '{}')
};

const gallery = document.getElementById('gallery');
const empty = document.getElementById('empty');
const fileInput = document.getElementById('csvFile');
const fileStatus = document.getElementById('fileStatus');
const searchInput = document.getElementById('search');
const lightbox = document.getElementById('lightbox');

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === ',' && !quoted) { row.push(cell.trim()); cell = ''; continue; }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += c;
  }
  if (cell.length || row.length) { row.push(cell.trim()); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());
  return rows.map((r, idx) => {
    const o = { id: String(idx + 1) };
    headers.forEach((h, i) => o[h] = (r[i] ?? '').trim());
    o.id = o.id || o.uuid || String(idx + 1);
    o.image_url = o.image_url || o.image || o.url || '';
    o.title = o.title || o.name || '';
    o.prompt = o.prompt || '';
    o.author = o.author || o.username || '';
    o.type = (o.type || 'image').toLowerCase();
    o.likes = Number(o.likes || o.like_count || 0) || 0;
    o.created_at = o.created_at || o.date || '';
    return o;
  }).filter(x => x.image_url);
}

function getVisibleItems() {
  let arr = [...state.items];
  if (state.type !== 'all') arr = arr.filter(x => x.type === state.type);
  if (state.query) {
    const q = state.query.toLowerCase();
    arr = arr.filter(x => [x.title, x.prompt, x.author].join(' ').toLowerCase().includes(q));
  }
  if (state.sort === 'likes') arr.sort((a,b) => b.likes - a.likes);
  else if (state.sort === 'new') arr.sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
  else arr.sort((a,b) => b.likes - a.likes);
  return arr;
}

function render() {
  const items = getVisibleItems();
  gallery.innerHTML = '';
  empty.classList.toggle('hidden', items.length > 0);
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.title || item.prompt || 'image';
    img.loading = 'lazy';
    img.onerror = () => { card.style.display = 'none'; };

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    const top = document.createElement('div');
    top.className = 'overlay-top';
    const author = document.createElement('span');
    author.textContent = item.author || 'Unknown';
    const like = document.createElement('button');
    like.className = 'like' + (state.likes[item.id] ? ' liked' : '');
    like.textContent = `♥ ${item.likes + (state.likes[item.id] ? 1 : 0)}`;
    like.onclick = (e) => {
      e.stopPropagation();
      state.likes[item.id] = !state.likes[item.id];
      localStorage.setItem('exploreLikes', JSON.stringify(state.likes));
      render();
    };
    top.append(author, like);
    const bottom = document.createElement('div');
    bottom.className = 'overlay-bottom';
    bottom.textContent = item.prompt || item.title || '';
    overlay.append(top, bottom);
    card.append(img, overlay);
    card.onclick = () => openLightbox(item);
    gallery.appendChild(card);
  });
}

function openLightbox(item) {
  document.getElementById('lightboxImg').src = item.image_url;
  document.getElementById('lightboxImg').alt = item.title || '';
  document.getElementById('detailAuthor').textContent = item.author ? `@${item.author}` : '';
  document.getElementById('detailTitle').textContent = item.title || 'Untitled';
  document.getElementById('detailPrompt').textContent = item.prompt || '프롬프트가 없습니다.';
  document.getElementById('detailMeta').textContent = `${item.type.toUpperCase()}  ·  ♥ ${item.likes}  ·  ${item.created_at || ''}`;
  document.getElementById('copyPrompt').onclick = async () => {
    await navigator.clipboard.writeText(item.prompt || '');
    document.getElementById('copyPrompt').textContent = '복사 완료';
    setTimeout(() => document.getElementById('copyPrompt').textContent = '프롬프트 복사', 1200);
  };
  lightbox.showModal();
}

document.getElementById('closeLightbox').onclick = () => lightbox.close();
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });

fileInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  state.items = parseCSV(text);
  fileStatus.textContent = `${file.name} · ${state.items.length}개 이미지`;
  render();
});

searchInput.addEventListener('input', e => { state.query = e.target.value; render(); });

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  state.sort = btn.dataset.sort;
  render();
}));

document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  state.type = btn.dataset.type;
  render();
}));

document.getElementById('settingsBtn').onclick = () => alert('CSV 열 이름은 README의 형식을 참고하세요.');

// 샘플 데이터: images.csv를 같은 폴더에서 서버로 열 때 자동 표시할 수 있도록 fetch 시도
fetch('images.csv').then(r => r.ok ? r.text() : Promise.reject()).then(text => {
  state.items = parseCSV(text);
  fileStatus.textContent = `images.csv · ${state.items.length}개 이미지`;
  render();
}).catch(() => {
  empty.classList.remove('hidden');
  render();
});
