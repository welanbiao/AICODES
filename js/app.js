// ===== 云村音乐 · 仿真游戏主逻辑 =====
const state = {
  page: 'discover',
  currentPlaylist: null,
  queue: [],
  queueIndex: -1,
  playing: false,
  currentTime: 0,
  volume: 0.8,
  playMode: 'list', // list | single | random
  liked: new Set(JSON.parse(localStorage.getItem('liked') || '[]')),
  unlocked: new Set(JSON.parse(localStorage.getItem('unlocked') || '[]')),
  listenedToday: parseInt(localStorage.getItem('listenedToday') || '0'),
  likedToday: parseInt(localStorage.getItem('likedToday') || '0'),
  commentedToday: parseInt(localStorage.getItem('commentedToday') || '0'),
  lastDate: localStorage.getItem('lastDate') || '',
  listenCount: 0,
  totalListenTime: parseInt(localStorage.getItem('totalListenTime') || '0'),
  pendingUnlock: null,
  searchQuery: '',
  timer: null,
  lyricsOpen: false,
  vinylOpen: false,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function saveState() {
  localStorage.setItem('liked', JSON.stringify([...state.liked]));
  localStorage.setItem('unlocked', JSON.stringify([...state.unlocked]));
  localStorage.setItem('listenedToday', state.listenedToday.toString());
  localStorage.setItem('likedToday', state.likedToday.toString());
  localStorage.setItem('commentedToday', state.commentedToday.toString());
  localStorage.setItem('lastDate', state.lastDate);
  localStorage.setItem('totalListenTime', state.totalListenTime.toString());
  localStorage.setItem('gameUser', JSON.stringify(GAME_DATA.user));
}

function loadState() {
  const saved = localStorage.getItem('gameUser');
  if (saved) Object.assign(GAME_DATA.user, JSON.parse(saved));
  resetDailyTasks();
}

function resetDailyTasks() {
  const today = new Date().toDateString();
  if (state.lastDate !== today) {
    state.lastDate = today;
    state.listenedToday = 0;
    state.likedToday = 0;
    state.commentedToday = 0;
    GAME_DATA.user.checkedInToday = false;
    GAME_DATA.dailyTasks.forEach(t => { t.progress = 0; t.done = false; });
  }
  updateTaskProgress();
}

function updateTaskProgress() {
  GAME_DATA.dailyTasks.find(t => t.id === 'listen3').progress = state.listenedToday;
  GAME_DATA.dailyTasks.find(t => t.id === 'like1').progress = state.likedToday;
  GAME_DATA.dailyTasks.find(t => t.id === 'comment1').progress = state.commentedToday;
  GAME_DATA.dailyTasks.find(t => t.id === 'checkin').progress = GAME_DATA.user.checkedInToday ? 1 : 0;
}

function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function sfx(fn) { try { fn(); } catch (_) {} }

function updateHeader() {
  $('#coin-count').textContent = GAME_DATA.user.coins;
  $('#sidebar-username').textContent = GAME_DATA.user.name;
  $('#sidebar-level').textContent = GAME_DATA.user.level;
  const checkinBtn = $('#checkin-btn');
  checkinBtn.textContent = GAME_DATA.user.checkedInToday ? '已签到' : '签到';
  checkinBtn.style.opacity = GAME_DATA.user.checkedInToday ? '0.6' : '1';
}

function addExp(amount) {
  GAME_DATA.user.exp += amount;
  while (GAME_DATA.user.exp >= GAME_DATA.user.expToNext) {
    GAME_DATA.user.exp -= GAME_DATA.user.expToNext;
    GAME_DATA.user.level++;
    GAME_DATA.user.expToNext = Math.floor(GAME_DATA.user.expToNext * 1.5);
    showToast(`🎉 升级了！当前 Lv.${GAME_DATA.user.level}`);
  }
  saveState();
  updateHeader();
}

function addCoins(amount) {
  GAME_DATA.user.coins += amount;
  saveState();
  updateHeader();
}

// ===== 页面渲染 =====
function renderPage() {
  const content = $('#content');
  switch (state.page) {
    case 'discover': content.innerHTML = renderDiscover(); break;
    case 'playlist': content.innerHTML = renderPlaylistDetail(); break;
    case 'mymusic': content.innerHTML = renderMyMusic(); break;
    case 'game': content.innerHTML = renderGamePage(); break;
    case 'search': content.innerHTML = renderSearch(); break;
    default: content.innerHTML = renderEmptyPage(); break;
  }
  bindPageEvents();
}

function renderDiscover() {
  const banners = GAME_DATA.banners.map(b => `
    <div class="banner-item" data-banner="${b.id}">
      <div class="banner-bg" style="background:${b.color}">${b.title}</div>
      <span class="banner-tag">${b.tag}</span>
    </div>
  `).join('');

  const cards = GAME_DATA.playlists.map(p => {
    const locked = p.locked && !state.unlocked.has(p.id);
    return `
      <div class="playlist-card" data-playlist="${p.id}">
        <div class="playlist-cover-wrap">
          <div class="playlist-cover" style="background:${p.cover}">🎵</div>
          <div class="play-overlay"><div class="play-icon">▶</div></div>
          <span class="play-count">▶ ${p.playCount}</span>
          ${locked ? `<span class="lock-badge">🔒 ${p.unlockCost}币</span>` : ''}
        </div>
        <div class="playlist-name">${p.name}</div>
      </div>
    `;
  }).join('');

  return `
    <h1 class="page-title">发现音乐</h1>
    <div class="banner-carousel">${banners}</div>
    <div class="section-header">
      <div class="section-title">推荐歌单</div>
      <span class="section-more">更多 ›</span>
    </div>
    <div class="playlist-grid">${cards}</div>
    <div class="section-header">
      <div class="section-title">排行榜</div>
      <span class="section-more">更多 ›</span>
    </div>
    <div class="playlist-grid">${GAME_DATA.playlists.slice(2, 6).map(p => {
      const locked = p.locked && !state.unlocked.has(p.id);
      return `
        <div class="playlist-card" data-playlist="${p.id}">
          <div class="playlist-cover-wrap">
            <div class="playlist-cover" style="background:${p.cover}">🎵</div>
            <div class="play-overlay"><div class="play-icon">▶</div></div>
            <span class="play-count">▶ ${p.playCount}</span>
            ${locked ? `<span class="lock-badge">🔒 ${p.unlockCost}币</span>` : ''}
          </div>
          <div class="playlist-name">${p.name}</div>
        </div>
      `;
    }).join('')}</div>
  `;
}

function renderPlaylistDetail() {
  const pl = state.currentPlaylist;
  if (!pl) return renderDiscover();
  const songs = getPlaylistSongs(pl);
  const currentId = state.queueIndex >= 0 ? state.queue[state.queueIndex]?.id : null;

  const rows = songs.map((s, i) => `
    <tr data-song="${s.id}" class="${currentId === s.id ? 'playing' : ''}">
      <td class="col-index">${state.playing && currentId === s.id ? '🎵' : i + 1}</td>
      <td class="col-title">
        <div class="song-name-cell">
          <div class="song-mini-cover" style="background:${s.cover}"></div>
          <span class="song-name-text">${s.name}</span>
        </div>
      </td>
      <td class="col-artist">${s.artist}</td>
      <td class="col-album">${s.album}</td>
      <td class="col-duration">${formatTime(s.duration)}</td>
      <td class="col-action">
        <button class="song-like-btn ${state.liked.has(s.id) ? 'liked' : ''}" data-like="${s.id}">
          ${state.liked.has(s.id) ? '♥' : '♡'}
        </button>
      </td>
    </tr>
  `).join('');

  const comments = GAME_DATA.comments.map(c => `
    <div class="comment-item">
      <div class="comment-avatar">🎤</div>
      <div class="comment-body">
        <div class="comment-user">${c.user}</div>
        <div class="comment-text">${c.text}</div>
        <div class="comment-like">👍 ${c.likes.toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="playlist-detail-header">
      <div class="detail-cover" style="background:${pl.cover}">🎵</div>
      <div class="detail-info">
        <div class="detail-type">歌单</div>
        <h1 class="detail-title">${pl.name}</h1>
        <div class="detail-meta">
          <div class="detail-creator"><span>🎧</span> ${GAME_DATA.user.name}</div>
          <span>创建时间：2026-01-15</span>
          <span>${songs.length} 首</span>
        </div>
        <p style="font-size:13px;color:#999;margin-bottom:16px">${pl.desc}</p>
        <div class="detail-actions">
          <button class="btn-play-all" id="play-all-btn">▶ 播放全部</button>
          <button class="btn-secondary" id="fav-playlist-btn">⭐ 收藏</button>
          <button class="btn-secondary">↗ 分享</button>
        </div>
      </div>
    </div>
    <table class="song-table">
      <thead>
        <tr>
          <th class="col-index"></th>
          <th class="col-title">标题</th>
          <th class="col-artist">歌手</th>
          <th class="col-album">专辑</th>
          <th class="col-duration">时长</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="comment-section">
      <h3 style="margin-bottom:16px;font-size:15px">热门评论</h3>
      <div class="comment-input-wrap">
        <input class="comment-input" id="comment-input" placeholder="发表你的评论..." maxlength="200">
        <button class="btn-comment" id="submit-comment">发送</button>
      </div>
      <div id="comment-list">${comments}</div>
    </div>
  `;
}

function renderMyMusic() {
  const likedSongs = [...state.liked].map(id => getSong(id)).filter(Boolean);
  const myCards = GAME_DATA.myPlaylists.map(p => `
    <div class="playlist-card">
      <div class="playlist-cover-wrap">
        <div class="playlist-cover" style="background:${p.cover}">${p.id === 'my1' ? '♥' : '🎵'}</div>
        <div class="play-overlay"><div class="play-icon">▶</div></div>
      </div>
      <div class="playlist-name">${p.name}</div>
      <div class="liked-count">${p.id === 'my1' ? likedSongs.length : p.count} 首</div>
    </div>
  `).join('');

  const likedRows = likedSongs.length ? likedSongs.map((s, i) => `
    <tr data-song="${s.id}">
      <td class="col-index">${i + 1}</td>
      <td class="col-title">
        <div class="song-name-cell">
          <div class="song-mini-cover" style="background:${s.cover}"></div>
          <span class="song-name-text">${s.name}</span>
        </div>
      </td>
      <td class="col-artist">${s.artist}</td>
      <td class="col-album">${s.album}</td>
      <td class="col-duration">${formatTime(s.duration)}</td>
      <td class="col-action">
        <button class="song-like-btn liked" data-like="${s.id}">♥</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999">还没有收藏的歌曲，去发现音乐吧 ♪</td></tr>';

  return `
    <h1 class="page-title">我的音乐</h1>
    <div class="my-music-grid">${myCards}</div>
    <div class="section-header" style="margin-top:32px">
      <div class="section-title">我喜欢的音乐</div>
    </div>
    <table class="song-table">
      <thead>
        <tr>
          <th class="col-index"></th>
          <th class="col-title">标题</th>
          <th class="col-artist">歌手</th>
          <th class="col-album">专辑</th>
          <th class="col-duration">时长</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${likedRows}</tbody>
    </table>
  `;
}

function renderGamePage() {
  const u = GAME_DATA.user;
  const expPct = (u.exp / u.expToNext * 100).toFixed(0);

  const tasks = GAME_DATA.dailyTasks.map(t => {
    const complete = t.progress >= t.target;
    const claimed = t.done;
    let statusClass = 'pending';
    let statusText = `${t.progress}/${t.target}`;
    if (claimed) { statusClass = 'done'; statusText = '已完成'; }
    else if (complete) { statusClass = 'claim'; statusText = '领取'; }

    return `
      <div class="task-item">
        <div class="task-info">
          <div class="task-name">${t.name}</div>
          <div class="task-progress-text">进度：${Math.min(t.progress, t.target)}/${t.target}</div>
        </div>
        <div class="task-reward">+${t.reward} 🪙</div>
        <button class="task-status ${statusClass}" data-task="${t.id}" ${claimed || !complete ? (claimed ? 'disabled' : '') : ''}>
          ${statusText}
        </button>
      </div>
    `;
  }).join('');

  return `
    <h1 class="page-title">云村任务中心</h1>
    <div class="game-stats">
      <div class="stat-card">
        <div class="stat-value">Lv.${u.level}</div>
        <div class="stat-label">当前等级</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${u.coins}</div>
        <div class="stat-label">云音乐币</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${state.listenedToday}</div>
        <div class="stat-label">今日收听</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.floor(state.totalListenTime / 60)}</div>
        <div class="stat-label">累计分钟</div>
      </div>
    </div>
    <div class="exp-bar-wrap">
      <div class="exp-bar-label">
        <span>经验值</span>
        <span>${u.exp} / ${u.expToNext}</span>
      </div>
      <div class="exp-bar">
        <div class="exp-bar-fill" style="width:${expPct}%"></div>
      </div>
    </div>
    <div class="section-header">
      <div class="section-title">每日任务</div>
    </div>
    <div class="task-list">${tasks}</div>
  `;
}

function renderSearch() {
  const q = state.searchQuery.toLowerCase();
  const results = Object.values(GAME_DATA.songs).filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.album.toLowerCase().includes(q)
  );

  if (!q) {
    return `
      <h1 class="page-title">搜索</h1>
      <div class="search-empty">
        <div class="search-empty-icon">🔍</div>
        <p>搜索音乐、歌手、歌词、用户</p>
      </div>
    `;
  }

  if (!results.length) {
    return `
      <h1 class="page-title">搜索 "${state.searchQuery}"</h1>
      <div class="search-empty">
        <div class="search-empty-icon">😔</div>
        <p>没有找到相关结果</p>
      </div>
    `;
  }

  const rows = results.map((s, i) => `
    <tr data-song="${s.id}">
      <td class="col-index">${i + 1}</td>
      <td class="col-title">
        <div class="song-name-cell">
          <div class="song-mini-cover" style="background:${s.cover}"></div>
          <span class="song-name-text">${s.name}</span>
        </div>
      </td>
      <td class="col-artist">${s.artist}</td>
      <td class="col-album">${s.album}</td>
      <td class="col-duration">${formatTime(s.duration)}</td>
      <td class="col-action">
        <button class="song-like-btn ${state.liked.has(s.id) ? 'liked' : ''}" data-like="${s.id}">
          ${state.liked.has(s.id) ? '♥' : '♡'}
        </button>
      </td>
    </tr>
  `).join('');

  return `
    <h1 class="page-title">搜索 "${state.searchQuery}" · ${results.length} 首</h1>
    <table class="song-table">
      <thead>
        <tr>
          <th class="col-index"></th>
          <th class="col-title">标题</th>
          <th class="col-artist">歌手</th>
          <th class="col-album">专辑</th>
          <th class="col-duration">时长</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderEmptyPage() {
  const names = { podcast: '播客', video: '视频', friends: '朋友', 'fav-playlists': '收藏的歌单' };
  return `
    <div class="empty-page">
      <div class="empty-page-icon">🚧</div>
      <div class="empty-page-text">${names[state.page] || '此功能'} 即将上线，敬请期待</div>
    </div>
  `;
}

function renderMyPlaylistsNav() {
  const el = $('#my-playlists-nav');
  el.innerHTML = GAME_DATA.myPlaylists.map(p => `
    <a class="nav-item sub" data-page="mymusic">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
      ${p.name}
    </a>
  `).join('');
}

// ===== 播放器 =====
function setCoverColor(cover) {
  const color = cover.match(/#[0-9a-f]{3,8}/i)?.[0] || '#C20C0C';
  const label = document.querySelector('.vinyl-mini .vinyl-label');
  const vinylArt = $('#vinyl-center-art');
  if (label) label.style.background = cover.includes('gradient') ? cover : color;
  if (vinylArt) vinylArt.style.background = cover.includes('gradient') ? cover : color;
  document.documentElement.style.setProperty('--cover-color', color);
}

function renderLyrics(song) {
  const lyrics = getLyrics(song);
  const body = $('#lyrics-body');
  $('#lyrics-song-name').textContent = song.name;
  $('#lyrics-artist').textContent = song.artist;
  body.innerHTML = lyrics.map((l, i) =>
    `<div class="lyrics-line" data-idx="${i}">${l.text}</div>`
  ).join('');
  state.currentLyrics = lyrics;
}

function updateLyricsHighlight() {
  if (!state.currentLyrics || state.queueIndex < 0) return;
  const idx = getCurrentLyricIndex(state.currentLyrics, state.currentTime);
  const lines = $$('.lyrics-line');
  lines.forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    el.classList.toggle('passed', i < idx);
  });
  const active = lines[idx];
  if (active && state.lyricsOpen) {
    active.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateVinylUI(song) {
  $('#vinyl-song-name').textContent = song.name;
  $('#vinyl-artist').textContent = song.artist;
  setCoverColor(song.cover);
  $('#vinyl-record').classList.toggle('spinning', state.playing);
  $('#tonearm').classList.toggle('playing', state.playing);
  $('#vinyl-play').textContent = state.playing ? '⏸' : '▶';
}

function playSong(song, queue, index) {
  state.queue = queue;
  state.queueIndex = index;
  state.currentTime = 0;
  state.playing = true;

  $('#player-song-name').textContent = song.name;
  $('#player-artist').textContent = song.artist;
  setCoverColor(song.cover);
  $('#player-cover').classList.add('spinning');
  $('#total-time').textContent = formatTime(song.duration);
  $('#play-btn').textContent = '⏸';

  const likeBtn = $('#player-like');
  likeBtn.textContent = state.liked.has(song.id) ? '♥' : '♡';
  likeBtn.classList.toggle('liked', state.liked.has(song.id));

  renderLyrics(song);
  updateVinylUI(song);
  sfx(() => AudioEngine.sfxPlay());
  AudioEngine.startMusic(song.id);

  startTimer();
  updateProgress();
  renderQueuePanel();

  if (state.listenCount === 0 || state.queue[state.queueIndex - 1]?.id !== song.id) {
    state.listenedToday++;
    state.listenCount++;
    state.totalListenTime += Math.min(30, song.duration);
    addExp(10);
    addCoins(5);
    updateTaskProgress();
    saveState();
  }
}

function togglePlay() {
  if (state.queueIndex < 0) {
    const pl = GAME_DATA.playlists[0];
    const songs = getPlaylistSongs(pl);
    if (songs.length) playSong(songs[0], songs, 0);
    return;
  }
  state.playing = !state.playing;
  $('#play-btn').textContent = state.playing ? '⏸' : '▶';
  $('#player-cover').classList.toggle('spinning', state.playing);
  $('#vinyl-record')?.classList.toggle('spinning', state.playing);
  $('#tonearm')?.classList.toggle('playing', state.playing);
  $('#vinyl-play').textContent = state.playing ? '⏸' : '▶';
  if (state.playing) {
    sfx(() => AudioEngine.sfxPlay());
    AudioEngine.startMusic(state.queue[state.queueIndex].id);
    startTimer();
  } else {
    sfx(() => AudioEngine.sfxPause());
    AudioEngine.stopMusic();
    stopTimer();
  }
}

function playNext() {
  if (!state.queue.length) return;
  sfx(() => AudioEngine.sfxNext());
  let next;
  if (state.playMode === 'random') {
    next = Math.floor(Math.random() * state.queue.length);
  } else {
    next = (state.queueIndex + 1) % state.queue.length;
  }
  playSong(state.queue[next], state.queue, next);
}

function playPrev() {
  if (!state.queue.length) return;
  if (state.currentTime > 3) {
    state.currentTime = 0;
    updateProgress();
    return;
  }
  const prev = (state.queueIndex - 1 + state.queue.length) % state.queue.length;
  playSong(state.queue[prev], state.queue, prev);
}

function startTimer() {
  stopTimer();
  state.timer = setInterval(() => {
    if (!state.playing || state.queueIndex < 0) return;
    const song = state.queue[state.queueIndex];
    state.currentTime += 0.5;
    if (state.currentTime >= song.duration) {
      if (state.playMode === 'single') {
        state.currentTime = 0;
      } else {
        playNext();
        return;
      }
    }
    updateProgress();
    updateLyricsHighlight();
  }, 500);
}

function stopTimer() {
  if (state.timer) { clearInterval(state.timer); state.timer = null; }
}

function updateProgress() {
  if (state.queueIndex < 0) return;
  const song = state.queue[state.queueIndex];
  const pct = (state.currentTime / song.duration * 100).toFixed(1);
  $('#progress-fill').style.width = pct + '%';
  $('#progress-thumb').style.left = pct + '%';
  $('#current-time').textContent = formatTime(state.currentTime);
  updateLyricsHighlight();
}

function seekTo(e) {
  if (state.queueIndex < 0) return;
  const track = $('#progress-track');
  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  state.currentTime = pct * state.queue[state.queueIndex].duration;
  updateProgress();
}

function toggleLike(songId) {
  if (state.liked.has(songId)) {
    state.liked.delete(songId);
  } else {
    state.liked.add(songId);
    state.likedToday++;
    addExp(5);
    updateTaskProgress();
    sfx(() => AudioEngine.sfxLike());
    showToast('❤️ 已添加到「我喜欢的音乐」');
  }
  saveState();
  renderPage();
  if (state.queueIndex >= 0 && state.queue[state.queueIndex].id === songId) {
    const btn = $('#player-like');
    btn.textContent = state.liked.has(songId) ? '♥' : '♡';
    btn.classList.toggle('liked', state.liked.has(songId));
  }
}

function renderQueuePanel() {
  const list = $('#queue-list');
  list.innerHTML = state.queue.map((s, i) => `
    <div class="queue-item ${i === state.queueIndex ? 'active' : ''}" data-queue-index="${i}">
      <span class="queue-item-index">${i === state.queueIndex && state.playing ? '🎵' : i + 1}</span>
      <span>${s.name}</span>
      <span style="margin-left:auto;color:#999;font-size:12px">${s.artist}</span>
    </div>
  `).join('');
  $('#queue-count').textContent = state.queue.length;
}

function cyclePlayMode() {
  const modes = ['list', 'single', 'random'];
  const icons = { list: '🔁', single: '🔂', random: '🔀' };
  const idx = modes.indexOf(state.playMode);
  state.playMode = modes[(idx + 1) % modes.length];
  $('#mode-btn').textContent = icons[state.playMode];
  const labels = { list: '列表循环', single: '单曲循环', random: '随机播放' };
  sfx(() => AudioEngine.sfxClick());
  showToast(labels[state.playMode]);
}

// ===== 签到 =====
function renderCheckinModal() {
  const days = GAME_DATA.checkInRewards.map((reward, i) => {
    const dayNum = i + 1;
    const done = dayNum <= GAME_DATA.user.checkInDays;
    const today = dayNum === GAME_DATA.user.checkInDays + 1 && !GAME_DATA.user.checkedInToday;
    return `
      <div class="checkin-day ${done ? 'done' : ''} ${today ? 'today' : ''}">
        <span>Day ${dayNum}</span>
        <span class="day-reward">${reward}币</span>
      </div>
    `;
  }).join('');
  $('#checkin-days').innerHTML = days;
  const btn = $('#do-checkin');
  btn.disabled = GAME_DATA.user.checkedInToday;
  btn.textContent = GAME_DATA.user.checkedInToday ? '今日已签到' : '立即签到';
}

function doCheckin() {
  if (GAME_DATA.user.checkedInToday) return;
  const reward = GAME_DATA.checkInRewards[Math.min(GAME_DATA.user.checkInDays, 6)];
  GAME_DATA.user.checkedInToday = true;
  GAME_DATA.user.checkInDays = Math.min(GAME_DATA.user.checkInDays + 1, 7);
  addCoins(reward);
  addExp(20);
  sfx(() => AudioEngine.sfxCoin());
  updateTaskProgress();
  saveState();
  showToast(`签到成功！获得 ${reward} 云币`);
  renderCheckinModal();
  updateHeader();
}

// ===== 解锁歌单 =====
function tryOpenPlaylist(id) {
  const pl = GAME_DATA.playlists.find(p => p.id === id);
  if (!pl) return;
  if (pl.locked && !state.unlocked.has(id)) {
    state.pendingUnlock = pl;
    $('#unlock-msg').textContent = `需要 ${pl.unlockCost} 云币解锁「${pl.name}」`;
    $('#unlock-modal').classList.add('show');
    return;
  }
  state.currentPlaylist = pl;
  state.page = 'playlist';
  renderPage();
}

function doUnlock() {
  const pl = state.pendingUnlock;
  if (!pl) return;
  if (GAME_DATA.user.coins < pl.unlockCost) {
    showToast('云币不足，去完成任务赚取吧！');
    return;
  }
  GAME_DATA.user.coins -= pl.unlockCost;
  state.unlocked.add(pl.id);
  saveState();
  updateHeader();
  $('#unlock-modal').classList.remove('show');
  sfx(() => AudioEngine.sfxUnlock());
  showToast(`🎉 成功解锁「${pl.name}」`);
  state.currentPlaylist = pl;
  state.page = 'playlist';
  state.pendingUnlock = null;
  renderPage();
}

// ===== 事件绑定 =====
function bindPageEvents() {
  $$('.playlist-card[data-playlist]').forEach(el => {
    el.addEventListener('click', () => { sfx(() => AudioEngine.sfxClick()); tryOpenPlaylist(el.dataset.playlist); });
  });

  $$('[data-song]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.song-like-btn')) return;
      const song = getSong(el.dataset.song);
      if (!song) return;
      let queue, index;
      if (state.currentPlaylist) {
        queue = getPlaylistSongs(state.currentPlaylist);
        index = queue.findIndex(s => s.id === song.id);
      } else {
        queue = [song];
        index = 0;
      }
      playSong(song, queue, index);
      $$('.song-table tbody tr').forEach(r => r.classList.remove('playing'));
      el.classList.add('playing');
    });
  });

  $$('.song-like-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLike(el.dataset.like);
    });
  });

  const playAll = $('#play-all-btn');
  if (playAll) {
    playAll.addEventListener('click', () => {
      const songs = getPlaylistSongs(state.currentPlaylist);
      if (songs.length) playSong(songs[0], songs, 0);
    });
  }

  const commentInput = $('#comment-input');
  const submitComment = $('#submit-comment');
  if (submitComment) {
    submitComment.addEventListener('click', () => {
      const text = commentInput?.value.trim();
      if (!text) return;
      const list = $('#comment-list');
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `
        <div class="comment-avatar">🎧</div>
        <div class="comment-body">
          <div class="comment-user">${GAME_DATA.user.name}</div>
          <div class="comment-text">${text}</div>
          <div class="comment-like">👍 0</div>
        </div>
      `;
      list.prepend(item);
      commentInput.value = '';
      state.commentedToday++;
      addExp(8);
      updateTaskProgress();
      saveState();
      showToast('评论发表成功！');
    });
  }

  $$('.task-status.claim').forEach(el => {
    el.addEventListener('click', () => {
      const task = GAME_DATA.dailyTasks.find(t => t.id === el.dataset.task);
      if (!task || task.done) return;
      task.done = true;
      addCoins(task.reward);
      addExp(15);
      sfx(() => AudioEngine.sfxCoin());
      showToast(`领取成功！+${task.reward} 云币`);
      renderPage();
    });
  });

  $$('[data-banner]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.banner === '1') tryOpenPlaylist('daily');
      else if (el.dataset.banner === '2') tryOpenPlaylist('private');
      else { $('#checkin-modal').classList.add('show'); renderCheckinModal(); }
    });
  });
}

function initEvents() {
  $$('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      sfx(() => AudioEngine.sfxClick());
      state.page = el.dataset.page;
      $$('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      renderPage();
    });
  });

  $('#search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    if (state.searchQuery) {
      state.page = 'search';
      renderPage();
    } else if (state.page === 'search') {
      state.page = 'discover';
      renderPage();
    }
  });

  $('#play-btn').addEventListener('click', togglePlay);
  $('#next-btn').addEventListener('click', playNext);
  $('#prev-btn').addEventListener('click', playPrev);
  $('#mode-btn').addEventListener('click', cyclePlayMode);
  $('#progress-track').addEventListener('click', seekTo);

  $('#player-like').addEventListener('click', () => {
    if (state.queueIndex >= 0) toggleLike(state.queue[state.queueIndex].id);
  });

  $('#queue-btn').addEventListener('click', () => {
    $('#queue-panel').classList.toggle('open');
    renderQueuePanel();
  });
  $('#queue-close').addEventListener('click', () => {
    $('#queue-panel').classList.remove('open');
  });

  $('#queue-list').addEventListener('click', (e) => {
    const item = e.target.closest('.queue-item');
    if (!item) return;
    const idx = parseInt(item.dataset.queueIndex);
    playSong(state.queue[idx], state.queue, idx);
  });

  $('#checkin-btn').addEventListener('click', () => {
    $('#checkin-modal').classList.add('show');
    renderCheckinModal();
  });
  $('#do-checkin').addEventListener('click', doCheckin);

  $$('.modal-close').forEach(el => {
    el.addEventListener('click', () => {
      el.closest('.modal-overlay').classList.remove('show');
    });
  });

  $('#do-unlock').addEventListener('click', doUnlock);

  $('#volume-btn').addEventListener('click', () => {
    $('#volume-wrap').classList.toggle('show');
  });

  $('#volume-slider').addEventListener('input', (e) => {
    const v = e.target.value / 100;
    state.volume = v;
    AudioEngine.setVolume(v);
  });

  $('#lyrics-btn').addEventListener('click', () => {
    sfx(() => AudioEngine.sfxClick());
    state.lyricsOpen = !state.lyricsOpen;
    $('#lyrics-panel').classList.toggle('open', state.lyricsOpen);
    $('#lyrics-btn').classList.toggle('active-extra', state.lyricsOpen);
    if (state.lyricsOpen) $('#queue-panel').classList.remove('open');
  });

  $('#lyrics-close').addEventListener('click', () => {
    state.lyricsOpen = false;
    $('#lyrics-panel').classList.remove('open');
    $('#lyrics-btn').classList.remove('active-extra');
  });

  $('#player-cover').addEventListener('click', () => {
    if (state.queueIndex < 0) return;
    state.vinylOpen = true;
    $('#vinyl-overlay').classList.add('show');
    updateVinylUI(state.queue[state.queueIndex]);
  });

  $('#vinyl-close').addEventListener('click', () => {
    state.vinylOpen = false;
    $('#vinyl-overlay').classList.remove('show');
  });

  $('#vinyl-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      state.vinylOpen = false;
      $('#vinyl-overlay').classList.remove('show');
    }
  });

  $('#vinyl-play').addEventListener('click', togglePlay);
  $('#vinyl-prev').addEventListener('click', playPrev);
  $('#vinyl-next').addEventListener('click', playNext);

  $('#sfx-btn').addEventListener('click', () => {
    const on = !AudioEngine.sfxEnabled;
    AudioEngine.sfxEnabled = on;
    AudioEngine.enabled = on;
    if (on && state.playing) AudioEngine.startMusic(state.queue[state.queueIndex]?.id);
    else AudioEngine.stopMusic();
    showToast(on ? '音效与旋律已开启' : '音效与旋律已关闭');
    $('#sfx-btn').classList.toggle('active-extra', on);
    if (on) sfx(() => AudioEngine.sfxClick());
  });

  document.body.addEventListener('click', () => AudioEngine.resume(), { once: true });

  $$('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) el.classList.remove('show');
    });
  });
}

// ===== 启动 =====
function init() {
  loadState();
  updateHeader();
  renderMyPlaylistsNav();
  renderPage();
  initEvents();
  AudioEngine.setVolume(state.volume);
  $('#volume-slider').value = state.volume * 100;
}

document.addEventListener('DOMContentLoaded', init);
