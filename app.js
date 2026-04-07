/**
 * Interactive prototype — categories (大类) + sub-tasks (子类), sessionStorage
 */
const STORAGE_KEY = "timeOnYourSidePrototype.v5";
const THEME_STORAGE_KEY = "timeOnYourSidePrototype.theme";
const TODO_STORAGE_KEY = "timeOnYourSidePrototype.todos.v1";

const ICON_MAP = {
  briefcase: "💼",
  book: "📚",
  fitness: "🏃",
  home: "🏠",
  moon: "🌙",
  coffee: "☕",
  heart: "❤️",
  leaf: "🌿",
  music: "🎵",
  game: "🎮",
  lightbulb: "💡",
  chart: "📊",
  pencil: "✏️",
  plane: "✈️",
  car: "🚗",
  bed: "🛏️",
  target: "🎯",
  code: "💻",
  student: "🎓",
  people: "👥",
  wallet: "💰",
  utensils: "🍽️",
  dog: "🐕",
  star: "⭐",
  folder: "📁",
  medkit: "🩹",
  tree: "🌳",
  phone: "📱",
  camera: "📷",
  gift: "🎁",
  dance: "💃",
  writing: "📝",
  paint: "🎨",
  mic: "🎤",
  video: "🎬",
  walk: "🚶",
  bike: "🚴",
  swim: "🏊",
  yoga: "🧘",
  cook: "🍳",
  laptop: "🖥️",
  brain: "🧠",
  idea: "🧩",
  read: "📖",
  language: "🗣️",
  meeting: "🧑‍🤝‍🧑",
  shopping: "🛒",
  cleaning: "🧹",
  plant: "🪴",
  sleep: "😴",
  meditate: "🧘‍♀️",
  run: "🏃‍♀️",
  circle: "●",
};

/** 色相环上拉开间距，避免相近蓝/绿/紫重复感 */
const COLOR_PRESETS = [
  { hex: "#D92D20", hint: "朱红" },
  { hex: "#E36309", hint: "橙色" },
  { hex: "#CA8A04", hint: "金黄" },
  { hex: "#65A30D", hint: "草绿" },
  { hex: "#15803D", hint: "松绿" },
  { hex: "#0F766E", hint: "青绿" },
  { hex: "#0E7490", hint: "青蓝" },
  { hex: "#1D4ED8", hint: "宝蓝" },
  { hex: "#4338CA", hint: "靛蓝" },
  { hex: "#6D28D9", hint: "紫色" },
  { hex: "#86198F", hint: "深紫" },
  { hex: "#BE185D", hint: "玫红" },
  { hex: "#9D174D", hint: "酒红" },
  { hex: "#7C2D12", hint: "赭棕" },
  { hex: "#B45309", hint: "琥珀" },
];

/** 删除大类/子类并迁移：新建大类 → 新建子类后归并记录 */
let pendingDeleteMigrate = null;

const DEFAULT_CATEGORIES = [
  {
    id: "cat-work",
    name: "工作",
    icon: "briefcase",
    color: COLOR_PRESETS[0].hex,
    children: [
      { id: "t1", name: "深度工作", icon: "target", color: COLOR_PRESETS[0].hex },
    ],
  },
  {
    id: "cat-learn",
    name: "学习",
    icon: "book",
    color: COLOR_PRESETS[1].hex,
    children: [
      { id: "t2", name: "阅读", icon: "book", color: COLOR_PRESETS[1].hex },
    ],
  },
  {
    id: "cat-health",
    name: "健康",
    icon: "fitness",
    color: COLOR_PRESETS[6].hex,
    children: [
      { id: "t3", name: "运动", icon: "fitness", color: COLOR_PRESETS[6].hex },
    ],
  },
  {
    id: "cat-life",
    name: "生活",
    icon: "home",
    color: COLOR_PRESETS[4].hex,
    children: [
      { id: "t4", name: "家庭", icon: "home", color: COLOR_PRESETS[4].hex },
    ],
  },
  {
    id: "cat-rest",
    name: "休息",
    icon: "moon",
    color: COLOR_PRESETS[8].hex,
    children: [
      { id: "t5", name: "小憩", icon: "moon", color: COLOR_PRESETS[8].hex },
    ],
  },
];

function seedEntries() {
  const now = new Date();
  const entries = [];
  let id = 1;
  const add = (daysAgo, hour, minute, durMin, taskId, memo = "") => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    const end = new Date(d.getTime() + durMin * 60 * 1000);
    entries.push({
      id: "e" + id++,
      taskId,
      start: d.toISOString(),
      end: end.toISOString(),
      activity: "",
      note: memo,
    });
  };
  const h = now.getHours();
  for (let i = 0; i < 7; i++) {
    add(3 + i * 4, h, 5 + i, 25 + i, "t2");
  }
  add(0, 10, 0, 90, "t1", "整理本周需求文档；状态不错，上午专注度高");
  add(0, 14, 30, 45, "t1", "处理邮件与沟通；下午略分心，需要缩短会议");
  add(1, 9, 0, 120, "t1", "完成核心功能开发；进入心流，进度超预期");
  add(1, 20, 0, 30, "t5", "晚间放松散步；睡前心情平稳");
  add(2, 11, 0, 60, "t3", "慢跑和拉伸；运动后精神更好");
  return entries;
}

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdStartMs(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0).getTime();
}

function parseYmdEndMs(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function defaultHomeFocus() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    selections: [null, null, null],
    period: "week",
    customRange: {
      start: formatYmd(start),
      end: formatYmd(end),
    },
  };
}

function defaultHomeAccum() {
  return { kind: "leaf", id: "" };
}

function normalizeHomeFocus(h) {
  if (!h) return defaultHomeFocus();
  const sel = [null, null, null];
  const arr = Array.isArray(h.selections) ? h.selections : [];
  let j = 0;
  for (let i = 0; i < arr.length && j < 3; i++) {
    const s = arr[i];
    if (s && s.id && (s.kind === "category" || s.kind === "leaf")) {
      sel[j++] = { kind: s.kind, id: s.id };
    }
  }
  const base = defaultHomeFocus();
  const customStart =
    typeof h.customRange?.start === "string" ? h.customRange.start : base.customRange.start;
  const customEnd =
    typeof h.customRange?.end === "string" ? h.customRange.end : base.customRange.end;
  const customRange = customStart <= customEnd
    ? { start: customStart, end: customEnd }
    : { start: customEnd, end: customStart };
  return {
    period: h.period === "month" || h.period === "custom" ? h.period : "week",
    selections: sel,
    customRange,
  };
}

function normalizeHomeAccum(h) {
  if (!h || !h.id) return defaultHomeAccum();
  return {
    kind: h.kind === "category" ? "category" : "leaf",
    id: h.id,
  };
}

function defaultStatsRange() {
  return { start: formatYmd(new Date()), end: formatYmd(new Date()) };
}

function normalizeStatsRange(r) {
  const t = formatYmd(new Date());
  if (!r || typeof r.start !== "string" || typeof r.end !== "string") {
    return { start: t, end: t };
  }
  let a = r.start;
  let b = r.end;
  if (a > b) {
    const x = a;
    a = b;
    b = x;
  }
  return { start: a, end: b };
}

function daysSpanInclusive(startYmd, endYmd) {
  const a = parseYmdStartMs(startYmd);
  const b = parseYmdStartMs(endYmd);
  return Math.floor((b - a) / 86400000) + 1;
}

function inferStatsRangePresetFromRange(start, end) {
  const todayYmd = formatYmd(new Date());
  if (start === end && start === todayYmd) return "today";
  if (end !== todayYmd) return "custom";
  const span = daysSpanInclusive(start, end);
  if (span === 7) return "7";
  if (span === 30) return "30";
  return "custom";
}

function normalizeStatsRangePreset(preset, range) {
  const allowed = new Set(["today", "7", "30", "custom"]);
  if (preset && allowed.has(preset)) return preset;
  return inferStatsRangePresetFromRange(range.start, range.end);
}

function defaultStatsTrendScope() {
  return { kind: "category", id: "" };
}

function defaultTimelineDate() {
  return formatYmd(new Date());
}

function normalizeTimelineDate(v) {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return defaultTimelineDate();
}

function normalizeStatsTrendScope(s) {
  if (!s || !s.id) return defaultStatsTrendScope();
  return {
    kind: s.kind === "leaf" ? "leaf" : "category",
    id: s.id,
  };
}

function normalizePersisted(p) {
  if (!p || !Array.isArray(p.entries)) return null;
  const homeFocus = normalizeHomeFocus(p.homeFocus);
  const homeAccum = normalizeHomeAccum(p.homeAccum);
  const statsRange = normalizeStatsRange(p.statsRange);
  const statsRangePreset = normalizeStatsRangePreset(p.statsRangePreset, statsRange);
  const statsTrendScope = normalizeStatsTrendScope(p.statsTrendScope);
  const timelineDate = normalizeTimelineDate(p.timelineDate);

  if (p.categories?.length) {
    return {
      categories: p.categories,
      entries: p.entries,
      homeFocus,
      homeAccum,
      statsRange,
      statsRangePreset,
      statsTrendScope,
      timelineDate,
    };
  }
  if (p.tasks?.length) {
    return {
      categories: [
        {
          id: "cat-migrated",
          name: "我的主题",
          icon: "folder",
          color: COLOR_PRESETS[9].hex,
          children: p.tasks.map((t) => ({
            id: t.id,
            name: t.name,
            icon: "circle",
            color: t.color || COLOR_PRESETS[9].hex,
          })),
        },
      ],
      entries: p.entries,
      homeFocus,
      homeAccum,
      statsRange,
      statsRangePreset,
      statsTrendScope,
      timelineDate,
    };
  }
  return null;
}

function loadState() {
  const keys = [
    STORAGE_KEY,
    "timeOnYourSidePrototype.v4",
    "timeOnYourSidePrototype.v3",
    "timeOnYourSidePrototype.v2",
    "timeOnYourSidePrototype.v1",
  ];
  try {
    for (const key of keys) {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const p = normalizePersisted(JSON.parse(raw));
        if (p) return p;
      }
    }
  } catch (_) {}
  return {
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    entries: seedEntries(),
    homeFocus: defaultHomeFocus(),
    homeAccum: defaultHomeAccum(),
    statsRange: defaultStatsRange(),
    statsRangePreset: "today",
    statsTrendScope: defaultStatsTrendScope(),
    timelineDate: defaultTimelineDate(),
  };
}

function saveState() {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      categories: state.categories,
      entries: state.entries,
      homeFocus: state.homeFocus,
      homeAccum: state.homeAccum,
      statsRange: state.statsRange,
      statsRangePreset: state.statsRangePreset,
      statsTrendScope: state.statsTrendScope,
      timelineDate: state.timelineDate,
    })
  );
}

let state = loadState();
if (!state.homeFocus) state.homeFocus = defaultHomeFocus();
if (!state.homeAccum) state.homeAccum = defaultHomeAccum();
if (!state.statsRange) state.statsRange = defaultStatsRange();
if (!state.statsRangePreset) {
  state.statsRangePreset = normalizeStatsRangePreset(null, state.statsRange);
}
if (!state.statsTrendScope) state.statsTrendScope = defaultStatsTrendScope();
if (!state.timelineDate) state.timelineDate = defaultTimelineDate();

function loadTodoState() {
  try {
    const raw = sessionStorage.getItem(TODO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) {
        return {
          showCompleted: !!parsed.showCompleted,
          items: parsed.items
            .filter((x) => x && typeof x.text === "string")
            .map((x) => ({
              id: x.id || genId("todo"),
              text: x.text.trim(),
              done: !!x.done,
            }))
            .filter((x) => x.text),
        };
      }
    }
  } catch (_) {}
  return { showCompleted: false, items: [] };
}

function saveTodoState() {
  sessionStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoState));
}

let todoState = loadTodoState();

/** 统计页：已展开的大类 id */
const statsExpandedCats = new Set();
/** 饼图当前扇区，供点击命中 */
let statsDonutSegments = [];

let timerInterval = null;
let timerStartedAt = null;
let timerMode = null;
let preselectedTaskId = null;
let pendingSaveDraft = null;
let pendingEditEntryId = null;

let editorCtx = {
  mode: "category",
  categoryId: null,
  leafId: null,
  parentCategoryId: null,
  selectedIcon: "folder",
  selectedColor: COLOR_PRESETS[0].hex,
};

function getIconChar(key) {
  return ICON_MAP[key] || "📌";
}

function getAllLeaves() {
  const out = [];
  (state.categories || []).forEach((cat) => {
    (cat.children || []).forEach((ch) => {
      out.push({
        ...ch,
        parentId: cat.id,
        parentName: cat.name,
      });
    });
  });
  return out;
}

function findLeaf(leafId) {
  for (const cat of state.categories) {
    const ch = (cat.children || []).find((c) => c.id === leafId);
    if (ch) return { leaf: ch, category: cat };
  }
  return null;
}

function findCategory(catId) {
  return state.categories.find((c) => c.id === catId) || null;
}

function getTaskRef(taskId) {
  const leafRef = findLeaf(taskId);
  if (leafRef) return { kind: "leaf", ...leafRef };
  const cat = findCategory(taskId);
  if (cat) return { kind: "category", category: cat };
  return null;
}

function getTaskActivityText(taskId) {
  const ref = getTaskRef(taskId);
  if (!ref) return "";
  if (ref.kind === "leaf") return `${ref.category.name} · ${ref.leaf.name}`;
  return ref.category.name;
}

function cleanLegacyTimelineNote(note, taskId, storedActivity) {
  let n = typeof note === "string" ? note.trim() : "";
  if (!n) return n;
  const ref = getTaskRef(taskId);
  const candidates = new Set();
  const sa = typeof storedActivity === "string" ? storedActivity.trim() : "";
  if (sa) candidates.add(sa);
  const cur = getTaskActivityText(taskId);
  if (cur) candidates.add(cur);
  if (ref?.kind === "leaf") {
    candidates.add(`${ref.category.name} · ${ref.leaf.name}`);
    candidates.add(`${ref.category.name}·${ref.leaf.name}`);
  } else if (ref?.kind === "category") {
    candidates.add(ref.category.name);
  }
  const seps = ["；", ";"];
  let changed = true;
  while (changed && n) {
    changed = false;
    for (const line of candidates) {
      if (!line) continue;
      for (const sep of seps) {
        const suf = sep + line;
        if (n.endsWith(suf)) {
          n = n.slice(0, -suf.length).trim();
          changed = true;
          break;
        }
      }
      if (!changed) {
        const linePattern = line
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\s+/g, "\\s*");
        const re = new RegExp(`[；;]\\s*${linePattern}\\s*$`);
        if (re.test(n)) {
          n = n.replace(re, "").trim();
          changed = true;
        }
      }
      if (changed) break;
    }
  }
  if (ref?.kind === "leaf" && n) {
    const re = /[；;]\s*[^；;\n]+?\s*[·・‧∙⋅]\s*[^；;\n]+$/;
    const m = n.match(re);
    if (m && m.index != null) {
      const tail = m[0].replace(/^[；;]\s*/, "").trim();
      if (
        tail.includes(ref.leaf.name) &&
        tail.includes(ref.category.name)
      ) {
        n = n.slice(0, m.index).trim();
      }
    }
  }
  if (n) {
    const normalized = n.replace(/\s+/g, "");
    for (const line of candidates) {
      if (!line) continue;
      if (normalized === line.replace(/\s+/g, "")) return "";
    }
  }
  return n;
}

function leafIdsInCategory(catId) {
  const cat = state.categories.find((c) => c.id === catId);
  if (!cat) return [];
  return (cat.children || []).map((c) => c.id);
}

function entryCountForLeaves(leafIds) {
  const set = new Set(leafIds);
  return state.entries.filter((e) => set.has(e.taskId)).length;
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function entriesInLastDays(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return state.entries.filter((e) => new Date(e.start) >= cutoff);
}

function countByTaskAndHour(hour) {
  const map = {};
  entriesInLastDays(30).forEach((e) => {
    const h = new Date(e.start).getHours();
    if (h !== hour) return;
    map[e.taskId] = (map[e.taskId] || 0) + 1;
  });
  return map;
}

function getRecommendedTaskIds() {
  const hour = new Date().getHours();
  const counts = countByTaskAndHour(hour);
  return Object.entries(counts)
    .filter(([id, c]) => c >= 7 && !!findLeaf(id))
    .map(([id]) => id);
}

function entryDurationSec(e) {
  return Math.round((new Date(e.end) - new Date(e.start)) / 1000);
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}小时${m > 0 ? m + "分" : ""}`;
  return `${m}分钟`;
}

function formatClock(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clippedDurationSec(entry, rangeStartMs, rangeEndMs) {
  const es = new Date(entry.start).getTime();
  const ee = new Date(entry.end).getTime();
  const x = Math.max(es, rangeStartMs);
  const y = Math.min(ee, rangeEndMs);
  return y > x ? Math.round((y - x) / 1000) : 0;
}

/** 与当日视图重叠的区间（毫秒），用于时间线展示起止时刻 */
function clippedRangeMs(entry, rangeStartMs, rangeEndMs) {
  const es = new Date(entry.start).getTime();
  const ee = new Date(entry.end).getTime();
  const x = Math.max(es, rangeStartMs);
  const y = Math.min(ee, rangeEndMs);
  return y > x ? { start: x, end: y } : null;
}

function formatHmLocal(ms) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

function aggregateByCategoryInRange(startYmd, endYmd) {
  const a = parseYmdStartMs(startYmd);
  const b = parseYmdEndMs(endYmd);
  const map = {};
  state.entries.forEach((e) => {
    const sec = clippedDurationSec(e, a, b);
    if (sec <= 0) return;
    const ref = getTaskRef(e.taskId);
    if (!ref) return;
    const cid = ref.category.id;
    map[cid] = (map[cid] || 0) + sec;
  });
  return map;
}

function aggregateLeafInCategoryInRange(catId, startYmd, endYmd) {
  const a = parseYmdStartMs(startYmd);
  const b = parseYmdEndMs(endYmd);
  const allowed = new Set(leafIdsInCategory(catId));
  const map = {};
  state.entries.forEach((e) => {
    if (!allowed.has(e.taskId)) return;
    const sec = clippedDurationSec(e, a, b);
    if (sec <= 0) return;
    map[e.taskId] = (map[e.taskId] || 0) + sec;
  });
  return map;
}

function daySpanInclusive(startYmd, endYmd) {
  const t0 = parseYmdStartMs(startYmd);
  const t1 = parseYmdStartMs(endYmd);
  return Math.round((t1 - t0) / 86400000) + 1;
}

function eachDayInRange(startYmd, endYmd) {
  const out = [];
  const [y0, m0, d0] = startYmd.split("-").map(Number);
  const cur = new Date(y0, m0 - 1, d0, 12, 0, 0);
  const endT = parseYmdEndMs(endYmd);
  while (cur.getTime() <= endT) {
    out.push({
      y: cur.getFullYear(),
      m: cur.getMonth() + 1,
      d: cur.getDate(),
      label: `${cur.getMonth() + 1}/${cur.getDate()}`,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function buildCategoryDonut(byCat) {
  const segs = [];
  state.categories.forEach((cat) => {
    const sec = byCat[cat.id] || 0;
    if (sec > 0) {
      segs.push({
        catId: cat.id,
        name: cat.name,
        color: cat.color,
        sec,
      });
    }
  });
  const total = segs.reduce((s, x) => s + x.sec, 0);
  if (total === 0) {
    return { gradient: "#e5e5ea", segments: [], total: 0 };
  }
  let acc = 0;
  const parts = segs.map((s) => {
    const pct = (s.sec / total) * 100;
    const startPct = acc;
    acc += pct;
    return {
      ...s,
      startPct,
      endPct: acc,
      pctOfTotal: (s.sec / total) * 100,
    };
  });
  const gradient = `conic-gradient(${parts
    .map((p) => `${p.color} ${p.startPct}% ${p.endPct}%`)
    .join(", ")})`;
  return { gradient, segments: parts, total };
}

function entryOverlapsLocalDay(entry, y, m, d) {
  const ds = new Date(y, m - 1, d, 0, 0, 0).getTime();
  const de = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  const a = new Date(entry.start).getTime();
  const b = new Date(entry.end).getTime();
  return b >= ds && a <= de;
}

function secondsForSelectionOnDay(sel, y, m, d) {
  if (!sel || !sel.id) return 0;
  const allowedLeafIds = sel.kind === "leaf" ? new Set([sel.id]) : new Set(leafIdsInCategory(sel.id));
  let sec = 0;
  state.entries.forEach((e) => {
    if (sel.kind === "leaf") {
      if (e.taskId !== sel.id) return;
    } else {
      if (e.taskId !== sel.id && !allowedLeafIds.has(e.taskId)) return;
    }
    if (!entryOverlapsLocalDay(e, y, m, d)) return;
    const ds = new Date(y, m - 1, d, 0, 0, 0).getTime();
    const de = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    const a = Math.max(new Date(e.start).getTime(), ds);
    const b = Math.min(new Date(e.end).getTime(), de);
    if (b > a) sec += Math.round((b - a) / 1000);
  });
  return sec;
}

function getFocusDayList() {
  if (state.homeFocus.period === "custom") {
    const a = parseYmdStartMs(state.homeFocus.customRange.start);
    const b = parseYmdEndMs(state.homeFocus.customRange.end);
    const out = [];
    const cur = new Date(a);
    while (cur.getTime() <= b) {
      out.push({
        y: cur.getFullYear(),
        m: cur.getMonth() + 1,
        d: cur.getDate(),
        label: `${cur.getMonth() + 1}/${cur.getDate()}`,
        shortLabel: ["日", "一", "二", "三", "四", "五", "六"][cur.getDay()],
      });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }
  const n = state.homeFocus.period === "month" ? 30 : 7;
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const wk = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    out.push({
      y,
      m: mo,
      d: day,
      label: `${mo}/${day}`,
      shortLabel: wk,
    });
  }
  return out;
}

function parseScopeValue(str) {
  if (!str) return null;
  const idx = str.indexOf(":");
  if (idx < 1) return null;
  const kind = str.slice(0, idx);
  const id = str.slice(idx + 1);
  if (kind !== "category" && kind !== "leaf") return null;
  if (!id) return null;
  return { kind, id };
}

function getSelectionMeta(sel) {
  if (!sel || !sel.id) return null;
  if (sel.kind === "leaf") {
    const f = findLeaf(sel.id);
    if (!f) return null;
    return {
      label: `${f.leaf.name}`,
      sub: f.category.name,
      color: f.leaf.color || f.category.color,
    };
  }
  const cat = state.categories.find((c) => c.id === sel.id);
  if (!cat) return null;
  return {
    label: `${cat.name}（大类合计）`,
    sub: "含全部子类",
    color: cat.color,
  };
}

function selectionToValue(sel) {
  if (!sel || !sel.id) return "";
  return `${sel.kind}:${sel.id}`;
}

function getAccumulatedSeconds(scope) {
  if (!scope || !scope.id) return 0;
  const allowed =
    scope.kind === "leaf"
      ? new Set([scope.id])
      : new Set(leafIdsInCategory(scope.id));
  return state.entries
    .filter((e) => allowed.has(e.taskId))
    .reduce((s, e) => s + entryDurationSec(e), 0);
}

function firstRecordedDate() {
  if (!state.entries.length) return null;
  const t = Math.min(...state.entries.map((e) => new Date(e.start).getTime()));
  return new Date(t);
}

function fillScopeSelect(selectEl, currentVal) {
  selectEl.innerHTML = "";
  const o0 = document.createElement("option");
  o0.value = "";
  o0.textContent = "不纳入对比";
  if (!currentVal) o0.selected = true;
  selectEl.appendChild(o0);
  const og1 = document.createElement("optgroup");
  og1.label = "大类";
  state.categories.forEach((cat) => {
    const v = `category:${cat.id}`;
    const o = document.createElement("option");
    o.value = v;
    o.textContent = `${cat.name} · 合计`;
    if (v === currentVal) {
      o.selected = true;
      o0.selected = false;
    }
    og1.appendChild(o);
  });
  selectEl.appendChild(og1);
  const og2 = document.createElement("optgroup");
  og2.label = "子类";
  state.categories.forEach((cat) => {
    (cat.children || []).forEach((leaf) => {
      const v = `leaf:${leaf.id}`;
      const o = document.createElement("option");
      o.value = v;
      o.textContent = `${leaf.name} · ${cat.name}`;
      if (v === currentVal) {
        o.selected = true;
        o0.selected = false;
      }
      og2.appendChild(o);
    });
  });
  selectEl.appendChild(og2);
}

function syncFocusPeriodButtons() {
  document.querySelectorAll("[data-focus-period]").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.focusPeriod === state.homeFocus.period
    );
  });
  const customRange = $("#focus-custom-range");
  if (customRange) customRange.hidden = state.homeFocus.period !== "custom";
  const startInput = $("#focus-date-start");
  const endInput = $("#focus-date-end");
  if (startInput) startInput.value = state.homeFocus.customRange.start;
  if (endInput) endInput.value = state.homeFocus.customRange.end;
}

function renderFocusChart() {
  const wrap = $("#focus-chart-wrap");
  if (!wrap) return;
  const days = getFocusDayList();
  const active = [];
  state.homeFocus.selections.forEach((s) => {
    if (s && s.id && getSelectionMeta(s)) active.push(s);
  });
  if (active.length === 0) {
    wrap.innerHTML = "";
    return;
  }
  const series = active.map((sel) => ({
    sel,
    meta: getSelectionMeta(sel),
    points: days.map((day) =>
      secondsForSelectionOnDay(sel, day.y, day.m, day.d)
    ),
  }));
  const maxSec = Math.max(60, ...series.flatMap((s) => s.points));
  const n = days.length;
  const CW = 1000;
  const CH = 300;
  const PADL = 52;
  const PADR = 20;
  const PADT = 20;
  const PADB = 44;
  const innerW = CW - PADL - PADR;
  const innerH = CH - PADT - PADB;
  function xAt(i) {
    return n <= 1 ? PADL + innerW / 2 : PADL + (innerW * i) / (n - 1);
  }
  function yAt(sec) {
    return PADT + innerH * (1 - sec / maxSec);
  }
  const dotR = n > 14 ? 2.5 : 4;
  let svg = `<svg class="focus-chart-svg" viewBox="0 0 ${CW} ${CH}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;
  [0, 0.5, 1].forEach((t) => {
    const sec = maxSec * t;
    const y = yAt(sec);
    svg += `<text x="${PADL - 8}" y="${y + 7}" text-anchor="end" font-size="20" fill="#8e8e93" font-family="PingFang SC,-apple-system,sans-serif">${Math.round(sec / 60)}分</text>`;
  });
  series.forEach((s) => {
    const pts = s.points
      .map((sec, i) => `${xAt(i).toFixed(2)},${yAt(sec).toFixed(2)}`)
      .join(" ");
    svg += `<polyline fill="none" stroke="${s.meta.color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`;
    s.points.forEach((sec, i) => {
      svg += `<circle cx="${xAt(i)}" cy="${yAt(sec)}" r="${dotR}" fill="${s.meta.color}" opacity="0.85"/>`;
    });
  });
  const step = n > 14 ? 5 : n > 7 ? 2 : 1;
  days.forEach((day, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    svg += `<text x="${xAt(i)}" y="${CH - 10}" text-anchor="middle" font-size="19" fill="#8e8e93" font-family="PingFang SC,-apple-system,sans-serif">${day.label}</text>`;
  });
  svg += "</svg>";
  let legend = '<div class="focus-legend">';
  series.forEach((s) => {
    const total = s.points.reduce((a, b) => a + b, 0);
    const daysWithData = s.points.filter((sec) => sec > 0).length;
    const avgMin =
      daysWithData > 0 ? Math.round(total / daysWithData / 60) : 0;
    legend += `<div class="focus-legend-item">`;
    legend += `<span class="focus-legend-dot" style="background:${s.meta.color}"></span>`;
    legend += `<span class="focus-legend-name">${escapeHtml(s.meta.label)}</span>`;
    legend += `<span class="focus-legend-avg">日均约 ${avgMin} 分钟</span>`;
    legend += `</div>`;
  });
  legend += "</div>";
  wrap.innerHTML = svg + legend;
}

function fillAccumSelect() {
  const sel = $("#accum-scope");
  if (!sel) return;
  const cur =
    state.homeAccum && state.homeAccum.id
      ? `${state.homeAccum.kind}:${state.homeAccum.id}`
      : "";
  sel.innerHTML = "";
  const o0 = document.createElement("option");
  o0.value = "";
  o0.textContent = "请选择大类或子类";
  if (!cur) o0.selected = true;
  sel.appendChild(o0);
  const og1 = document.createElement("optgroup");
  og1.label = "大类";
  state.categories.forEach((cat) => {
    const v = `category:${cat.id}`;
    const o = document.createElement("option");
    o.value = v;
    o.textContent = `${cat.name} · 合计`;
    if (v === cur) {
      o.selected = true;
      o0.selected = false;
    }
    og1.appendChild(o);
  });
  sel.appendChild(og1);
  const og2 = document.createElement("optgroup");
  og2.label = "子类";
  state.categories.forEach((cat) => {
    (cat.children || []).forEach((leaf) => {
      const v = `leaf:${leaf.id}`;
      const o = document.createElement("option");
      o.value = v;
      o.textContent = `${leaf.name} · ${cat.name}`;
      if (v === cur) {
        o.selected = true;
        o0.selected = false;
      }
      og2.appendChild(o);
    });
  });
  sel.appendChild(og2);
  sel.onchange = () => {
    const p = parseScopeValue(sel.value);
    state.homeAccum = p ? { kind: p.kind, id: p.id } : defaultHomeAccum();
    saveState();
    updateAccumDisplay();
  };
}

function updateAccumDisplay() {
  const totalEl = $("#accum-total-display");
  const sinceEl = $("#accum-since-display");
  if (!totalEl) return;
  const ac = state.homeAccum;
  if (!ac || !ac.id || !getSelectionMeta(ac)) {
    totalEl.textContent = "请选择上方范围以查看累计";
    if (sinceEl) sinceEl.textContent = "";
    return;
  }
  const sec = getAccumulatedSeconds(ac);
  totalEl.textContent =
    sec > 0 ? `累计投入 ${formatDuration(sec)}` : "在所选范围内尚无记录";
  if (sinceEl) {
    const fd = firstRecordedDate();
    sinceEl.textContent = fd
      ? `自 ${fd.getFullYear()}年${fd.getMonth() + 1}月${fd.getDate()}日起有数据 · 仅统计本设备内记录`
      : "";
  }
}

function renderFocusUI() {
  const container = $("#focus-slots");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const row = document.createElement("div");
    row.className = "focus-slot-row";
    const lab = document.createElement("span");
    lab.className = "focus-slot-label";
    lab.textContent = `事项 ${i + 1}`;
    const select = document.createElement("select");
    select.className = "focus-slot-select";
    fillScopeSelect(select, selectionToValue(state.homeFocus.selections[i]));
    const idx = i;
    select.addEventListener("change", () => {
      state.homeFocus.selections[idx] = parseScopeValue(select.value);
      saveState();
      renderFocusChart();
    });
    row.appendChild(lab);
    row.appendChild(select);
    container.appendChild(row);
  }
  syncFocusPeriodButtons();
  renderFocusChart();
}

function angleFromTopClockwise(cx, cy, px, py) {
  const dx = px - cx;
  const dy = py - cy;
  let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (deg < 0) deg += 360;
  return deg;
}

function pickDonutSegmentByPct(segments, pct) {
  if (!segments.length) return null;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const last = i === segments.length - 1;
    if (pct >= s.startPct && (last ? pct <= s.endPct + 0.001 : pct < s.endPct)) {
      return s;
    }
  }
  return null;
}

function handleDonutClick(ev) {
  const hint = $("#donut-segment-hint");
  const el = $("#donut");
  if (!el || !statsDonutSegments.length) {
    if (hint) hint.hidden = true;
    return;
  }
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rOuter = rect.width / 2;
  const rInner = (42 / 80) * rOuter;
  const dx = ev.clientX - cx;
  const dy = ev.clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < rInner || dist > rOuter) {
    if (hint) {
      hint.hidden = true;
      hint.textContent = "";
    }
    return;
  }
  const deg = angleFromTopClockwise(cx, cy, ev.clientX, ev.clientY);
  const pct = (deg / 360) * 100;
  const seg = pickDonutSegmentByPct(statsDonutSegments, pct);
  if (hint && seg) {
    hint.hidden = false;
    hint.textContent = `${seg.name} · 占本周期 ${seg.pctOfTotal.toFixed(1)}%（${formatDuration(seg.sec)}）`;
  }
}

function ensureStatsTrendScope() {
  if (state.statsTrendScope.id) {
    if (state.statsTrendScope.kind === "category") {
      if (state.categories.some((c) => c.id === state.statsTrendScope.id)) return;
    } else if (findLeaf(state.statsTrendScope.id)) return;
  }
  const first = state.categories.find((cat) => (cat.children || []).length > 0);
  if (first) {
    state.statsTrendScope = { kind: "category", id: first.id };
  } else {
    state.statsTrendScope = defaultStatsTrendScope();
  }
}

function fillStatsTrendSelect() {
  const sel = $("#stats-trend-scope");
  if (!sel) return;
  const cur = state.statsTrendScope.id
    ? `${state.statsTrendScope.kind}:${state.statsTrendScope.id}`
    : "";
  sel.innerHTML = "";
  const og1 = document.createElement("optgroup");
  og1.label = "大类";
  state.categories.forEach((cat) => {
    if (!(cat.children || []).length) return;
    const v = `category:${cat.id}`;
    const o = document.createElement("option");
    o.value = v;
    o.textContent = `${cat.name} · 合计`;
    if (v === cur) o.selected = true;
    og1.appendChild(o);
  });
  sel.appendChild(og1);
  const og2 = document.createElement("optgroup");
  og2.label = "子类";
  state.categories.forEach((cat) => {
    (cat.children || []).forEach((leaf) => {
      const v = `leaf:${leaf.id}`;
      const o = document.createElement("option");
      o.value = v;
      o.textContent = `${leaf.name} · ${cat.name}`;
      if (v === cur) o.selected = true;
      og2.appendChild(o);
    });
  });
  sel.appendChild(og2);
  sel.onchange = () => {
    const p = parseScopeValue(sel.value);
    if (p) {
      state.statsTrendScope = { kind: p.kind, id: p.id };
      saveState();
      renderStatsTrendChart();
    }
  };
}

function renderStatsTrendChart() {
  const wrap = $("#stats-trend-chart");
  if (!wrap) return;
  const { start, end } = state.statsRange;
  const days = eachDayInRange(start, end);
  const scope = state.statsTrendScope;
  if (!scope.id || !getSelectionMeta(scope)) {
    wrap.innerHTML = '<p class="empty-hint">请选择趋势对象</p>';
    return;
  }
  const points = days.map((day) =>
    secondsForSelectionOnDay(scope, day.y, day.m, day.d)
  );
  const maxSec = Math.max(60, ...points);
  const n = days.length;
  const CW = 1000;
  const CH = 280;
  const PADL = 52;
  const PADR = 16;
  const PADT = 20;
  const PADB = 44;
  const innerW = CW - PADL - PADR;
  const innerH = CH - PADT - PADB;
  function xAt(i) {
    return n <= 1 ? PADL + innerW / 2 : PADL + (innerW * i) / (n - 1);
  }
  function yAt(sec) {
    return PADT + innerH * (1 - sec / maxSec);
  }
  const meta = getSelectionMeta(scope);
  const dotR = n > 14 ? 2.5 : 4;
  let svg = `<svg class="focus-chart-svg stats-trend-svg" viewBox="0 0 ${CW} ${CH}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;
  [0, 0.5, 1].forEach((t) => {
    const sec = maxSec * t;
    const y = yAt(sec);
    svg += `<line x1="${PADL}" y1="${y}" x2="${CW - PADR}" y2="${y}" stroke="rgba(60,60,67,0.09)" stroke-width="1"/>`;
    svg += `<text x="${PADL - 8}" y="${y + 7}" text-anchor="end" font-size="20" fill="#8e8e93" font-family="PingFang SC,-apple-system,sans-serif">${Math.round(sec / 60)}分</text>`;
  });
  const pts = points
    .map((sec, i) => `${xAt(i).toFixed(2)},${yAt(sec).toFixed(2)}`)
    .join(" ");
  svg += `<polyline fill="none" stroke="${meta.color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`;
  points.forEach((sec, i) => {
    svg += `<circle cx="${xAt(i)}" cy="${yAt(sec)}" r="${dotR}" fill="${meta.color}" opacity="0.88"/>`;
  });
  const step = n > 14 ? Math.ceil(n / 6) : n > 7 ? 2 : 1;
  days.forEach((day, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    svg += `<text x="${xAt(i)}" y="${CH - 10}" text-anchor="middle" font-size="19" fill="#8e8e93" font-family="PingFang SC,-apple-system,sans-serif">${day.label}</text>`;
  });
  svg += "</svg>";
  const daysWithData = points.filter((sec) => sec > 0).length;
  const avgMin =
    daysWithData > 0
      ? Math.round(points.reduce((a, b) => a + b, 0) / daysWithData / 60)
      : 0;
  wrap.innerHTML =
    svg +
    `<p class="stats-trend-caption">${escapeHtml(meta.label)} · 区间内日均约 ${avgMin} 分钟</p>`;
}

function formatStatsRangeLabel(startYmd, endYmd) {
  const fmt = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const toDate = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  };
  if (startYmd === endYmd) {
    return fmt.format(toDate(startYmd));
  }
  return `${fmt.format(toDate(startYmd))} — ${fmt.format(toDate(endYmd))}`;
}

function updateUrlTabState(tabName) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tabName);
  window.history.replaceState(null, "", url.toString());
}

function updateUrlDateState() {
  const url = new URL(window.location.href);
  if (state?.statsRange?.start) url.searchParams.set("statsStart", state.statsRange.start);
  if (state?.statsRange?.end) url.searchParams.set("statsEnd", state.statsRange.end);
  if (state?.timelineDate) url.searchParams.set("timelineDate", state.timelineDate);
  window.history.replaceState(null, "", url.toString());
}

function initialTabFromUrl() {
  const tab = new URL(window.location.href).searchParams.get("tab");
  if (tab === "timeline") return "stats";
  const allowed = new Set(["home", "timer", "stats", "categories", "todos"]);
  return allowed.has(tab) ? tab : "home";
}

function hydrateDateStateFromUrl() {
  const url = new URL(window.location.href);
  const statsStart = url.searchParams.get("statsStart");
  const statsEnd = url.searchParams.get("statsEnd");
  const timelineDate = url.searchParams.get("timelineDate");
  const hadStatsUrl =
    (statsStart && /^\d{4}-\d{2}-\d{2}$/.test(statsStart)) ||
    (statsEnd && /^\d{4}-\d{2}-\d{2}$/.test(statsEnd));
  if (statsStart && /^\d{4}-\d{2}-\d{2}$/.test(statsStart)) state.statsRange.start = statsStart;
  if (statsEnd && /^\d{4}-\d{2}-\d{2}$/.test(statsEnd)) state.statsRange.end = statsEnd;
  if (state.statsRange.start > state.statsRange.end) {
    const t = state.statsRange.start;
    state.statsRange.start = state.statsRange.end;
    state.statsRange.end = t;
  }
  if (hadStatsUrl) state.statsRangePreset = "custom";
  if (timelineDate && /^\d{4}-\d{2}-\d{2}$/.test(timelineDate)) state.timelineDate = timelineDate;
}

function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function applyTheme(mode) {
  if (mode === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode === "dark" ? "dark" : "light");
  } catch (_) {}
  updateThemeToggleLabel();
}

function toggleTheme() {
  applyTheme(isDarkTheme() ? "light" : "dark");
}

function updateThemeToggleLabel() {
  const el = $("#theme-toggle-label");
  if (!el) return;
  el.textContent = isDarkTheme() ? "🌙" : "☀️";
}

function $(sel) {
  return document.querySelector(sel);
}

function entryTimeConflicts(start, end, excludeEntryId) {
  const s = start.getTime();
  const e = end.getTime();
  for (const ent of state.entries) {
    if (excludeEntryId && ent.id === excludeEntryId) continue;
    const es = new Date(ent.start).getTime();
    const ee = new Date(ent.end).getTime();
    if (s < ee && e > es) return true;
  }
  return false;
}

function csvCell(v) {
  if (v == null || v === undefined) return "";
  const str = String(v);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function parseCsvRows(text) {
  const t = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let i = 0;
  let cell = "";
  let inQuotes = false;
  while (i < t.length) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += c;
      i++;
    } else if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
      i++;
    } else if (c === "\n") {
      row.push(cell);
      cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      i++;
    } else {
      cell += c;
      i++;
    }
  }
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

function buildTaxonomyCsv() {
  const headers = [
    "category_id",
    "category_name",
    "category_icon",
    "category_color",
    "sub_id",
    "sub_name",
    "sub_icon",
    "sub_color",
  ];
  const lines = [headers.join(",")];
  (state.categories || []).forEach((cat) => {
    (cat.children || []).forEach((sub) => {
      lines.push(
        [
          cat.id,
          cat.name,
          cat.icon,
          cat.color,
          sub.id,
          sub.name,
          sub.icon,
          sub.color,
        ]
          .map(csvCell)
          .join(",")
      );
    });
  });
  return lines.join("\n");
}

function buildTodosCsv() {
  const headers = ["id", "text", "done"];
  const lines = [headers.join(",")];
  todoState.items.forEach((t) => {
    lines.push([t.id, t.text, t.done ? "1" : "0"].map(csvCell).join(","));
  });
  return lines.join("\n");
}

function buildRecordsCsv() {
  const headers = ["id", "task_id", "start", "end", "activity", "note"];
  const lines = [headers.join(",")];
  state.entries.forEach((e) => {
    const activity = e.activity || getTaskActivityText(e.taskId);
    lines.push(
      [
        e.id,
        e.taskId,
        e.start,
        e.end,
        activity,
        e.note || "",
      ]
        .map(csvCell)
        .join(",")
    );
  });
  return lines.join("\n");
}

function downloadCsvFile(filename, csvText) {
  const blob = new Blob([`\uFEFF${csvText}`], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportThreeCsvs() {
  downloadCsvFile("人生账本-类目.csv", buildTaxonomyCsv());
  setTimeout(() => downloadCsvFile("人生账本-待办.csv", buildTodosCsv()), 120);
  setTimeout(() => downloadCsvFile("人生账本-记录.csv", buildRecordsCsv()), 240);
}

function categoriesFromTaxonomyRows(rows) {
  if (!rows.length) return [];
  const h = rows[0].map((x) => String(x).trim());
  const ix = (name) => h.indexOf(name);
  const iCat = ix("category_id");
  const iCn = ix("category_name");
  const iCi = ix("category_icon");
  const iCc = ix("category_color");
  const iSid = ix("sub_id");
  const iSn = ix("sub_name");
  const iSi = ix("sub_icon");
  const iSc = ix("sub_color");
  if (iCat < 0) return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  const map = new Map();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.length) continue;
    const cid = row[iCat];
    if (!cid) continue;
    if (!map.has(cid)) {
      map.set(cid, {
        id: cid,
        name: row[iCn] || "",
        icon: row[iCi] || "folder",
        color: row[iCc] || COLOR_PRESETS[0].hex,
        children: [],
      });
    }
    const sid = row[iSid];
    if (sid) {
      map.get(cid).children.push({
        id: sid,
        name: row[iSn] || "",
        icon: row[iSi] || "circle",
        color: row[iSc] || COLOR_PRESETS[0].hex,
      });
    }
  }
  return Array.from(map.values());
}

function todosFromRows(rows) {
  if (!rows.length) return [];
  const h = rows[0].map((x) => String(x).trim());
  const iId = h.indexOf("id");
  const iText = h.indexOf("text");
  const iDone = h.indexOf("done");
  if (iText < 0) return todoState.items;
  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const text = String(row[iText] || "").trim();
    if (!text) continue;
    const doneRaw = String(row[iDone] || "").toLowerCase();
    items.push({
      id: row[iId] || genId("todo"),
      text,
      done: doneRaw === "1" || doneRaw === "true",
    });
  }
  return items;
}

function recordsFromRows(rows) {
  if (!rows.length) return [];
  const h = rows[0].map((x) => String(x).trim());
  const ix = (name) => h.indexOf(name);
  const iId = ix("id");
  const iTask = ix("task_id");
  const iStart = ix("start");
  const iEnd = ix("end");
  const iAct = ix("activity");
  const iNote = ix("note");
  if (iTask < 0 || iStart < 0 || iEnd < 0) return state.entries;
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const taskId = row[iTask];
    const start = row[iStart];
    const end = row[iEnd];
    if (!taskId || !start || !end) continue;
    if (!getTaskRef(taskId)) continue;
    const st = new Date(start);
    const en = new Date(end);
    if (isNaN(st.getTime()) || isNaN(en.getTime()) || en <= st) continue;
    out.push({
      id: row[iId] || "e" + Date.now() + "-" + r,
      taskId,
      start: st.toISOString(),
      end: en.toISOString(),
      activity: row[iAct] != null ? String(row[iAct]) : "",
      note: row[iNote] != null ? String(row[iNote]) : "",
    });
  }
  return out;
}

function sniffCsvKind(firstLine) {
  const s = (firstLine || "").toLowerCase();
  if (s.includes("category_id")) return "taxonomy";
  if (s.includes("task_id") && s.includes("start")) return "records";
  if (s.includes("text") && s.includes("done")) return "todos";
  return null;
}

function applyImportedCsvFiles(fileTexts) {
  let taxText;
  let todoText;
  let recText;
  for (const { name, text } of fileTexts) {
    const t = String(text || "").trim();
    if (!t) continue;
    const nm = (name || "").toLowerCase();
    const first = t.split("\n")[0] || "";
    if (nm.includes("类目") || nm.includes("taxonomy")) taxText = t;
    else if (nm.includes("待办") || nm.includes("todos")) todoText = t;
    else if (nm.includes("记录") || nm.includes("records")) recText = t;
    else {
      const kind = sniffCsvKind(first);
      if (kind === "taxonomy") taxText = t;
      else if (kind === "todos") todoText = t;
      else if (kind === "records") recText = t;
    }
  }
  if (!taxText && !todoText && !recText) return;
  if (taxText) {
    const rows = parseCsvRows(taxText);
    state.categories = categoriesFromTaxonomyRows(rows);
  }
  if (todoText) {
    const rows = parseCsvRows(todoText);
    todoState.items = todosFromRows(rows);
    saveTodoState();
  }
  if (recText) {
    const rows = parseCsvRows(recText);
    state.entries = recordsFromRows(rows);
  }
  saveState();
  refreshDependentViews();
}

function fillLeafSelect(selectEl, selectedTaskId) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const leaves = getAllLeaves();
  if (leaves.length === 0) {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "请先添加子类";
    selectEl.appendChild(o);
    return;
  }
  state.categories.forEach((cat) => {
    if (!(cat.children || []).length) return;
    const og = document.createElement("optgroup");
    og.label = `${getIconChar(cat.icon)} ${cat.name}`;
    (cat.children || []).forEach((t) => {
      const o = document.createElement("option");
      o.value = t.id;
      o.textContent = `${getIconChar(t.icon)} ${t.name}`;
      og.appendChild(o);
    });
    if (og.children.length) selectEl.appendChild(og);
  });
  if (selectedTaskId) selectEl.value = selectedTaskId;
}

function openEditEntryModal(entryId) {
  const e = state.entries.find((x) => x.id === entryId);
  if (!e) return;
  pendingEditEntryId = entryId;
  const startEl = $("#edit-entry-start");
  const endEl = $("#edit-entry-end");
  if (startEl) startEl.value = toLocalInput(new Date(e.start));
  if (endEl) endEl.value = toLocalInput(new Date(e.end));
  const memoEl = $("#edit-entry-memo");
  if (memoEl) memoEl.value = typeof e.note === "string" ? e.note : "";
  fillLeafSelect($("#edit-entry-task"), e.taskId);
  openModal("modal-entry-edit");
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function labelHtml(leaf) {
  return `<span class="task-ico" aria-hidden="true">${getIconChar(leaf.icon)}</span>${escapeHtml(leaf.name)}`;
}

function labelHtmlWithParent(leaf) {
  return `<span class="task-name-line">${labelHtml(leaf)}</span><span class="task-parent-hint">${escapeHtml(leaf.parentName)}</span>`;
}

function refreshDependentViews() {
  initTimerTab();
  renderHome();
  renderStats();
  renderCategories();
  renderTodos();
}

function renderRecommendationSection() {
  const recSection = $("#rec-section");
  const recEmpty = $("#rec-empty");
  if (!recSection || !recEmpty) return;

  if (timerStartedAt) {
    recSection.hidden = true;
    recEmpty.hidden = true;
    return;
  }

  const recIds = getRecommendedTaskIds();
  const hour = new Date().getHours();

  if (recIds.length === 0) {
    recSection.hidden = true;
    recEmpty.hidden = false;
  } else {
    recSection.hidden = false;
    recEmpty.hidden = true;
    const tid = recIds[0];
    const found = findLeaf(tid);
    const leaf = found?.leaf;
    $("#rec-task-name").textContent = leaf
      ? `${getIconChar(leaf.icon)} ${leaf.name}`
      : "";
    $("#rec-detail").textContent = leaf
      ? `你在过去 30 天里，${hour}:00–${hour}:59 这个时段已记录 7 次及以上「${found.category.name} · ${leaf.name}」`
      : "";
    $("#rec-start").onclick = () => {
      preselectedTaskId = tid;
      switchTab("timer");
      enterPickFirstWithTask(tid);
    };
    $("#rec-other").onclick = () => {
      switchTab("timer");
      stopTimerInterval();
      timerStartedAt = null;
      const z = formatClock(0);
      const d1 = $("#timer-display");
      const d2 = $("#timer-display-run");
      if (d1) d1.textContent = z;
      if (d2) d2.textContent = z;
      setRingProgress(0);
      timerMode = null;
      preselectedTaskId = null;
      showTimerRunningView(false);
      $("#seg-pick").classList.add("active");
      $("#seg-direct").classList.remove("active");
      $("#flow-pick").classList.add("active");
      $("#flow-direct").classList.remove("active");
    };
  }
}

function renderHome() {
  renderRecommendationSection();

  renderFocusUI();
  fillAccumSelect();
  updateAccumDisplay();
}

function renderTimeline() {
  const ymd = state.timelineDate || defaultTimelineDate();
  const dateInput = $("#timeline-date");
  if (dateInput) dateInput.value = ymd;
  const list = $("#timeline-list");
  if (!list) return;
  const [y, m, d] = ymd.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d, 0, 0, 0).getTime();
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  const todayEntries = state.entries
    .filter((e) => clippedDurationSec(e, dayStart, dayEnd) > 0)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  list.innerHTML = "";
  if (!todayEntries.length) {
    list.innerHTML = '<p class="empty-hint">这一天还没有记录</p>';
    return;
  }

  const timeline = document.createElement("div");
  timeline.className = "timeline-rail";
  todayEntries.forEach((e) => {
    const ref = getTaskRef(e.taskId);
    if (!ref) return;
    const range = clippedRangeMs(e, dayStart, dayEnd);
    if (!range) return;
    const timeLine = `${formatHmLocal(range.start)} – ${formatHmLocal(range.end)}`;
    const sec = Math.max(0, Math.round((range.end - range.start) / 1000));
    const memoRaw = cleanLegacyTimelineNote(e.note, e.taskId, e.activity);
    const memoBlock = memoRaw
      ? `<p class="timeline-memo">${escapeHtml(memoRaw)}</p>`
      : "";
    const wrap = document.createElement("div");
    wrap.className = "timeline-swipe-wrap";
    wrap.dataset.entryId = e.id;
    wrap.innerHTML = `
      <div class="timeline-swipe-track">
        <div class="timeline-swipe-front">
          <div class="timeline-dot-wrap">
            <div class="timeline-dot" style="border-color:${ref.kind === "leaf" ? ref.leaf.color : ref.category.color}; background:${ref.category.color}">
              <span>${getIconChar(ref.kind === "leaf" ? ref.leaf.icon : ref.category.icon)}</span>
            </div>
          </div>
          <div class="timeline-content">
            <p class="timeline-time">${escapeHtml(timeLine)}</p>
            <h3 class="timeline-main">${escapeHtml(formatDuration(sec))}</h3>
            <p class="timeline-category">${escapeHtml(ref.kind === "leaf" ? `${ref.category.name} · ${ref.leaf.name}` : ref.category.name)}</p>
            ${memoBlock}
          </div>
        </div>
        <button type="button" class="timeline-swipe-edit">编辑</button>
        <button type="button" class="timeline-swipe-delete">删除</button>
        <div class="timeline-swipe-overshoot" aria-hidden="true"></div>
      </div>`;
    timeline.appendChild(wrap);
    attachTimelineEntrySwipe(wrap, e.id);
  });
  list.appendChild(timeline);
}

function syncStatsDateInputs() {
  const s = $("#stats-date-start");
  const e = $("#stats-date-end");
  if (s) s.value = state.statsRange.start;
  if (e) e.value = state.statsRange.end;
}

function syncStatsPresetControls() {
  const row = $("#stats-custom-range-row");
  const custom = state.statsRangePreset === "custom";
  if (row) row.hidden = !custom;
  const map = [
    ["today", "#stats-quick-today"],
    ["7", "#stats-quick-7"],
    ["30", "#stats-quick-30"],
    ["custom", "#stats-quick-custom"],
  ];
  map.forEach(([key, sel]) => {
    const btn = $(sel);
    if (btn) btn.classList.toggle("active", state.statsRangePreset === key);
  });
}

function applyStatsRangeFromInputs() {
  let s = $("#stats-date-start")?.value;
  let e = $("#stats-date-end")?.value;
  if (!s || !e) return;
  if (s > e) {
    const x = s;
    s = e;
    e = x;
  }
  state.statsRange = { start: s, end: e };
  state.statsRangePreset = "custom";
  saveState();
  updateUrlDateState();
  renderStats();
}

function setStatsQuickRange(numDays) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (numDays - 1));
  state.statsRange = {
    start: formatYmd(start),
    end: formatYmd(end),
  };
  state.statsRangePreset = numDays === 1 ? "today" : numDays === 7 ? "7" : "30";
  saveState();
  updateUrlDateState();
  renderStats();
}

function renderStats() {
  const { start, end } = state.statsRange;
  const byCat = aggregateByCategoryInRange(start, end);
  const { gradient, segments, total } = buildCategoryDonut(byCat);
  statsDonutSegments = segments;

  const donutEl = $("#donut");
  if (total > 0) {
    donutEl.classList.remove("donut--empty");
    donutEl.style.background = gradient;
  } else {
    donutEl.style.background = "";
    donutEl.classList.add("donut--empty");
  }
  donutEl.style.cursor = segments.length ? "pointer" : "default";
  $("#donut-total").textContent =
    total > 0 ? `合计 ${formatDuration(total)}` : "暂无记录";
  $("#donut-label").textContent = formatStatsRangeLabel(start, end);

  const hint = $("#donut-segment-hint");
  if (hint) {
    hint.hidden = true;
    hint.textContent = "";
  }

  donutEl.onclick = (e) => handleDonutClick(e);

  const list = $("#accum-list");
  list.innerHTML = "";
  state.categories.forEach((cat) => {
    const periodSec = byCat[cat.id] || 0;
    const expanded = statsExpandedCats.has(cat.id);
    const kids = cat.children || [];
    const hasKids = kids.length > 0;

    const wrap = document.createElement("div");
    wrap.className = "stats-cat-block";

    const row = document.createElement("button");
    row.type = "button";
    row.className = `stats-cat-row-btn${expanded ? " expanded" : ""}${hasKids ? "" : " no-expand"}`;
    row.style.borderLeft = `3px solid ${cat.color}`;
    row.disabled = !hasKids;
    row.innerHTML = `
      <span class="stats-cat-left">
        ${hasKids ? '<span class="stats-chevron" aria-hidden="true"></span>' : ""}
        <span class="task-ico">${getIconChar(cat.icon)}</span>
        <span class="stats-cat-name">${escapeHtml(cat.name)}</span>
        <span class="stats-cat-badge">大类</span>
      </span>
      <span class="stat-val stats-cat-right">
        ${periodSec > 0 ? formatDuration(periodSec) : "—"}
      </span>`;
    if (hasKids) {
      row.onclick = () => {
        if (statsExpandedCats.has(cat.id)) statsExpandedCats.delete(cat.id);
        else statsExpandedCats.add(cat.id);
        renderStats();
      };
    }
    wrap.appendChild(row);

    if (expanded && hasKids) {
      const leafMap = aggregateLeafInCategoryInRange(cat.id, start, end);
      kids.forEach((leaf) => {
        const pSec = leafMap[leaf.id] || 0;
        const sub = document.createElement("div");
        sub.className = "stats-leaf-row";
        sub.style.borderLeft = `3px solid ${leaf.color}`;
        const leafObj = {
          ...leaf,
          parentId: cat.id,
          parentName: cat.name,
        };
        sub.innerHTML = `
          <span class="stat-label">${labelHtmlWithParent(leafObj)}</span>
          <span class="stat-val">
            ${pSec > 0 ? formatDuration(pSec) : "—"}
          </span>`;
        wrap.appendChild(sub);
      });
    }

    list.appendChild(wrap);
  });

  syncStatsDateInputs();
  syncStatsPresetControls();
  renderTimeline();
}

function renderCategories() {
  const root = $("#categories-tree");
  if (!root) return;
  root.innerHTML = "";
  if (!state.categories.length) {
    root.innerHTML =
      '<p class="empty-hint">还没有大类，点击下方添加</p>';
    return;
  }

  state.categories.forEach((cat) => {
    const card = document.createElement("div");
    card.className = "card cat-card";
    const leafIds = leafIdsInCategory(cat.id);
    const n = entryCountForLeaves(leafIds);
    card.innerHTML = `
      <div class="cat-header">
        <span class="cat-header-main">
          <span class="cat-ico">${getIconChar(cat.icon)}</span>
          <span class="cat-title">${escapeHtml(cat.name)}</span>
        </span>
        <span class="cat-actions">
          <button type="button" class="btn-mini" data-act="add-sub" data-cat="${cat.id}">子类</button>
          <button type="button" class="btn-mini" data-act="edit-cat" data-cat="${cat.id}">编辑</button>
          <button type="button" class="btn-mini danger" data-act="del-cat" data-cat="${cat.id}">删除</button>
        </span>
      </div>
      <p class="cat-meta">${leafIds.length} 个子类 · 记录 ${n} 条</p>
      <ul class="cat-children" data-cat-list="${cat.id}"></ul>
    `;
    const ul = card.querySelector(".cat-children");
    (cat.children || []).forEach((leaf) => {
      const li = document.createElement("li");
      li.className = "cat-leaf-row";
      const en = state.entries.filter((e) => e.taskId === leaf.id).length;
      li.innerHTML = `
        <span class="cat-leaf-label">
          <span class="cat-ico sm">${getIconChar(leaf.icon)}</span>
          <span>${escapeHtml(leaf.name)}</span>
        </span>
        <span class="cat-leaf-actions">
          <button type="button" class="btn-mini" data-act="edit-leaf" data-cat="${cat.id}" data-leaf="${leaf.id}">编辑</button>
          <button type="button" class="btn-mini danger" data-act="del-leaf" data-cat="${cat.id}" data-leaf="${leaf.id}">删除</button>
        </span>`;
      ul.appendChild(li);
    });
    root.appendChild(card);
  });

  root.querySelectorAll("[data-act]").forEach((btn) => {
    btn.onclick = () => {
      const act = btn.getAttribute("data-act");
      const catId = btn.getAttribute("data-cat");
      const leafId = btn.getAttribute("data-leaf");
      if (act === "add-sub") openEditor("sub", { parentCategoryId: catId });
      if (act === "edit-cat") openEditor("category", { categoryId: catId });
      if (act === "del-cat") deleteCategory(catId);
      if (act === "edit-leaf") openEditor("sub", { categoryId: catId, leafId });
      if (act === "del-leaf") deleteLeaf(catId, leafId);
    };
  });
}

const TODO_DELETE_W = 72;
/** 水平位移超过此值视为滑动，吞掉随后的 click，避免 label 误触切换完成态 */
const TODO_SWIPE_SUPPRESS_CLICK_PX = 6;
/** 多滑出一段距离，松手即删（滑到底） */
const TODO_DELETE_OVERSHOOT = 36;
const TODO_MIN_TX = -(TODO_DELETE_W + TODO_DELETE_OVERSHOOT);
/** 松手时位移 ≤ 此值视为「滑到底」，自动删除（需接近完全露出删除区，约 -68px） */
const TODO_AUTO_DELETE_TX = -(TODO_DELETE_W - 4);

const TL_EDIT_W = 72;
const TL_DEL_W = 72;
const TL_SWIPE_OS = 36;
const TL_ACTIONS_W = TL_EDIT_W + TL_DEL_W;
const TL_MIN_TX = -(TL_ACTIONS_W + TL_SWIPE_OS);
const TL_AUTO_DELETE_TX = -(TL_ACTIONS_W - 4);

function readTranslateX(el) {
  const inline = el.style.transform;
  if (inline) {
    const m = inline.match(/translateX\(([-0-9.]+)px\)/);
    if (m) return parseFloat(m[1]);
  }
  const cs = getComputedStyle(el).transform;
  if (!cs || cs === "none") return 0;
  if (cs.startsWith("matrix3d")) {
    const parts = cs.slice(9, -1).split(/\s*,\s*/);
    return parseFloat(parts[12]) || 0;
  }
  if (cs.startsWith("matrix")) {
    const parts = cs.slice(7, -1).split(/\s*,\s*/);
    return parseFloat(parts[4]) || 0;
  }
  return 0;
}

function deleteTodoById(id) {
  todoState.items = todoState.items.filter((x) => x.id !== id);
  saveTodoState();
  renderTodos();
}

function clearCompletedTodos() {
  const n = todoState.items.filter((x) => x.done).length;
  if (n === 0) return;
  if (!confirm(`确定删除 ${n} 条已完成待办？`)) return;
  todoState.items = todoState.items.filter((x) => !x.done);
  saveTodoState();
  renderTodos();
}

function deleteEntryById(id) {
  state.entries = state.entries.filter((x) => x.id !== id);
  saveState();
  if ($("#panel-stats")?.classList.contains("active")) renderStats();
  if ($("#panel-home")?.classList.contains("active")) renderHome();
}

function attachTimelineEntrySwipe(wrap, entryId) {
  const track = wrap.querySelector(".timeline-swipe-track");
  const front = wrap.querySelector(".timeline-swipe-front");
  const editBtn = wrap.querySelector(".timeline-swipe-edit");
  const delBtn = wrap.querySelector(".timeline-swipe-delete");
  if (!track || !front || !editBtn || !delBtn) return;

  track.style.width = `calc(100% + ${TL_ACTIONS_W + TL_SWIPE_OS}px)`;

  function getTx() {
    return readTranslateX(track);
  }

  function setTx(tx, smooth) {
    const x = Math.max(TL_MIN_TX, Math.min(0, tx));
    track.style.transition = smooth ? "transform 0.2s ease" : "none";
    track.style.transform = `translateX(${x}px)`;
    if (x <= -TL_ACTIONS_W / 2) wrap.classList.add("is-open");
    else wrap.classList.remove("is-open");
  }

  function closeOtherTimelineSwipes() {
    document
      .querySelectorAll("#timeline-list .timeline-swipe-wrap.is-open")
      .forEach((w) => {
        if (w === wrap) return;
        w.classList.remove("is-open");
        const t = w.querySelector(".timeline-swipe-track");
        if (t) {
          t.style.transition = "transform 0.2s ease";
          t.style.transform = "translateX(0)";
        }
      });
  }

  editBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setTx(0, true);
    wrap.classList.remove("is-open");
    openEditEntryModal(entryId);
  });

  delBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteEntryById(entryId);
  });

  front.addEventListener("pointerdown", (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startTx = getTx();
    track.style.transition = "none";
    closeOtherTimelineSwipes();
    let decided = false;
    let cancelledVertical = false;
    let maxAbsDx = 0;

    function suppressClickIfSwiped() {
      if (maxAbsDx <= TODO_SWIPE_SUPPRESS_CLICK_PX) return;
      const swallow = (ce) => {
        ce.preventDefault();
        ce.stopImmediatePropagation();
      };
      front.addEventListener("click", swallow, { capture: true, once: true });
    }

    function up() {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      if (cancelledVertical) return;
      const tx = getTx();
      track.style.transition = "transform 0.2s ease";
      if (tx <= TL_AUTO_DELETE_TX) {
        suppressClickIfSwiped();
        deleteEntryById(entryId);
        return;
      }
      if (tx <= -TL_ACTIONS_W / 2) setTx(-TL_ACTIONS_W, true);
      else setTx(0, true);
      suppressClickIfSwiped();
    }

    function move(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      maxAbsDx = Math.max(maxAbsDx, Math.abs(dx));
      if (!decided) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
          cancelledVertical = true;
          decided = true;
          up();
          return;
        }
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) decided = true;
        else return;
      }
      if (cancelledVertical) return;
      setTx(startTx + dx, false);
    }

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  });
}

function attachTodoSwipe(wrap, itemId) {
  const track = wrap.querySelector(".todo-swipe-track");
  const front = wrap.querySelector(".todo-front");
  const delBtn = wrap.querySelector(".todo-swipe-delete");
  if (!track || !front || !delBtn) return;

  function getTx() {
    return readTranslateX(track);
  }

  function setTx(tx, smooth) {
    const x = Math.max(TODO_MIN_TX, Math.min(0, tx));
    track.style.transition = smooth ? "transform 0.2s ease" : "none";
    track.style.transform = `translateX(${x}px)`;
    if (x <= -TODO_DELETE_W / 2) wrap.classList.add("is-open");
    else wrap.classList.remove("is-open");
  }

  function closeOtherSwipes() {
    document.querySelectorAll("#todo-list .todo-swipe-wrap.is-open").forEach((w) => {
      if (w === wrap) return;
      w.classList.remove("is-open");
      const t = w.querySelector(".todo-swipe-track");
      if (t) {
        t.style.transition = "transform 0.2s ease";
        t.style.transform = "translateX(0)";
      }
    });
  }

  delBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteTodoById(itemId);
  });

  front.addEventListener("pointerdown", (e) => {
    if (e.target.closest('input[type="checkbox"]')) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startTx = getTx();
    track.style.transition = "none";
    closeOtherSwipes();
    let decided = false;
    let cancelledVertical = false;
    let maxAbsDx = 0;

    function suppressLabelClickIfSwiped() {
      if (maxAbsDx <= TODO_SWIPE_SUPPRESS_CLICK_PX) return;
      const swallow = (ce) => {
        ce.preventDefault();
        ce.stopImmediatePropagation();
      };
      front.addEventListener("click", swallow, { capture: true, once: true });
    }

    function up() {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      if (cancelledVertical) return;
      const tx = getTx();
      track.style.transition = "transform 0.2s ease";
      if (tx <= TODO_AUTO_DELETE_TX) {
        suppressLabelClickIfSwiped();
        deleteTodoById(itemId);
        return;
      }
      if (tx <= -TODO_DELETE_W / 2) setTx(-TODO_DELETE_W, true);
      else setTx(0, true);
      suppressLabelClickIfSwiped();
    }

    function move(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      maxAbsDx = Math.max(maxAbsDx, Math.abs(dx));
      if (!decided) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
          cancelledVertical = true;
          decided = true;
          up();
          return;
        }
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) decided = true;
        else return;
      }
      if (cancelledVertical) return;
      setTx(startTx + dx, false);
    }

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  });
}

function renderTodos() {
  const list = $("#todo-list");
  const showCompletedInput = $("#todo-show-completed");
  const clearBtn = $("#todo-clear-completed");
  if (!list || !showCompletedInput) return;

  showCompletedInput.checked = !!todoState.showCompleted;
  if (clearBtn) {
    const hasDone = todoState.items.some((x) => x.done);
    clearBtn.hidden = !hasDone;
  }

  list.innerHTML = "";

  const visible = todoState.showCompleted
    ? todoState.items
    : todoState.items.filter((x) => !x.done);

  if (!visible.length) {
    list.innerHTML = '<p class="empty-hint">暂无待办事项</p>';
    return;
  }

  visible.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = `todo-swipe-wrap${item.done ? " done" : ""}`;
    wrap.dataset.todoId = item.id;
    wrap.innerHTML = `
      <div class="todo-swipe-track">
        <div class="todo-front">
          <label class="todo-item-label">
            <input type="checkbox" ${item.done ? "checked" : ""} />
            <span>${escapeHtml(item.text)}</span>
          </label>
        </div>
        <button type="button" class="todo-swipe-delete" aria-label="删除">删除</button>
        <div class="todo-swipe-overshoot" aria-hidden="true"></div>
      </div>
    `;
    const box = wrap.querySelector('input[type="checkbox"]');
    box.addEventListener("change", () => {
      const target = todoState.items.find((x) => x.id === item.id);
      if (!target) return;
      target.done = box.checked;
      saveTodoState();
      renderTodos();
    });
    list.appendChild(wrap);
    attachTodoSwipe(wrap, item.id);
  });
}

function performDeleteCategoryAndEntries(catId) {
  const leafIds = new Set(leafIdsInCategory(catId));
  state.entries = state.entries.filter((e) => !leafIds.has(e.taskId));
  state.categories = state.categories.filter((c) => c.id !== catId);
  saveState();
  refreshDependentViews();
}

function performMigrateEntriesThenDeleteCategory(sourceCatId, targetLeafId) {
  if (!findLeaf(targetLeafId)) return;
  const sourceLeafIds = new Set(leafIdsInCategory(sourceCatId));
  state.entries.forEach((e) => {
    if (sourceLeafIds.has(e.taskId)) e.taskId = targetLeafId;
  });
  state.categories = state.categories.filter((c) => c.id !== sourceCatId);
  saveState();
  refreshDependentViews();
}

function performDeleteLeafAndEntries(parentCatId, leafId) {
  state.entries = state.entries.filter((e) => e.taskId !== leafId);
  const cat = state.categories.find((c) => c.id === parentCatId);
  if (cat) {
    cat.children = (cat.children || []).filter((c) => c.id !== leafId);
  }
  saveState();
  refreshDependentViews();
}

function performMigrateEntriesThenDeleteLeaf(parentCatId, sourceLeafId, targetLeafId) {
  if (!findLeaf(targetLeafId) || sourceLeafId === targetLeafId) return;
  state.entries.forEach((e) => {
    if (e.taskId === sourceLeafId) e.taskId = targetLeafId;
  });
  const cat = state.categories.find((c) => c.id === parentCatId);
  if (cat) {
    cat.children = (cat.children || []).filter((c) => c.id !== sourceLeafId);
  }
  saveState();
  refreshDependentViews();
}

function readDeleteTaxonomyContext(backdrop) {
  if (!backdrop) return null;
  const t = backdrop.dataset.deleteTarget;
  if (t === "category" && backdrop.dataset.catId) {
    return { kind: "category", catId: backdrop.dataset.catId };
  }
  if (t === "leaf" && backdrop.dataset.leafId && backdrop.dataset.parentCatId) {
    return {
      kind: "leaf",
      leafId: backdrop.dataset.leafId,
      parentCatId: backdrop.dataset.parentCatId,
    };
  }
  return null;
}

function clearDeleteTaxonomyDataset(backdrop) {
  if (!backdrop) return;
  delete backdrop.dataset.deleteTarget;
  delete backdrop.dataset.catId;
  delete backdrop.dataset.leafId;
  delete backdrop.dataset.parentCatId;
}

function applyDeleteTaxonomyModalLabels(kind) {
  const title = $("#delete-taxonomy-title");
  const msgA = $("#delete-taxonomy-msg-a");
  const msgB = $("#delete-taxonomy-msg-b");
  const hint = $("#delete-cat-migrate-hint");
  const btnDel = $("#delete-cat-with-entries");
  const btnMig = $("#delete-cat-migrate-start");
  if (kind === "category") {
    if (title) title.textContent = "删除大类";
    if (msgA) {
      msgA.textContent =
        "该分类下已有记录，删除分类及记录，或将记录迁移至其他子类。";
    }
    if (msgB) {
      msgB.textContent =
        "选择目标子类后，该大类下所有时间记录将归入该子类，并删除当前大类。";
    }
    if (btnDel) btnDel.textContent = "删除分类及全部记录";
    if (btnMig) btnMig.textContent = "迁移到其他子类";
  } else {
    if (title) title.textContent = "删除子类";
    if (msgA) {
      msgA.textContent =
        "该子类下已有记录，删除子类及记录，或将记录迁移至其他子类。";
    }
    if (msgB) {
      msgB.textContent =
        "选择目标子类后，当前子类下的时间记录将归入该子类，并删除当前子类。";
    }
    if (btnDel) btnDel.textContent = "删除子类及全部记录";
    if (btnMig) btnMig.textContent = "迁移到其他子类";
  }
  if (hint) {
    hint.textContent = "暂无可选子类。";
  }
}

function populateDeleteTaxonomyMigrateSelect() {
  const sel = $("#delete-cat-target-leaf");
  if (!sel) return false;
  const bd = $("#modal-delete-category");
  const ctx = readDeleteTaxonomyContext(bd);
  if (!ctx) return false;
  sel.innerHTML = "";
  let hasOption = false;
  if (ctx.kind === "category") {
    state.categories.forEach((cat) => {
      if (cat.id === ctx.catId) return;
      (cat.children || []).forEach((leaf) => {
        hasOption = true;
        const opt = document.createElement("option");
        opt.value = leaf.id;
        opt.textContent = `${cat.name} — ${leaf.name}`;
        sel.appendChild(opt);
      });
    });
  } else {
    state.categories.forEach((cat) => {
      (cat.children || []).forEach((leaf) => {
        if (leaf.id === ctx.leafId) return;
        hasOption = true;
        const opt = document.createElement("option");
        opt.value = leaf.id;
        opt.textContent = `${cat.name} — ${leaf.name}`;
        sel.appendChild(opt);
      });
    });
  }
  const hint = $("#delete-cat-migrate-hint");
  if (hint) hint.hidden = hasOption;
  return hasOption;
}

function resetDeleteCategoryModal() {
  const a = $("#delete-cat-step-a");
  const b = $("#delete-cat-step-b");
  if (a) a.hidden = false;
  if (b) b.hidden = true;
}

function deleteCategory(catId) {
  const ids = leafIdsInCategory(catId);
  const n = entryCountForLeaves(ids);
  if (n === 0) {
    if (!confirm("确定删除此大类及其下所有子类？")) return;
    state.categories = state.categories.filter((c) => c.id !== catId);
    saveState();
    refreshDependentViews();
    return;
  }
  const backdrop = $("#modal-delete-category");
  if (!backdrop) return;
  clearDeleteTaxonomyDataset(backdrop);
  backdrop.dataset.deleteTarget = "category";
  backdrop.dataset.catId = catId;
  applyDeleteTaxonomyModalLabels("category");
  resetDeleteCategoryModal();
  openModal("modal-delete-category");
}

function deleteLeaf(catId, leafId) {
  const n = entryCountForLeaves([leafId]);
  if (n === 0) {
    if (!confirm("确定删除此子类？")) return;
    const cat = state.categories.find((c) => c.id === catId);
    if (cat) {
      cat.children = (cat.children || []).filter((c) => c.id !== leafId);
    }
    saveState();
    refreshDependentViews();
    return;
  }
  const backdrop = $("#modal-delete-category");
  if (!backdrop) return;
  clearDeleteTaxonomyDataset(backdrop);
  backdrop.dataset.deleteTarget = "leaf";
  backdrop.dataset.leafId = leafId;
  backdrop.dataset.parentCatId = catId;
  applyDeleteTaxonomyModalLabels("leaf");
  resetDeleteCategoryModal();
  openModal("modal-delete-category");
}

function openEditor(mode, { categoryId = null, leafId = null, parentCategoryId = null } = {}) {
  editorCtx = {
    mode,
    categoryId,
    leafId,
    parentCategoryId: parentCategoryId || categoryId,
    selectedIcon: "folder",
    selectedColor: COLOR_PRESETS[0].hex,
  };

  const title = $("#editor-title");
  const nameIn = $("#editor-name");

  if (mode === "category" && !categoryId) {
    title.textContent = "添加大类";
    nameIn.value = "";
    editorCtx.selectedIcon = "folder";
    editorCtx.selectedColor = COLOR_PRESETS[0].hex;
  } else if (mode === "category" && categoryId) {
    const cat = state.categories.find((c) => c.id === categoryId);
    title.textContent = "编辑大类";
    nameIn.value = cat?.name || "";
    editorCtx.selectedIcon = cat?.icon || "folder";
    editorCtx.selectedColor = cat?.color || COLOR_PRESETS[0].hex;
  } else if (mode === "sub" && !leafId) {
    title.textContent = "添加子类";
    nameIn.value = "";
    editorCtx.selectedIcon = "book";
    editorCtx.selectedColor =
      state.categories.find((c) => c.id === editorCtx.parentCategoryId)?.color ||
      COLOR_PRESETS[0].hex;
  } else if (mode === "sub" && leafId) {
    const found = findLeaf(leafId);
    title.textContent = "编辑子类";
    nameIn.value = found?.leaf?.name || "";
    editorCtx.selectedIcon = found?.leaf?.icon || "book";
    editorCtx.selectedColor = found?.leaf?.color || COLOR_PRESETS[0].hex;
    editorCtx.parentCategoryId = found?.category?.id || parentCategoryId;
  }

  buildIconPicker();
  buildColorPresets();
  openModal("modal-editor");
}

function buildIconPicker() {
  const wrap = $("#editor-icon-picker");
  wrap.innerHTML = "";
  Object.keys(ICON_MAP).forEach((key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "icon-pick-btn";
    b.dataset.icon = key;
    b.textContent = ICON_MAP[key];
    b.title = key;
    if (key === editorCtx.selectedIcon) b.classList.add("selected");
    b.onclick = () => {
      editorCtx.selectedIcon = key;
      wrap.querySelectorAll(".icon-pick-btn").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    };
    wrap.appendChild(b);
  });
}

function buildColorPresets() {
  const wrap = $("#editor-color-presets");
  wrap.innerHTML = "";
  COLOR_PRESETS.forEach(({ hex, hint }) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "color-pick-btn";
    b.style.background = hex;
    b.dataset.color = hex;
    b.title = hint;
    if (hex === editorCtx.selectedColor) b.classList.add("selected");
    b.onclick = () => {
      editorCtx.selectedColor = hex;
      wrap.querySelectorAll(".color-pick-btn").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    };
    wrap.appendChild(b);
  });
}

function saveEditor() {
  const name = $("#editor-name").value.trim();
  if (!name) {
    alert("请填写名称");
    return;
  }
  const { mode, categoryId, leafId, parentCategoryId } = editorCtx;
  const icon = editorCtx.selectedIcon;
  const color = editorCtx.selectedColor;

  let newCategoryId = null;
  let newLeafId = null;

  if (mode === "category" && !categoryId) {
    newCategoryId = genId("cat");
    state.categories.push({
      id: newCategoryId,
      name,
      icon,
      color,
      children: [],
    });
  } else if (mode === "category" && categoryId) {
    const cat = state.categories.find((c) => c.id === categoryId);
    if (cat) {
      cat.name = name;
      cat.icon = icon;
      cat.color = color;
    }
  } else if (mode === "sub" && !leafId) {
    const cat = state.categories.find((c) => c.id === parentCategoryId);
    if (!cat) return;
    if (!cat.children) cat.children = [];
    newLeafId = genId("leaf");
    cat.children.push({
      id: newLeafId,
      name,
      icon,
      color,
    });
  } else if (mode === "sub" && leafId) {
    const found = findLeaf(leafId);
    if (found?.leaf) {
      found.leaf.name = name;
      found.leaf.icon = icon;
      found.leaf.color = color;
    }
  }

  if (
    pendingDeleteMigrate?.step === "awaitNewCat" &&
    mode === "category" &&
    !categoryId &&
    newCategoryId
  ) {
    pendingDeleteMigrate.step = "awaitNewLeaf";
    pendingDeleteMigrate.newParentId = newCategoryId;
    saveState();
    closeModal("modal-editor");
    refreshDependentViews();
    openEditor("sub", { parentCategoryId: newCategoryId });
    return;
  }
  if (
    pendingDeleteMigrate?.step === "awaitNewLeaf" &&
    mode === "sub" &&
    !leafId &&
    newLeafId &&
    parentCategoryId === pendingDeleteMigrate.newParentId
  ) {
    const p = pendingDeleteMigrate;
    pendingDeleteMigrate = null;
    if (p.kind === "category") {
      performMigrateEntriesThenDeleteCategory(p.sourceCatId, newLeafId);
    } else {
      performMigrateEntriesThenDeleteLeaf(p.sourceParentCatId, p.sourceLeafId, newLeafId);
    }
    closeModal("modal-editor");
    refreshDependentViews();
    return;
  }

  saveState();
  closeModal("modal-editor");
  refreshDependentViews();
}

function switchTab(name) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".tab-bar button").forEach((b) => {
    b.classList.remove("active");
    b.removeAttribute("aria-current");
  });
  $(`#panel-${name}`).classList.add("active");
  const tab = $(`#tab-${name}`);
  if (tab) {
    tab.classList.add("active");
    tab.setAttribute("aria-current", "page");
  }
  if (name === "home") renderHome();
  if (name === "stats") renderStats();
  if (name === "categories") renderCategories();
  if (name === "todos") renderTodos();
  updateUrlTabState(name);
}

function showTimerRunningView(show) {
  $("#timer-setup").classList.toggle("hidden", show);
  $("#timer-running").classList.toggle("active", show);
  const rs = $("#rec-section");
  const re = $("#rec-empty");
  if (show) {
    if (rs) rs.hidden = true;
    if (re) re.hidden = true;
  } else {
    renderRecommendationSection();
  }
}

function setRingProgress(sec) {
  const m = 25 * 60;
  const p = Math.min(100, (sec / m) * 100);
  document.documentElement.style.setProperty("--p", p + "%");
}

function resetTimerVisuals() {
  const z = formatClock(0);
  const d1 = $("#timer-display");
  const d2 = $("#timer-display-run");
  if (d1) d1.textContent = z;
  if (d2) d2.textContent = z;
  setRingProgress(0);
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  if (!timerStartedAt) return;
  const sec = Math.floor((Date.now() - timerStartedAt) / 1000);
  $("#timer-display").textContent = formatClock(sec);
  $("#timer-display-run").textContent = formatClock(sec);
  setRingProgress(sec);
}

function startTimerRun() {
  stopTimerInterval();
  timerStartedAt = Date.now();
  showTimerRunningView(true);
  const ref =
    timerMode === "pick_first" && preselectedTaskId
      ? getTaskRef(preselectedTaskId)
      : null;
  const label = ref
    ? `${getIconChar(ref.kind === "leaf" ? ref.leaf.icon : ref.category.icon)} ${ref.kind === "leaf" ? ref.leaf.name : ref.category.name}`
    : "计时中";
  $("#timer-sub-run").textContent =
    timerMode === "pick_first" ? `任务：${label}` : "结束后再选择任务";
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function finishTimer() {
  stopTimerInterval();
  const end = new Date();
  const start = new Date(timerStartedAt);
  const durationSec = Math.floor((end - start) / 1000);
  showTimerRunningView(false);
  timerStartedAt = null;
  openSaveSheet(start, end, durationSec, preselectedTaskId || null);
}

function openSaveSheet(start, end, durationSec, selectedTaskId = null) {
  pendingSaveDraft = {
    start: start.toISOString(),
    end: end.toISOString(),
    taskId: selectedTaskId,
  };
  $("#sheet-save-duration").textContent = formatDuration(durationSec);
  $("#sheet-save-start").value = toLocalInput(start);
  $("#sheet-save-end").value = toLocalInput(end);
  const memoEl = $("#sheet-save-memo");
  if (memoEl) memoEl.value = "";
  const list = $("#sheet-task-list");
  list.innerHTML = "";
  state.categories.forEach((cat) => {
    if (!(cat.children || []).length) return;
    const sub = document.createElement("div");
    sub.className = "picker-group-label";
    sub.textContent = `${getIconChar(cat.icon)} ${cat.name}`;
    list.appendChild(sub);
    (cat.children || []).forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "task-picker-item";
      btn.style.borderLeft = `3px solid ${t.color}`;
      btn.innerHTML = labelHtml(t);
      btn.onclick = () => {
        pendingSaveDraft.taskId = t.id;
        list.querySelectorAll(".task-picker-item").forEach((x) =>
          x.classList.remove("selected")
        );
        btn.classList.add("selected");
      };
      if (pendingSaveDraft.taskId === t.id) btn.classList.add("selected");
      list.appendChild(btn);
    });
  });
  openModal("modal-save");
}

function commitSaveSheet() {
  if (!pendingSaveDraft) return;
  const start = new Date($("#sheet-save-start").value);
  const end = new Date($("#sheet-save-end").value);
  if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
    alert("请填写有效的开始和结束时间");
    return;
  }
  if (end <= start) {
    alert("结束时间需晚于开始时间");
    return;
  }
  if (!pendingSaveDraft.taskId) {
    alert("请选择子类");
    return;
  }
  if (!findLeaf(pendingSaveDraft.taskId)) {
    alert("请选择子类");
    return;
  }
  if (entryTimeConflicts(start, end, null)) {
    alert("时段冲突");
    return;
  }
  const memo = ($("#sheet-save-memo")?.value || "").trim();
  state.entries.push({
    id: "e" + Date.now(),
    taskId: pendingSaveDraft.taskId,
    start: start.toISOString(),
    end: end.toISOString(),
    activity: getTaskActivityText(pendingSaveDraft.taskId),
    note: memo,
  });
  saveState();
  pendingSaveDraft = null;
  timerMode = null;
  preselectedTaskId = null;
  closeModal("modal-save");
  refreshDependentViews();
}

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function enterPickFirstWithTask(taskId) {
  preselectedTaskId = taskId;
  $("#flow-pick").classList.add("active");
  $("#flow-direct").classList.remove("active");
  $("#seg-pick").classList.add("active");
  $("#seg-direct").classList.remove("active");
  startTimerRun();
}

function initTimerTab() {
  renderRecommendationSection();
  $("#seg-pick").onclick = () => {
    $("#seg-pick").classList.add("active");
    $("#seg-direct").classList.remove("active");
    $("#flow-pick").classList.add("active");
    $("#flow-direct").classList.remove("active");
  };
  $("#seg-direct").onclick = () => {
    $("#seg-direct").classList.add("active");
    $("#seg-pick").classList.remove("active");
    $("#flow-direct").classList.add("active");
    $("#flow-pick").classList.remove("active");
  };

  const gridParent = $("#task-grid");
  gridParent.innerHTML = "";
  const leaves = getAllLeaves();
  if (leaves.length === 0) {
    gridParent.innerHTML =
      '<p class="empty-hint">请先在「分类」里添加大类和子类</p>';
  } else {
    const byParent = {};
    leaves.forEach((t) => {
      if (!byParent[t.parentId]) byParent[t.parentId] = [];
      byParent[t.parentId].push(t);
    });

    state.categories.forEach((cat) => {
      const groupLeaves = byParent[cat.id];
      if (!groupLeaves?.length) return;
      const group = document.createElement("div");
      group.className = "task-group";
      group.innerHTML = `<div class="task-group-label">${getIconChar(cat.icon)} ${escapeHtml(cat.name)}</div>`;
      const inner = document.createElement("div");
      inner.className = "task-grid task-grid-inner";
      groupLeaves.forEach((t) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "task-chip";
        b.style.borderLeft = `3px solid ${t.color}`;
        b.innerHTML = `${labelHtml(t)}`;
        b.onclick = () => {
          timerMode = "pick_first";
          preselectedTaskId = t.id;
          startTimerRun();
        };
        inner.appendChild(b);
      });
      group.appendChild(inner);
      gridParent.appendChild(group);
    });
  }

  $("#btn-direct-start").onclick = () => {
    timerMode = "timer_first";
    preselectedTaskId = null;
    startTimerRun();
  };

  $("#btn-stop").onclick = finishTimer;

  $("#btn-cancel-run").onclick = () => {
    stopTimerInterval();
    timerStartedAt = null;
    resetTimerVisuals();
    showTimerRunningView(false);
    timerMode = null;
    preselectedTaskId = null;
  };

  $("#link-manual").onclick = (e) => {
    e.preventDefault();
    openManualSheet();
  };
  $("#link-manual2").onclick = (e) => {
    e.preventDefault();
    openManualSheet();
  };
}

function openManualSheet() {
  const now = new Date();
  const end = new Date(now.getTime() - 60 * 60 * 1000);
  openSaveSheet(end, now, Math.floor((now - end) / 1000), null);
}

function openModal(id) {
  $("#" + id).classList.add("open");
}

function closeModal(id) {
  $("#" + id).classList.remove("open");
}

function init() {
  $("#timer-setup").classList.remove("hidden");
  showTimerRunningView(false);

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark") applyTheme("dark");
    else if (saved === "light") applyTheme("light");
    else updateThemeToggleLabel();
  } catch (_) {
    updateThemeToggleLabel();
  }
  $("#btn-theme-toggle").onclick = () => toggleTheme();

  $("#app-header-titles")?.addEventListener("click", (e) => {
    e.preventDefault();
    const tools = $("#app-header-csv-tools");
    if (!tools) return;
    tools.hidden = !tools.hidden;
  });
  $("#btn-export-csv")?.addEventListener("click", () => exportThreeCsvs());
  $("#btn-import-csv")?.addEventListener("click", () => {
    alert("导入建议顺序：先导入类目配置，再导入待办事项，最后导入时间记录。");
    $("#import-csv-input")?.click();
  });
  $("#import-csv-input")?.addEventListener("change", async (ev) => {
    const input = ev.target;
    const files = input?.files ? [...input.files] : [];
    if (input) input.value = "";
    if (!files.length) return;
    try {
      const pairs = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          text: await f.text(),
        }))
      );
      applyImportedCsvFiles(pairs);
    } catch (_) {}
  });

  initTimerTab();

  $("#tab-home").onclick = () => switchTab("home");
  $("#tab-timer").onclick = () => switchTab("timer");
  $("#tab-stats").onclick = () => switchTab("stats");
  $("#tab-categories").onclick = () => switchTab("categories");
  $("#tab-todos").onclick = () => switchTab("todos");

  $("#btn-add-category").onclick = () => openEditor("category", {});

  $("#editor-save").onclick = saveEditor;
  $("#editor-cancel").onclick = () => {
    pendingDeleteMigrate = null;
    closeModal("modal-editor");
  };

  $("#delete-cat-with-entries").onclick = () => {
    const bd = $("#modal-delete-category");
    const ctx = readDeleteTaxonomyContext(bd);
    if (!ctx) return;
    let n;
    let msg;
    if (ctx.kind === "category") {
      n = entryCountForLeaves(leafIdsInCategory(ctx.catId));
      msg = `将永久删除该大类、其下所有子类及 ${n} 条时间记录，且无法恢复。确定继续？`;
    } else {
      n = entryCountForLeaves([ctx.leafId]);
      msg = `将永久删除该子类及 ${n} 条时间记录，且无法恢复。确定继续？`;
    }
    if (!confirm(msg)) return;
    closeModal("modal-delete-category");
    clearDeleteTaxonomyDataset(bd);
    resetDeleteCategoryModal();
    if (ctx.kind === "category") {
      performDeleteCategoryAndEntries(ctx.catId);
    } else {
      performDeleteLeafAndEntries(ctx.parentCatId, ctx.leafId);
    }
  };
  $("#delete-cat-migrate-start").onclick = () => {
    const bd = $("#modal-delete-category");
    if (!readDeleteTaxonomyContext(bd)) return;
    $("#delete-cat-step-a").hidden = true;
    $("#delete-cat-step-b").hidden = false;
    populateDeleteTaxonomyMigrateSelect();
  };
  $("#delete-cat-migrate-back").onclick = () => {
    $("#delete-cat-step-a").hidden = false;
    $("#delete-cat-step-b").hidden = true;
  };
  $("#delete-cat-cancel").onclick = () => {
    const bd = $("#modal-delete-category");
    closeModal("modal-delete-category");
    clearDeleteTaxonomyDataset(bd);
    resetDeleteCategoryModal();
    pendingDeleteMigrate = null;
  };
  $("#delete-cat-migrate-confirm").onclick = () => {
    const bd = $("#modal-delete-category");
    const ctx = readDeleteTaxonomyContext(bd);
    if (!ctx) return;
    const sel = $("#delete-cat-target-leaf");
    const targetLeafId = sel?.value;
    if (!targetLeafId) {
      alert("请先选择目标子类。");
      return;
    }
    closeModal("modal-delete-category");
    clearDeleteTaxonomyDataset(bd);
    resetDeleteCategoryModal();
    if (ctx.kind === "category") {
      performMigrateEntriesThenDeleteCategory(ctx.catId, targetLeafId);
    } else {
      performMigrateEntriesThenDeleteLeaf(ctx.parentCatId, ctx.leafId, targetLeafId);
    }
  };
  const deleteCatNewThenMigrateBtn = $("#delete-cat-new-then-migrate");
  if (deleteCatNewThenMigrateBtn) deleteCatNewThenMigrateBtn.onclick = () => {
    const bd = $("#modal-delete-category");
    const ctx = readDeleteTaxonomyContext(bd);
    if (!ctx) return;
    if (ctx.kind === "category") {
      pendingDeleteMigrate = {
        kind: "category",
        step: "awaitNewCat",
        sourceCatId: ctx.catId,
      };
    } else {
      pendingDeleteMigrate = {
        kind: "leaf",
        step: "awaitNewCat",
        sourceLeafId: ctx.leafId,
        sourceParentCatId: ctx.parentCatId,
      };
    }
    closeModal("modal-delete-category");
    clearDeleteTaxonomyDataset(bd);
    resetDeleteCategoryModal();
    openEditor("category", {});
  };

  document.querySelectorAll("[data-focus-period]").forEach((btn) => {
    btn.onclick = () => {
      state.homeFocus.period = btn.dataset.focusPeriod;
      saveState();
      syncFocusPeriodButtons();
      renderFocusChart();
    };
  });
  const applyFocusCustomRange = () => {
    let s = $("#focus-date-start")?.value;
    let e = $("#focus-date-end")?.value;
    if (!s || !e) return;
    if (s > e) {
      const t = s;
      s = e;
      e = t;
    }
    state.homeFocus.customRange = { start: s, end: e };
    state.homeFocus.period = "custom";
    saveState();
    syncFocusPeriodButtons();
    renderFocusChart();
  };
  $("#focus-date-start")?.addEventListener("change", applyFocusCustomRange);
  $("#focus-date-end")?.addEventListener("change", applyFocusCustomRange);

  $("#stats-date-start")?.addEventListener("change", applyStatsRangeFromInputs);
  $("#stats-date-end")?.addEventListener("change", applyStatsRangeFromInputs);
  $("#stats-quick-today").onclick = () => setStatsQuickRange(1);
  $("#stats-quick-7").onclick = () => setStatsQuickRange(7);
  $("#stats-quick-30").onclick = () => setStatsQuickRange(30);
  $("#stats-quick-custom").onclick = () => {
    state.statsRangePreset = "custom";
    saveState();
    updateUrlDateState();
    renderStats();
  };
  $("#timeline-date").addEventListener("change", () => {
    if (!$("#timeline-date").value) return;
    state.timelineDate = $("#timeline-date").value;
    saveState();
    updateUrlDateState();
    renderTimeline();
  });

  $("#modal-save-dismiss").onclick = () => {
    pendingSaveDraft = null;
    timerMode = null;
    preselectedTaskId = null;
    resetTimerVisuals();
    closeModal("modal-save");
  };
  $("#modal-save-confirm").onclick = commitSaveSheet;
  $("#modal-manual-cancel").onclick = () => closeModal("modal-manual");
  $("#modal-manual-save").onclick = () => {
    const start = new Date($("#manual-start").value);
    const end = new Date($("#manual-end").value);
    const taskId = $("#manual-task").value;
    const memo = ($("#manual-memo")?.value || "").trim();
    if (!taskId) {
      alert("请选择子类");
      return;
    }
    if (end <= start) {
      alert("结束时间需晚于开始时间");
      return;
    }
    if (entryTimeConflicts(start, end, null)) {
      alert("时段冲突");
      return;
    }
    state.entries.push({
      id: "e" + Date.now(),
      taskId,
      start: start.toISOString(),
      end: end.toISOString(),
      activity: getTaskActivityText(taskId),
      note: memo,
    });
    saveState();
    closeModal("modal-manual");
    refreshDependentViews();
  };

  $("#modal-entry-edit-cancel")?.addEventListener("click", () => {
    pendingEditEntryId = null;
    closeModal("modal-entry-edit");
  });
  $("#modal-entry-edit-save")?.addEventListener("click", () => {
    if (!pendingEditEntryId) return;
    const start = new Date($("#edit-entry-start")?.value);
    const end = new Date($("#edit-entry-end")?.value);
    const taskId = $("#edit-entry-task")?.value;
    const memo = ($("#edit-entry-memo")?.value || "").trim();
    if (!taskId) {
      alert("请选择子类");
      return;
    }
    if (
      !(start instanceof Date) ||
      isNaN(start.getTime()) ||
      !(end instanceof Date) ||
      isNaN(end.getTime())
    ) {
      alert("请填写有效的开始和结束时间");
      return;
    }
    if (end <= start) {
      alert("结束时间需晚于开始时间");
      return;
    }
    if (entryTimeConflicts(start, end, pendingEditEntryId)) {
      alert("时段冲突");
      return;
    }
    const ent = state.entries.find((x) => x.id === pendingEditEntryId);
    if (!ent) return;
    ent.taskId = taskId;
    ent.start = start.toISOString();
    ent.end = end.toISOString();
    ent.activity = getTaskActivityText(taskId);
    ent.note = memo;
    pendingEditEntryId = null;
    saveState();
    closeModal("modal-entry-edit");
    refreshDependentViews();
  });

  $("#btn-reset-demo").onclick = () => {
    statsExpandedCats.clear();
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("timeOnYourSidePrototype.v4");
    sessionStorage.removeItem("timeOnYourSidePrototype.v3");
    sessionStorage.removeItem("timeOnYourSidePrototype.v2");
    sessionStorage.removeItem("timeOnYourSidePrototype.v1");
    state = loadState();
    initTimerTab();
    renderHome();
    renderStats();
    renderCategories();
    renderTodos();
  };

  function commitTodoAdd() {
    const input = $("#todo-input");
    const text = (input?.value || "").trim();
    if (!text) return;
    todoState.items.unshift({ id: genId("todo"), text, done: false });
    saveTodoState();
    if (input) input.value = "";
    renderTodos();
  }
  $("#todo-add").onclick = (e) => {
    e.preventDefault();
    commitTodoAdd();
  };
  // 不在输入框监听 Enter：中文 IME 选词时常用 Enter 确认，会误触发提交
  $("#todo-show-completed").addEventListener("change", (e) => {
    todoState.showCompleted = !!e.target.checked;
    saveTodoState();
    renderTodos();
  });
  $("#todo-clear-completed")?.addEventListener("click", () => clearCompletedTodos());

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#app-header-titles") && !e.target.closest("#app-header-csv-tools")) {
      const tools = $("#app-header-csv-tools");
      if (tools) tools.hidden = true;
    }
    if (!e.target.closest("#todo-list")) {
      document
        .querySelectorAll("#todo-list .todo-swipe-wrap.is-open")
        .forEach((w) => {
          w.classList.remove("is-open");
          const t = w.querySelector(".todo-swipe-track");
          if (t) {
            t.style.transition = "transform 0.2s ease";
            t.style.transform = "translateX(0)";
          }
        });
    }
    if (!e.target.closest("#timeline-list")) {
      document
        .querySelectorAll("#timeline-list .timeline-swipe-wrap.is-open")
        .forEach((w) => {
          w.classList.remove("is-open");
          const t = w.querySelector(".timeline-swipe-track");
          if (t) {
            t.style.transition = "transform 0.2s ease";
            t.style.transform = "translateX(0)";
          }
        });
    }
  });

  document.querySelectorAll(".modal-backdrop").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target === el) {
        if (el.id === "modal-save") {
          pendingSaveDraft = null;
          timerMode = null;
          preselectedTaskId = null;
        }
        if (el.id === "modal-delete-category") {
          clearDeleteTaxonomyDataset(el);
          resetDeleteCategoryModal();
          pendingDeleteMigrate = null;
        }
        if (el.id === "modal-entry-edit") pendingEditEntryId = null;
        el.classList.remove("open");
      }
    });
  });

  hydrateDateStateFromUrl();
  switchTab(initialTabFromUrl());
  updateUrlDateState();
}

const style = document.createElement("style");
style.textContent = `
  .hidden { display: none !important; }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", init);
