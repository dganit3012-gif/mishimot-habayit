/* ──────────────────────────────────────────────
   משימות הבית — App State & Logic
   ────────────────────────────────────────────── */

// ── Seed Data ──────────────────────────────────
const SEED = {
  users: [
    { id: 'parent_mom', name: 'אמא',  role: 'parent', points: 0, streakDays: 0, weekly: [] },
    { id: 'parent_dad', name: 'אבא',  role: 'parent', points: 0, streakDays: 0, weekly: [] },
    { id: 'emily',      name: 'אמילי', role: 'child',  age: 13, points: 85, streakDays: 5, weekly: [80,100,60,90,70,100,40] },
    { id: 'noa',        name: 'נועה',  role: 'child',  age: 12, points: 62, streakDays: 3, weekly: [70,80,90,60,100,50,80] },
    { id: 'alma',       name: 'אלמה', role: 'child',  age: 6,  points: 30, streakDays: 2, weekly: [] },
  ],
  tasks: [
    { id: 1, title: 'לסדר את החדר',           category: 'ארגון הבית', icon: 'ti-folder',          assigneeId: 'emily', freq: 'יומי',    requiresApproval: false, points: 10, status: 'open' },
    { id: 2, title: 'לקפל כביסה נקייה',        category: 'ארגון הבית', icon: 'ti-shirt',           assigneeId: 'emily', freq: 'שבועי',   requiresApproval: false, points: 15, status: 'done' },
    { id: 3, title: 'למיין כביסה צבעים ולבן',  category: 'מיון וסדר', icon: 'ti-sort-descending', assigneeId: 'noa',   freq: 'שבועי',   requiresApproval: true,  points: 10, status: 'pending' },
    { id: 4, title: 'לשטוף כלים קלים',         category: 'ניקיון',    icon: 'ti-droplet',         assigneeId: 'noa',   freq: 'יומי',    requiresApproval: false, points: 10, status: 'open' },
    { id: 5, title: 'לסדר צעצועים בקופסה',     category: 'ארגון הבית', icon: 'ti-box',             assigneeId: 'alma',  freq: 'יומי',    requiresApproval: false, points: 5,  status: 'done' },
    { id: 6, title: 'להזין את הכלב',           category: 'חיות מחמד', icon: 'ti-paw',             assigneeId: 'alma',  freq: 'יומי',    requiresApproval: false, points: 5,  status: 'late' },
    { id: 7, title: 'לנקות שולחן האוכל',       category: 'ניקיון',    icon: 'ti-droplet',         assigneeId: 'noa',   freq: 'יומי',    requiresApproval: false, points: 8,  status: 'open' },
    { id: 8, title: 'לסדר ספרים בארון',        category: 'ארגון הבית', icon: 'ti-books',           assigneeId: 'emily', freq: 'שבועי',   requiresApproval: false, points: 12, status: 'open' },
  ],
  rewards: [
    { id: 1, label: 'הזמנה לבחירה מאייהרב', cost: 1000 },
  ],
};

const CATEGORIES = ['ניקיון', 'ארגון הבית', 'מיון וסדר', 'מטבח', 'כביסה', 'חיות מחמד', 'אחר'];
const FREQ_OPTIONS = ['יומי', 'אחת ליומיים', 'אחת ל-3 ימים', 'אחת ל-4 ימים', 'אחת ל-5 ימים', 'שבועי', 'אחת לשבועיים', 'חד פעמי'];
const CATEGORY_ICONS = {
  'ניקיון': 'ti-droplet', 'ארגון הבית': 'ti-folder', 'מיון וסדר': 'ti-sort-descending',
  'מטבח': 'ti-chef-hat', 'כביסה': 'ti-shirt', 'חיות מחמד': 'ti-paw', 'אחר': 'ti-dots',
};
const WEEK_DAYS = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];

// ── Persistence ────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem('mishimot_state');
    if (raw) return JSON.parse(raw);
  } catch(_) {}
  return null;
}

function save(state) {
  try { localStorage.setItem('mishimot_state', JSON.stringify(state)); } catch(_) {}
}

// ── App State ──────────────────────────────────
const _saved = load();
let state = _saved || {
  users:      JSON.parse(JSON.stringify(SEED.users)),
  tasks:      JSON.parse(JSON.stringify(SEED.tasks)),
  nextTaskId: 9,
  persona:    'parent_mom',
  view:       'dashboard',
};
// rewards always come from SEED so parent can update them via code
state.rewards = JSON.parse(JSON.stringify(SEED.rewards));

// ── Helpers ────────────────────────────────────
const byId = (arr, id) => arr.find(x => x.id === id);
const children = () => state.users.filter(u => u.role === 'child');
const parents  = () => state.users.filter(u => u.role === 'parent');
const isParent = () => byId(state.users, state.persona)?.role === 'parent';
const currentUser = () => byId(state.users, state.persona);

function bucket(status) {
  if (status === 'done')    return 'done';
  if (status === 'open')    return 'progress';
  return 'attention'; // late, pending
}

function bucketMeta(key) {
  return {
    progress:  { label: 'בתהליך',      cls: 'pill-progress', icon: 'ti-player-play',    textColor: 'var(--text-accent)' },
    attention: { label: 'דורש טיפול',  cls: 'pill-attention', icon: 'ti-alert-triangle', textColor: 'var(--text-warning)' },
    done:      { label: 'הושלם',       cls: 'pill-done',      icon: 'ti-check',          textColor: 'var(--text-success)' },
  }[key];
}

function detailTag(status) {
  if (status === 'late')    return ' · באיחור';
  if (status === 'pending') return ' · ממתין לאישור';
  return '';
}

function persist() { save(state); }

// ── Fireworks ──────────────────────────────────
function fireworks() {
  const layer = document.getElementById('fw-layer');
  if (!layer) return;
  const colors = ['var(--fill-accent)','var(--fill-success)','var(--fill-warning)','var(--fill-pro)','var(--fill-brand)'];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    const angle = Math.random() * Math.PI * 2;
    const dist  = 60 + Math.random() * 120;
    const dx    = Math.round(Math.cos(angle) * dist);
    const dy    = Math.round(Math.sin(angle) * dist);
    Object.assign(span.style, {
      position: 'absolute',
      top: '45%', left: '50%',
      width: '10px', height: '10px',
      borderRadius: '50%',
      background: colors[i % colors.length],
      '--dx': dx + 'px', '--dy': dy + 'px',
      animation: 'fwpop 0.9s ease-out forwards',
    });
    layer.appendChild(span);
    setTimeout(() => span.remove(), 950);
  }
}

// ── Toast ──────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Complete task ──────────────────────────────
function completeTask(taskId) {
  const task = byId(state.tasks, taskId);
  if (!task || task.status === 'done') return;
  if (task.requiresApproval && !isParent()) {
    task.status = 'pending';
    persist();
    renderApp();
    toast('הוגש לאישור הורה ✓');
    return;
  }
  task.status = 'done';
  const user = byId(state.users, task.assigneeId);
  if (user) user.points += task.points;
  persist();
  renderApp();
  fireworks();
  toast(`כל הכבוד! +${task.points} נקודות 🎉`);
}

// ── Approve task ───────────────────────────────
function approveTask(taskId) {
  const task = byId(state.tasks, taskId);
  if (!task) return;
  task.status = 'done';
  const user = byId(state.users, task.assigneeId);
  if (user) user.points += task.points;
  persist();
  renderApp();
  fireworks();
  toast(`אושר! +${task.points} נקודות`);
}

// ── Add task ───────────────────────────────────
function addTask(data) {
  state.tasks.push({
    id:              state.nextTaskId++,
    title:           data.title,
    category:        data.category,
    icon:            CATEGORY_ICONS[data.category] || 'ti-dots',
    assigneeId:      data.assigneeId,
    freq:            data.freq,
    requiresApproval: data.requiresApproval,
    points:          data.points,
    status:          'open',
  });
  persist();
}

// ── Redeem reward ──────────────────────────────
function redeemReward(rewardId) {
  const reward = byId(state.rewards, rewardId);
  const user   = currentUser();
  if (!reward || !user) return;
  if (user.points < reward.cost) return;
  user.points -= reward.cost;
  persist();
  renderApp();
  toast(`מומש: ${reward.label} 🎁`);
}

/* ══════════════════════════════════════════════
   RENDER FUNCTIONS
   ══════════════════════════════════════════════ */

// ── Pill ───────────────────────────────────────
function pill(status) {
  const m = bucketMeta(bucket(status));
  return `<span class="pill ${m.cls}"><i class="ti ${m.icon}" aria-hidden="true"></i> ${m.label}${detailTag(status)}</span>`;
}

// ── Metric card ────────────────────────────────
function metricCard(label, value) {
  return `<div class="metric-card"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

// ── Progress bar ───────────────────────────────
function progressBar(done, total) {
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  return `<div class="progress-wrap">
    <div class="legend">${done} מתוך ${total} הושלמו היום — ${pct}%</div>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;
}

// ── Edit task modal ────────────────────────────
function openEditTask(taskId) {
  const task = byId(state.tasks, taskId);
  if (!task) return;

  const assigneeOpts = [...children(), ...parents()].map(u =>
    `<option value="${u.id}" ${u.id === task.assigneeId ? 'selected' : ''}>${u.name}</option>`).join('');
  const catOpts = CATEGORIES.map(c =>
    `<option value="${c}" ${c === task.category ? 'selected' : ''}>${c}</option>`).join('');
  const freqOpts = FREQ_OPTIONS.map(f =>
    `<option value="${f}" ${f === task.freq ? 'selected' : ''}>${f}</option>`).join('');

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-body').innerHTML = `
    <h3>עריכת משימה</h3>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
      <div class="form-group"><label>שם המשימה</label>
        <input type="text" id="et-title" value="${task.title}" /></div>
      <div class="form-group"><label>קטגוריה</label>
        <select id="et-cat">${catOpts}</select></div>
      <div class="form-group"><label>תדירות</label>
        <select id="et-freq">${freqOpts}</select></div>
      <div class="form-group"><label>משויך ל</label>
        <select id="et-assignee">${assigneeOpts}</select></div>
      <div class="form-group"><label>נקודות</label>
        <input type="number" id="et-points" min="1" max="50" value="${task.points}" /></div>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="et-approval" ${task.requiresApproval ? 'checked' : ''} />
        דורש אישור הורה
      </label>
    </div>
    <div class="modal-actions" style="justify-content:space-between;">
      <button class="secondary" style="color:var(--text-warning);border-color:var(--fill-warning);"
        onclick="deleteTask(${taskId})">מחק משימה</button>
      <div style="display:flex;gap:8px;">
        <button class="secondary" onclick="closeModal()">ביטול</button>
        <button class="primary" onclick="saveEditTask(${taskId})">שמור שינויים</button>
      </div>
    </div>`;
}

function saveEditTask(taskId) {
  const task = byId(state.tasks, taskId);
  if (!task) return;
  const title = document.getElementById('et-title')?.value.trim();
  if (!title) { toast('נא להזין שם'); return; }
  task.title           = title;
  task.category        = document.getElementById('et-cat')?.value || task.category;
  task.freq            = document.getElementById('et-freq')?.value || task.freq;
  task.assigneeId      = document.getElementById('et-assignee')?.value || task.assigneeId;
  task.points          = Number(document.getElementById('et-points')?.value) || task.points;
  task.requiresApproval = document.getElementById('et-approval')?.checked || false;
  task.icon            = CATEGORY_ICONS[task.category] || 'ti-dots';
  persist();
  closeModal();
  renderContent();
  toast('המשימה עודכנה ✓');
}

function deleteTask(taskId) {
  if (!confirm('למחוק את המשימה?')) return;
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  persist();
  closeModal();
  renderContent();
  toast('המשימה נמחקה');
}

// ── Task row (parent list) ─────────────────────
function taskRow(task, opts = {}) {
  const assignee = byId(state.users, task.assigneeId);
  const meta = [task.category, task.freq, opts.showAssignee && assignee ? assignee.name : null]
    .filter(Boolean).join(' · ') + detailTag(task.status);

  let action = '';
  if (opts.showActions) {
    if (task.status === 'pending')
      action = `<button class="secondary" onclick="approveTask(${task.id})">אשר</button>`;
    else if (task.status === 'late')
      action = `<button class="secondary" onclick="toast('נשלחה תזכורת 📣')">תזכורת</button>`;
  }

  const editBtn = `<button class="secondary" style="padding:4px 10px;flex-shrink:0;" onclick="openEditTask(${task.id})" title="עריכה"><i class="ti ti-pencil" aria-hidden="true"></i> עריכה</button>`;

  return `<div class="task-row">
    <i class="ti ${task.icon} icon" aria-hidden="true"></i>
    <div class="info">
      <div class="title">${task.title}</div>
      <div class="meta">${meta}</div>
    </div>
    ${pill(task.status)}
    ${action}
    ${opts.showActions ? editBtn : ''}
  </div>`;
}

// ── Kanban ─────────────────────────────────────
function kanbanCard(task) {
  const b = bucket(task.status);
  let inner = '';
  if (b === 'progress' || (b === 'attention' && task.status === 'late')) {
    inner = `<div class="k-action"><button class="primary" style="font-size:12px;padding:5px 12px;width:100%;" onclick="completeTask(${task.id})">סיימתי ✓</button></div>`;
  } else if (b === 'attention' && task.status === 'pending') {
    inner = `<div class="k-action"><span style="font-size:11px;color:var(--text-warning);">ממתין לאישור הורה</span></div>`;
  } else {
    inner = `<div class="k-action"><span style="font-size:11px;color:var(--text-success);"><i class="ti ti-check" aria-hidden="true"></i> הושלם</span></div>`;
  }
  return `<div class="kanban-card">
    <div class="k-title"><i class="ti ${task.icon}" aria-hidden="true"></i><span>${task.title}</span></div>
    <div class="k-meta">${task.category}${detailTag(task.status)} · ${task.points} נק׳</div>
    ${inner}
  </div>`;
}

function kanbanColumn(bucketKey, items) {
  const m = bucketMeta(bucketKey);
  return `<div class="kanban-col">
    <div class="kanban-col-header" style="color:${m.textColor}">
      <i class="ti ${m.icon}" aria-hidden="true"></i>
      <span>${m.label}</span>
      <span class="count">(${items.length})</span>
    </div>
    ${items.map(kanbanCard).join('')}
    ${items.length === 0 ? '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">אין כרגע</div>' : ''}
  </div>`;
}

function renderKanban(tasks) {
  const groups = { progress: [], attention: [], done: [] };
  tasks.forEach(t => groups[bucket(t.status)].push(t));
  return `<div class="kanban">
    ${kanbanColumn('progress',  groups.progress)}
    ${kanbanColumn('attention', groups.attention)}
    ${kanbanColumn('done',      groups.done)}
  </div>`;
}

// ── Weekly bar chart ───────────────────────────
function weekChart(weekly) {
  if (!weekly || weekly.length === 0) return '';
  return `<div class="section">
    <h3>השלמה לפי יום</h3>
    <div class="week-chart">
      ${weekly.map((v, i) => `
        <div class="week-bar">
          <div class="week-bar-track">
            <div class="week-bar-fill" style="height:${v}%"></div>
          </div>
          <span class="week-bar-label">${WEEK_DAYS[i]}</span>
        </div>`).join('')}
    </div>
  </div>`;
}

// ── Reward shop ────────────────────────────────
function rewardShop(userPoints, showRedeem = false) {
  const rows = state.rewards.map(r => {
    const canAfford = userPoints >= r.cost;
    const redeemBtn = showRedeem
      ? `<button class="reward-redeem" onclick="redeemReward(${r.id})" ${canAfford ? '' : 'disabled'}>מימוש</button>`
      : '';
    return `<div class="reward-row">
      <span class="reward-label" style="color:${canAfford ? 'var(--text-primary)' : 'var(--text-muted)'}">${r.label}</span>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="reward-cost">${r.cost} נקודות</span>
        ${redeemBtn}
      </div>
    </div>`;
  }).join('');
  return `<div class="section card">
    <h3>חנות פרסים</h3>
    <div>${rows}</div>
  </div>`;
}

// ── Parent add-task form ───────────────────────
function addTaskForm() {
  const assigneeOpts = [...children(), ...parents()].map(u =>
    `<option value="${u.id}">${u.name}</option>`).join('');

  const catOpts = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  const freqOpts = FREQ_OPTIONS.map(f => `<option value="${f}">${f}</option>`).join('');

  return `<div class="section card">
    <h3>הוספת משימה חדשה</h3>
    <div id="add-task-form">
      <div class="form-group"><label>שם המשימה</label><input type="text" id="at-title" placeholder="לדוג׳: לשטוף כלים" /></div>
      <div class="form-group"><label>קטגוריה</label><select id="at-cat">${catOpts}</select></div>
      <div class="form-group"><label>תדירות</label><select id="at-freq">${freqOpts}</select></div>
      <div class="form-group"><label>משויך ל</label><select id="at-assignee">${assigneeOpts}</select></div>
      <div class="form-group"><label>נקודות</label><input type="number" id="at-points" min="1" max="50" value="10" /></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="primary" id="at-submit">הוסף משימה</button>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
        <input type="checkbox" id="at-approval" /> דורש אישור הורה
      </label>
    </div>
  </div>`;
}

// ── Parent dashboard ───────────────────────────
let parentFilter = null; // null = all, or userId string

function setParentFilter(userId) {
  parentFilter = (parentFilter === userId) ? null : userId;
  renderContent();
}

function renderParent() {
  const tasks = state.tasks;
  const doneCount      = tasks.filter(t => t.status === 'done').length;
  const progressCount  = tasks.filter(t => bucket(t.status) === 'progress').length;
  const attentionCount = tasks.filter(t => bucket(t.status) === 'attention').length;

  const memberCards = children().map(m => {
    const mTasks = tasks.filter(t => t.assigneeId === m.id);
    const mDone  = mTasks.filter(t => t.status === 'done').length;
    const isActive = parentFilter === m.id;
    return `<div class="member-card" onclick="setParentFilter('${m.id}')" style="cursor:pointer;transition:all 0.15s;${isActive ? 'border-color:var(--border-accent);box-shadow:0 0 0 2px var(--bg-accent);' : ''}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div class="avatar" style="${isActive ? 'background:var(--fill-accent);color:#fff;' : ''}">${m.name[0]}</div>
        <div><div class="name">${m.name}</div><div class="pts">${m.points} נקודות</div></div>
      </div>
      <div class="stat">${mDone} מתוך ${mTasks.length} הושלמו היום</div>
      ${m.streakDays > 0 ? `<div style="margin-top:6px"><span class="streak-badge"><i class="ti ti-flame" aria-hidden="true"></i> ${m.streakDays} ימים ברצף</span></div>` : ''}
      ${isActive ? `<div style="margin-top:8px;font-size:11px;color:var(--text-accent);">מציג משימות של ${m.name} בלבד · לחץ שוב לביטול</div>` : ''}
    </div>`;
  }).join('');

  const filteredTasks = parentFilter
    ? tasks.filter(t => t.assigneeId === parentFilter)
    : tasks;

  const filterUser = parentFilter ? byId(state.users, parentFilter) : null;
  const listTitle  = filterUser ? `משימות של ${filterUser.name}` : 'כל המשימות';

  const allRows = filteredTasks.length > 0
    ? filteredTasks.map(t => taskRow(t, { showAssignee: !parentFilter, showActions: true })).join('')
    : `<div style="padding:16px 0;color:var(--text-muted);font-size:14px;">אין משימות להצגה</div>`;

  return `
    <h2>לוח ניהול — היום</h2>

    <div class="metric-grid">
      ${metricCard('כל המשימות', tasks.length)}
      ${metricCard('הושלם', doneCount)}
      ${metricCard('בתהליך', progressCount)}
      ${metricCard('דורש טיפול', attentionCount)}
    </div>

    <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">לחצי על ילדה כדי לסנן את המשימות שלה</p>
    <div class="member-cards">${memberCards}</div>

    ${addTaskForm()}

    <div class="section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <h3 style="margin:0;">${listTitle} (${filteredTasks.length})</h3>
        ${parentFilter ? `<button class="secondary" style="font-size:12px;" onclick="setParentFilter(null)">הצג הכל</button>` : ''}
      </div>
      <div>${allRows}</div>
    </div>
  `;
}

// ── Child view (older, kanban) ─────────────────
function renderChildOlder(user) {
  const myTasks = state.tasks.filter(t => t.assigneeId === user.id);
  const done    = myTasks.filter(t => t.status === 'done').length;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
      <h2 style="margin:0">${user.name}, המשימות שלי</h2>
      <div style="display:flex;gap:8px;">
        ${metricCard('נקודות', user.points)}
        ${user.streakDays > 0 ? `<div class="metric-card"><div class="label">ימים ברצף</div><div class="value">${user.streakDays} 🔥</div></div>` : ''}
      </div>
    </div>

    ${progressBar(done, myTasks.length)}
    ${renderKanban(myTasks)}
    ${weekChart(user.weekly)}
    ${rewardShop(user.points, true)}
  `;
}

// ── Child view (alma, big cards) ───────────────
function renderAlma(user) {
  const myTasks = state.tasks.filter(t => t.assigneeId === user.id);

  const cards = myTasks.map(t => {
    const isDone = t.status === 'done';
    return `<div class="alma-card">
      <div class="alma-icon"><i class="ti ${t.icon}" aria-hidden="true"></i></div>
      <div class="alma-title">${t.title}</div>
      ${isDone
        ? `<div class="alma-done-msg">✅ כל הכבוד!</div>`
        : `<button class="alma-btn" onclick="completeTask(${t.id})">סיימתי! 🌟</button>`}
    </div>`;
  }).join('');

  return `
    <h2>${user.name}, היום שלי</h2>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;">⭐ ${user.points} כוכבים</p>
    <div class="alma-grid">${cards}</div>
  `;
}

// ── Rewards tab (parent) ───────────────────────
function renderRewardsParent() {
  const childRows = children().map(u => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:0.5px solid var(--border);">
      <div class="avatar" style="width:32px;height:32px;font-size:12px;border-radius:50%;background:var(--bg-accent);color:var(--text-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${u.name[0]}</div>
      <span style="flex:1">${u.name}</span>
      <strong>${u.points} נקודות</strong>
    </div>`).join('');

  const shopRows = state.rewards.map(r => `
    <div class="reward-row">
      <span class="reward-label">${r.label}</span>
      <span class="reward-cost">${r.cost} נקודות</span>
    </div>`).join('');

  return `
    <h2>תגמולים ופרסים</h2>
    <div class="section card">
      <h3>נקודות נצברות</h3>
      <div>${childRows}</div>
    </div>
    <div class="section card">
      <h3>חנות פרסים</h3>
      <div>${shopRows}</div>
      <div style="margin-top:12px;">
        <button class="secondary" onclick="openAddRewardModal()">+ הוסף פרס</button>
      </div>
    </div>
  `;
}

// ── Reports (parent) ───────────────────────────
function renderReports() {
  const rows = children().map(u => {
    const myTasks = state.tasks.filter(t => t.assigneeId === u.id);
    const done    = myTasks.filter(t => t.status === 'done').length;
    const pct     = myTasks.length > 0 ? Math.round(done / myTasks.length * 100) : 0;
    return `<div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:14px;font-weight:500;">${u.name}</span>
        <span style="font-size:13px;color:var(--text-muted)">${done}/${myTasks.length} · ${pct}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  const topUser = [...children()].sort((a,b) => b.points - a.points)[0];

  return `
    <h2>דוחות התקדמות</h2>
    ${topUser ? `<div class="section card" style="background:var(--bg-success)">
      <p style="font-size:13px;color:var(--text-success)">🏆 המסייעת הגדולה ביותר השבוע</p>
      <p style="font-size:18px;font-weight:600;margin-top:4px;">${topUser.name} — ${topUser.points} נקודות</p>
    </div>` : ''}
    <div class="section card">
      <h3>שיעור השלמה לפי ילדה</h3>
      ${rows}
    </div>
  `;
}

/* ══════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════ */

function openAddRewardModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-body').innerHTML = `
    <h3>הוספת פרס חדש</h3>
    <div class="form-group" style="margin-bottom:12px;">
      <label>תיאור הפרס</label>
      <input type="text" id="mr-label" placeholder="לדוג׳: בחירת פעילות" />
    </div>
    <div class="form-group" style="margin-bottom:16px;">
      <label>עלות בנקודות</label>
      <input type="number" id="mr-cost" min="5" max="200" value="25" />
    </div>
    <div class="modal-actions">
      <button class="secondary" onclick="closeModal()">ביטול</button>
      <button class="primary" onclick="saveReward()">שמור</button>
    </div>`;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function saveReward() {
  const label = document.getElementById('mr-label')?.value.trim();
  const cost  = Number(document.getElementById('mr-cost')?.value) || 25;
  if (!label) return;
  const maxId = state.rewards.reduce((m, r) => Math.max(m, r.id), 0);
  state.rewards.push({ id: maxId + 1, label, cost });
  persist();
  closeModal();
  renderContent();
  toast('פרס נוסף ✓');
}

/* ══════════════════════════════════════════════
   NAVIGATION & RENDER
   ══════════════════════════════════════════════ */

const PARENT_VIEWS = [
  { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'לוח' },
  { id: 'rewards',   icon: 'ti-gift',             label: 'פרסים' },
  { id: 'reports',   icon: 'ti-chart-bar',        label: 'דוחות' },
];

function setPersona(id) {
  state.persona = id;
  // reset view
  state.view = isParent() ? 'dashboard' : 'tasks';
  persist();
  renderApp();
}

function setView(v) {
  state.view = v;
  renderContent();
  renderNav();
}

function renderContent() {
  const content = document.getElementById('content');
  if (!content) return;

  const user = currentUser();
  if (!user) { content.innerHTML = '<p>שגיאה</p>'; return; }

  if (user.role === 'parent') {
    if (state.view === 'rewards') { content.innerHTML = renderRewardsParent(); return; }
    if (state.view === 'reports') { content.innerHTML = renderReports(); return; }
    content.innerHTML = renderParent();
    attachAddTask();
    return;
  }

  // Child
  if (user.age <= 7) {
    content.innerHTML = renderAlma(user);
  } else {
    content.innerHTML = renderChildOlder(user);
  }
}

function renderNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  const user = currentUser();
  if (!user) return;

  if (user.role === 'parent') {
    nav.innerHTML = PARENT_VIEWS.map(v => `
      <button class="nav-btn ${state.view === v.id ? 'active' : ''}" onclick="setView('${v.id}')">
        <i class="ti ${v.icon}" aria-hidden="true"></i>
        <span>${v.label}</span>
      </button>`).join('');
  } else {
    nav.innerHTML = `
      <button class="nav-btn active">
        <i class="ti ti-list-check" aria-hidden="true"></i>
        <span>משימות</span>
      </button>
      <button class="nav-btn" onclick="openChildRewards()">
        <i class="ti ti-gift" aria-hidden="true"></i>
        <span>פרסים</span>
      </button>`;
  }
}

function openChildRewards() {
  const user = currentUser();
  if (!user) return;
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-body').innerHTML = `
    <h3>חנות פרסים — ${user.name}</h3>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">יש לך <strong>${user.points}</strong> נקודות</p>
    ${state.rewards.map(r => {
      const can = user.points >= r.cost;
      return `<div class="reward-row">
        <span class="reward-label" style="color:${can ? 'var(--text-primary)' : 'var(--text-muted)'}">${r.label}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="reward-cost">${r.cost} נקודות</span>
          <button class="reward-redeem" onclick="redeemReward(${r.id});closeModal();" ${can ? '' : 'disabled'}>מימוש</button>
        </div>
      </div>`;
    }).join('')}
    <div class="modal-actions"><button class="secondary" onclick="closeModal()">סגור</button></div>`;
}

function renderPersonaSwitcher() {
  const el = document.getElementById('persona-switcher');
  if (!el) return;

  const all = [
    ...parents().map(u => ({ id: u.id, label: u.name })),
    ...children().map(u => ({ id: u.id, label: u.name })),
  ];

  el.innerHTML = all.map(p => `
    <button class="persona-btn ${state.persona === p.id ? 'active' : ''}" onclick="setPersona('${p.id}')">${p.label}</button>
  `).join('');
}

function attachAddTask() {
  const btn = document.getElementById('at-submit');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const title = document.getElementById('at-title')?.value.trim();
    if (!title) { toast('נא להזין שם למשימה'); return; }
    addTask({
      title,
      category:        document.getElementById('at-cat')?.value || 'אחר',
      freq:            document.getElementById('at-freq')?.value || 'יומי',
      assigneeId:      document.getElementById('at-assignee')?.value,
      points:          Number(document.getElementById('at-points')?.value) || 10,
      requiresApproval: document.getElementById('at-approval')?.checked || false,
    });
    renderContent();
    toast('משימה נוספה ✓');
    // scroll to top smoothly
    document.getElementById('page')?.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderApp() {
  renderPersonaSwitcher();
  renderContent();
  renderNav();

  const user = currentUser();
  const sub  = document.getElementById('header-sub');
  if (sub && user) {
    sub.textContent = user.role === 'parent' ? 'תצוגת הורה' : `${user.name} · ${user.points} נקודות`;
  }
}

// ── Bootstrap ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  renderApp();
});
