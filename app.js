'use strict';

const { resources: RESOURCES, tasks: TASKS, templates: TEMPLATES, statuses: STATUSES,
  guides: GUIDES, taskDetails: TASK_DETAILS, branches: BRANCHES,
  materialPresets: MATERIAL_PRESETS, contentSources: CONTENT_SOURCES,
  regionalPhd: REGIONAL_PHD, universityCatalog: UNIVERSITY_CATALOG } = window.CS_DATA;
const STORAGE_KEY = 'cs-navigator-2026-v1';
const MATERIAL_STATUSES = ['待准备', '准备中', '待修改', '已完成'];
const TEMPLATE_SCOPES = { jobcv: 'job', jd: 'job', coldemail: 'phd', sop: 'phd', reading: 'phd', mainlandphd: 'phd', hkphd: 'phd', macauphd: 'phd', matrix: 'both', interview: 'both', weekly: 'both' };
const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4m8-4v4M3 9h18"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v5h5M8 12h8M8 16h6"/></svg>',
  compare: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7v14H4zM13 5h7v14h-7zM7 9h1m8 0h1M7 13h1m8 0h1"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5zM13.8 6.7l3.5 3.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>'
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const safeText = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const todayKey = () => dateKey(new Date());
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = value => value ? new Date(`${value}T12:00:00`) : null;
const dateLabel = value => {
  const date = parseDate(value);
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date) : '未设截止日期';
};
const monthLabel = date => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(date);
const isHttpsUrl = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

function defaultState() {
  return {
    mode: 'all', favorites: [], done: [], applications: [], custom: [], template: 'jobcv',
    customTasks: [], compareTargets: [], materials: []
  };
}

function sanitizeState(input) {
  const clean = defaultState();
  if (!input || typeof input !== 'object') return clean;
  clean.mode = ['all', 'job', 'phd'].includes(input.mode) ? input.mode : 'all';
  clean.favorites = Array.isArray(input.favorites) ? input.favorites.filter(value => typeof value === 'string').slice(0, 2000) : [];
  clean.done = Array.isArray(input.done) ? input.done.filter(value => typeof value === 'string').slice(0, 1000) : [];
  clean.applications = Array.isArray(input.applications) ? input.applications.filter(item => item && typeof item === 'object').slice(0, 500).map(item => ({
    id: safeText(item.id, 100) || makeId('app'), name: safeText(item.name, 110), role: safeText(item.role, 160),
    path: ['job', 'phd'].includes(item.path) ? item.path : 'job', deadline: safeText(item.deadline, 10),
    status: STATUSES.includes(item.status) ? item.status : STATUSES[0], url: isHttpsUrl(item.url) ? safeText(item.url, 1000) : '', next: safeText(item.next, 240)
  })).filter(item => item.name) : [];
  clean.custom = Array.isArray(input.custom) ? input.custom.filter(item => item && typeof item === 'object').slice(0, 500).map(item => ({
    id: safeText(item.id, 100) || makeId('custom'), name: safeText(item.name, 90), url: isHttpsUrl(item.url) ? safeText(item.url, 1000) : '',
    scope: ['job', 'phd', 'both'].includes(item.scope) ? item.scope : 'both', cat: '自定义资源', region: '全球', kind: '个人添加',
    summary: safeText(item.summary, 180), action: safeText(item.action, 180) || '请核查当前内容与适用范围。',
    warning: '该资源由你添加，请自行核对。', priority: 2
  })).filter(item => item.name && item.url) : [];
  clean.template = Object.hasOwn(TEMPLATES, input.template) ? input.template : 'jobcv';
  clean.customTasks = Array.isArray(input.customTasks) ? input.customTasks.filter(item => item && typeof item === 'object').slice(0, 1000).map(item => ({
    id: safeText(item.id, 100) || makeId('plan'), title: safeText(item.title, 120), path: ['job', 'phd', 'both'].includes(item.path) ? item.path : 'both',
    category: safeText(item.category, 60), deadline: safeText(item.deadline, 10), notes: safeText(item.notes, 300), done: Boolean(item.done)
  })).filter(item => item.title) : [];
  clean.compareTargets = Array.isArray(input.compareTargets) ? input.compareTargets.filter(item => item && typeof item === 'object').slice(0, 4).map(item => ({
    id: safeText(item.id, 100) || makeId('target'), name: safeText(item.name, 110), type: ['job', 'phd'].includes(item.type) ? item.type : 'job',
    organization: safeText(item.organization, 120), location: safeText(item.location, 90), compensation: safeText(item.compensation, 120),
    deadline: safeText(item.deadline, 10), requirements: safeText(item.requirements, 240), notes: safeText(item.notes, 300),
    url: isHttpsUrl(item.url) ? safeText(item.url, 1000) : ''
  })).filter(item => item.name) : [];
  clean.materials = Array.isArray(input.materials) ? input.materials.filter(item => item && typeof item === 'object').slice(0, 1000).map(item => ({
    id: safeText(item.id, 100) || makeId('material'), name: safeText(item.name, 100), type: safeText(item.type, 60), target: safeText(item.target, 120),
    status: MATERIAL_STATUSES.includes(item.status) ? item.status : MATERIAL_STATUSES[0], version: safeText(item.version, 80),
    deadline: safeText(item.deadline, 10), notes: safeText(item.notes, 300)
  })).filter(item => item.name) : [];
  return clean;
}

let storageOK = true;
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : defaultState();
  } catch {
    storageOK = false;
    return defaultState();
  }
}

let state = loadState();
let view = 'overview';
let toastTimer;
let editingId = '';
let editingType = '';
let templateId = state.template;
window.showResourceForm = false;
let resourceFilters = { query: '', category: 'all', region: 'all', kind: 'all', university: 'all', province: 'all', csGrade: 'all', saved: false, priority: false };
let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = todayKey();
let searchMatches = [];
let resourceSort = 'priority';
let resourcePage = 1;
let roadmapFilter = 'all';
let routeDetailsOpen = false;
let regionalPhdKey = 'mainland';
let applicationFilters = { query: '', status: 'all' };
let planFilters = { query: '', status: 'all' };
let materialFilters = { query: '', status: 'all' };
let templateScope = 'all';
let calendarActiveOnly = false;

function persist() {
  if (!storageOK) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
    setStorageMessage('此浏览器无法保存数据，请及时导出备份。');
  }
}

function setStorageMessage(message) {
  const node = $('#storage-msg');
  if (!node) return;
  node.textContent = message;
  $('.storage-dot')?.classList.toggle('warn', !storageOK);
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
}

function allResources() { return RESOURCES.concat(state.custom); }
function visibleResources() { return allResources().filter(item => state.mode === 'all' || item.scope === 'both' || item.scope === state.mode); }
function taskTotal(path) { return TASKS[path].reduce((total, group) => total + group[1].length, 0); }
function taskDoneCount(path) { return TASKS[path].reduce((total, group) => total + group[1].filter(([id]) => state.done.includes(id)).length, 0); }
function getPathName(path) { return path === 'phd' ? '申博' : path === 'job' ? '就业' : '双轨'; }
function tag(text, className = '') { return `<span class="tag ${className}">${esc(text)}</span>`; }
function nextIncompleteTask(path) {
  for (const [group, tasks] of TASKS[path]) {
    const next = tasks.find(([id]) => !state.done.includes(id));
    if (next) return { id: next[0], title: next[1], group };
  }
  return null;
}

function render() {
  const main = $('#main-content');
  const renderers = {
    overview: renderOverview, resources: renderResources, roadmap: renderRoadmap, applications: renderApplications,
    calendar: renderCalendar, plans: renderPlans, compare: renderCompare, materials: renderMaterials, templates: renderTemplates
  };
  main.innerHTML = renderers[view]();
  $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  setStorageMessage(storageOK ? '数据保存在当前浏览器' : '此浏览器无法保存数据，请及时导出备份。');
}

function pageHead(title, description, actions = '') {
  const guide = GUIDES[view];
  return `<header class="page-head"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>
    <details class="section-guide"><summary><strong>${esc(guide.title)}</strong><span>使用指引</span></summary><ol>${guide.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><p>${esc(guide.note)}</p></details>`;
}

function daysUntil(value) {
  const date = parseDate(value), today = parseDate(todayKey());
  return date && !Number.isNaN(date.getTime()) ? Math.round((date - today) / 86400000) : null;
}

function isActiveApplication(item) { return !['已结束', 'Offer/录取'].includes(item.status); }

function renderEditor(type, title, content, empty) {
  return `<details class="record-editor" data-editor="${type}" ${editingType === type || empty ? 'open' : ''}><summary>${editingType === type ? '正在编辑 · ' : ''}${esc(title)}<span>展开 / 收起表单</span></summary>${content}</details>`;
}

function renderStats(items) {
  return `<div class="section-stats">${items.map(([label, value, destination, focus]) => `<button type="button" class="stat-card" ${focus ? `data-overview-focus="${focus}"` : `data-view="${destination}"`}><span>${esc(label)}</span><strong>${esc(value)}</strong></button>`).join('')}</div>`;
}

function renderRecordFilters(section, filters, options) {
  return `<div class="record-filters"><div class="field"><label for="${section}-query">搜索记录</label><input type="search" id="${section}-query" data-filter-query="${section}" value="${esc(filters.query)}" placeholder="名称、目标、备注等"></div><div class="field"><label for="${section}-filter">状态 / 时间</label><select id="${section}-filter" data-filter-status="${section}">${options.map(([value, label]) => `<option value="${esc(value)}" ${filters.status === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div><button type="button" class="btn subtle small" data-reset-list="${section}">清空筛选</button></div>`;
}

function renderRouteTask(id, label) {
  const detail = TASK_DETAILS[id];
  const links = detail.resources.map(resourceId => RESOURCES.find(item => item.id === resourceId)).filter(Boolean);
  return `<div class="task-entry"><label class="task-line"><input id="task-${esc(id)}" type="checkbox" data-task="${esc(id)}" ${state.done.includes(id) ? 'checked' : ''}><span>${esc(label)}</span></label>
    <details class="task-detail" ${routeDetailsOpen ? 'open' : ''}><summary>步骤与完成标准</summary><ol>${detail.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><p><strong>完成标准：</strong>${esc(detail.outcome)}</p><p class="task-pitfall"><strong>常见误区：</strong>${esc(detail.pitfall)}</p>${links.length ? `<div class="task-resource-links">${links.map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.name)} ↗</a>`).join('')}</div>` : ''}</details></div>`;
}

function renderBranchFocus(path) {
  return `<details class="branch-focus"><summary>${getPathName(path)}方向怎么细分</summary><p class="small-note">以下是准备切入点，可按实际岗位或研究问题调整；不要求全部完成。</p><div class="branch-grid">${BRANCHES[path].map(branch => `<article><h3>${esc(branch.name)}</h3><p>${esc(branch.focus)}</p><p><strong>可展示的证据：</strong>${esc(branch.evidence)}</p></article>`).join('')}</div></details>`;
}

function regionalResourceCount(region) {
  return RESOURCES.filter(item => item.region === region && item.scope !== 'job').length;
}

function resourceSearchText(item) {
  return [item.name, item.summary, item.cat, item.region, item.kind, item.action, item.output,
    item.school?.name, item.school?.province, item.school?.csGrade, ...(item.school?.labels || []), ...(item.school?.aliases || [])].join(' ').toLocaleLowerCase();
}

function renderUniversityDirectory() {
  const counts = ['double-first', '985', '211'].map(group => UNIVERSITY_CATALOG.entries.filter(item => item.groups.includes(group)).length);
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];
  const gradeCounts = Object.fromEntries(grades.map(grade => [grade, UNIVERSITY_CATALOG.entries.filter(item => item.csGrade === grade).length]));
  const gradeGroups = [['A', 'A 类'], ['B', 'B 类'], ['C', 'C 类']];
  const matched = UNIVERSITY_CATALOG.evaluation.matchedEntries;
  return `<section class="university-directory" aria-labelledby="university-directory-title"><div><h2 id="university-directory-title">中国大陆 · 院校名单</h2><p>按第二轮（2022）双一流名单收录 ${counts[0]} 所，其中 ${matched} 所匹配第四轮学科评估 0812 计算机科学与技术公开分档。包含原 985、211 对应院校，已与已有招生资源去重。</p></div>
    <div class="university-shortcuts" role="group" aria-label="按高校名单筛选">${[['double-first',`双一流 · ${counts[0]}`],['985',`原 985 · ${counts[1]}`],['211',`原 211 · ${counts[2]} 条`]].map(([group,label]) => `<button class="btn ${state.mode === 'phd' && resourceFilters.university === group ? 'primary' : 'subtle'} small" type="button" data-university-group="${group}" aria-pressed="${state.mode === 'phd' && resourceFilters.university === group}">${label}</button>`).join('')}</div>
    <div class="evaluation-filter" aria-label="按第四轮学科评估筛选"><div class="evaluation-heading"><strong>第四轮学科评估 · 0812</strong><span>2017 年历史参考</span></div><div class="university-shortcuts">${gradeGroups.map(([group,label]) => `<button class="btn ${state.mode === 'phd' && resourceFilters.csGrade === group ? 'primary' : 'subtle'} small" type="button" data-cs-grade="${group}" aria-pressed="${state.mode === 'phd' && resourceFilters.csGrade === group}">${label} · ${grades.filter(grade => grade.startsWith(group)).reduce((sum, grade) => sum + gradeCounts[grade], 0)}</button>`).join('')}</div><div class="grade-chips" role="group" aria-label="按第四轮评估精确分档筛选">${grades.map(grade => `<button class="grade-chip grade-${grade.replace('+','plus').replace('-','minus')} ${resourceFilters.csGrade === grade && state.mode === 'phd' ? 'active' : ''}" type="button" data-cs-grade="${grade}" aria-pressed="${resourceFilters.csGrade === grade && state.mode === 'phd'}"><strong>${grade}</strong><span>${gradeCounts[grade]}</span></button>`).join('')}</div></div>
    <p class="small-note">学校在名单内，不代表计算机学科入选、设有相关博士点或当批有名额。评估结果来自 2017 年第四轮评估，不能替代当前博士点、导师、名额与录取要求核查。</p><details class="catalog-sources"><summary>名单口径、评估口径、入口核对与官方来源</summary><p>985、211 是历史工程标签。本目录按第二轮 147 校口径：地矿油两地办学实体分别列出；华北电力北京、保定校区合为一条。因此原 211 对应 115 条目录记录，按教育部历史名单合并名称为 112 个。各标签有重叠，数量不能相加。</p><p>第四轮评估公开表共 168 条 0812 分档记录，与本目录按办学实体及学校代码匹配 91 所。公开表中的“中国地质大学”和“中国石油大学”分别按代码对应武汉、北京办学实体；未匹配只说明本目录未关联到该档位，不等于未参评或学科弱。</p><p>所在地按主校区；河北工业大学按天津、华北电力大学按北京归类。更名院校保留旧名搜索。未确认研究生栏目时提供学校官网导航，并单独标注；核对日期不保证网站当前可访问。</p><div class="task-resource-links">${UNIVERSITY_CATALOG.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('')}${UNIVERSITY_CATALOG.evaluation.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('')}</div></details></section>`;
}

function renderUniversityMeta(school) {
  if (!school) return '';
  const gradeClass = school.csGrade ? ` grade-${school.csGrade.replace('+','plus').replace('-','minus')}` : ' no-grade';
  const gradeTag = school.csGrade ? tag(`第四轮 0812 · ${school.csGrade}`, `cs-grade${gradeClass}`) : tag('第四轮 0812 · 未收录', 'cs-grade no-grade');
  const evaluationNote = school.csGrade
    ? `<p><strong>第四轮学科评估：</strong>${esc(school.csGrade)}（0812 计算机科学与技术，2017 年结果，历史参考）。</p>`
    : '<p><strong>第四轮学科评估：</strong>该校未出现在本目录关联的 0812 公开分档表中；这不等于未参评或学科弱。</p>';
  return `<div class="university-labels">${school.labels.map(label => tag(label, 'university-tag')).join('')}${tag(school.province)}${gradeTag}</div><details class="university-notes"><summary>院校、评估与入口说明</summary><p><strong>学校：</strong>${esc(school.name)} · 主校所在地：${esc(school.province)}</p>${evaluationNote}<p><strong>核对方式：</strong>${esc(school.verification)}</p>${school.note ? `<p>${esc(school.note)}</p>` : ''}${school.aliases.length ? `<p>可搜索旧名 / 别名：${esc(school.aliases.join('、'))}</p>` : ''}<a href="${esc(school.website)}" target="_blank" rel="noreferrer">学校官网 ↗</a></details>`;
}

function renderRegionalPhd() {
  const guide = REGIONAL_PHD[regionalPhdKey];
  const sources = guide.sources.map(id => RESOURCES.find(item => item.id === id)).filter(Boolean);
  const sections = [['materials', '材料检查清单'], ['funding', '资助与费用核对'], ['pitfalls', '常见误区']];
  return `<section class="panel regional-phd" id="regional-phd" aria-labelledby="regional-phd-title"><div class="panel-title"><div><h2 id="regional-phd-title" tabindex="-1">大陆与港澳 · 博士申请指引</h2><p>按地区查通道、材料与资助。入口资料核对：2026-10-21。</p></div><span class="pill">3 地区</span></div>
    <div class="regional-tabs" role="group" aria-label="选择博士申请地区">${Object.entries(REGIONAL_PHD).map(([key, item]) => `<button type="button" class="btn ${key === regionalPhdKey ? 'primary' : 'subtle'}" data-regional-phd="${key}" aria-pressed="${key === regionalPhdKey}">${esc(item.label)} <small>${regionalResourceCount(item.region)} 个入口</small></button>`).join('')}</div>
    <p class="regional-summary">${esc(guide.summary)}</p><div class="regional-routes">${guide.routes.map(([title, description]) => `<article><h3>${esc(title)}</h3><p>${esc(description)}</p></article>`).join('')}</div>
    <details class="regional-detail" open><summary>申请推进顺序 · 6 步</summary><ol>${guide.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol></details>
    <div class="regional-checks">${sections.map(([key, title]) => `<details class="regional-detail"><summary>${title}</summary><ul>${guide[key].map(item => `<li>${esc(item)}</li>`).join('')}</ul></details>`).join('')}</div>
    <div class="regional-actions"><button type="button" class="btn primary small" data-phd-region="${regionalPhdKey}">查看${esc(guide.label)}博士资源 · ${regionalResourceCount(guide.region)} 项</button><button type="button" class="btn subtle small" data-regional-template="${regionalPhdKey}">打开本地区申请核对表</button></div>
    <details class="regional-detail"><summary>官方依据与继续查阅</summary><p class="small-note">下列为查阅起点。示例章程只说明该校该年度，使用时查目标当届通知；院校列表不表示排名或仍有名额。</p><div class="task-resource-links">${[...sources.map(item => ({title:item.name,url:item.url})), ...guide.evidence].map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} ↗</a>`).join('')}</div></details>
    <p class="small-note">具体资格、金额及截止日以目标当届官方说明为准。申请看板仅保存日期；完整截止时刻和原始时区请记入“下一步动作”或核对表。</p></section>`;
}

function renderOverview() {
  const modes = state.mode === 'all' ? ['job', 'phd'] : [state.mode];
  const progressRows = modes.map(path => {
    const done = taskDoneCount(path), total = taskTotal(path), percent = total ? Math.round(done / total * 100) : 0;
    return `<div class="progress-row"><span>${getPathName(path)}行动路线</span><div class="progress-track" role="progressbar" aria-label="${getPathName(path)}进度" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${percent}%"></div></div><strong>${done} / ${total}</strong></div>`;
  }).join('');
  const upcoming = state.applications.filter(item => item.deadline >= todayKey() && !['已结束', 'Offer/录取'].includes(item.status) && (state.mode === 'all' || item.path === state.mode)).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
  const nextActions = modes.map(path => {
    const item = nextIncompleteTask(path);
    return item ? `<div class="next-action-row"><div><strong>${getPathName(path)} · ${esc(item.title)}</strong><small>${esc(item.group)}</small></div><button class="btn subtle small" type="button" data-open-roadmap="${path}">查看任务 ${ICONS.arrow}</button></div>` : `<div class="next-action-row"><div><strong>${getPathName(path)}路线已完成</strong><small>你可以创建自定义计划，或继续查看资源库。</small></div><button class="btn subtle small" type="button" data-view="plans">管理计划 ${ICONS.arrow}</button></div>`;
  }).join('');
  const deadlines = upcoming.length ? `<div class="table-scroll"><table class="deadline-table"><thead><tr><th>截止日期</th><th>事项</th><th>方向</th><th>状态</th></tr></thead><tbody>${upcoming.map(item => `<tr><td class="date">${esc(item.deadline)}</td><td class="name"><a href="#" data-open-app="${esc(item.id)}">${esc(item.name)}</a></td><td>${getPathName(item.path)}</td><td><span class="status-dot ${item.status === '已结束' ? 'done' : item.status.includes('面试') ? 'active' : ''}"></span>${esc(item.status)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><strong>这里会显示最近的申请节点</strong>记录申请事项和截止日期后，就能在总览里快速查看。</div>`;
  const customDone = state.customTasks.filter(item => item.done).length;
  const customTotal = state.customTasks.length;
  const materialDone = state.materials.filter(item => item.status === '已完成').length;
  const activeApplications = state.applications.filter(item => (state.mode === 'all' || item.path === state.mode) && isActiveApplication(item));
  const weekCount = activeApplications.filter(item => { const days = daysUntil(item.deadline); return days !== null && days >= 0 && days <= 7; }).length;
  const pastCount = activeApplications.filter(item => daysUntil(item.deadline) !== null && daysUntil(item.deadline) < 0).length;
  const openPlans = state.customTasks.filter(item => !item.done && (state.mode === 'all' || item.path === 'both' || item.path === state.mode)).length;
  return `${pageHead('你好，专注规划，稳步前行', '在这里管理就业与申博目标、跟踪进度，并把申请过程安排得清晰可控。')}
    <section class="overview-path" aria-label="当前规划方向"><strong>当前路径</strong><select id="overview-mode" aria-label="选择当前路径"><option value="all" ${state.mode === 'all' ? 'selected' : ''}>就业与申博</option><option value="job" ${state.mode === 'job' ? 'selected' : ''}>计算机就业</option><option value="phd" ${state.mode === 'phd' ? 'selected' : ''}>计算机申博</option></select><button class="btn primary" type="button" data-view="roadmap">下一步 ${ICONS.arrow}</button></section>
    ${renderStats([['未来 7 天截止', weekCount, 'applications', 'week'], ['截止已过 · 需复核', pastCount, 'applications', 'overdue'], ['未完成计划', openPlans, 'plans', 'open-plans'], ['待备材料 · 全部目标', state.materials.length - materialDone, 'materials', 'open-materials']])}
    <section class="panel metric-overview"><div class="panel-title"><div><h2>进度概览</h2><p>完成情况会随任务勾选自动更新。</p></div><span class="small-note">${state.mode === 'all' ? '双轨路线' : `${getPathName(state.mode)}路线`}</span></div><div class="progress-list">${progressRows}</div></section>
    <div class="overview-columns"><section class="panel"><div class="panel-title"><div><h2>近期截止事项</h2><p>根据你录入的申请截止日期排序。</p></div><button class="btn subtle small" type="button" data-view="calendar">查看日历 ${ICONS.arrow}</button></div>${deadlines}</section>
    <section class="panel"><div class="panel-title"><div><h2>继续你的计划</h2><p>从最需要整理的部分开始。</p></div></div><div class="quick-links">
      <button class="quick-link" type="button" data-view="resources"><span class="quick-icon">${ICONS.search}</span><span><strong>查找资源</strong><small>${visibleResources().length} 个已收录入口</small></span></button>
      <button class="quick-link" type="button" data-view="plans"><span class="quick-icon">${ICONS.file}</span><span><strong>自定义计划</strong><small>${customDone} / ${customTotal} 项完成</small></span></button>
      <button class="quick-link" type="button" data-view="compare"><span class="quick-icon">${ICONS.compare}</span><span><strong>比较目标</strong><small>${state.compareTargets.length} 个目标已记录</small></span></button>
      <button class="quick-link" type="button" data-view="materials"><span class="quick-icon">${ICONS.file}</span><span><strong>准备申请材料</strong><small>${materialDone} 项材料已完成</small></span></button>
      <button class="quick-link" type="button" data-open-regional-phd><span class="quick-icon">${ICONS.file}</span><span><strong>大陆与港澳申博</strong><small>3 地区指引 · 申请与资助核对表</small></span></button>
      <button class="quick-link" type="button" data-university-group="double-first"><span class="quick-icon">${ICONS.search}</span><span><strong>大陆高校目录</strong><small>147 所双一流 · 原 985 / 211 标签</small></span></button>
    </div></section></div>
    <section class="panel overview-next"><div class="panel-title"><div><h2>下一步行动</h2><p>先完成当前最关键的一步；可在路线中展开完成标准。</p></div><button class="btn subtle small" type="button" data-view="roadmap">打开行动路线 ${ICONS.arrow}</button></div><div class="next-action-list">${nextActions}</div></section>`;
}

function renderResources() {
  const source = visibleResources();
  const categories = [...new Set(source.map(item => item.cat))].sort((a, b) => a.localeCompare(b, 'zh'));
  const regions = [...new Set(source.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'zh'));
  const kinds = [...new Set(source.map(item => item.kind))].sort((a, b) => a.localeCompare(b, 'zh'));
  const csGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];
  if (resourceFilters.category !== 'all' && !categories.includes(resourceFilters.category)) resourceFilters.category = 'all';
  if (resourceFilters.region !== 'all' && !regions.includes(resourceFilters.region)) resourceFilters.region = 'all';
  if (resourceFilters.kind !== 'all' && !kinds.includes(resourceFilters.kind)) resourceFilters.kind = 'all';
  if (resourceFilters.csGrade !== 'all' && !['A', 'B', 'C', ...csGrades].includes(resourceFilters.csGrade)) resourceFilters.csGrade = 'all';
  const provinces = [...new Set(source.filter(item => item.school).map(item => item.school.province))].sort((a,b) => a.localeCompare(b,'zh'));
  if (resourceFilters.province !== 'all' && !provinces.includes(resourceFilters.province)) resourceFilters.province = 'all';
  if (!source.some(item => item.school)) resourceFilters.university = 'all';
  const query = resourceFilters.query.toLocaleLowerCase();
  const items = source.filter(item => {
    const haystack = resourceSearchText(item);
    return (!query || haystack.includes(query)) && (resourceFilters.category === 'all' || item.cat === resourceFilters.category) &&
      (resourceFilters.region === 'all' || item.region === resourceFilters.region) && (resourceFilters.kind === 'all' || item.kind === resourceFilters.kind) &&
      (resourceFilters.university === 'all' || item.school?.groups.includes(resourceFilters.university)) && (resourceFilters.province === 'all' || item.school?.province === resourceFilters.province) &&
      (resourceFilters.csGrade === 'all' || (resourceFilters.csGrade.length === 1 ? item.school?.csGrade.startsWith(resourceFilters.csGrade) : item.school?.csGrade === resourceFilters.csGrade)) &&
      (!resourceFilters.saved || state.favorites.includes(item.id)) && (!resourceFilters.priority || item.priority === 1);
  });
  if (resourceSort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  else if (resourceSort === 'official') items.sort((a, b) => Number(b.kind === '官方平台') - Number(a.kind === '官方平台'));
  else items.sort((a, b) => a.priority - b.priority);
  const pageCount = Math.max(1, Math.ceil(items.length / 24));
  resourcePage = Math.min(Math.max(1, resourcePage), pageCount);
  const pageItems = items.slice((resourcePage - 1) * 24, resourcePage * 24);
  const categoryOptions = ['全部类别', ...categories].map((value, index) => `<option value="${index ? esc(value) : 'all'}" ${resourceFilters.category === (index ? value : 'all') ? 'selected' : ''}>${esc(value)}</option>`).join('');
  const kindOptions = ['全部类型', ...kinds].map((value, index) => `<option value="${index ? esc(value) : 'all'}" ${resourceFilters.kind === (index ? value : 'all') ? 'selected' : ''}>${esc(value)}</option>`).join('');
  const cards = items.length ? pageItems.map(item => `<article class="resource-card"><div class="resource-top"><div class="resource-tags">${tag(item.cat)}${tag(item.kind, item.kind === 'GitHub' ? 'primary-tag' : item.kind === '官方平台' ? 'official-tag' : '')}${tag(item.region)}</div><button class="fav-button ${state.favorites.includes(item.id) ? 'active' : ''}" type="button" data-favorite="${esc(item.id)}" aria-label="${state.favorites.includes(item.id) ? '取消收藏' : '收藏'} ${esc(item.name)}" title="${state.favorites.includes(item.id) ? '取消收藏' : '收藏'}">${state.favorites.includes(item.id) ? '★' : '☆'}</button></div><h3>${esc(item.name)}</h3>${renderUniversityMeta(item.school)}<p>${esc(item.summary)}</p><div class="resource-action"><strong>建议动作：</strong>${esc(item.action)}</div>${item.output ? `<div class="resource-output"><strong>建议产出：</strong>${esc(item.output)}</div>` : ''}${item.warning ? `<div class="resource-warning">注意：${esc(item.warning)}</div>` : ''}${item.reviewedOn ? `<p class="resource-review small-note">入口资料核对：${esc(item.reviewedOn)}</p>` : ''}<div class="resource-bottom"><a class="resource-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${item.school?.reviewMethod === 'university-home' ? '从官网查招生' : '查看资源'} ↗</a>${item.id.startsWith('custom-') ? `<button class="btn danger small" type="button" data-remove-resource="${esc(item.id)}">删除自定义</button>` : `<span class="small-note">${item.school ? item.school.entryKind : item.priority === 1 ? '优先入门' : '补充探索'}</span>`}</div></article>`).join('') : `<div class="empty-state"><strong>没有找到匹配资源</strong>清空筛选条件，或切换到双轨总览查看更多结果。</div>`;
  const actions = `<div class="path-switch" aria-label="资源方向"><button type="button" data-mode="all" class="${state.mode === 'all' ? 'active' : ''}">全部</button><button type="button" data-mode="job" class="${state.mode === 'job' ? 'active' : ''}">就业</button><button type="button" data-mode="phd" class="${state.mode === 'phd' ? 'active' : ''}">申博</button></div>`;
  return `${pageHead('可筛选资源库', `内置 ${RESOURCES.length} 个资源入口，覆盖就业、学习实践、科研与博士申请。每项提供用途、动作和产出建议。`, `${actions}<button class="btn primary" type="button" data-toggle-form="resource">${ICONS.plus} 添加自己的资源</button>`)}
    <div class="regional-shortcuts" aria-label="大陆与港澳博士资源快捷筛选"><strong>定向申博</strong>${Object.entries(REGIONAL_PHD).map(([key, guide]) => `<button class="btn subtle small" type="button" data-phd-region="${key}" aria-pressed="${state.mode === 'phd' && resourceFilters.region === guide.region}">${esc(guide.label)} · ${regionalResourceCount(guide.region)}</button>`).join('')}<button class="btn subtle small" type="button" data-open-regional-phd>查看三地申请指引 ${ICONS.arrow}</button></div>${renderUniversityDirectory()}<section class="panel"><div class="filter-grid"><div class="field"><label for="resource-query">关键词</label><input id="resource-query" type="search" value="${esc(resourceFilters.query)}" placeholder="企业、地区、课程、论文、奖学金、院校、评估等级"></div><div class="field"><label for="resource-category">类别</label><select id="resource-category">${categoryOptions}</select></div><div class="field"><label for="resource-region">地区</label><select id="resource-region"><option value="all">全部地区</option>${regions.map(value => `<option ${resourceFilters.region === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div><div class="field"><label for="resource-kind">来源类型</label><select id="resource-kind">${kindOptions}</select></div><div class="field"><label for="resource-university">院校名单</label><select id="resource-university">${[['all','不限院校名单'],['double-first','第二轮双一流'],['985','原985工程'],['211','原211工程']].map(([value,label]) => `<option value="${value}" ${resourceFilters.university === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label for="resource-province">主校所在地</label><select id="resource-province"><option value="all">全部所在地</option>${provinces.map(value => `<option ${resourceFilters.province === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></div><div class="field"><label for="resource-cs-grade">第四轮学科评估 · 0812</label><select id="resource-cs-grade">${[['all','不限评估分档'],['A','A 类（A+ / A / A-）'],['B','B 类（B+ / B / B-）'],['C','C 类（C+ / C / C-）'],...csGrades.map(grade => [grade, `${grade} 档`])].map(([value,label]) => `<option value="${esc(value)}" ${resourceFilters.csGrade === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div></div>
    <div class="filter-bar"><div class="filter-controls"><label class="filter-check"><input id="resource-saved" type="checkbox" ${resourceFilters.saved ? 'checked' : ''}>只看收藏</label><label class="filter-check"><input id="resource-priority" type="checkbox" ${resourceFilters.priority ? 'checked' : ''}>优先推荐</label><button class="btn subtle small" type="button" data-reset-resource-filters>清空筛选</button></div><div class="resource-sort"><label for="resource-sort">排序</label><select id="resource-sort"><option value="priority" ${resourceSort === 'priority' ? 'selected' : ''}>推荐顺序</option><option value="name" ${resourceSort === 'name' ? 'selected' : ''}>名称排序</option><option value="official" ${resourceSort === 'official' ? 'selected' : ''}>官方入口优先</option></select><span class="resource-count" role="status">匹配 ${items.length} / ${source.length} 项</span></div></div>
    <div id="resource-form-slot">${renderResourceForm()}</div><div class="resource-grid" id="resource-list">${cards}</div><nav class="pagination" aria-label="资源分页"><span>第 ${resourcePage} / ${pageCount} 页 · 每页最多 24 项</span><div class="page-actions"><button class="btn subtle small" type="button" data-resource-page="${resourcePage - 1}" ${resourcePage === 1 ? 'disabled' : ''}>上一页</button><button class="btn subtle small" type="button" data-resource-page="${resourcePage + 1}" ${resourcePage === pageCount ? 'disabled' : ''}>下一页</button></div></nav></section>`;
}

function renderResourceForm() {
  if (!window.showResourceForm) return '';
  return `<form class="panel form-panel" data-form="resource"><div class="panel-title"><div><h2>添加个人资源</h2><p>自定义链接保存在当前浏览器。只接受 HTTPS 地址。</p></div><button class="btn subtle small" type="button" data-toggle-form="resource">收起</button></div><div class="form-grid"><div class="field"><label for="cr-name">资源名称</label><input id="cr-name" name="name" required maxlength="90" placeholder="例如：某校博士招生页"></div><div class="field span-2"><label for="cr-url">HTTPS 链接</label><input id="cr-url" name="url" type="url" required placeholder="https://..."></div><div class="field"><label for="cr-scope">适用方向</label><select id="cr-scope" name="scope"><option value="both">就业与申博</option><option value="job">就业</option><option value="phd">申博</option></select></div><div class="field span-4"><label for="cr-summary">用途说明</label><input id="cr-summary" name="summary" maxlength="180" placeholder="这个链接可以帮助你做什么"></div></div><div class="form-actions"><button class="btn primary" type="submit">保存资源</button></div></form>`;
}

function renderRoadmap() {
  const modes = state.mode === 'all' ? ['job', 'phd'] : [state.mode];
  const groups = modes.map(path => {
    const total = taskTotal(path), done = taskDoneCount(path), percent = total ? Math.round(done / total * 100) : 0;
    const stages = TASKS[path].map(([group, tasks], index) => {
      const visible = tasks.filter(([id]) => roadmapFilter === 'all' || (roadmapFilter === 'done') === state.done.includes(id));
      const completed = tasks.filter(([id]) => state.done.includes(id)).length;
      return visible.length ? `<section class="taskgroup"><h3>${String(index + 1).padStart(2, '0')} · ${esc(group)} <small>${completed} / ${tasks.length}</small></h3>${visible.map(([id, label]) => renderRouteTask(id, label)).join('')}</section>` : '';
    }).join('');
    return `<section class="panel"><div class="panel-title"><div><h2>${getPathName(path)}行动路线</h2><p>${done} / ${total} 项完成 · ${percent}%</p></div><div class="progress-track" style="width:min(240px,35vw)" role="progressbar" aria-label="${getPathName(path)}进度" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${percent}%"></div></div></div>${renderBranchFocus(path)}<div class="task-groups">${stages || '<div class="empty-state"><strong>当前筛选下没有任务</strong>切换“全部任务”查看完整路线。</div>'}</div></section>`;
  }).join('');
  const actions = `<div class="path-switch" aria-label="路线范围"><button type="button" data-mode="all" class="${state.mode === 'all' ? 'active' : ''}">双轨</button><button type="button" data-mode="job" class="${state.mode === 'job' ? 'active' : ''}">就业</button><button type="button" data-mode="phd" class="${state.mode === 'phd' ? 'active' : ''}">申博</button></div>`;
  return `${pageHead('把信息变成实际行动', '就业与申博分阶段推进。按完成状态聚焦任务，展开步骤与完成标准。', actions)}<div class="section-toolbar"><div class="field"><label for="roadmap-status">任务范围</label><select id="roadmap-status"><option value="all" ${roadmapFilter === 'all' ? 'selected' : ''}>全部任务</option><option value="open" ${roadmapFilter === 'open' ? 'selected' : ''}>未完成</option><option value="done" ${roadmapFilter === 'done' ? 'selected' : ''}>已完成</option></select></div><button class="btn subtle small" type="button" data-route-details>${routeDetailsOpen ? '收起全部详情' : '展开全部详情'}</button><details class="reset-menu"><summary>进度管理</summary><button class="btn danger small" type="button" data-reset-tasks>重置当前路线进度</button></details></div>${state.mode !== 'job' ? renderRegionalPhd() : ''}${groups}`;
}

function renderApplicationForm() {
  const editing = editingType === 'application' ? state.applications.find(item => item.id === editingId) : null;
  const item = editing || { name: '', role: '', path: state.mode === 'phd' ? 'phd' : 'job', deadline: '', status: STATUSES[0], url: '', next: '' };
  return `<form class="panel form-panel" data-form="application"><div class="panel-title"><div><h2>${editing ? '编辑申请事项' : '添加申请事项'}</h2><p>记录企业、博士项目、导师沟通或奖学金机会。</p></div>${editing ? '<button class="btn subtle small" type="button" data-cancel-edit>取消编辑</button>' : ''}</div><div class="form-grid"><div class="field"><label for="ap-name">企业 / 院校 / 项目</label><input id="ap-name" name="name" required maxlength="110" value="${esc(item.name)}" placeholder="例如：某大学计算机博士项目"></div><div class="field"><label for="ap-role">岗位或研究方向</label><input id="ap-role" name="role" maxlength="160" value="${esc(item.role)}" placeholder="例如：分布式系统 / 后端开发"></div><div class="field"><label for="ap-path">申请方向</label><select id="ap-path" name="path"><option value="job" ${item.path === 'job' ? 'selected' : ''}>就业</option><option value="phd" ${item.path === 'phd' ? 'selected' : ''}>申博</option></select></div><div class="field"><label for="ap-deadline">截止日期</label><input id="ap-deadline" name="deadline" type="date" value="${esc(item.deadline)}"></div><div class="field"><label for="ap-status">当前状态</label><select id="ap-status" name="status">${STATUSES.map(status => `<option ${item.status === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select></div><div class="field"><label for="ap-url">官方申请链接</label><input id="ap-url" name="url" type="url" value="${esc(item.url)}" placeholder="https://..."></div><div class="field span-2"><label for="ap-next">下一步动作</label><input id="ap-next" name="next" maxlength="240" value="${esc(item.next)}" placeholder="例如：确认推荐信收件；官方截止时间及原始时区"></div></div><div class="form-actions"><button class="btn primary" type="submit">${editing ? '保存修改' : `${ICONS.plus} 添加申请事项`}</button></div></form>`;
}

function renderApplications() {
  const scoped = state.applications.filter(item => state.mode === 'all' || item.path === state.mode);
  const query = applicationFilters.query.toLocaleLowerCase();
  const filtered = scoped.filter(item => {
    const days = daysUntil(item.deadline), status = applicationFilters.status;
    const statusMatch = status === 'all' || (status === 'active' ? isActiveApplication(item) : status === 'overdue' ? isActiveApplication(item) && days !== null && days < 0 : status === 'week' ? isActiveApplication(item) && days !== null && days >= 0 && days <= 7 : item.status === status);
    return statusMatch && `${item.name} ${item.role} ${item.next} ${item.status}`.toLocaleLowerCase().includes(query);
  }).sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  const cards = filtered.length ? filtered.map(item => `<article class="tracker-item" id="app-${esc(item.id)}"><div><div class="resource-tags">${tag(getPathName(item.path))}${tag(item.deadline ? `${item.deadline} · ${daysLeft(item.deadline)}` : '未设截止日期', isActiveApplication(item) && daysUntil(item.deadline) !== null && daysUntil(item.deadline) <= 7 ? 'attention-tag' : '')}</div><strong>${esc(item.name)}</strong><small>${esc(item.role || '未填写具体岗位或研究方向')}</small><small class="${!item.next && isActiveApplication(item) ? 'needs-info' : ''}">下一步：${esc(item.next || (isActiveApplication(item) ? '待补充具体动作' : '未记录后续动作'))}</small>${item.url ? `<small><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">打开官方申请页 ↗</a></small>` : ''}</div><div><label class="field-label" for="status-${esc(item.id)}">申请状态</label><select id="status-${esc(item.id)}" data-app-status="${esc(item.id)}">${STATUSES.map(status => `<option ${status === item.status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select></div><div class="tracker-actions"><button class="btn small" type="button" data-edit-app="${esc(item.id)}">编辑</button><button class="btn small danger" type="button" data-remove-app="${esc(item.id)}">删除</button></div></article>`).join('') : `<div class="empty-state"><strong>${scoped.length ? '没有符合当前筛选的申请' : '还没有申请事项'}</strong>${scoped.length ? '清空筛选或切换方向，查看其他申请记录。' : '记录一个真实目标，填写下一步动作；添加日期后同步出现在日历里。'}</div>`;
  const actions = `<div class="path-switch" aria-label="申请方向"><button type="button" data-mode="all" class="${state.mode === 'all' ? 'active' : ''}">全部</button><button type="button" data-mode="job" class="${state.mode === 'job' ? 'active' : ''}">就业</button><button type="button" data-mode="phd" class="${state.mode === 'phd' ? 'active' : ''}">申博</button></div>`;
  return `${pageHead('我的申请看板', '按截止日期管理目标、当前状态和下一步动作。数据只保存在当前浏览器。', `${actions}<button class="btn primary small" type="button" data-open-editor="application">新增申请</button>`)}
    <div class="status-pipeline" aria-label="申请状态统计">${STATUSES.map(status => `<button type="button" data-application-status="${esc(status)}" class="${applicationFilters.status === status ? 'active' : ''}"><span>${esc(status)}</span><strong>${scoped.filter(item => item.status === status).length}</strong></button>`).join('')}</div>
    ${renderRecordFilters('applications', applicationFilters, [['all', '全部申请'], ['active', '进行中'], ['week', '未来 7 天截止'], ['overdue', '截止已过 · 需复核'], ...STATUSES.map(status => [status, status])])}<p class="list-caption" role="status">显示 ${filtered.length} / ${scoped.length} 项 · 按截止日期排序</p><div class="tracker-list">${cards}</div>${renderEditor('application', '新增申请事项', renderApplicationForm(), !scoped.length)}`;
}

function daysLeft(value) {
  const target = parseDate(value);
  if (!target || Number.isNaN(target.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const days = Math.round((target - today) / 86400000);
  return days < 0 ? `已过 ${-days} 天` : days === 0 ? '今天截止' : `还有 ${days} 天`;
}

function renderCalendar() {
  const year = calendarCursor.getFullYear(), month = calendarCursor.getMonth();
  const calendarApps = state.applications.filter(item => (state.mode === 'all' || item.path === state.mode) && (!calendarActiveOnly || isActiveApplication(item)));
  const monthEvents = calendarApps.filter(item => item.deadline && item.deadline.startsWith(dateKey(calendarCursor).slice(0, 7))).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const first = new Date(year, month, 1), offset = (first.getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const slots = Math.ceil((offset + dayCount) / 7) * 7;
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'].map(day => `<div class="calendar-weekday">周${day}</div>`).join('');
  const days = Array.from({ length: slots }, (_, index) => {
    const date = new Date(year, month, index - offset + 1);
    const key = dateKey(date);
    const events = calendarApps.filter(item => item.deadline === key);
    const outside = date.getMonth() !== month;
    return `<div class="calendar-day ${outside ? 'outside' : ''} ${key === todayKey() ? 'today' : ''} ${key === selectedCalendarDate ? 'selected' : ''}"><div class="calendar-day-head"><button type="button" data-select-date="${key}" aria-label="选择 ${key}">${date.getDate()}</button>${events.length ? `<span class="small-note">${events.length}</span>` : ''}</div>${events.slice(0, 2).map(item => `<button class="calendar-event ${item.path}" type="button" data-open-app="${esc(item.id)}" title="${esc(item.name)}">${esc(item.name)}</button>`).join('')}${events.length > 2 ? `<span class="calendar-more">另有 ${events.length - 2} 项</span>` : ''}</div>`;
  }).join('');
  const selectedEvents = calendarApps.filter(item => item.deadline === selectedCalendarDate);
  const detail = selectedEvents.length ? `<div class="tracker-list">${selectedEvents.map(item => `<article class="tracker-item"><div><div class="resource-tags">${tag(getPathName(item.path))}${tag(item.status)}</div><strong>${esc(item.name)}</strong><small>${esc(item.role || '未填写具体岗位或研究方向')}</small></div><div><small>${esc(item.next || '还没有记录下一步动作')}</small></div><div class="tracker-actions"><button class="btn small" type="button" data-open-app="${esc(item.id)}">查看申请</button></div></article>`).join('')}</div>` : `<div class="empty-state"><strong>这一天没有截止事项</strong>选择其他日期，或添加一条带截止日期的申请记录。<br><button class="btn subtle small" type="button" data-view="applications">添加申请事项</button></div>`;
  return `${pageHead('申请截止日历', '日历只显示申请看板里已填写的日期，不会生成示例事件。')}
    <section class="panel"><div class="calendar-toolbar"><div class="page-actions"><button class="btn subtle small" type="button" data-calendar-step="-1" aria-label="上一个月">‹</button><button class="btn subtle small" type="button" data-calendar-today>今天</button><button class="btn subtle small" type="button" data-calendar-step="1" aria-label="下一个月">›</button></div><h2>${monthLabel(calendarCursor)}</h2><div class="path-switch"><button type="button" data-mode="all" class="${state.mode === 'all' ? 'active' : ''}">全部</button><button type="button" data-mode="job" class="${state.mode === 'job' ? 'active' : ''}">就业</button><button type="button" data-mode="phd" class="${state.mode === 'phd' ? 'active' : ''}">申博</button></div></div><div class="calendar-legend"><span class="legend-job">就业</span><span class="legend-phd">申博</span><label class="filter-check"><input id="calendar-active-only" type="checkbox" ${calendarActiveOnly ? 'checked' : ''}>只看进行中申请</label><span>本月 ${monthEvents.length} 项 · 仅显示申请看板日期</span></div><div class="calendar-grid">${weekdays}${days}</div><section class="calendar-detail"><h3>${dateLabel(selectedCalendarDate)} · 截止事项</h3>${detail}</section><details class="month-agenda" ${monthEvents.length ? 'open' : ''}><summary>本月事项列表 · ${monthEvents.length} 项</summary>${monthEvents.length ? `<div class="agenda-list">${monthEvents.map(item => `<button type="button" data-open-app="${esc(item.id)}"><span>${esc(item.deadline)}</span><strong>${esc(item.name)}</strong><small>${getPathName(item.path)} · ${esc(item.status)}</small></button>`).join('')}</div>` : '<p class="small-note">本月暂无已录入的申请日期。可以切换月份或在申请看板补充日期。</p>'}</details></section>`;
}

function renderPlanForm() {
  const editing = editingType === 'plan' ? state.customTasks.find(item => item.id === editingId) : null;
  const item = editing || { title: '', path: state.mode === 'phd' ? 'phd' : state.mode === 'job' ? 'job' : 'both', category: '', deadline: '', notes: '' };
  return `<form class="panel form-panel" data-form="plan"><div class="panel-title"><div><h2>${editing ? '编辑计划事项' : '添加自定义任务'}</h2><p>为学习、申请或求职安排自己的里程碑。</p></div>${editing ? '<button class="btn subtle small" type="button" data-cancel-edit>取消编辑</button>' : ''}</div><div class="form-grid"><div class="field span-2"><label for="plan-title">任务名称</label><input id="plan-title" name="title" required maxlength="120" value="${esc(item.title)}" placeholder="例如：完成一个可部署的后端项目"></div><div class="field"><label for="plan-path">适用方向</label><select id="plan-path" name="path"><option value="both" ${item.path === 'both' ? 'selected' : ''}>双轨通用</option><option value="job" ${item.path === 'job' ? 'selected' : ''}>就业</option><option value="phd" ${item.path === 'phd' ? 'selected' : ''}>申博</option></select></div><div class="field"><label for="plan-category">阶段 / 分类</label><input id="plan-category" name="category" maxlength="60" value="${esc(item.category)}" placeholder="例如：项目实践"></div><div class="field"><label for="plan-deadline">计划日期</label><input id="plan-deadline" name="deadline" type="date" value="${esc(item.deadline)}"></div><div class="field span-2"><label for="plan-notes">备注</label><input id="plan-notes" name="notes" maxlength="300" value="${esc(item.notes)}" placeholder="拆分步骤、链接或验收标准"></div></div><div class="form-actions"><button class="btn primary" type="submit">${editing ? '保存修改' : `${ICONS.plus} 添加计划`}</button></div></form>`;
}

function renderPlans() {
  const scoped = state.customTasks.filter(item => state.mode === 'all' || item.path === 'both' || item.path === state.mode);
  const query = planFilters.query.toLocaleLowerCase();
  const items = scoped.filter(item => {
    const status = planFilters.status;
    return (status === 'all' || (status === 'done' ? item.done : status === 'overdue' ? !item.done && daysUntil(item.deadline) !== null && daysUntil(item.deadline) < 0 : !item.done)) && `${item.title} ${item.category} ${item.notes}`.toLocaleLowerCase().includes(query);
  }).sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  const list = items.length ? `<div class="plan-list">${items.map(item => `<article class="plan-item ${item.done ? 'done' : ''}" id="plan-${esc(item.id)}"><input type="checkbox" data-plan-done="${esc(item.id)}" ${item.done ? 'checked' : ''} aria-label="标记 ${esc(item.title)} 完成"><div><strong>${esc(item.title)}</strong><small>${esc(item.notes || '暂无备注')}</small><div class="item-meta">${tag(getPathName(item.path))}${item.category ? tag(item.category) : ''}${item.deadline ? tag(`${item.deadline} · ${daysLeft(item.deadline)}`) : ''}</div></div><div class="item-actions"><button class="btn small" type="button" data-edit-plan="${esc(item.id)}">编辑</button><button class="btn small danger" type="button" data-remove-plan="${esc(item.id)}">删除</button></div></article>`).join('')}</div>` : `<div class="empty-state"><strong>${scoped.length ? '没有符合当前筛选的计划' : '还没有自定义任务'}</strong>${scoped.length ? '清空筛选或切换方向，查看其他计划。' : '用“动作 + 对象”创建一项任务，并在备注写明交付物。'}</div>`;
  return `${pageHead('自定义计划', '添加、编辑和完成自己的学习任务或申请里程碑。路线任务仍在“行动路线”中管理。', `<div class="path-switch" aria-label="计划方向"><button type="button" data-mode="all" class="${state.mode === 'all' ? 'active' : ''}">全部</button><button type="button" data-mode="job" class="${state.mode === 'job' ? 'active' : ''}">就业</button><button type="button" data-mode="phd" class="${state.mode === 'phd' ? 'active' : ''}">申博</button></div><button class="btn primary small" type="button" data-open-editor="plan">新增计划</button>`)}<div class="completion-strip"><span>${scoped.filter(item => item.done).length} / ${scoped.length} 项完成</span><progress max="${scoped.length || 1}" value="${scoped.filter(item => item.done).length}" aria-label="计划完成进度"></progress></div>${renderRecordFilters('plans', planFilters, [['all', '全部计划'], ['open', '未完成'], ['done', '已完成'], ['overdue', '计划日期已过']])}<p class="list-caption" role="status">显示 ${items.length} / ${scoped.length} 项 · 按计划日期排序</p>${list}${renderEditor('plan', '新增自定义计划', renderPlanForm(), !scoped.length)}`;
}

function renderCompareForm() {
  const editing = editingType === 'target' ? state.compareTargets.find(item => item.id === editingId) : null;
  const item = editing || { name: '', type: state.mode === 'phd' ? 'phd' : 'job', organization: '', location: '', compensation: '', deadline: '', requirements: '', notes: '', url: '' };
  return `<form class="panel form-panel" data-form="target"><div class="panel-title"><div><h2>${editing ? '编辑对比目标' : '添加比较目标'}</h2><p>最多同时比较 4 个岗位或博士项目。</p></div>${editing ? '<button class="btn subtle small" type="button" data-cancel-edit>取消编辑</button>' : ''}</div><div class="form-grid"><div class="field"><label for="target-name">目标名称</label><input id="target-name" name="name" required maxlength="110" value="${esc(item.name)}" placeholder="岗位或博士项目"></div><div class="field"><label for="target-type">目标类型</label><select id="target-type" name="type"><option value="job" ${item.type === 'job' ? 'selected' : ''}>就业</option><option value="phd" ${item.type === 'phd' ? 'selected' : ''}>申博</option></select></div><div class="field"><label for="target-organization">公司 / 院校</label><input id="target-organization" name="organization" maxlength="120" value="${esc(item.organization)}"></div><div class="field"><label for="target-location">地点</label><input id="target-location" name="location" maxlength="90" value="${esc(item.location)}"></div><div class="field"><label for="target-compensation">薪酬 / 经费</label><input id="target-compensation" name="compensation" maxlength="120" value="${esc(item.compensation)}" placeholder="可留空，按实际信息填写"></div><div class="field"><label for="target-deadline">截止日期</label><input id="target-deadline" name="deadline" type="date" value="${esc(item.deadline)}"></div><div class="field span-2"><label for="target-requirements">关键要求</label><input id="target-requirements" name="requirements" maxlength="240" value="${esc(item.requirements)}" placeholder="学历、技术栈、研究方向等"></div><div class="field"><label for="target-url">官方链接</label><input id="target-url" name="url" type="url" value="${esc(item.url)}" placeholder="https://..."></div><div class="field span-2"><label for="target-notes">个人备注</label><input id="target-notes" name="notes" maxlength="300" value="${esc(item.notes)}"></div></div><div class="form-actions"><button class="btn primary" type="submit">${editing ? '保存修改' : `${ICONS.plus} 添加目标`}</button></div></form>`;
}

function renderCompare() {
  const targets = state.compareTargets;
  const fields = [['公司 / 院校', 'organization'], ['地点', 'location'], ['薪酬 / 经费', 'compensation'], ['截止日期', 'deadline'], ['关键要求', 'requirements'], ['官方链接', 'url']];
  const audit = targets.length ? `<div class="target-audit">${targets.map(item => {
    const missing = fields.filter(([, key]) => !item[key]);
    return `<article><strong>${esc(item.name)}</strong><span>已填写 ${fields.length - missing.length} / ${fields.length} 项条件</span><p>${missing.length ? '待核实或说明：' + missing.map(([label]) => label).join('、') : '基础条件已填写，请继续核对证据。'}</p><button class="btn subtle small" type="button" data-edit-target="${esc(item.id)}">补充 / 编辑</button></article>`;
  }).join('')}</div>` : '';
  const comparison = targets.length ? `<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>比较维度</th>${targets.map(item => `<th><div class="compare-heading"><strong>${esc(item.name)}</strong><button class="icon-button" type="button" data-edit-target="${esc(item.id)}" aria-label="编辑 ${esc(item.name)}">${ICONS.edit}</button></div><div class="item-meta">${tag(getPathName(item.type))}</div></th>`).join('')}</tr></thead><tbody>${[
    ['公司 / 院校', 'organization'], ['地点', 'location'], ['薪酬 / 经费', 'compensation'], ['截止日期', 'deadline'], ['关键要求', 'requirements'], ['个人备注', 'notes'], ['官方链接', 'url']
  ].map(([label, key]) => `<tr><th>${label}</th>${targets.map(item => `<td class="${item[key] ? '' : 'unknown-cell'}">${key === 'url' ? (item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">打开官方页面 ↗</a>` : '待核实') : esc(item[key] || '待核实')}</td>`).join('')}</tr>`).join('')}<tr><th>管理</th>${targets.map(item => `<td><button class="btn danger small" type="button" data-remove-target="${esc(item.id)}">删除目标</button></td>`).join('')}</tr></tbody></table></div>` : `<div class="empty-state"><strong>添加目标后开始比较</strong>并排记录不同岗位或博士项目的地点、资助、截止时间和要求。</div>`;
  return `${pageHead('目标对比', '把关键条件并排整理，支持就业岗位与博士项目。个人判断由你填写，页面不会编造薪酬或录取数据。', `<span class="pill">${targets.length} / 4 个目标</span><button class="btn primary small" type="button" data-open-editor="target" ${targets.length >= 4 ? 'disabled' : ''}>新增目标</button>`)}${audit}<p class="small-note">填写数量仅用于发现待核实信息，不评价目标质量。没有截止日等不适用情况可在备注说明。</p><section class="panel"><div class="panel-title"><div><h2>比较表</h2><p>空白字段显示“待核实”。先补齐事实，再判断匹配度。</p></div></div>${comparison}</section>${targets.length < 4 || editingType === 'target' ? renderEditor('target', '新增比较目标', renderCompareForm(), !targets.length) : '<p class="list-caption">已达 4 个目标上限，可在比较表中编辑或删除目标。</p>'}`;
}

function renderMaterialForm() {
  const editing = editingType === 'material' ? state.materials.find(item => item.id === editingId) : null;
  const item = editing || { name: '', type: '其他', target: '', status: MATERIAL_STATUSES[0], version: '', deadline: '', notes: '' };
  return `<form class="panel form-panel" data-form="material"><div class="panel-title"><div><h2>${editing ? '编辑材料' : '添加申请材料'}</h2><p>管理材料状态、版本和对应申请目标。</p></div>${editing ? '<button class="btn subtle small" type="button" data-cancel-edit>取消编辑</button>' : ''}</div><div class="form-grid"><div class="field"><label for="material-name">材料名称</label><input id="material-name" name="name" required maxlength="100" value="${esc(item.name)}" placeholder="例如：研究计划"></div><div class="field"><label for="material-type">材料类型</label><input id="material-type" name="type" maxlength="60" list="material-types" value="${esc(item.type)}"><datalist id="material-types">${[...new Set(MATERIAL_PRESETS.map(item => item.type).concat(['推荐信', '成绩单', '语言成绩', '其他']))].map(type => `<option value="${esc(type)}"></option>`).join('')}</datalist></div><div class="field"><label for="material-target">对应目标</label><input id="material-target" name="target" maxlength="120" value="${esc(item.target)}" placeholder="可留空"></div><div class="field"><label for="material-status">状态</label><select id="material-status" name="status">${MATERIAL_STATUSES.map(status => `<option ${item.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><div class="field"><label for="material-version">版本 / 文件名</label><input id="material-version" name="version" maxlength="80" value="${esc(item.version)}" placeholder="例如：CV_目标项目_2026-10-21_v2.pdf"></div><div class="field"><label for="material-deadline">准备日期</label><input id="material-deadline" name="deadline" type="date" value="${esc(item.deadline)}"></div><div class="field span-2"><label for="material-notes">备注</label><input id="material-notes" name="notes" maxlength="300" value="${esc(item.notes)}" placeholder="格式要求、验收标准、官方来源或待核实问题"></div></div><div class="form-actions"><button class="btn primary" type="submit">${editing ? '保存修改' : `${ICONS.plus} 添加材料`}</button></div></form>`;
}

function renderMaterials() {
  const completed = state.materials.filter(item => item.status === '已完成').length;
  const query = materialFilters.query.toLocaleLowerCase();
  const items = state.materials.filter(item => {
    const status = materialFilters.status;
    const statusMatch = status === 'all' || (status === 'open' ? item.status !== '已完成' : status === 'overdue' ? item.status !== '已完成' && daysUntil(item.deadline) !== null && daysUntil(item.deadline) < 0 : item.status === status);
    return statusMatch && `${item.name} ${item.type} ${item.target} ${item.version} ${item.notes}`.toLocaleLowerCase().includes(query);
  });
  const presets = ['共同基础', '就业按需', '申博按需'].map(group => `<section class="material-preset-group"><h3>${group}</h3><div class="page-actions">${MATERIAL_PRESETS.filter(item => item.group === group).map(item => `<button class="btn subtle small" type="button" data-add-material-preset="${esc(item.name)}" title="${esc(item.notes)}">${ICONS.plus} ${esc(item.name)}</button>`).join('')}</div></section>`).join('');
  const list = items.length ? `<div class="material-list">${items.slice().sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')).map(item => `<article class="material-item" id="material-${esc(item.id)}"><div class="material-name"><input type="checkbox" data-material-done="${esc(item.id)}" ${item.status === '已完成' ? 'checked' : ''} aria-label="标记 ${esc(item.name)} 已完成"><div><strong>${esc(item.name)}</strong><small>${esc(item.target || '未指定对应目标')}${item.version ? ` · ${esc(item.version)}` : ''}${item.notes ? ` · ${esc(item.notes)}` : ''}</small><div class="item-meta">${tag(item.type || '其他')}${item.deadline ? tag(`${item.deadline} · ${daysLeft(item.deadline)}`) : ''}</div></div></div><select data-material-status="${esc(item.id)}" aria-label="${esc(item.name)}状态">${MATERIAL_STATUSES.map(status => `<option ${item.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select><div class="item-actions"><button class="btn small" type="button" data-edit-material="${esc(item.id)}">编辑</button><button class="btn small danger" type="button" data-remove-material="${esc(item.id)}">删除</button></div></article>`).join('')}</div>` : `<div class="empty-state"><strong>${state.materials.length ? '没有符合当前筛选的材料' : '还没有申请材料'}</strong>${state.materials.length ? '清空筛选查看全部材料。' : '按目标要求从下方预设添加，或创建自己的材料。'}</div>`;
  return `${pageHead('简历与申请材料', '按目标记录材料状态和版本。所有字段由你维护，文件内容不会上传。', `<button class="btn primary small" type="button" data-open-editor="material">新增材料</button>`)}<div class="completion-strip"><span>${completed} / ${state.materials.length} 项完成 · 全部目标</span><progress max="${state.materials.length || 1}" value="${completed}" aria-label="材料准备进度"></progress></div>${renderRecordFilters('materials', materialFilters, [['all', '全部材料'], ['open', '未完成'], ['overdue', '准备日期已过'], ...MATERIAL_STATUSES.map(status => [status, status])])}<p class="list-caption" role="status">显示 ${items.length} / ${state.materials.length} 项 · 按准备日期排序</p>${list}${renderEditor('material', '新增申请材料', renderMaterialForm(), false)}<details class="panel preset-catalog" ${state.materials.length ? '' : 'open'}><summary>按需添加常用材料 · ${MATERIAL_PRESETS.length} 项</summary><p class="small-note">按目标要求选用；加入时附带检查提示，可继续编辑。</p><div class="material-preset-groups">${presets}</div></details>`;
}

function renderTemplates() {
  const ids = Object.keys(TEMPLATES).filter(id => templateScope === 'all' || TEMPLATE_SCOPES[id] === templateScope);
  const active = ids.includes(templateId) ? templateId : ids[0];
  templateId = active;
  const item = TEMPLATES[active];
  const nav = ids.map(id => `<button type="button" data-template="${esc(id)}" class="${active === id ? 'active' : ''}">${esc(TEMPLATES[id].title)}</button>`).join('');
  const groups = [['all', '全部模板'], ['job', '就业'], ['phd', '申博'], ['both', '通用']];
  return `${pageHead('模板与个人备份', `${Object.keys(TEMPLATES).length} 份可复制的写作与记录提纲。按用途选择模板，复制或下载后修改。`, '<button class="btn primary small" type="button" data-export>导出个人备份</button>')}
    <div class="section-toolbar"><div class="path-switch" aria-label="模板用途">${groups.map(([id, label]) => `<button type="button" data-template-scope="${id}" class="${templateScope === id ? 'active' : ''}">${label}</button>`).join('')}</div><span class="small-note">当前 ${ids.length} 份模板</span></div><section class="panel"><div class="panel-title"><div><h2>${esc(item.title)}</h2><p>${esc(item.subtitle)}</p></div><div class="page-actions"><button class="btn subtle small" type="button" data-copy-template>复制文本</button><button class="btn primary small" type="button" data-download-template>下载文本</button></div></div><div class="template-layout"><nav class="template-nav" aria-label="选择模板">${nav}</nav><pre class="template-content">${esc(item.text)}</pre></div></section>
    <section class="panel content-sources"><div class="panel-title"><div><h2>内容使用与参考</h2><p>步骤与数量是规划建议；具体要求以雇主或目标院系的当年官方说明为准。</p></div></div><ul>${CONTENT_SOURCES.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul><p class="small-note">这些来源用于核对材料组织与项目说明原则。院校示例不代表其他项目的要求；资源入口未作实时开放状态保证。</p></section>
    <section class="panel"><div class="panel-title"><div><h2>个人数据备份</h2><p>收藏 ${state.favorites.length} 项 · 路线已完成 ${taskDoneCount('job') + taskDoneCount('phd')} 项 · 申请 ${state.applications.length} 项 · 计划 ${state.customTasks.length} 项 · 目标 ${state.compareTargets.length} 项 · 材料 ${state.materials.length} 项</p></div></div><div class="backup-grid"><article class="backup-card"><h3>导出备份</h3><p>下载 JSON 文件，建议定期保存到安全位置。</p><button class="btn primary small" type="button" data-export>导出个人数据</button></article><article class="backup-card"><h3>导入备份</h3><p>导入会覆盖当前浏览器里的所有个人数据。</p><button class="btn subtle small" type="button" data-import>选择备份文件</button></article><article class="backup-card"><h3>个人数据管理</h3><p>清空前请先导出备份。此操作无法撤销。</p><details class="reset-menu"><summary>展开清空选项</summary><button class="btn danger small" type="button" data-wipe>清空当前浏览器数据</button></details></article></div><p class="small-note" style="margin:14px 0 0">${storageOK ? '当前浏览器支持本地存储。清理网站数据或更换浏览器会影响个人进度。' : '当前浏览器无法使用本地存储，请及时导出个人数据备份。'}</p></section>`;
}

function renderSearchResults(query) {
  const wrap = $('#search-results');
  const q = query.trim().toLocaleLowerCase();
  if (!q) { searchMatches = []; wrap.classList.add('hidden'); wrap.innerHTML = ''; return; }
  const matches = [];
  const add = (kind, title, detail, destination, id = '', path = '') => matches.push({ kind, title, detail, destination, id, path });
  for (const [key, guide] of Object.entries(REGIONAL_PHD)) {
    if (`${guide.label} 大陆 港澳 博士 申请 指引 ${guide.summary} ${guide.routes.flat().join(' ')} ${guide.steps.join(' ')} ${guide.materials.join(' ')} ${guide.funding.join(' ')} ${guide.pitfalls.join(' ')}`.toLocaleLowerCase().includes(q)) add('地区申博指引', `${guide.label}博士申请指引`, guide.summary, 'roadmap', key, 'phd');
  }
  for (const item of allResources()) {
    if (resourceSearchText(item).includes(q)) add('资源', item.name, `${item.cat} · ${item.region}`, 'resources', item.id);
  }
  for (const path of ['job', 'phd']) for (const [group, tasks] of TASKS[path]) for (const [id, title] of tasks) {
    if (`${title} ${group} ${TASK_DETAILS[id].steps.join(" ")} ${TASK_DETAILS[id].outcome} ${TASK_DETAILS[id].pitfall}`.toLocaleLowerCase().includes(q)) add('路线任务', title, `${getPathName(path)} · ${group}`, 'roadmap', id, path);
  }
  for (const [destination, guide] of Object.entries(GUIDES)) if (`${guide.title} ${guide.steps.join(' ')} ${guide.note}`.toLocaleLowerCase().includes(q)) add('栏目指引', guide.title, guide.steps[0], destination);
  for (const path of ['job', 'phd']) for (const branch of BRANCHES[path]) if (`${branch.name} ${branch.focus} ${branch.evidence}`.toLocaleLowerCase().includes(q)) add('方向准备', branch.name, branch.focus, 'roadmap', `branch-${path}`, path);
  for (const item of state.customTasks) if (`${item.title} ${item.category} ${item.notes}`.toLocaleLowerCase().includes(q)) add('自定义计划', item.title, item.category || getPathName(item.path), 'plans', item.id);
  for (const item of state.applications) if (`${item.name} ${item.role} ${item.next} ${item.status}`.toLocaleLowerCase().includes(q)) add('申请事项', item.name, `${getPathName(item.path)} · ${item.status}`, 'applications', item.id, item.path);
  for (const item of state.compareTargets) if (`${item.name} ${item.organization} ${item.location} ${item.requirements}`.toLocaleLowerCase().includes(q)) add('对比目标', item.name, item.organization || getPathName(item.type), 'compare', item.id, item.type);
  for (const item of state.materials) if (`${item.name} ${item.type} ${item.target} ${item.version} ${item.notes}`.toLocaleLowerCase().includes(q)) add('申请材料', item.name, item.target || item.type, 'materials', item.id);
  for (const [id, item] of Object.entries(TEMPLATES)) if (`${item.title} ${item.subtitle} ${item.text}`.toLocaleLowerCase().includes(q)) add('模板', item.title, item.subtitle, 'templates', id);
  searchMatches = matches.slice(0, 12);
  if (!searchMatches.length) {
    wrap.innerHTML = '<div class="empty-state"><strong>没有匹配结果</strong>试试其他关键词。</div>';
    wrap.classList.remove('hidden');
    return;
  }
  let previousKind = '';
  wrap.innerHTML = searchMatches.map((match, index) => `${match.kind !== previousKind ? `<div class="search-result-group">${previousKind = match.kind}</div>` : ''}<button class="search-result" type="button" role="option" data-search-index="${index}"><span>${esc(match.title)}</span><small>${esc(match.detail)}</small></button>`).join('');
  wrap.classList.remove('hidden');
  wrap.insertAdjacentHTML('beforeend', `<p class="search-result-count">共 ${matches.length} 项${matches.length > searchMatches.length ? '，显示前 12 项；可缩小关键词继续查找。' : ''}</p>`);
}

function setView(nextView) {
  if (!['overview', 'resources', 'roadmap', 'applications', 'calendar', 'plans', 'compare', 'materials', 'templates'].includes(nextView)) return;
  view = nextView;
  $('#sidebar').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#menu-toggle').setAttribute('aria-label', '打开导航');
  render();
  $('#main-content').scrollIntoView({ block: 'start' });
}

function openSearchMatch(match) {
  $('#global-search').value = '';
  renderSearchResults('');
  if (match.path) { state.mode = match.path; persist(); }
  if (match.destination === 'resources') {
    resourcePage = 1;
    state.mode = 'all';
    resourceFilters = { query: match.title, category: 'all', region: 'all', kind: 'all', university: 'all', province: 'all', csGrade: 'all', saved: false, priority: false };
    persist();
  }
  if (match.destination === 'applications') applicationFilters = { query: '', status: 'all' };
  if (match.destination === 'plans') { planFilters = { query: '', status: 'all' }; state.mode = 'all'; persist(); }
  if (match.destination === 'materials') materialFilters = { query: '', status: 'all' };
  if (match.destination === 'roadmap') roadmapFilter = 'all';
  if (match.destination === 'templates') templateScope = 'all';
  if (match.destination === 'templates') templateId = match.id;
  if (match.kind === '地区申博指引') regionalPhdKey = match.id;
  setView(match.destination);
  if (match.kind === '地区申博指引') { $('#regional-phd-title')?.focus({ preventScroll: true }); $('#regional-phd')?.scrollIntoView({ block: 'start' }); }
  const ids = { applications: `app-${match.id}`, plans: `plan-${match.id}`, compare: null, materials: `material-${match.id}`, roadmap: `task-${match.id}` };
  const target = ids[match.destination] && document.getElementById(ids[match.destination]);
  if (target) {
    const detail = target.closest('.task-entry')?.querySelector('details');
    if (detail) detail.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }
  if (match.kind === '栏目指引') $('.section-guide').open = true;
  if (match.kind === '方向准备') {
    const focus = $('.branch-focus');
    if (focus) { focus.open = true; focus.scrollIntoView({ block: 'center' }); }
  }
}

function downloadText(content, fileName, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportData() {
  downloadText(JSON.stringify({ format: 'cs-navigator-backup', version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2), 'CS_Navigator_个人数据备份.json', 'application/json;charset=utf-8');
  toast('备份文件已下载');
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板')).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  toast(copied ? '已复制到剪贴板' : '浏览器限制复制，请选中文本手动复制');
}

function clearEditing() {
  editingType = '';
  editingId = '';
}

function resetViewFilters() {
  resourceFilters = { query: '', category: 'all', region: 'all', kind: 'all', university: 'all', province: 'all', csGrade: 'all', saved: false, priority: false };
  resourcePage = 1;
  roadmapFilter = 'all';
  routeDetailsOpen = false;
  regionalPhdKey = 'mainland';
  applicationFilters = { query: '', status: 'all' };
  planFilters = { query: '', status: 'all' };
  materialFilters = { query: '', status: 'all' };
  templateScope = 'all';
  calendarActiveOnly = false;
  window.showResourceForm = false;
  clearEditing();
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function importData(file) {
  try {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) throw new Error('备份文件超过 5 MB');
    const raw = JSON.parse(await file.text());
    if (raw.format !== 'cs-navigator-backup' || ![1, 2].includes(raw.version) || !raw.data) throw new Error('备份文件格式不受支持');
    if (!window.confirm('导入会覆盖当前浏览器的全部个人数据，包括收藏、进度、申请、计划、目标与材料。继续吗？')) return;
    state = sanitizeState(raw.data);
    templateId = state.template;
    resetViewFilters();
    persist();
    render();
    toast('数据导入成功');
  } catch (error) {
    toast(`导入失败：${error.message}`);
  }
}

function submitApplication(form) {
  const values = readForm(form);
  const url = safeText(values.url, 1000);
  if (url && !isHttpsUrl(url)) { toast('申请链接只支持 HTTPS'); return; }
  const previous = editingType === 'application' ? state.applications.find(item => item.id === editingId) : null;
  const record = {
    id: previous?.id || makeId('app'), name: safeText(values.name, 110), role: safeText(values.role, 160), path: values.path,
    deadline: safeText(values.deadline, 10), status: STATUSES.includes(values.status) ? values.status : STATUSES[0], url, next: safeText(values.next, 240)
  };
  if (!record.name) return;
  if (previous) state.applications[state.applications.indexOf(previous)] = record;
  else state.applications.unshift(record);
  applicationFilters = { query: '', status: 'all' };
  if (state.mode !== 'all') state.mode = record.path;
  clearEditing(); persist(); render(); toast(previous ? '已保存申请修改' : '已记录申请事项');
  requestAnimationFrame(() => document.getElementById(`app-${record.id}`)?.scrollIntoView({ block: 'center' }));
}

function submitPlan(form) {
  const values = readForm(form);
  const previous = editingType === 'plan' ? state.customTasks.find(item => item.id === editingId) : null;
  const record = {
    id: previous?.id || makeId('plan'), title: safeText(values.title, 120), path: values.path,
    category: safeText(values.category, 60), deadline: safeText(values.deadline, 10), notes: safeText(values.notes, 300), done: previous?.done || false
  };
  if (!record.title) return;
  if (previous) state.customTasks[state.customTasks.indexOf(previous)] = record;
  else state.customTasks.unshift(record);
  planFilters = { query: '', status: 'all' };
  if (state.mode !== 'all' && record.path !== 'both') state.mode = record.path;
  clearEditing(); persist(); render(); toast(previous ? '计划已更新' : '已添加计划');
  requestAnimationFrame(() => document.getElementById(`plan-${record.id}`)?.scrollIntoView({ block: 'center' }));
}

function submitTarget(form) {
  const values = readForm(form);
  const url = safeText(values.url, 1000);
  if (url && !isHttpsUrl(url)) { toast('目标链接只支持 HTTPS'); return; }
  const previous = editingType === 'target' ? state.compareTargets.find(item => item.id === editingId) : null;
  if (!previous && state.compareTargets.length >= 4) { toast('最多比较 4 个目标，请先删除一个目标'); return; }
  const record = {
    id: previous?.id || makeId('target'), name: safeText(values.name, 110), type: values.type,
    organization: safeText(values.organization, 120), location: safeText(values.location, 90), compensation: safeText(values.compensation, 120),
    deadline: safeText(values.deadline, 10), requirements: safeText(values.requirements, 240), notes: safeText(values.notes, 300), url
  };
  if (!record.name) return;
  if (previous) state.compareTargets[state.compareTargets.indexOf(previous)] = record;
  else state.compareTargets.push(record);
  clearEditing(); persist(); render(); toast(previous ? '对比目标已更新' : '已添加对比目标');
}

function submitMaterial(form) {
  const values = readForm(form);
  const previous = editingType === 'material' ? state.materials.find(item => item.id === editingId) : null;
  const record = {
    id: previous?.id || makeId('material'), name: safeText(values.name, 100), type: safeText(values.type, 60) || '其他',
    target: safeText(values.target, 120), status: MATERIAL_STATUSES.includes(values.status) ? values.status : MATERIAL_STATUSES[0],
    version: safeText(values.version, 80), deadline: safeText(values.deadline, 10), notes: safeText(values.notes, 300)
  };
  if (!record.name) return;
  if (previous) state.materials[state.materials.indexOf(previous)] = record;
  else state.materials.unshift(record);
  materialFilters = { query: '', status: 'all' };
  clearEditing(); persist(); render(); toast(previous ? '材料已更新' : '已添加材料');
  requestAnimationFrame(() => document.getElementById(`material-${record.id}`)?.scrollIntoView({ block: 'center' }));
}

function submitResource(form) {
  const values = readForm(form);
  const url = safeText(values.url, 1000);
  if (!isHttpsUrl(url)) { toast('自定义资源只支持 HTTPS 链接'); return; }
  state.custom.push({ id: makeId('custom'), name: safeText(values.name, 90), url, scope: values.scope, cat: '自定义资源', region: '全球', kind: '个人添加', summary: safeText(values.summary, 180) || '你自行补充的资源。', action: '请核查当前内容与适用范围。', warning: '该资源由你添加，请自行核对。', priority: 2 });
  window.showResourceForm = false;
  persist(); render(); toast('自定义资源已加入');
}

function editRecord(type, id) {
  editingType = type;
  editingId = id;
  render();
  const input = $(`[data-form="${type}"] input:not([type="checkbox"]):not([type="radio"])`);
  input?.focus();
  $('#main-content .form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeRecord(collection, id, label) {
  if (!window.confirm(`确认删除这条${label}？`)) return;
  state[collection] = state[collection].filter(item => item.id !== id);
  if (editingId === id) clearEditing();
  persist(); render(); toast(`${label}已删除`);
}

function handleClick(event) {
  const target = event.target;
  const universityButton = target.closest('[data-university-group]');
  if (universityButton) {
    const group = universityButton.dataset.universityGroup;
    if (!['double-first','985','211'].includes(group)) return;
    state.mode = 'phd';
    resourceFilters = { query: '', category: 'all', region: '中国大陆', kind: 'all', university: group, province: 'all', csGrade: 'all', saved: false, priority: false };
    resourcePage = 1;
    persist(); setView('resources');
    $('#resource-university')?.focus({ preventScroll: true });
    $('#resource-list')?.scrollIntoView({ block: 'start' });
    return;
  }
  const gradeButton = target.closest('[data-cs-grade]');
  if (gradeButton) {
    const grade = gradeButton.dataset.csGrade;
    if (!['A', 'B', 'C', 'A+', 'A-', 'B+', 'B-', 'C+', 'C-'].includes(grade)) return;
    state.mode = 'phd';
    resourceFilters = { query: '', category: 'all', region: '中国大陆', kind: 'all', university: 'all', province: 'all', csGrade: grade, saved: false, priority: false };
    resourcePage = 1;
    persist(); setView('resources');
    $('#resource-cs-grade')?.focus({ preventScroll: true });
    $('#resource-list')?.scrollIntoView({ block: 'start' });
    return;
  }
  const regionalButton = target.closest('[data-regional-phd], [data-phd-region], [data-regional-template], [data-open-regional-phd]');
  if (regionalButton) {
    const key = regionalButton.dataset.regionalPhd || regionalButton.dataset.phdRegion || regionalButton.dataset.regionalTemplate || regionalPhdKey;
    const guide = REGIONAL_PHD[key];
    if (!guide) return;
    regionalPhdKey = key;
    if (regionalButton.hasAttribute('data-phd-region')) {
      state.mode = 'phd';
      resourceFilters = { query: '', category: 'all', region: guide.region, kind: 'all', university: 'all', province: 'all', csGrade: 'all', saved: false, priority: false };
      resourcePage = 1;
      persist(); setView('resources');
    } else if (regionalButton.hasAttribute('data-regional-template')) {
      templateId = guide.template; templateScope = 'phd'; state.template = templateId;
      persist(); setView('templates');
    } else {
      state.mode = 'phd'; roadmapFilter = 'all';
      persist(); setView('roadmap');
      const heading = $('#regional-phd-title');
      heading?.focus({ preventScroll: true }); $('#regional-phd')?.scrollIntoView({ block: 'start' });
    }
    return;
  }
  const focus = target.closest('[data-overview-focus]');
  if (focus) {
    const name = focus.dataset.overviewFocus;
    if (name === 'week' || name === 'overdue') { applicationFilters = { query: '', status: name }; setView('applications'); }
    if (name === 'open-plans') { planFilters = { query: '', status: 'open' }; setView('plans'); }
    if (name === 'open-materials') { materialFilters = { query: '', status: 'open' }; setView('materials'); }
    return;
  }
  const editorButton = target.closest('[data-open-editor]');
  if (editorButton) {
    const editor = $(`[data-editor="${editorButton.dataset.openEditor}"]`);
    if (editor) { editor.open = true; editor.scrollIntoView({ block: 'start', behavior: 'smooth' }); $('input:not([type="checkbox"])', editor)?.focus({ preventScroll: true }); }
    return;
  }
  const resourcePageButton = target.closest('[data-resource-page]');
  if (resourcePageButton) {
    resourcePage = Number(resourcePageButton.dataset.resourcePage);
    render(); $('#resource-list')?.scrollIntoView({ block: 'start' }); return;
  }
  const resetList = target.closest('[data-reset-list]');
  if (resetList) {
    const filters = { applications: applicationFilters, plans: planFilters, materials: materialFilters }[resetList.dataset.resetList];
    if (filters) { filters.query = ''; filters.status = 'all'; render(); }
    return;
  }
  const applicationStatus = target.closest('[data-application-status]');
  if (applicationStatus) { applicationFilters.status = applicationStatus.dataset.applicationStatus; render(); return; }
  if (target.closest('[data-route-details]')) { routeDetailsOpen = !routeDetailsOpen; render(); return; }
  const templateGroup = target.closest('[data-template-scope]');
  if (templateGroup) { templateScope = templateGroup.dataset.templateScope; render(); state.template = templateId; persist(); return; }

  const viewButton = target.closest('[data-view], [data-view-link]');
  if (viewButton) {
    event.preventDefault();
    setView(viewButton.dataset.view || viewButton.dataset.viewLink);
    return;
  }
  const searchOption = target.closest('[data-search-index]');
  if (searchOption) {
    const match = searchMatches[Number(searchOption.dataset.searchIndex)];
    if (match) openSearchMatch(match);
    return;
  }
  const modeButton = target.closest('[data-mode]');
  if (modeButton) {
    state.mode = modeButton.dataset.mode;
    resourcePage = 1;
    persist(); render();
    return;
  }
  const roadmapButton = target.closest('[data-open-roadmap]');
  if (roadmapButton) {
    state.mode = roadmapButton.dataset.openRoadmap;
    persist();
    setView('roadmap');
    return;
  }
  const toggleResourceForm = target.closest('[data-toggle-form="resource"]');
  if (toggleResourceForm) {
    window.showResourceForm = !window.showResourceForm;
    render();
    if (window.showResourceForm) $('#cr-name')?.focus();
    return;
  }
  const favorite = target.closest('[data-favorite]');
  if (favorite) {
    const id = favorite.dataset.favorite;
    state.favorites = state.favorites.includes(id) ? state.favorites.filter(value => value !== id) : [...state.favorites, id];
    persist(); render();
    return;
  }
  const removeResource = target.closest('[data-remove-resource]');
  if (removeResource) {
    if (!window.confirm('删除此自定义资源吗？')) return;
    state.custom = state.custom.filter(item => item.id !== removeResource.dataset.removeResource);
    persist(); render(); toast('自定义资源已删除');
    return;
  }
  if (target.closest('[data-reset-resource-filters]')) {
    resourceFilters = { query: '', category: 'all', region: 'all', kind: 'all', university: 'all', province: 'all', csGrade: 'all', saved: false, priority: false };
    resourcePage = 1;
    render();
    return;
  }
  if (target.closest('[data-reset-tasks]')) {
    if (!window.confirm('仅重置当前路线的任务勾选？自定义计划和申请看板不会改变。')) return;
    const paths = state.mode === 'all' ? ['job', 'phd'] : [state.mode];
    const ids = paths.flatMap(path => TASKS[path].flatMap(group => group[1].map(([id]) => id)));
    state.done = state.done.filter(id => !ids.includes(id));
    persist(); render(); toast('当前路线任务已重置');
    return;
  }
  if (target.closest('[data-add-sample]')) {
    const path = state.mode === 'phd' ? 'phd' : 'job';
    state.applications.unshift({ id: makeId('app-example'), name: path === 'phd' ? '示例：某大学计算机博士项目' : '示例：某公司软件开发实习', role: path === 'phd' ? '分布式系统研究方向' : '后端开发实习', path, deadline: '', status: '待调研', url: '', next: '从官方页面确认截止时间和资格' });
    persist(); render(); toast('已加入示例，可修改状态或删除');
    return;
  }
  const appEdit = target.closest('[data-edit-app]');
  if (appEdit) { editRecord('application', appEdit.dataset.editApp); return; }
  const appRemove = target.closest('[data-remove-app]');
  if (appRemove) { removeRecord('applications', appRemove.dataset.removeApp, '申请事项'); return; }
  if (target.closest('[data-cancel-edit]')) { clearEditing(); render(); return; }
  const openApp = target.closest('[data-open-app]');
  if (openApp) {
    event.preventDefault();
    const id = openApp.dataset.openApp;
    applicationFilters = { query: '', status: 'all' };
    const item = state.applications.find(record => record.id === id);
    if (item) { state.mode = item.path; persist(); }
    setView('applications');
    requestAnimationFrame(() => document.getElementById(`app-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    return;
  }
  const calendarStep = target.closest('[data-calendar-step]');
  if (calendarStep) {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + Number(calendarStep.dataset.calendarStep), 1);
    selectedCalendarDate = dateKey(calendarCursor);
    render();
    return;
  }
  if (target.closest('[data-calendar-today]')) {
    const now = new Date();
    calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);
    selectedCalendarDate = todayKey();
    render();
    return;
  }
  const calendarDay = target.closest('[data-select-date]');
  if (calendarDay) {
    selectedCalendarDate = calendarDay.dataset.selectDate;
    const date = parseDate(selectedCalendarDate);
    calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
    render();
    return;
  }
  const planEdit = target.closest('[data-edit-plan]');
  if (planEdit) { editRecord('plan', planEdit.dataset.editPlan); return; }
  const planRemove = target.closest('[data-remove-plan]');
  if (planRemove) { removeRecord('customTasks', planRemove.dataset.removePlan, '计划事项'); return; }
  const targetEdit = target.closest('[data-edit-target]');
  if (targetEdit) { editRecord('target', targetEdit.dataset.editTarget); return; }
  const targetRemove = target.closest('[data-remove-target]');
  if (targetRemove) { removeRecord('compareTargets', targetRemove.dataset.removeTarget, '对比目标'); return; }
  const materialEdit = target.closest('[data-edit-material]');
  if (materialEdit) { editRecord('material', materialEdit.dataset.editMaterial); return; }
  const materialRemove = target.closest('[data-remove-material]');
  if (materialRemove) { removeRecord('materials', materialRemove.dataset.removeMaterial, '材料'); return; }
  const preset = target.closest('[data-add-material-preset]');
  if (preset) {
    const name = preset.dataset.addMaterialPreset;
    if (state.materials.some(item => item.name === name)) { toast('这项材料已在清单中'); return; }
    const item = MATERIAL_PRESETS.find(record => record.name === name);
    if (!item) return;
    materialFilters = { query: '', status: 'all' };
    state.materials.unshift({ id: makeId('material'), name, type: item.type, target: '', status: MATERIAL_STATUSES[0], version: '', deadline: '', notes: item.notes });
    persist(); render(); toast('已加入材料清单');
    return;
  }
  const template = target.closest('[data-template]');
  if (template) {
    templateId = template.dataset.template;
    state.template = templateId;
    persist(); render();
    return;
  }
  if (target.closest('[data-copy-template]')) { copyText(TEMPLATES[templateId]?.text || TEMPLATES.jobcv.text); return; }
  if (target.closest('[data-download-template]')) { downloadText(TEMPLATES[templateId]?.text || TEMPLATES.jobcv.text, `CS_Navigator_${templateId}.txt`); return; }
  if (target.closest('[data-export]') || target.closest('#export-quick')) { exportData(); return; }
  if (target.closest('[data-import]')) { $('#import-file').click(); return; }
  if (target.closest('[data-wipe]')) {
    if (!window.confirm('确定清空本浏览器保存的全部个人数据？操作不可撤销，请先导出备份。')) return;
    state = defaultState(); templateId = 'jobcv'; resetViewFilters(); persist(); render(); toast('个人数据已清空');
    return;
  }
}

function updateResourceView(event) {
  const activeId = event.target.id;
  const selection = typeof event.target.selectionStart === 'number' ? event.target.selectionStart : null;
  if (activeId === 'resource-query') resourceFilters.query = event.target.value;
  if (activeId === 'resource-category') resourceFilters.category = event.target.value;
  if (activeId === 'resource-region') resourceFilters.region = event.target.value;
  if (activeId === 'resource-kind') resourceFilters.kind = event.target.value;
  if (activeId === 'resource-university') resourceFilters.university = event.target.value;
  if (activeId === 'resource-province') resourceFilters.province = event.target.value;
  if (activeId === 'resource-cs-grade') resourceFilters.csGrade = event.target.value;
  if (activeId === 'resource-saved') resourceFilters.saved = event.target.checked;
  if (activeId === 'resource-priority') resourceFilters.priority = event.target.checked;
  resourcePage = 1;
  render();
  const replacement = document.getElementById(activeId);
  if (replacement) {
    replacement.focus();
    if (selection !== null && replacement.setSelectionRange) replacement.setSelectionRange(selection, selection);
  }
}

function updateRecordFilter(event) {
  const target = event.target;
  const section = target.dataset.filterQuery || target.dataset.filterStatus;
  const filters = { applications: applicationFilters, plans: planFilters, materials: materialFilters }[section];
  if (!filters) return;
  const selection = target.selectionStart;
  if (target.dataset.filterQuery) filters.query = target.value;
  else filters.status = target.value;
  const id = target.id;
  render();
  const replacement = document.getElementById(id);
  if (replacement) { replacement.focus(); if (selection !== null && replacement.setSelectionRange) replacement.setSelectionRange(selection, selection); }
}

function handleInput(event) {
  if (event.isComposing && (event.target.id === 'resource-query' || event.target.dataset.filterQuery)) return;
  if (event.target.dataset.filterQuery) { updateRecordFilter(event); return; }
  if (event.target.id === 'global-search') { renderSearchResults(event.target.value); return; }
  if (['resource-query', 'resource-category', 'resource-region', 'resource-kind', 'resource-university', 'resource-province', 'resource-cs-grade', 'resource-saved', 'resource-priority'].includes(event.target.id)) updateResourceView(event);
}

function handleChange(event) {
  const target = event.target;
  if (target.dataset.filterStatus) { updateRecordFilter(event); return; }
  if (target.id === 'roadmap-status') { roadmapFilter = target.value; render(); return; }
  if (target.id === 'resource-sort') { resourceSort = target.value; resourcePage = 1; render(); return; }
  if (target.id === 'calendar-active-only') { calendarActiveOnly = target.checked; render(); return; }
  if (target.id === 'overview-mode') {
    state.mode = target.value; persist(); render(); return;
  }
  if (['resource-query', 'resource-category', 'resource-region', 'resource-kind', 'resource-university', 'resource-province', 'resource-cs-grade', 'resource-saved', 'resource-priority'].includes(target.id)) { updateResourceView(event); return; }
  if (target.matches('[data-task]')) {
    const id = target.dataset.task;
    state.done = target.checked ? [...new Set([...state.done, id])] : state.done.filter(value => value !== id);
    persist(); render(); return;
  }
  if (target.matches('[data-app-status]')) {
    const item = state.applications.find(record => record.id === target.dataset.appStatus);
    if (item) { item.status = target.value; persist(); render(); toast('已更新申请状态'); }
    return;
  }
  if (target.matches('[data-plan-done]')) {
    const item = state.customTasks.find(record => record.id === target.dataset.planDone);
    if (item) { item.done = target.checked; persist(); render(); }
    return;
  }
  if (target.matches('[data-material-done]')) {
    const item = state.materials.find(record => record.id === target.dataset.materialDone);
    if (item) { item.status = target.checked ? '已完成' : '准备中'; persist(); render(); }
    return;
  }
  if (target.matches('[data-material-status]')) {
    const item = state.materials.find(record => record.id === target.dataset.materialStatus);
    if (item) { item.status = target.value; persist(); render(); }
  }
}

function handleSubmit(event) {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  const handlers = { resource: submitResource, application: submitApplication, plan: submitPlan, target: submitTarget, material: submitMaterial };
  handlers[form.dataset.form]?.(form);
}

function init() {
  setStorageMessage(storageOK ? '数据保存在当前浏览器' : '此浏览器无法保存数据，请及时导出备份。');
  $$('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('[data-view-link]').addEventListener('click', event => { event.preventDefault(); setView('overview'); });
  $('#main-content').addEventListener('click', handleClick);
  $('#main-content').addEventListener('input', handleInput);
  $('#main-content').addEventListener('compositionend', handleInput);
  $('#main-content').addEventListener('change', handleChange);
  $('#main-content').addEventListener('submit', handleSubmit);
  $('#global-search').addEventListener('input', handleInput);
  $('#global-search').addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('#global-search').value = ''; renderSearchResults(''); }
    if (event.key === 'Enter' && searchMatches[0]) { event.preventDefault(); openSearchMatch(searchMatches[0]); }
  });
  $('#search-results').addEventListener('click', handleClick);
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  });
  $('#export-quick').addEventListener('click', exportData);
  $('#print-quick').addEventListener('click', () => window.print());
  $('#import-file').addEventListener('change', async event => {
    await importData(event.target.files?.[0]);
    event.target.value = '';
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.global-search-wrap')) renderSearchResults('');
    if (window.innerWidth <= 780 && !event.target.closest('#sidebar, #menu-toggle')) {
      $('#sidebar').classList.remove('open');
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
      $('#menu-toggle').setAttribute('aria-label', '打开导航');
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#global-search').focus(); }
  });
  render();
}

document.addEventListener('DOMContentLoaded', init);
