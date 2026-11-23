import * as THREE from 'three';
import '@fontsource-variable/vazirmatn';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const viewport = $('#viewport');
const minimap = $('#minimap');
const minimapCtx = minimap.getContext('2d');
const fmt = (number) => Math.max(0, Math.floor(number)).toLocaleString('fa-IR');
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const MAP_W = 76;
const MAP_D = 60;
const HALF_W = MAP_W / 2;
const HALF_D = MAP_D / 2;
const UNIT_LIMIT = 30;

const factions = [
  { id: 'cn', name: 'چین', code: 'CN', color: '#ef5a61', trait: 'تولید انبوه', description: 'هزینهٔ ساخت و تولید نیرو کمتر است.', abilityName: 'تدارکات سریع', abilityText: '۵۰۰ اعتبار دریافت کن.', ability: 'supply', costMult: .88, unitCostMult: .9, tank: { armor: 80, pen: 82, hp: 980, speed: 2.9 }, vehicles: { scout: 'دانگ‌فنگ منگشی', tank: 'تایپ ۹۹A', ifv: 'ZBD-04A', mlrs: 'PHL-03', heli: 'Z-10', jet: 'J-10C', atgm: 'HJ-12', sam: 'HQ-9' }, special: { kind: 'arsenal', name: 'مجتمع صنعتی', icon: '▥', cost: 880, description: 'درآمد پایگاه را افزایش می‌دهد.', hp: 1100, powerUse: 30, income: 8 } },
  { id: 'ir', name: 'ایران', code: 'IR', color: '#64c695', trait: 'دفاع استوار', description: 'برجک‌های دفاعی برد و قدرت بیشتری دارند.', abilityName: 'سپر دفاعی', abilityText: 'ساختمان‌ها را ترمیم و برای مدتی تقویت کن.', ability: 'fortify', turretMult: 1.28, tank: { armor: 65, pen: 70, hp: 900, speed: 3.0 }, vehicles: { scout: 'صفیر', tank: 'کرار', ifv: 'BMP-2', mlrs: 'فجر-۵', heli: 'Mi-24', jet: 'MiG-29', atgm: 'دهلاویه', sam: 'باور-۳۷۳' }, special: { kind: 'bastion', name: 'پدافند سپهر', icon: '⌁', cost: 920, description: 'برج دفاعی دوربرد با آتش سنگین.', hp: 1050, powerUse: 38, range: 17, damage: 48, cooldown: 1.15 } },
  { id: 'tr', name: 'ترکیه', code: 'TR', color: '#5fa9db', trait: 'تحرک بالا', description: 'واحدهای زمینی سریع‌تر حرکت می‌کنند.', abilityName: 'شتاب رزمی', abilityText: 'سرعت نیروهای زمینی را موقتاً افزایش بده.', ability: 'overdrive', speedMult: 1.2, tank: { armor: 75, pen: 78, hp: 900, speed: 3.0 }, vehicles: { scout: 'اوتوکار کبرا', tank: 'آلتای', ifv: 'ACV-15', mlrs: 'T-300 کاسیرگا', heli: 'T-129 آتاک', jet: 'F-16', atgm: 'OMTAS', sam: 'حصار' }, special: { kind: 'droneport', name: 'پایگاه پهپادی', icon: '◈', cost: 860, description: 'برد دید و تحرک نیروها را افزایش می‌دهد.', hp: 900, powerUse: 32 } },
  { id: 'us', name: 'آمریکا', code: 'US', color: '#5c9cf2', trait: 'پشتیبانی هوایی', description: 'توانایی حملهٔ هوایی تاکتیکی در اختیار است.', abilityName: 'حملهٔ هوایی', abilityText: 'نقطه‌ای روی میدان انتخاب کن تا هدف‌گیری شود.', ability: 'airstrike', tank: { armor: 78, pen: 85, hp: 1000, speed: 2.8 }, vehicles: { scout: 'هاموی M1151', tank: 'M1A2 آبرامز', ifv: 'M2A3 بردلی', mlrs: 'HIMARS', heli: 'AH-64 آپاچی', jet: 'F-16C', atgm: 'جاولین', sam: 'پاتریوت' }, special: { kind: 'airbase', name: 'پایگاه هوایی راهبردی', icon: '✈', cost: 980, description: 'قدرت حملهٔ هوایی و تولید هوایی را افزایش می‌دهد.', hp: 1050, powerUse: 45 } },
  { id: 'ru', name: 'روسیه', code: 'RU', color: '#d67962', trait: 'زره سنگین', description: 'واحدها و ساختمان‌ها آسیب کمتری می‌گیرند.', abilityName: 'زره واکنشی', abilityText: 'برای مدتی آسیب دریافتی را کاهش بده.', ability: 'ironclad', armorMult: .84, tank: { armor: 85, pen: 80, hp: 1050, speed: 2.6 }, vehicles: { scout: 'تایگر', tank: 'T-90M', ifv: 'BMP-3', mlrs: 'BM-30 اسمرچ', heli: 'Mi-28', jet: 'Su-35', atgm: 'کورنت', sam: 'S-400' }, special: { kind: 'armory', name: 'کارگاه زره و تعمیر', icon: '▤', cost: 900, description: 'زره نیروهای زمینی را تقویت می‌کند.', hp: 1250, powerUse: 42 } },
  { id: 'il', name: 'اسرائیل', code: 'IL', color: '#d8bf61', trait: 'شناسایی دقیق', description: 'واحدها دشمن را از فاصلهٔ دورتری تشخیص می‌دهند.', abilityName: 'اسکن میدان', abilityText: 'برد دید نیروها را برای مدتی افزایش بده.', ability: 'recon', rangeMult: 1.2, tank: { armor: 88, pen: 75, hp: 1000, speed: 2.7 }, vehicles: { scout: 'سوفر', tank: 'مرکاوا Mk.4', ifv: 'نامر', mlrs: 'لینکس', heli: 'AH-64D', jet: 'F-15I', atgm: 'اسپایک', sam: 'دیوید اسلینگ' }, special: { kind: 'sensor', name: 'مرکز شنود', icon: '⌖', cost: 820, description: 'برد شناسایی و درگیری نیروها را افزایش می‌دهد.', hp: 800, powerUse: 28 } },
  { id: 'in', name: 'هند', code: 'IN', color: '#e99b54', trait: 'اقتصاد پویا', description: 'اعتبار بیشتری از درآمد دوره‌ای به دست می‌آید.', abilityName: 'تجارت منطقه‌ای', abilityText: '۶۵۰ اعتبار به ذخیرهٔ پایگاه اضافه کن.', ability: 'trade', incomeMult: 1.18, tank: { armor: 72, pen: 72, hp: 950, speed: 2.8 }, vehicles: { scout: 'ماهیندرا آرمادو', tank: 'آرجون Mk.1A', ifv: 'BMP-2K', mlrs: 'پیناکا', heli: 'پرچند', jet: 'Su-30MKI', atgm: 'ناگ', sam: 'آکاش' }, special: { kind: 'solar', name: 'مزرعهٔ خورشیدی', icon: '☼', cost: 740, description: 'تولید برق و درآمد پایگاه را بالا می‌برد.', hp: 720, powerOutput: 95, income: 5 } },
  { id: 'fr', name: 'فرانسه', code: 'FR', color: '#75c2c3', trait: 'پشتیبانی میدانی', description: 'ساختمان‌ها از ابتدا مقاوم‌ترند و ترمیم می‌شوند.', abilityName: 'تعمیر اضطراری', abilityText: 'سلامتی نیروها و ساختمان‌ها را بازیابی کن.', ability: 'repair', hpMult: 1.1, tank: { armor: 76, pen: 80, hp: 900, speed: 3.2 }, vehicles: { scout: 'VLRA', tank: 'لکلرک', ifv: 'VBCI', mlrs: 'LRU', heli: 'تایگر', jet: 'رافال', atgm: 'MMP', sam: 'SAMP/T' }, special: { kind: 'hospital', name: 'مرکز امداد', icon: '✚', cost: 860, description: 'نیروهای نزدیک را به‌آرامی ترمیم می‌کند.', hp: 980, powerUse: 34 } },
];

const BUILDINGS = [
  { kind: 'hq', name: 'مرکز فرماندهی', icon: '⌂', cost: 1200, hp: 3000, powerUse: 0, range: 12, damage: 18, cooldown: 1.2, armor: 45, description: 'قلب پایگاه؛ بدون آن درآمد و ساخت‌وساز ممکن نیست' },
  { kind: 'generator', name: 'نیروگاه', icon: 'ϟ', cost: 350, hp: 650, powerOutput: 160, powerUse: 0, armor: 12, requires: 'hq', description: 'تأمین برق کارخانه‌ها و پدافند' },
  { kind: 'refinery', name: 'پالایشگاه', icon: '♨', cost: 750, hp: 950, powerUse: 25, income: 12, armor: 15, requires: 'hq', description: 'درآمد ثابت +۱۲ اعتبار در ثانیه' },
  { kind: 'barracks', name: 'پادگان', icon: '▰', cost: 600, hp: 900, powerUse: 20, armor: 18, requires: 'hq', description: 'خودروی شناسایی، مهندس و تیم موشک‌انداز' },
  { kind: 'turret', name: 'برجک دفاعی', icon: '⌖', cost: 500, hp: 850, powerUse: 20, range: 14, damage: 34, cooldown: 1.0, armor: 40, requires: 'barracks', description: 'پدافند زمینی خودکار' },
  { kind: 'sam', name: 'سامانهٔ پدافند هوایی', icon: '⌁', cost: 950, hp: 800, powerUse: 30, range: 24, damage: 150, cooldown: 2.2, armor: 25, canHitAir: true, antiAirOnly: true, requires: 'turret', description: 'موشک زمین‌به‌هوا؛ فقط اهداف هوایی' },
  { kind: 'logistics', name: 'پایانهٔ کشتیرانی', icon: '⚓', cost: 1100, hp: 1050, powerUse: 35, income: 8, armor: 16, requires: 'refinery', description: 'خط لجستیک: درآمد +۸ و ۱۲٪ سرعت تولید بیشتر' },
  { kind: 'armor', name: 'کارخانهٔ زرهی', icon: '▥', cost: 1500, hp: 1400, powerUse: 55, armor: 25, requires: 'logistics', description: 'تانک، نفربر و راکت‌انداز تولید می‌کند' },
  { kind: 'airfield', name: 'فرودگاه', icon: '✈', cost: 1800, hp: 1200, powerUse: 60, armor: 18, requires: 'armor', description: 'بالگرد و جنگنده تولید می‌کند' },
];

const UNITS = [
  { kind: 'scout', name: 'خودروی شناسایی', icon: '◈', cost: 350, hp: 320, speed: 5.0, range: 7, scan: 12, damage: 16, cooldown: .55, buildTime: 6, armor: 8, penetration: 22, requires: 'barracks', requiresName: 'پادگان', description: 'سریع و ارزان؛ برای شناسایی و مزاحمت' },
  { kind: 'engineer', name: 'مهندس', icon: '⚒', cost: 240, hp: 260, speed: 3.6, range: 0, scan: 6, damage: 0, cooldown: 0, buildTime: 4, repair: 15, armor: 4, penetration: 0, requires: 'barracks', requiresName: 'پادگان', description: 'ترمیم خودکار ساختمان‌ها و واحدهای آسیب‌دیده' },
  { kind: 'atgm', name: 'تیم موشک‌انداز', icon: '⌁', cost: 450, hp: 220, speed: 3.0, range: 12, scan: 15, damage: 110, cooldown: 3.2, buildTime: 7, armor: 4, penetration: 95, missile: true, requires: 'barracks', requiresName: 'پادگان', description: 'موشک هدایت‌شده؛ مرگبار برای تانک‌ها' },
  { kind: 'tank', name: 'تانک اصلی نبرد', icon: '▣', cost: 900, hp: 950, speed: 2.8, range: 10, scan: 13, damage: 90, cooldown: 2.2, buildTime: 12, armor: 75, penetration: 80, requires: 'armor', requiresName: 'کارخانهٔ زرهی', description: 'زره سنگین و توپ ۱۲۰ میلی‌متری' },
  { kind: 'ifv', name: 'خودروی جنگی پیاده', icon: '▤', cost: 700, hp: 620, speed: 3.8, range: 8, scan: 12, damage: 28, cooldown: .8, buildTime: 9, armor: 40, penetration: 35, canHitAir: true, requires: 'armor', requiresName: 'کارخانهٔ زرهی', description: 'توپ خودکار؛ توان محدود ضدهوایی' },
  { kind: 'mlrs', name: 'راکت‌انداز چندلول', icon: '➤', cost: 1100, hp: 420, speed: 2.2, range: 22, scan: 24, damage: 80, cooldown: 5, buildTime: 14, armor: 10, penetration: 35, splash: 3.4, missile: true, requires: 'armor', requiresName: 'کارخانهٔ زرهی', description: 'باران راکت با برد ۲۲ و آسیب منطقه‌ای' },
  { kind: 'heli', name: 'بالگرد رزمی', icon: '✧', cost: 1100, hp: 520, speed: 5.4, range: 10, scan: 16, damage: 55, cooldown: 1.4, buildTime: 13, armor: 20, penetration: 70, air: true, altitude: 5.5, canHitAir: true, missile: true, requires: 'airfield', requiresName: 'فرودگاه', description: 'پرواز بر فراز میدان؛ فقط پدافند هوایی مهارش می‌کند' },
  { kind: 'jet', name: 'جنگندهٔ چندمنظوره', icon: '✈', cost: 1700, hp: 600, speed: 8.5, range: 9, scan: 20, damage: 100, cooldown: 2.0, buildTime: 18, armor: 15, penetration: 85, air: true, altitude: 8, canHitAir: true, missile: true, requires: 'airfield', requiresName: 'فرودگاه', description: 'سرعت و قدرت بالا؛ ضربهٔ هوایی سریع' },
];

const DIFFICULTIES = {
  easy: { id: 'easy', name: 'آسان', hint: 'دشمن کندتر می‌سازد و موج‌های کوچک‌تری می‌فرستد', income: .7, wave: 42, cap: 10, turrets: 1, think: 4.2, hp: .92 },
  normal: { id: 'normal', name: 'معمولی', hint: 'تعادل استاندارد نبرد', income: 1, wave: 30, cap: 14, turrets: 2, think: 3, hp: 1 },
  hard: { id: 'hard', name: 'سخت', hint: 'اقتصاد پرسرعت، پدافند سنگین و موج‌های بزرگ', income: 1.42, wave: 22, cap: 18, turrets: 3, think: 2.1, hp: 1.12 },
};

const BUILDING_INFO = Object.fromEntries(BUILDINGS.map((item) => [item.kind, item]));
const UNIT_INFO = Object.fromEntries(UNITS.map((item) => [item.kind, item]));

const sound = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('frontline.muted') === '1'; } catch (error) { muted = false; }
  let lastShotAt = 0;
  function ensure() {
    if (!ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      ctx = new AudioCtor();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(frequency, duration, { type = 'sine', gain = .05, endFreq = frequency, delay = 0 } = {}) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const start = ac.currentTime + delay;
    const oscillator = ac.createOscillator();
    const envelope = ac.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.linearRampToValueAtTime(gain, start + Math.min(.02, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope).connect(ac.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }
  function noise(duration = .3, gain = .12) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const frames = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;
    const envelope = ac.createGain();
    envelope.gain.value = gain;
    envelope.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + duration);
    source.connect(filter).connect(envelope).connect(ac.destination);
    source.start();
  }
  return {
    init: () => ensure(),
    ui: () => tone(520, .06, { type: 'triangle', gain: .028, endFreq: 680 }),
    order: () => tone(330, .1, { type: 'sine', gain: .03, endFreq: 470 }),
    deny: () => tone(190, .15, { type: 'square', gain: .026, endFreq: 120 }),
    alert: () => { tone(440, .12, { type: 'sawtooth', gain: .03, endFreq: 330 }); tone(440, .12, { type: 'sawtooth', gain: .03, endFreq: 330, delay: .18 }); },
    shot: (fromPlayer) => { const now = performance.now(); if (now - lastShotAt < 75) return; lastShotAt = now; tone(fromPlayer ? 780 : 540, .05, { type: 'square', gain: .011, endFreq: 360 }); },
    build: () => { tone(620, .1, { type: 'sine', gain: .038, endFreq: 640 }); tone(940, .13, { type: 'sine', gain: .032, endFreq: 960, delay: .09 }); },
    explode: () => noise(.36, .11),
    victory: () => [523, 659, 784, 1046].forEach((freq, index) => tone(freq, .24, { type: 'triangle', gain: .05, delay: index * .12 })),
    defeat: () => [392, 330, 262].forEach((freq, index) => tone(freq, .32, { type: 'sine', gain: .05, delay: index * .16 })),
    toggle() {
      muted = !muted;
      try { localStorage.setItem('frontline.muted', muted ? '1' : '0'); } catch (error) { /* private mode */ }
      if (!muted) tone(660, .08, { type: 'sine', gain: .03 });
      return muted;
    },
    get muted() { return muted; },
  };
})();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#90a69a');
scene.fog = new THREE.Fog('#90a69a', 82, 145);
const camera = new THREE.OrthographicCamera(-24, 24, 24, -24, 0.1, 260);
let cameraHeight = 44;
const cameraTarget = new THREE.Vector3(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.13;
viewport.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd8ece1, 0x37473b, 1.8));
const sun = new THREE.DirectionalLight(0xffe9c9, 2.3);
sun.position.set(-32, 58, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -56;
sun.shadow.camera.right = 56;
sun.shadow.camera.top = 56;
sun.shadow.camera.bottom = -56;
sun.shadow.bias = -0.0002;
scene.add(sun);
scene.add(sun.target);

let ground;
let gameStarted = false;
let paused = false;
let gameEnded = false;
let elapsed = 0;
let credits = 0;
let selectedFactionId = 'cn';
let enemyFactionId = 'us';
let selectedDifficulty = 'normal';
const difficulty = () => DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.normal;
let selectedEntity = null;
let activeTab = 'build';
let placementKind = null;
let placementGhost = null;
let abilityMode = null;
let abilityCooldown = 0;
let boostUntil = { fortify: 0, overdrive: 0, ironclad: 0, recon: 0 };
let enemyWaveTimer = 28;
let enemyCredits = 0;
let enemyThinkTimer = 0;
let enemyUnitGoal = null;
let enemyAirSpawned = { heli: 0, jet: 0 };
let enemyRecruitTimer = 0;
let enemyWaveNumber = 0;
let power = { supply: 0, usage: 0, factor: 1 };
let enemyPower = { supply: 0, usage: 0, factor: 1 };
let powerWarned = false;
let stats = { kills: 0, losses: 0, trained: 0, built: 0 };
let lastPlayerHitAt = -99;
let attackAlertAt = -99;
let helpWasPaused = false;
let toastTimer = 0;
let uiTimer = 0;
let techSignatureCache = '';
let passiveHealTimer = 0;
let repairFxTimer = 0;
const buildings = [];
const units = [];
const effects = [];
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let pointerState = null;
let lastFrame = performance.now();

const factionById = (id) => factions.find((faction) => faction.id === id) || factions[0];
const playerFaction = () => factionById(selectedFactionId);
const enemyFaction = () => factionById(enemyFactionId);
const playerBuildingCount = (kind) => buildings.filter((building) => building.owner === 'player' && (!kind || building.kind === kind)).length;
const playerUnitCount = () => units.filter((unit) => unit.owner === 'player').length;
const enemyUnitCount = () => units.filter((unit) => unit.owner === 'enemy').length;
const queuedCount = (owner) => buildings.filter((building) => building.owner === owner).reduce((total, building) => total + (building.queue?.length || 0), 0);
const queuedForKind = (owner, kind) => buildings.filter((building) => building.owner === owner).reduce((total, building) => total + (building.queue || []).filter((job) => job.kind === kind).length, 0);
const specialFor = (factionId) => factionById(factionId).special;
const findBuildingInfo = (kind, factionId = selectedFactionId) => BUILDING_INFO[kind] || (specialFor(factionId).kind === kind ? specialFor(factionId) : null);

function resize() {
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  const aspect = width / height;
  camera.left = -(cameraHeight * aspect) / 2;
  camera.right = (cameraHeight * aspect) / 2;
  camera.top = cameraHeight / 2;
  camera.bottom = -cameraHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  updateCamera();
}

function updateCamera() {
  const viewWidth = cameraHeight * viewport.clientWidth / Math.max(1, viewport.clientHeight);
  const minX = Math.min(0, -HALF_W + Math.min(viewWidth * .28, 12));
  const maxX = Math.max(0, HALF_W - Math.min(viewWidth * .28, 12));
  cameraTarget.x = THREE.MathUtils.clamp(cameraTarget.x, minX, maxX);
  cameraTarget.z = THREE.MathUtils.clamp(cameraTarget.z, -HALF_D + 8, HALF_D - 8);
  camera.position.set(cameraTarget.x, cameraHeight * 1.08, cameraTarget.z + cameraHeight * .82);
  camera.lookAt(cameraTarget.x, 0, cameraTarget.z);
}

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: options.roughness ?? .75, metalness: options.metalness ?? .05, transparent: options.transparent ?? false, opacity: options.opacity ?? 1, emissive: options.emissive ?? 0x000000, emissiveIntensity: options.emissiveIntensity ?? 0, flatShading: options.flatShading ?? false });
}

function addBox(parent, width, height, depth, x, y, z, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMaterial(color, options));
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, topRadius, bottomRadius, height, segments, x, y, z, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments), makeMaterial(color, options));
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, width, depth, x, y, z, color, opacity = 1) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), makeMaterial(color, { roughness: 1, transparent: opacity < 1, opacity, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildStaticWorld() {
  ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP_W, MAP_D), makeMaterial('#536f58', { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.08;
  ground.receiveShadow = true;
  ground.name = 'ground';
  scene.add(ground);

  const grid = new THREE.GridHelper(MAP_W, 38, 0x9bb6a0, 0x78957f);
  grid.position.y = -.04;
  grid.material.transparent = true;
  grid.material.opacity = .16;
  scene.add(grid);

  addPlane(scene, MAP_W - 2, 4, 0, -.035, 0, '#7f8065', .62);
  addPlane(scene, 3.4, MAP_D - 2, 0, -.03, 0, '#767b62', .40);
  addPlane(scene, 17, 1.2, -15, -.025, -9, '#9a916e', .42);
  addPlane(scene, 16, 1.2, 15, -.024, 9, '#9a916e', .42);

  const borderMaterial = new THREE.LineBasicMaterial({ color: 0xc1c7a4, transparent: true, opacity: .55 });
  const borderPoints = [
    new THREE.Vector3(-HALF_W, .03, -HALF_D), new THREE.Vector3(HALF_W, .03, -HALF_D),
    new THREE.Vector3(HALF_W, .03, HALF_D), new THREE.Vector3(-HALF_W, .03, HALF_D),
    new THREE.Vector3(-HALF_W, .03, -HALF_D),
  ];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(borderPoints), borderMaterial));

  const seed = 33;
  let randomState = seed;
  const random = () => { randomState = (randomState * 16807) % 2147483647; return (randomState - 1) / 2147483646; };
  for (let i = 0; i < 42; i++) {
    const x = (random() - .5) * (MAP_W - 9);
    const z = (random() - .5) * (MAP_D - 8);
    const nearPlayer = Math.hypot(x + 23, z + 16) < 10;
    const nearEnemy = Math.hypot(x - 23, z - 16) < 10;
    const nearRoad = Math.abs(z) < 3.5 || Math.abs(x) < 2.6;
    if (nearPlayer || nearEnemy || nearRoad) continue;
    if (i % 3 === 0) makeRock(x, z, .55 + random() * .65, random);
    else makeTree(x, z, .78 + random() * .45, random);
  }

  createOreField(-7, -1, random);
  createOreField(9, -10, random);
  createOreField(7, 17, random);
  createOreField(-12, 15, random);
  createLandmark(-1, 22);
  createLandmark(1, -23);
}

function makeTree(x, z, scale, random) {
  const group = new THREE.Group();
  const trunkColor = random() > .5 ? '#665c43' : '#71664a';
  const leafColor = random() > .5 ? '#315d43' : '#3e704b';
  addCylinder(group, .17 * scale, .23 * scale, 1.25 * scale, 7, 0, .62 * scale, 0, trunkColor);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(.95 * scale, 1.85 * scale, 7), makeMaterial(leafColor, { roughness: 1, flatShading: true }));
  crown.position.set(0, 1.65 * scale, 0);
  crown.castShadow = true;
  group.add(crown);
  const crown2 = new THREE.Mesh(new THREE.ConeGeometry(.69 * scale, 1.3 * scale, 7), makeMaterial(random() > .5 ? '#3d704c' : '#477a50', { roughness: 1, flatShading: true }));
  crown2.position.set(.08 * scale, 2.12 * scale, .02 * scale);
  crown2.castShadow = true;
  group.add(crown2);
  group.position.set(x, 0, z);
  scene.add(group);
}

function makeRock(x, z, scale, random) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), makeMaterial(random() > .5 ? '#777d68' : '#8b8a72', { roughness: 1, flatShading: true }));
  rock.position.set(x, scale * .43, z);
  rock.rotation.set(random() * .5, random() * 2, random() * .3);
  rock.scale.set(1.2, .7, .9);
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function createOreField(x, z, random) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.55, 36), new THREE.MeshBasicMaterial({ color: 0xd3c270, transparent: true, opacity: .33, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, .015, z);
  scene.add(ring);
  for (let i = 0; i < 6; i++) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.38 + random() * .35, 0), makeMaterial(i % 2 ? '#9eb582' : '#c0bd7a', { roughness: .5, metalness: .08, flatShading: true, emissive: 0x262510, emissiveIntensity: .14 }));
    crystal.position.set(x + (random() - .5) * 3.1, .35 + random() * .35, z + (random() - .5) * 2.6);
    crystal.rotation.set(random() * .4, random() * 2, random() * .4);
    crystal.castShadow = true;
    scene.add(crystal);
  }
}

function createLandmark(x, z) {
  const marker = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, .16, 24), makeMaterial('#526750'));
  pad.position.y = .04;
  marker.add(pad);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 2.6, 8), makeMaterial('#777e68'));
  mast.position.y = 1.35;
  marker.add(mast);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.43, 0), new THREE.MeshStandardMaterial({ color: '#d4bd67', emissive: '#827039', emissiveIntensity: .5, flatShading: true }));
  beacon.position.y = 2.72;
  marker.add(beacon);
  marker.position.set(x, 0, z);
  marker.traverse((child) => { if (child.isMesh) child.castShadow = true; });
  scene.add(marker);
}

function getEntityColor(owner, factionId) {
  return owner === 'player' ? factionById(factionId).color : factionById(factionId).color;
}

function createBuildingVisual(kind, color, factionId) {
  const group = new THREE.Group();
  const dark = new THREE.Color(color).multiplyScalar(.53);
  const mid = new THREE.Color(color).multiplyScalar(.76);
  const padSize = kind === 'armor' || kind === 'airfield' || kind === 'airbase' || kind === 'hq' ? 5.6 : 4.9;
  addBox(group, padSize, .28, padSize, 0, .14, 0, '#27362f');
  addBox(group, padSize - .4, .07, .18, 0, .31, -padSize / 2 + .2, color, { roughness: .6 });

  if (kind === 'hq') {
    addBox(group, 2.8, 1.8, 2.7, 0, 1.17, 0, dark);
    addBox(group, 3.55, .22, 3.35, 0, 2.12, 0, mid);
    addBox(group, 1.0, 2.45, 1.35, -1.65, 1.37, -.55, '#45534a');
    addBox(group, 1.0, 2.45, 1.35, 1.65, 1.37, -.55, '#45534a');
    addBox(group, .22, 1.2, .22, .15, 2.73, -.35, '#c4c6a7');
    addCylinder(group, .06, .06, .68, 8, .15, 3.66, -.35, color);
    addBox(group, 1.15, .5, .12, 0, .76, 1.39, color);
  } else if (kind === 'generator') {
    addBox(group, 3.1, 1.25, 2.7, 0, .88, 0, dark);
    for (const x of [-1.2, 0, 1.2]) {
      addCylinder(group, .49, .55, 1.7, 12, x, 1.23, -.1, '#7e8b78', { metalness: .25 });
      addCylinder(group, .54, .56, .12, 12, x, 2.11, -.1, color, { metalness: .3 });
      addCylinder(group, .08, .08, .35, 8, x + .32, 2.3, -.1, '#bcc0a6');
    }
    addBox(group, 3.4, .15, .3, 0, .68, 1.28, color);
  } else if (kind === 'barracks') {
    addBox(group, 3.85, 1.58, 3.05, 0, 1.02, -.1, dark);
    addBox(group, 4.15, .25, 3.35, 0, 1.95, -.08, mid);
    addBox(group, 1.15, .95, .2, 0, .77, 1.53, '#252f2c');
    addBox(group, .18, 1.35, .15, -1.55, .96, 1.55, color);
    addBox(group, .18, 1.35, .15, 1.55, .96, 1.55, color);
  } else if (kind === 'armor' || kind === 'airfield' || kind === 'airbase') {
    addBox(group, 4.55, 1.8, 3.55, 0, 1.11, 0, dark);
    addBox(group, 4.9, .27, 3.9, 0, 2.12, -.02, mid);
    addBox(group, 2.2, 1.35, .18, 0, .95, 1.84, '#252f2c');
    addBox(group, 2.4, .14, .2, 0, 1.68, 1.88, color);
    if (kind === 'airfield' || kind === 'airbase') {
      addBox(group, 5.1, .06, 1.15, 0, .34, 2.1, '#454d42');
      for (let i = -2; i <= 2; i++) addBox(group, .48, .035, .1, i * .85, .38, 2.1, '#d7d0aa');
      addCylinder(group, .48, .58, 1.1, 12, 1.65, 2.0, -.75, '#7b8171');
    } else {
      addCylinder(group, .34, .4, 1.5, 10, -1.65, 2.28, -.95, '#777f70');
      addCylinder(group, .43, .46, .15, 10, -1.65, 3.08, -.95, color);
      addBox(group, 1.9, .65, .35, .4, .55, 1.9, '#8b937f');
      for (const side of [-.7, 0, .7]) addCylinder(group, .18, .18, .5, 8, side, .55, 1.9, '#2f3a32');
    }
  } else if (kind === 'turret' || kind === 'bastion') {
    addCylinder(group, 1.9, 2.0, .34, 18, 0, .46, 0, '#47564a');
    addCylinder(group, 1.1, 1.25, .62, 14, 0, .88, 0, dark);
    addCylinder(group, .72, .92, 1.08, 12, 0, 1.66, 0, mid);
    addBox(group, .44, .45, 2.05, 0, 2.06, 1.05, '#555f52');
    addBox(group, .5, .12, .45, 0, 2.32, .12, color);
    for (const side of [-1, 1]) addBox(group, .23, .38, .25, side * 1.12, .72, -.1, color);
  } else if (kind === 'refinery') {
    addBox(group, 3.7, 1.42, 2.8, 0, .93, 0, dark);
    addBox(group, 4.0, .22, 3.05, 0, 1.77, 0, mid);
    addCylinder(group, .63, .7, 1.8, 12, -1.1, 1.3, -.2, '#778276', { metalness: .2 });
    addCylinder(group, .48, .55, 1.3, 12, 1.2, 1.06, -.55, '#7b8272', { metalness: .2 });
    addCylinder(group, .1, .12, 1.5, 8, 1.65, 1.58, .9, color);
    addBox(group, 3.7, .12, .25, 0, .65, 1.4, color);
  } else if (kind === 'sam') {
    addBox(group, 3.2, .7, 2.9, 0, .55, 0, dark);
    addBox(group, 2.0, .9, 1.7, -1.04, 1.28, .2, mid);
    addBox(group, .8, .5, .1, -1.04, 1.5, 1.06, '#9fd8d0', { emissive: 0x1e3b38, emissiveIntensity: .3 });
    addCylinder(group, .08, .1, 2.1, 8, 1.2, 1.9, -.4, '#b6b79e');
    const samRadar = new THREE.Mesh(new THREE.SphereGeometry(.72, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), makeMaterial(color, { metalness: .2, roughness: .45, side: THREE.DoubleSide }));
    samRadar.position.set(1.2, 2.95, -.4);
    samRadar.rotation.x = Math.PI * .82;
    samRadar.scale.set(1, .55, 1);
    group.add(samRadar);
    const launcher = new THREE.Group();
    launcher.position.set(.55, 1.1, .2);
    launcher.rotation.x = -.42;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j += 2) {
        addCylinder(launcher, .16, .16, 1.9, 8, i * .36, j * .19, .6, '#7d8577');
        addCylinder(launcher, .17, .17, .12, 8, i * .36, j * .19, 1.56, color);
      }
    }
    group.add(launcher);
    addBox(group, .18, 1.0, .18, 1.85, .8, 1.0, color);
  } else if (kind === 'logistics') {
    addBox(group, 4.4, .3, 3.9, 0, .17, 0, '#2a383b');
    addBox(group, 3.6, 1.7, 2.3, -.4, 1.05, -.6, dark);
    addBox(group, 3.9, .18, 2.6, -.4, 1.98, -.6, mid);
    for (let i = 0; i < 5; i++) addBox(group, .7, .12, .1, -1.9 + i * .75, .95, .57, color);
    addBox(group, 1.7, .35, .9, 1.45, .55, 1.15, '#57665f');
    addBox(group, 1.5, .3, .8, 1.45, .9, 1.15, color);
    addCylinder(group, .1, .13, 2.4, 8, 1.75, 1.6, -1.45, '#b6b79e');
    addBox(group, 1.6, .12, .16, 1.0, 2.75, -1.45, color);
    addBox(group, .4, .5, .4, 1.75, 3.0, -1.45, '#5d6a5f');
    for (const [ox, oz] of [[-.9, 1.5], [.5, 1.6]]) {
      addBox(group, .55, .45, .5, ox, .4, oz, '#b58e5e');
      addBox(group, .55, .12, .5, ox, .62, oz, '#8c7a55');
    }
  } else if (kind === 'radar' || kind === 'sensor' || kind === 'droneport') {
    addBox(group, 3.4, .85, 3.0, 0, .72, 0, dark);
    addBox(group, 3.8, .18, 3.2, 0, 1.22, 0, mid);
    addCylinder(group, .11, .16, 2.35, 9, 0, 2.44, 0, '#b6b79e');
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), makeMaterial(color, { metalness: .15, roughness: .45, side: THREE.DoubleSide }));
    dish.position.set(0, 3.52, 0);
    dish.rotation.x = Math.PI;
    dish.scale.set(1, .65, 1);
    group.add(dish);
    addCylinder(group, .08, .08, .45, 8, 0, 3.07, 0, '#d7dbc0');
    if (kind === 'droneport') addBox(group, .28, .13, 2.0, 1.8, .44, 0, color);
  } else if (kind === 'solar') {
    addBox(group, 4.0, .25, 3.7, 0, .3, 0, '#354239');
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const panel = addBox(group, 1.1, .11, .86, col * 1.25, .86 + Math.abs(row) * .12, row * 1.13, '#3d6771', { metalness: .35, roughness: .35 });
        panel.rotation.x = -.18;
        addBox(group, 1.14, .035, .07, col * 1.25, 1.0 + Math.abs(row) * .12, row * 1.13, color);
      }
    }
  } else if (kind === 'hospital') {
    addBox(group, 3.5, 1.7, 3.1, 0, 1.0, 0, '#566e69');
    addBox(group, 3.9, .22, 3.4, 0, 1.98, 0, mid);
    addBox(group, .42, .8, .18, 0, 1.38, 1.62, '#e6dfc2');
    addBox(group, 1.0, .28, .18, 0, 1.38, 1.62, color);
    addBox(group, .25, .78, .18, 0, 1.38, 1.62, color);
    addBox(group, .8, .5, .12, 0, .62, -1.55, color);
  } else if (kind === 'arsenal' || kind === 'armory') {
    addBox(group, 4.25, 1.9, 3.4, 0, 1.1, 0, dark);
    addBox(group, 4.55, .25, 3.7, 0, 2.17, 0, mid);
    addCylinder(group, .42, .48, 1.55, 10, -1.45, 2.07, -.7, '#798375');
    addCylinder(group, .42, .48, 1.55, 10, 1.45, 2.07, -.7, '#798375');
    addBox(group, 2.5, .18, .2, 0, 1.75, 1.78, color);
    addBox(group, .5, .75, .18, 0, .8, 1.8, '#242d29');
  } else {
    addBox(group, 3.7, 1.7, 3.2, 0, 1.05, 0, dark);
    addBox(group, 4.0, .22, 3.5, 0, 2.0, 0, mid);
    addBox(group, 3.0, .15, .2, 0, .6, 1.65, color);
  }

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.035, .055, .72, 6), makeMaterial('#c4c3a8'));
  antenna.position.set(padSize * .33, kind === 'hq' ? 3.2 : 2.72, -padSize * .32);
  group.add(antenna);
  return group;
}

function createUnitVisual(kind, color, factionId = 'us') {
  const group = new THREE.Group();
  const dark = new THREE.Color(color).multiplyScalar(.58);
  const steel = '#7c8578';
  const metal = '#4b554e';
  const wheel = (x, y, z, radius, width = .2) => {
    const mesh = addCylinder(group, radius, radius, width, 10, x, y, z, '#232b26');
    mesh.rotation.z = Math.PI / 2;
    return mesh;
  };
  if (kind === 'engineer') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.34, .43, .9, 8), makeMaterial(dark));
    body.position.y = .62;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.27, 10, 8), makeMaterial('#c1ae82'));
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);
    addBox(group, .65, .3, .3, 0, .65, -.37, color);
    addBox(group, .11, .9, .1, .48, .65, .1, '#c6b879');
  } else if (kind === 'atgm') {
    const crew = [[-.34, .3], [.3, -.32]];
    for (const [ox, oz] of crew) {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.28, .36, .85, 8), makeMaterial(dark));
      body.position.set(ox, .58, oz);
      body.castShadow = true;
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 10, 8), makeMaterial('#b8a67b'));
      head.position.set(ox, 1.16, oz);
      head.castShadow = true;
      group.add(head);
      addBox(group, .5, .24, .28, ox, .6, oz - .28, color);
    }
    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(.05, .09, .72, 6), makeMaterial(metal));
    tripod.position.set(.05, .42, .25);
    group.add(tripod);
    const tube = addCylinder(group, .15, .15, 1.75, 8, .05, .9, .45, steel);
    tube.rotation.x = -.32;
    const tip = addCylinder(group, .1, .15, .22, 8, .05, 1.2, 1.26, color);
    tip.rotation.x = -.32;
    addBox(group, .3, .22, .55, .05, .78, -.05, metal);
  } else if (kind === 'heli') {
    addBox(group, 1.0, .62, 1.9, 0, .05, .15, dark);
    const nose = addBox(group, .82, .5, .6, 0, .02, 1.3, color);
    nose.rotation.x = .18;
    addBox(group, .3, .24, 1.7, 0, .2, -1.55, dark);
    addBox(group, .7, .08, .1, 0, .38, -2.35, color).rotation.z = 0;
    const tailRotor = new THREE.Group();
    tailRotor.position.set(.18, .62, -2.3);
    addBox(tailRotor, .06, .85, .12, 0, 0, 0, '#cfd3b5');
    addBox(tailRotor, .06, .12, .85, 0, 0, 0, '#cfd3b5');
    group.add(tailRotor);
    group.userData.tailRotor = tailRotor;
    const cockpit = addBox(group, .62, .34, .62, 0, .3, .95, '#9fd8d0', { emissive: 0x1e3b38, emissiveIntensity: .25 });
    cockpit.rotation.x = .12;
    const rotor = new THREE.Group();
    rotor.position.set(0, .55, .1);
    addCylinder(rotor, .11, .14, .3, 8, 0, .1, 0, metal);
    for (let i = 0; i < 2; i++) {
      const blade = addBox(rotor, 3.0, .03, .17, 0, .24, 0, '#c9cdb0');
      blade.rotation.y = (i * Math.PI) / 2;
    }
    group.add(rotor);
    group.userData.rotor = rotor;
    for (const side of [-1, 1]) {
      addBox(group, .55, .1, .34, side * .74, .02, .1, color);
      addCylinder(group, .11, .11, .62, 8, side * .98, -.08, .1, metal).rotation.x = Math.PI / 2;
      addBox(group, .07, .07, 1.4, side * .55, -.55, .15, metal);
      addBox(group, .07, .45, .07, side * .55, -.32, .72, metal);
      addBox(group, .07, .45, .07, side * .55, -.32, -.42, metal);
    }
  } else if (kind === 'jet') {
    addBox(group, .72, .44, 3.0, 0, .1, 0, color);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.36, .95, 10), makeMaterial(color));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, .1, 1.9);
    group.add(nose);
    const canopy = addBox(group, .42, .26, .95, 0, .38, .72, '#a8e3dc', { emissive: 0x1e3b38, emissiveIntensity: .3 });
    canopy.rotation.x = -.08;
    addBox(group, 2.6, .07, .9, 0, -.02, -.35, dark);
    for (const side of [-1, 1]) {
      addBox(group, 1.1, .06, .55, side * 1.62, -.02, -.6, color);
      addBox(group, .42, .05, .42, side * 1.1, .04, -.25, color);
      addBox(group, .12, .55, .8, side * .34, .38, -1.15, dark);
      addBox(group, .3, .3, .55, side * .58, -.06, -.35, metal);
    }
    addBox(group, .62, .38, .35, 0, .1, -1.62, metal);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.3, .9, 8), new THREE.MeshBasicMaterial({ color: 0xffb35e, transparent: true, opacity: .75 }));
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(0, .1, -2.2);
    group.add(flame);
  } else if (kind === 'mlrs') {
    addBox(group, 1.35, .4, 2.9, 0, .62, 0, dark);
    addBox(group, 1.3, .78, .85, 0, .98, 1.0, color);
    const glass = addBox(group, 1.05, .3, .08, 0, 1.12, 1.44, '#9fd8d0', { emissive: 0x1e3b38, emissiveIntensity: .25 });
    glass.rotation.x = 0;
    addBox(group, 1.45, .18, 1.75, 0, .8, -.7, metal);
    const pod = new THREE.Group();
    pod.position.set(0, 1.3, -.6);
    pod.rotation.x = -.46;
    addBox(pod, 1.2, .62, 1.45, 0, 0, 0, steel);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j += 2) {
        addCylinder(pod, .11, .11, 1.5, 7, i * .34, j * .17, .12, '#2b332e');
      }
    }
    group.add(pod);
    for (const side of [-1, 1]) {
      for (const z of [1.0, -.35, -1.0]) wheel(side * .74, .29, z, .27);
    }
    addBox(group, .1, .1, .55, 0, 1.6, -1.55, color);
  } else if (kind === 'ifv') {
    addBox(group, 1.62, .52, 2.55, 0, .64, 0, dark);
    addBox(group, 1.45, .42, 1.3, 0, .96, .6, color);
    const turret = addBox(group, .85, .4, .9, 0, 1.2, -.2, steel);
    turret.rotation.x = 0;
    addBox(group, .13, .13, 1.15, 0, 1.3, .49, '#c3c8a4');
    addBox(group, .34, .28, .52, .45, 1.36, -.25, metal);
    addCylinder(group, .09, .09, .55, 7, .45, 1.42, .02, '#2b332e').rotation.x = -.15;
    for (const side of [-1, 1]) {
      for (const z of [.9, -.75]) wheel(side * .82, .31, z, .29, .24);
    }
    addBox(group, 1.3, .18, .5, 0, 1.02, -1.15, metal);
  } else if (kind === 'tank') {
    const eastern = ['ru', 'cn', 'ir'].includes(factionId);
    addBox(group, 1.9, .42, 2.55, 0, .55, 0, dark);
    for (const side of [-1, 1]) {
      addBox(group, .34, .46, 2.4, side * .98, .44, 0, '#2b322d');
      for (const z of [-.85, -.3, .3, .85]) wheel(side * .98, .27, z, .25, .22);
      addBox(group, .12, .16, 2.2, side * 1.16, .66, 0, color);
    }
    if (eastern) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(.62, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), makeMaterial(color));
      dome.position.set(0, .98, -.15);
      dome.scale.set(1.1, .62, 1.25);
      group.add(dome);
      addCylinder(group, .34, .4, .22, 10, 0, .99, -.18, steel);
      addBox(group, .17, .17, 1.75, 0, 1.03, .75, '#c6ccb0');
      addCylinder(group, .1, .1, .34, 8, 0, 1.12, 1.57, metal).rotation.x = Math.PI / 2;
      addBox(group, .55, .16, .75, .62, 1.16, -.32, steel);
      for (const side of [-1, 1]) {
        for (const z of [-.6, 0, .6]) addBox(group, .34, .12, .2, side * .78, .83, z, '#4e5a4a');
      }
    } else {
      addBox(group, 1.25, .42, 1.55, 0, 1.04, -.12, color);
      const front = addBox(group, 1.05, .3, .5, 0, .99, .68, color);
      front.rotation.x = .35;
      addBox(group, .18, .18, 1.8, 0, 1.16, .95, '#c6ccb0');
      addCylinder(group, .1, .1, .38, 8, 0, 1.24, 1.78, metal).rotation.x = Math.PI / 2;
      addCylinder(group, .27, .31, .22, 10, .38, 1.34, .35, steel);
      addBox(group, .32, .12, .34, .38, 1.46, .35, '#c3c8a4');
      addBox(group, .18, .1, .38, .38, 1.5, .35, '#2d3a34');
      addBox(group, .7, .2, .7, -.3, 1.3, -.6, metal);
      for (const side of [-1, 1]) addBox(group, .2, .22, .3, side * .78, 1.2, -.75, '#b7bea0');
    }
  } else if (kind === 'artillery') {
    addBox(group, 1.35, .42, 2.0, 0, .54, 0, dark);
    addBox(group, .85, .3, .85, 0, .88, -.35, color);
    const barrel = addBox(group, .28, .28, 2.35, 0, 1.08, .82, '#656e61');
    barrel.rotation.x = -.08;
    for (const side of [-1, 1]) {
      for (const z of [-.65, 0, .65]) {
        const mesh = addCylinder(group, .25, .25, .18, 10, side * .72, .37, z, '#2b322d');
        mesh.rotation.z = Math.PI / 2;
      }
    }
  } else {
    // scout: Humvee-style light vehicle with a pintle-mounted machine gun
    addBox(group, 1.5, .48, 2.2, 0, .66, 0, color);
    addBox(group, 1.32, .34, .9, 0, 1.02, -.28, dark);
    const windshield = addBox(group, 1.18, .28, .08, 0, 1.12, .22, '#9fd8d0', { emissive: 0x1e3b38, emissiveIntensity: .25 });
    windshield.rotation.x = -.22;
    addBox(group, 1.5, .12, .55, 0, .48, 1.05, metal);
    addBox(group, 1.42, .1, .28, 0, .5, -1.12, metal);
    addBox(group, .5, .12, .4, .42, 1.26, -.5, metal);
    addBox(group, .08, .34, .08, .42, 1.45, -.5, '#2b332e');
    addBox(group, .1, .1, .62, .42, 1.58, -.2, '#2b332e');
    for (const side of [-1, 1]) {
      for (const z of [.72, -.75]) {
        const mesh = addCylinder(group, .3, .3, .24, 12, side * .78, .31, z, '#202722');
        mesh.rotation.z = Math.PI / 2;
        addBox(group, .12, .24, .24, side * .82, .66, z, dark);
      }
    }
    addBox(group, .7, .18, .2, 0, .92, 1.05, '#c5c9a6');
  }
  return group;
}

function addEntityDecor(entity, radius, height) {
  // Permanent team marker: teal for the player, red for the enemy, independent of faction colour.
  const teamRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.03, radius * 1.13, 36),
    new THREE.MeshBasicMaterial({ color: entity.owner === 'player' ? 0x8ff0d0 : 0xff7f74, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false }),
  );
  teamRing.rotation.x = -Math.PI / 2;
  teamRing.position.y = .045;
  entity.teamRing = teamRing;
  entity.group.add(teamRing);

  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * .88, radius, 32), new THREE.MeshBasicMaterial({ color: getEntityColor(entity.owner, entity.factionId), transparent: true, opacity: .92, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .075;
  ring.visible = false;
  entity.group.add(ring);
  entity.selectionRing = ring;

  const barWidth = entity.entityType === 'building' ? 3.15 : 1.55;
  const barY = height + .52;
  const barGroup = new THREE.Group();
  barGroup.position.set(0, barY, 0);
  entity.group.add(barGroup);
  const back = new THREE.Mesh(new THREE.BoxGeometry(barWidth, .13, .09), new THREE.MeshBasicMaterial({ color: 0x17201c, transparent: true, opacity: .9 }));
  back.position.set(0, 0, 0);
  barGroup.add(back);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(barWidth - .06, .085, .13), new THREE.MeshBasicMaterial({ color: 0x6ee0ad }));
  fill.position.set(0, .01, .015);
  barGroup.add(fill);
  entity.healthBar = { fill, width: barWidth - .06, group: barGroup };

  if (entity.entityType === 'building') {
    const progressGroup = new THREE.Group();
    progressGroup.position.set(0, height + .92, 0);
    progressGroup.visible = false;
    entity.group.add(progressGroup);
    const progressBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, .1, .08), new THREE.MeshBasicMaterial({ color: 0x17201c, transparent: true, opacity: .85 }));
    progressGroup.add(progressBack);
    const progressFill = new THREE.Mesh(new THREE.BoxGeometry(2.28, .06, .1), new THREE.MeshBasicMaterial({ color: 0xf2c66e }));
    progressFill.position.set(0, .01, .02);
    progressGroup.add(progressFill);
    entity.productionBar = { group: progressGroup, fill: progressFill, width: 2.28 };
  }
}

function updateHealthBar(entity) {
  if (!entity.healthBar) return;
  const ratio = THREE.MathUtils.clamp(entity.hp / entity.maxHp, 0, 1);
  entity.healthBar.fill.scale.x = Math.max(.015, ratio);
  entity.healthBar.fill.position.x = -(entity.healthBar.width * (1 - ratio)) / 2;
  const color = ratio > .55 ? '#65dba9' : ratio > .25 ? '#e6c567' : '#f0786e';
  entity.healthBar.fill.material.color.set(color);
}

function createBuilding(kind, owner, x, z, factionId = owner === 'player' ? selectedFactionId : enemyFactionId) {
  const info = findBuildingInfo(kind, factionId) || BUILDING_INFO.hq;
  const faction = factionById(factionId);
  const color = faction.color;
  const hpMult = owner === 'player' ? (faction.hpMult || 1) : difficulty().hp * (faction.hpMult || 1);
  const group = createBuildingVisual(kind, color, factionId);
  const customName = kind === 'sam' ? faction.vehicles?.sam : null;
  const entity = {
    entityType: 'building', kind, owner, factionId, name: customName || info.name || 'ساختمان', icon: info.icon || '▥',
    x, z, hp: (info.hp || 800) * hpMult, maxHp: (info.hp || 800) * hpMult,
    powerUse: info.powerUse || 0, powerOutput: info.powerOutput || 0, income: info.income || 0,
    attackRange: info.range || (kind === 'hq' ? 11.5 : 0), scanRange: info.range || (kind === 'hq' ? 12 : 0),
    damage: info.damage || (kind === 'hq' ? 18 : 0), cooldown: info.cooldown || (kind === 'hq' ? 1.2 : 0),
    lastShot: 0, attackTarget: null, destroyed: false, group, queue: [],
    armor: info.armor || 15, penetration: 100, canHitAir: !!info.canHitAir, antiAirOnly: !!info.antiAirOnly,
    splash: info.splash || 0, missile: !!info.missile, air: false, altitude: 0,
  };
  group.position.set(x, 0, z);
  group.userData.entity = entity;
  addEntityDecor(entity, kind === 'hq' ? 3.3 : 2.65, kind === 'hq' ? 4 : kind === 'turret' || kind === 'bastion' ? 3.2 : 2.7);
  scene.add(group);
  buildings.push(entity);
  updateHealthBar(entity);
  return entity;
}

function createUnit(kind, owner, x, z, factionId = owner === 'player' ? selectedFactionId : enemyFactionId) {
  const info = UNIT_INFO[kind] || UNIT_INFO.scout;
  const faction = factionById(factionId);
  const hpMult = owner === 'player' ? (faction.hpMult || 1) : difficulty().hp * (faction.hpMult || 1);
  const group = createUnitVisual(kind, faction.color, factionId);
  const tankStats = kind === 'tank' ? (faction.tank || {}) : {};
  const hp = (tankStats.hp || info.hp) * hpMult;
  const entity = {
    entityType: 'unit', kind, owner, factionId, name: faction.vehicles?.[kind] || info.name, icon: info.icon,
    x, z, hp, maxHp: hp,
    speed: (tankStats.speed || info.speed) * (faction.speedMult || 1),
    attackRange: info.range * (faction.rangeMult || 1),
    scanRange: info.scan * (faction.rangeMult || 1), damage: info.damage,
    cooldown: info.cooldown, lastShot: 0, attackTarget: null, moveTarget: null, destroyed: false, group,
    holdPosition: false, repairRate: info.repair || 0,
    armor: tankStats.armor || info.armor || 0, penetration: tankStats.pen || info.penetration || 0,
    canHitAir: !!info.canHitAir, antiAirOnly: false, splash: info.splash || 0, missile: !!info.missile,
    air: !!info.air, altitude: info.air ? info.altitude : 0, baseAltitude: info.air ? info.altitude : 0,
    rotor: group.userData.rotor || null, tailRotor: group.userData.tailRotor || null,
    bobSeed: Math.random() * Math.PI * 2,
  };
  if (owner === 'enemy' && entity.air && enemyAirSpawned[entity.kind] !== undefined) enemyAirSpawned[entity.kind] += 1;
  group.position.set(x, entity.altitude, z);
  group.userData.entity = entity;
  addEntityDecor(entity, kind === 'tank' || kind === 'artillery' || kind === 'mlrs' ? 1.65 : info.air ? 1.5 : .98, info.air ? 2.4 : 1.8);
  if (info.air) {
    entity.selectionRing.visible = false;
    entity.teamRing.visible = false;
  }
  scene.add(group);
  units.push(entity);
  updateHealthBar(entity);
  return entity;
}

function disposeObject(root) {
  root.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    materials.forEach((material) => {
      material.map?.dispose();
      material.dispose();
    });
  });
}

function clearEntities() {
  for (const entity of [...buildings, ...units]) {
    scene.remove(entity.group);
    disposeObject(entity.group);
  }
  buildings.length = 0;
  units.length = 0;
  effects.forEach((effect) => { scene.remove(effect.object); disposeObject(effect.object); });
  effects.length = 0;
  selectedEntity = null;
  if (placementGhost) {
    scene.remove(placementGhost);
    placementGhost = null;
  }
}

function renderFactionGrid() {
  const grid = $('#factionGrid');
  grid.innerHTML = factions.map((faction) => `
    <button class="faction-option ${faction.id === selectedFactionId ? 'selected' : ''}" data-faction="${faction.id}" style="--faction-color:${faction.color}" type="button">
      <span class="faction-option-top"><span class="faction-emblem">${faction.code}</span><span class="faction-check">✦</span></span>
      <span><strong>${faction.name}</strong><small>${faction.trait}</small></span>
    </button>`).join('');
  grid.querySelectorAll('.faction-option').forEach((button) => {
    button.addEventListener('click', () => {
      selectedFactionId = button.dataset.faction;
      grid.querySelectorAll('.faction-option').forEach((card) => card.classList.toggle('selected', card.dataset.faction === selectedFactionId));
    });
  });
}

function unitLabel(kind, factionId = selectedFactionId) {
  return factionById(factionId).vehicles?.[kind] || UNIT_INFO[kind]?.name || 'نیرو';
}

function buildingLabel(kind, factionId = selectedFactionId) {
  if (kind === 'sam') return factionById(factionId).vehicles?.sam || BUILDING_INFO.sam.name;
  return findBuildingInfo(kind, factionId)?.name || BUILDING_INFO.hq.name;
}

function getBuildingCost(kind) {
  const info = findBuildingInfo(kind) || BUILDING_INFO.generator;
  return Math.ceil(info.cost * (playerFaction().costMult || 1));
}

function getUnitCost(kind) {
  const info = UNIT_INFO[kind];
  return Math.ceil(info.cost * (playerFaction().unitCostMult || playerFaction().costMult || 1));
}

function buildingRequirement(kind) {
  const info = findBuildingInfo(kind);
  if (!info) return '';
  if (kind === 'hq') return '';
  return info.requires || 'hq';
}

function canBuildTech(kind) {
  if (!gameStarted) return false;
  if (kind === 'hq') return playerBuildingCount('hq') === 0;
  const requirement = buildingRequirement(kind);
  return !requirement || playerBuildingCount(requirement) > 0;
}

function buildOrderStep() {
  if (playerBuildingCount('hq') === 0) return 'مرکز فرماندهی';
  if (playerBuildingCount('generator') === 0) return 'نیروگاه';
  if (playerBuildingCount('refinery') === 0) return 'پالایشگاه';
  if (playerBuildingCount('barracks') === 0) return 'پادگان';
  if (playerBuildingCount('turret') === 0) return 'برجک دفاعی';
  if (playerBuildingCount('sam') === 0) return playerFaction().vehicles?.sam || 'پدافند هوایی';
  if (playerBuildingCount('logistics') === 0) return 'پایانهٔ کشتیرانی';
  if (playerBuildingCount('armor') === 0) return 'کارخانهٔ زرهی';
  if (playerBuildingCount('airfield') === 0) return 'فرودگاه';
  return '';
}

function renderToolbar() {
  const list = $('#buildList');
  const previousScroll = list.scrollLeft;
  const options = activeTab === 'build'
    ? [...BUILDINGS, playerFaction().special]
    : UNITS;
  list.innerHTML = options.map((item) => {
    const isBuilding = activeTab === 'build';
    const price = isBuilding ? getBuildingCost(item.kind) : getUnitCost(item.kind);
    const requirementKind = isBuilding ? buildingRequirement(item.kind) : item.requires;
    const requirementName = isBuilding
      ? (requirementKind ? (BUILDING_INFO[requirementKind]?.name || '') : '')
      : item.requiresName;
    const duplicateHq = isBuilding && item.kind === 'hq' && playerBuildingCount('hq') > 0;
    const requirement = (requirementKind && playerBuildingCount(requirementKind) === 0) || duplicateHq ? (duplicateHq ? 'موجود است' : requirementName) : '';
    const extra = item.description || (isBuilding ? '' : 'آمادهٔ تولید');
    const startHint = isBuilding && item.kind === 'hq' && playerBuildingCount('hq') === 0;
    const displayName = isBuilding ? buildingLabel(item.kind) : unitLabel(item.kind);
    return `<button type="button" class="build-card ${isBuilding ? '' : 'train-card'} ${startHint ? 'tech-start' : ''}" data-kind="${item.kind}" data-building="${isBuilding}" ${requirement ? 'disabled' : ''} title="${extra}">
      <span class="build-icon" style="color:${isBuilding ? playerFaction().color : '#9de4cc'}">${item.icon}</span>
      <span class="build-copy"><strong>${displayName}</strong><small class="cost">◆ ${fmt(price)}</small>${requirement ? `<small class="requires">نیاز: ${requirement}</small>` : ''}<small class="queue-count"></small></span>
    </button>`;
  }).join('');

  list.scrollLeft = previousScroll;
  list.querySelectorAll('.build-card').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled || !gameStarted || paused || gameEnded) return;
      const kind = button.dataset.kind;
      if (button.dataset.building === 'true') startPlacement(kind);
      else trainUnit(kind);
    });
  });
  updateToolbarAvailability();
}

function updateToolbarAvailability() {
  document.querySelectorAll('.build-card').forEach((button) => {
    const isBuilding = button.dataset.building === 'true';
    const kind = button.dataset.kind;
    const cost = isBuilding ? getBuildingCost(kind) : getUnitCost(kind);
    let missingRequirement = false;
    if (isBuilding) missingRequirement = !canBuildTech(kind);
    else missingRequirement = playerBuildingCount(UNIT_INFO[kind].requires) === 0;
    button.disabled = !gameStarted || paused || gameEnded || credits < cost || missingRequirement || (!isBuilding && playerUnitCount() >= UNIT_LIMIT);
    if (isBuilding && kind === 'hq') button.classList.toggle('tech-start', playerBuildingCount('hq') === 0);
    button.classList.toggle('active', isBuilding && placementKind === kind);
    const costNode = button.querySelector('.cost');
    if (costNode) costNode.textContent = `◆ ${fmt(cost)}`;
    if (!isBuilding) {
      const queued = queuedForKind('player', kind);
      const queueNode = button.querySelector('.queue-count');
      if (queueNode) queueNode.textContent = queued ? `در صف ${faDigits(queued)}` : '';
      button.classList.toggle('producing', queued > 0);
    }
  });
}

function setToolbarTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.toolbar-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
  $('#toolbarHint').textContent = tab === 'build' ? 'گزینه‌ای را انتخاب کنید، سپس محل ساخت را روی زمین بزنید' : 'نیروها با زمان ساخته می‌شوند و در صف تولید می‌نشینند';
  renderToolbar();
  updateToolbarHint();
}

document.querySelectorAll('.toolbar-tab').forEach((button) => button.addEventListener('click', () => setToolbarTab(button.dataset.tab)));

function startGame(factionId = selectedFactionId) {
  selectedFactionId = factionId;
  const choices = factions.filter((faction) => faction.id !== selectedFactionId);
  enemyFactionId = choices[Math.floor(Math.random() * choices.length)].id;
  clearEntities();
  gameStarted = true;
  paused = false;
  gameEnded = false;
  elapsed = 0;
  credits = 6000;
  abilityCooldown = 0;
  boostUntil = { fortify: 0, overdrive: 0, ironclad: 0, recon: 0 };
  enemyWaveTimer = Math.round(difficulty().wave) + 25;
  enemyRecruitTimer = 4;
  enemyCredits = 6000;
  enemyThinkTimer = 2;
  enemyUnitGoal = null;
  enemyAirSpawned = { heli: 0, jet: 0 };
  enemyWaveNumber = 0;
  powerWarned = false;
  passiveHealTimer = 0;
  repairFxTimer = 0;
  stats = { kills: 0, losses: 0, trained: 0, built: 0 };
  lastPlayerHitAt = -99;
  attackAlertAt = -99;
  power = computePower('player');
  enemyPower = computePower('enemy');
  sound.init();
  updateSoundButton();
  placementKind = null;
  abilityMode = null;
  cameraHeight = 48;
  cameraTarget.set(-23, 0, -9);
  updateCamera();
  $('#startScreen').classList.add('hidden');
  $('#resultScreen').classList.add('hidden');
  $('#helpScreen').classList.add('hidden');
  $('#pauseVeil').classList.add('hidden');
  $('#placementHint').classList.add('hidden');
  $('#pauseBtn').innerHTML = '<span>Ⅱ</span>';
  $('#pauseBtn').title = 'توقف بازی';

  $('#factionBadge').textContent = playerFaction().code;
  $('#factionBadge').style.background = `${playerFaction().color}22`;
  $('#factionBadge').style.color = playerFaction().color;
  $('#factionName').textContent = `جناح ${playerFaction().name}`;
  $('#factionAbilityText').textContent = `${playerFaction().description} ساختمان ویژه: ${playerFaction().special.name}.`;
  $('#abilityName').textContent = playerFaction().abilityName;
  $('#abilityBtn').disabled = false;
  $('#activeBoost').classList.add('hidden');
  setSelection(null);
  setToolbarTab('build');
  updateToolbarHint();
  updateUI(true);
  showToast(`فرمانده ${playerFaction().name}، زمین خالی است. با ${fmt(credits)} اعتبار مرکز فرماندهی را بساز.`);
}

function updateToolbarHint() {
  if (!gameStarted) return;
  const hint = $('#toolbarHint');
  if (!hint) return;
  if (playerBuildingCount('hq') === 0) {
    hint.textContent = 'گام ۱: مرکز فرماندهی را بساز (کارت چشمک‌زن)';
    return;
  }
  if (activeTab === 'build') {
    const next = buildOrderStep();
    hint.textContent = next ? `گام بعدی: ${next} را بساز` : 'پایگاه کامل شد؛ نیرو بساز و به دشمن حمله کن';
  } else if (playerBuildingCount('barracks') === 0 && playerBuildingCount('armor') === 0 && playerBuildingCount('airfield') === 0) {
    hint.textContent = 'برای تولید نیرو اول پادگان بساز';
  } else {
    hint.textContent = 'نیروها با زمان ساخته می‌شوند و در صف تولید می‌نشینند';
  }
}

function setSelection(entity) {
  if (selectedEntity && selectedEntity.selectionRing) selectedEntity.selectionRing.visible = false;
  selectedEntity = entity && !entity.destroyed ? entity : null;
  if (selectedEntity && selectedEntity.selectionRing) selectedEntity.selectionRing.visible = !selectedEntity.air;
  renderSelection();
}

function renderSelection() {
  const card = $('#selectionCard');
  if (!selectedEntity) {
    card.innerHTML = `<div class="selection-placeholder"><span class="selection-cross">⌖</span><div><strong>واحدی انتخاب نشده</strong><small>روی واحد یا ساختمان خود بزنید</small></div></div>`;
    return;
  }
  const friendly = selectedEntity.owner === 'player';
  const ratio = Math.max(0, selectedEntity.hp / selectedEntity.maxHp * 100);
  let actions = '';
  if (friendly && selectedEntity.entityType === 'unit') {
    actions = `<div class="selection-actions"><button class="mini-action" data-action="stop">${selectedEntity.holdPosition ? 'آزادکردن واحد' : 'توقف و پدافند'}</button>${selectedEntity.damage > 0 ? '<button class="mini-action" data-action="attack">حالت حمله</button>' : ''}</div>`;
  } else if (friendly && ['barracks', 'armor', 'airfield'].includes(selectedEntity.kind)) {
    actions = `<div class="selection-actions"><button class="mini-action" data-action="train">رفتن به تولید نیرو</button></div>`;
  } else if (friendly && selectedEntity.kind === 'hq') {
    actions = `<div class="selection-actions"><button class="mini-action" data-action="build">فرمان‌های ساخت</button></div>`;
  }
  const kindLabel = selectedEntity.entityType === 'unit'
    ? (selectedEntity.air ? 'هوایی' : 'زمینی')
    : 'ساختمان پایگاه';
  const statLine = selectedEntity.entityType === 'unit'
    ? `<div class="selection-stats"><span>زره ${faDigits(Math.round(selectedEntity.armor || 0))}</span><span>نفوذ ${faDigits(Math.round(selectedEntity.penetration || 0))}</span>${selectedEntity.canHitAir ? '<span>ضدهوایی</span>' : ''}${selectedEntity.splash ? '<span>آسیب منطقه‌ای</span>' : ''}</div>`
    : `<div class="selection-stats"><span>زره ${faDigits(Math.round(selectedEntity.armor || 0))}</span>${selectedEntity.canHitAir ? '<span>پدافند هوایی</span>' : ''}${selectedEntity.income ? `<span>درآمد ${faDigits(selectedEntity.income)}</span>` : ''}</div>`;
  card.innerHTML = `<div class="selection-entity-head"><span class="selection-entity-icon" style="color:${factionById(selectedEntity.factionId).color}">${selectedEntity.icon}</span><div class="selection-data"><strong>${selectedEntity.name}</strong><small>${kindLabel}</small></div><span class="owner-tag" style="color:${friendly ? '#86d9b5' : '#f28b7f'}">${friendly ? 'خودی' : 'دشمن'}</span></div><div class="health-track"><span style="width:${ratio}%"></span></div>${statLine}<div class="queue-line" id="selectionQueue"></div>${actions}`;
  card.querySelectorAll('.mini-action').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'stop') {
      selectedEntity.moveTarget = null;
      selectedEntity.attackTarget = null;
      selectedEntity.holdPosition = !selectedEntity.holdPosition;
      sound.order();
      showToast(selectedEntity.holdPosition ? 'واحد در جای خود پدافند می‌کند.' : 'واحد آزاد شد و دوباره حرکت می‌کند.');
      renderSelection();
    }
    if (action === 'attack') { abilityMode = 'unitAttack'; sound.ui(); showToast('برای حمله، روی واحد یا ساختمان دشمن بزنید.'); }
    if (action === 'train') setToolbarTab('train');
    if (action === 'build') setToolbarTab('build');
  }));
}

// The selection panel is only rebuilt on selection changes; while an entity is alive we
// just refresh the health bar, so its action buttons keep their DOM node and stay clickable.
function refreshSelectionHealth() {
  if (!selectedEntity) return;
  const fill = document.querySelector('#selectionCard .health-track span');
  if (fill) {
    const ratio = Math.max(0, Math.min(1, selectedEntity.hp / selectedEntity.maxHp));
    fill.style.width = `${ratio * 100}%`;
  }
  const queueNode = document.querySelector('#selectionQueue');
  if (!queueNode) return;
  if (selectedEntity.entityType === 'building' && selectedEntity.queue?.length) {
    const job = selectedEntity.queue[0];
    const percent = Math.round((1 - Math.max(0, job.remaining) / Math.max(.001, job.total)) * 100);
    const rest = selectedEntity.queue.length - 1;
    queueNode.textContent = `تولید: ${unitLabel(job.kind, selectedEntity.factionId)} · ${faDigits(percent)}٪${rest > 0 ? ` · در صف: ${faDigits(rest)}` : ''}`;
  } else {
    queueNode.textContent = '';
  }
}

function startPlacement(kind) {
  if (!gameStarted || paused || gameEnded) return;
  if (!canBuildTech(kind)) {
    const requirement = kind === 'hq' ? 'مرکز فرماندهی فعلی را نگه دار' : (BUILDING_INFO[buildingRequirement(kind)]?.name || 'ساختمان لازم');
    showToast(`برای ساخت این گزینه ابتدا ${requirement} لازم است.`, 'warn');
    sound.deny();
    return;
  }
  sound.ui();
  placementKind = kind;
  abilityMode = null;
  $('#placementHint').classList.remove('hidden');
  $('#placementHint').innerHTML = 'نقطهٔ ساخت را انتخاب کنید <kbd>Esc</kbd> برای لغو';
  if (placementGhost) scene.remove(placementGhost);
  placementGhost = new THREE.Group();
  const ghostRadius = ['hq', 'armor', 'airfield', 'airbase'].includes(kind) ? 3.05 : 2.55;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(ghostRadius, ghostRadius, .08, 32), new THREE.MeshBasicMaterial({ color: 0x6de2b1, transparent: true, opacity: .28 }));
  plate.position.y = .15;
  placementGhost.add(plate);
  const outline = new THREE.Mesh(new THREE.RingGeometry(ghostRadius, ghostRadius + .17, 32), new THREE.MeshBasicMaterial({ color: 0x8af0c4, transparent: true, opacity: .95, side: THREE.DoubleSide }));
  outline.rotation.x = -Math.PI / 2;
  outline.position.y = .21;
  placementGhost.add(outline);
  placementGhost.position.set(cameraTarget.x, 0, cameraTarget.z);
  scene.add(placementGhost);
  setToolbarTab('build');
  renderToolbar();
  validateGhost();
}

function cancelPlacement() {
  placementKind = null;
  abilityMode = null;
  if (placementGhost) scene.remove(placementGhost);
  placementGhost = null;
  $('#placementHint').classList.add('hidden');
  renderToolbar();
}

function snappedPoint(point) {
  return { x: Math.round(point.x / 2) * 2, z: Math.round(point.z / 2) * 2 };
}

function validBuildSpotFor(owner, x, z, kind) {
  const boundary = ['factory', 'armor', 'airfield', 'airbase', 'hq'].includes(kind) ? 4.6 : 3.6;
  if (Math.abs(x) > HALF_W - boundary || Math.abs(z) > HALF_D - boundary) return false;
  if (kind === 'hq') {
    if (owner === 'player' && x > -4) return false;
    if (owner === 'enemy' && x < 4) return false;
    if (buildings.some((building) => building.owner === owner && building.kind === 'hq')) return false;
    return !buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 7.5);
  }
  const friendly = buildings.filter((building) => building.owner === owner);
  if (!friendly.some((building) => Math.hypot(building.x - x, building.z - z) < 20)) return false;
  return !buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 5.8);
}

function validBuildSpot(x, z, kind) {
  return validBuildSpotFor('player', x, z, kind);
}

function validateGhost() {
  if (!placementGhost || !placementKind) return false;
  const valid = validBuildSpot(placementGhost.position.x, placementGhost.position.z, placementKind);
  const color = valid ? 0x70e6b4 : 0xef716b;
  placementGhost.children.forEach((child) => child.material.color.setHex(color));
  return valid;
}

function moveGhostToPointer(clientX, clientY) {
  if (!placementGhost) return;
  const point = getGroundPoint(clientX, clientY);
  if (!point) return;
  const snapped = snappedPoint(point);
  placementGhost.position.set(snapped.x, 0, snapped.z);
  validateGhost();
}

function placeBuildingAt(x, z) {
  if (!placementKind) return;
  const point = snappedPoint({ x, z });
  const kind = placementKind;
  if (!validBuildSpot(point.x, point.z, kind)) {
    if (kind === 'hq' && point.x > -4) showToast('مرکز فرماندهی را فقط در نیمهٔ زمین خودی بساز.', 'warn');
    else showToast('این نقطه مناسب نیست؛ نزدیک پایگاه و دور از ساختمان‌ها انتخاب کن.', 'warn');
    sound.deny();
    return;
  }
  if (!canBuildTech(kind)) {
    showToast('پیش‌نیاز این ساختمان ساخته نشده است.', 'warn');
    sound.deny();
    return;
  }
  const cost = getBuildingCost(kind);
  if (credits < cost) {
    showToast('اعتبار کافی نیست.', 'warn');
    sound.deny();
    return;
  }
  credits -= cost;
  createBuilding(kind, 'player', point.x, point.z, selectedFactionId);
  stats.built += 1;
  sound.build();
  cancelPlacement();
  updateUI(true);
  showToast(`${(findBuildingInfo(kind) || {}).name || 'ساختمان'} ساخته شد.`, 'good');
}

function trainUnit(kind) {
  const info = UNIT_INFO[kind];
  if (!info || !gameStarted || paused || gameEnded) return;
  if (playerBuildingCount(info.requires) === 0) {
    showToast(`برای تولید ${info.name} به ${info.requiresName} نیاز داری.`, 'warn');
    sound.deny();
    return;
  }
  if (playerUnitCount() + queuedCount('player') >= UNIT_LIMIT) {
    showToast('ظرفیت نیروها پر شده است.', 'warn');
    sound.deny();
    return;
  }
  const producers = buildings.filter((building) => building.owner === 'player' && building.kind === info.requires && !building.destroyed && (building.queue?.length || 0) < 4);
  if (producers.length === 0) {
    showToast('همهٔ تولیدکننده‌ها مشغول‌اند؛ چند لحظه صبر کن.', 'warn');
    sound.deny();
    return;
  }
  const cost = getUnitCost(kind);
  if (credits < cost) {
    showToast('اعتبار کافی نیست.', 'warn');
    sound.deny();
    return;
  }
  const producer = producers.sort((a, b) => (a.queue?.length || 0) - (b.queue?.length || 0))[0];
  credits -= cost;
  producer.queue.push({ kind, total: info.buildTime, remaining: info.buildTime });
  sound.ui();
  updateUI(true);
  showToast(`${info.name} به صف تولید رفت.`);
}

function findSpawnPoint(producer) {
  const offsets = [[4.4, 1.4], [4.4, -1.6], [-4.4, 1.4], [-4.4, -1.6], [1.4, 4.4], [-1.4, 4.4], [1.4, -4.4], [-1.4, -4.4], [6.6, .4], [-6.6, .4]];
  for (const [offsetX, offsetZ] of offsets) {
    const x = THREE.MathUtils.clamp(producer.x + offsetX, -HALF_W + 2, HALF_W - 2);
    const z = THREE.MathUtils.clamp(producer.z + offsetZ, -HALF_D + 2, HALF_D - 2);
    if (!buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 3.6)) return { x, z };
  }
  return { x: producer.x, z: producer.z + 4 };
}

function nearestPlayerBuilding(entity) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const building of buildings) {
    if (building.owner !== 'player' || building.destroyed) continue;
    const d = distance(entity, building);
    if (d < nearestDistance) { nearest = building; nearestDistance = d; }
  }
  return nearest;
}

function spawnUnitFrom(producer, kind) {
  if (!producer || producer.destroyed) return null;
  if (producer.owner === 'player' && playerUnitCount() >= UNIT_LIMIT) return null;
  if (producer.owner === 'enemy' && enemyUnitCount() >= difficulty().cap) return null;
  const spot = findSpawnPoint(producer);
  const factionId = producer.owner === 'player' ? selectedFactionId : enemyFactionId;
  const unit = createUnit(kind, producer.owner, spot.x, spot.z, factionId);
  const forwardX = producer.owner === 'player' ? 6 : -6;
  unit.moveTarget = {
    x: THREE.MathUtils.clamp(spot.x + forwardX, -HALF_W + 2, HALF_W - 2),
    z: THREE.MathUtils.clamp(spot.z + (producer.owner === 'player' ? 2 : -2), -HALF_D + 2, HALF_D - 2),
  };
  if (producer.owner === 'enemy') {
    const hq = buildings.find((building) => building.owner === 'enemy' && building.kind === 'hq');
    const rally = hq
      ? { x: THREE.MathUtils.clamp(hq.x - 7, -HALF_W + 3, HALF_W - 3), z: THREE.MathUtils.clamp(hq.z - 4, -HALF_D + 3, HALF_D - 3) }
      : { x: spot.x - 4, z: spot.z - 2 };
    unit.staging = true;
    unit.attackTarget = null;
    unit.moveTarget = rally;
  } else {
    stats.trained += 1;
    sound.build();
    showToast(`${unitLabel(kind, factionId)} آماده شد.`, 'good');
    if (selectedEntity && selectedEntity.owner === 'player' && selectedEntity.entityType === 'unit') setSelection(selectedEntity);
  }
  return unit;
}

function productionSpeed(owner) {
  const logistics = owner === 'player' ? playerBuildingCount('logistics') : enemyBuildingCount('logistics');
  return 1 + Math.min(.36, logistics * .12);
}

function updateProduction(dt) {
  for (const producer of [...buildings]) {
    if (producer.destroyed || !producer.queue?.length) continue;
    const job = producer.queue[0];
    const factor = producer.owner === 'player' ? power.factor : enemyPower.factor;
    job.remaining -= dt * Math.max(.45, factor) * productionSpeed(producer.owner);
    if (job.remaining > 0) continue;
    const unit = spawnUnitFrom(producer, job.kind);
    if (!unit) { job.remaining = .4; continue; }
    producer.queue.shift();
    if (producer.owner === 'player') updateUI(true);
  }
}

function getGroundPoint(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const intersections = raycaster.intersectObject(ground, false);
  return intersections.length ? intersections[0].point : null;
}

function getEntityAt(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const roots = [...buildings, ...units].filter((entity) => !entity.destroyed).map((entity) => entity.group);
  const hits = raycaster.intersectObjects(roots, true);
  for (const hit of hits) {
    let object = hit.object;
    while (object && !object.userData.entity) object = object.parent;
    if (object?.userData.entity) return object.userData.entity;
  }
  return null;
}

function issueMove(unit, x, z) {
  unit.holdPosition = false;
  unit.attackTarget = null;
  unit.moveTarget = { x, z };
}

function issueAttack(unit, target) {
  unit.holdPosition = false;
  unit.attackTarget = target;
  unit.moveTarget = { x: target.x, z: target.z };
}

function handleCanvasAction(clientX, clientY, button = 0) {
  if (!gameStarted || paused || gameEnded) return;
  const point = getGroundPoint(clientX, clientY);
  const clicked = getEntityAt(clientX, clientY);
  if (placementKind && point) {
    placeBuildingAt(point.x, point.z);
    return;
  }
  if (abilityMode === 'airstrike' && point) {
    useAirstrike(point.x, point.z);
    return;
  }
  if (abilityMode === 'unitAttack' && clicked && clicked.owner === 'enemy') {
    if (selectedEntity?.entityType === 'unit' && selectedEntity.owner === 'player') issueAttack(selectedEntity, clicked);
    else units.filter((unit) => unit.owner === 'player' && unit.damage > 0).forEach((unit) => issueAttack(unit, clicked));
    abilityMode = null;
    sound.order();
    showToast('دستور حمله صادر شد.');
    return;
  }
  if (clicked) {
    if (clicked.owner === 'player') {
      setSelection(clicked);
      if (button === 2 && selectedEntity?.entityType === 'unit' && selectedEntity.kind === 'engineer') {
        showToast('مهندس به‌طور خودکار نزدیک‌ترین ساختمان آسیب‌دیده را ترمیم می‌کند.');
      }
      return;
    }
    if (selectedEntity?.owner === 'player' && selectedEntity.entityType === 'unit' && selectedEntity.damage > 0) {
      issueAttack(selectedEntity, clicked);
      sound.order();
      showToast(`هدف انتخاب شد: ${clicked.name}`);
    } else if (button === 2) {
      units.filter((unit) => unit.owner === 'player' && unit.damage > 0).forEach((unit) => issueAttack(unit, clicked));
      sound.order();
      showToast('نیروهای در دسترس به هدف حمله می‌کنند.');
    } else {
      setSelection(clicked);
    }
    return;
  }
  if (point && selectedEntity?.owner === 'player' && selectedEntity.entityType === 'unit') {
    issueMove(selectedEntity, point.x, point.z);
    abilityMode = null;
    sound.order();
    showToast('دستور حرکت صادر شد.');
  } else if (point && button === 2) {
    units.filter((unit) => unit.owner === 'player').forEach((unit) => issueMove(unit, point.x, point.z));
    sound.order();
  } else if (point && selectedEntity && selectedEntity.owner !== 'player') {
    setSelection(null);
  }
}

renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
const activePointers = new Map();
let pinchState = null;

function zoomCamera(delta) {
  cameraHeight = THREE.MathUtils.clamp(cameraHeight + delta, 30, 70);
  resize();
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button === 2) event.preventDefault();
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 2) {
    const [first, second] = [...activePointers.values()];
    pinchState = { distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)), height: cameraHeight };
    pointerState = null;
    return;
  }
  if (activePointers.size > 2) return;
  pointerState = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, button: event.button };
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinchState && activePointers.size === 2) {
    const [first, second] = [...activePointers.values()];
    const distance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y));
    cameraHeight = THREE.MathUtils.clamp(pinchState.height * pinchState.distance / distance, 30, 70);
    resize();
    return;
  }
  if (placementKind) moveGhostToPointer(event.clientX, event.clientY);
  if (!pointerState || pointerState.id !== event.pointerId) return;
  const dx = event.clientX - pointerState.lastX;
  const dy = event.clientY - pointerState.lastY;
  if (!pointerState.moved && Math.hypot(event.clientX - pointerState.x, event.clientY - pointerState.y) > 7) pointerState.moved = true;
  if (pointerState.moved) {
    const scale = cameraHeight / Math.max(1, viewport.clientHeight);
    cameraTarget.x -= dx * scale;
    cameraTarget.z += dy * scale * 1.12;
    updateCamera();
  }
  pointerState.lastX = event.clientX;
  pointerState.lastY = event.clientY;
});
renderer.domElement.addEventListener('pointerup', (event) => {
  activePointers.delete(event.pointerId);
  if (activePointers.size < 2) pinchState = null;
  if (!pointerState || pointerState.id !== event.pointerId) return;
  const state = pointerState;
  pointerState = null;
  if (!state.moved) handleCanvasAction(event.clientX, event.clientY, state.button);
});
renderer.domElement.addEventListener('pointercancel', (event) => {
  activePointers.delete(event.pointerId);
  if (activePointers.size < 2) pinchState = null;
  pointerState = null;
});
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomCamera(Math.sign(event.deltaY) * 2.4);
}, { passive: false });

function jumpCameraToMinimap(event) {
  const rect = minimap.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * MAP_W - HALF_W;
  const z = (event.clientY - rect.top) / rect.height * MAP_D - HALF_D;
  cameraTarget.set(x, 0, z);
  updateCamera();
}

let minimapDragging = false;
minimap.addEventListener('pointerdown', (event) => {
  if (!gameStarted) return;
  minimapDragging = true;
  minimap.setPointerCapture?.(event.pointerId);
  jumpCameraToMinimap(event);
});
minimap.addEventListener('pointermove', (event) => {
  if (minimapDragging) jumpCameraToMinimap(event);
});
minimap.addEventListener('pointerup', () => { minimapDragging = false; });
minimap.addEventListener('pointercancel', () => { minimapDragging = false; });

function useAbility() {
  if (!gameStarted || paused || gameEnded || abilityCooldown > 0) return;
  const ability = playerFaction().ability;
  sound.ui();
  if (ability === 'airstrike') {
    if (placementKind || placementGhost) cancelPlacement();
    abilityMode = 'airstrike';
    placementKind = null;
    $('#placementHint').classList.remove('hidden');
    $('#placementHint').textContent = 'نقطهٔ حملهٔ هوایی را انتخاب کنید · Esc برای لغو';
    showToast('محل حملهٔ هوایی را روی میدان انتخاب کن.');
    return;
  }
  if (ability === 'supply') {
    credits += 500;
    showToast('تدارکات رسید: ۵۰۰ اعتبار اضافه شد.');
  } else if (ability === 'fortify') {
    buildings.filter((building) => building.owner === 'player').forEach((building) => healEntity(building, building.maxHp * .16));
    boostUntil.fortify = elapsed + 18;
    showToast('سپر دفاعی فعال شد؛ ساختمان‌ها ترمیم شدند.');
  } else if (ability === 'overdrive') {
    boostUntil.overdrive = elapsed + 16;
    showToast('شتاب رزمی فعال شد؛ نیروها سریع‌تر حرکت می‌کنند.');
  } else if (ability === 'ironclad') {
    boostUntil.ironclad = elapsed + 18;
    showToast('زره واکنشی فعال شد؛ آسیب دریافتی کاهش یافت.');
  } else if (ability === 'recon') {
    boostUntil.recon = elapsed + 24;
    showToast('اسکن میدان فعال شد؛ برد دید نیروها افزایش یافت.');
  } else if (ability === 'trade') {
    credits += 650;
    showToast('تجارت منطقه‌ای انجام شد: ۶۵۰ اعتبار اضافه شد.');
  } else if (ability === 'repair') {
    [...buildings, ...units].filter((entity) => entity.owner === 'player').forEach((entity) => healEntity(entity, entity.maxHp * .27));
    showToast('تعمیر اضطراری انجام شد؛ نیروها بازیابی شدند.');
  }
  abilityCooldown = 60;
  updateUI(true);
}

function useAirstrike(x, z) {
  const targets = [...buildings, ...units].filter((entity) => entity.owner === 'enemy' && Math.hypot(entity.x - x, entity.z - z) <= 7.2);
  if (targets.length === 0) {
    showToast('هدف دشمنی در محدوده نبود؛ حمله مصرف شد.');
  } else {
    const airfieldBonus = (playerBuildingCount('airfield') > 0 || playerBuildingCount('airbase') > 0) ? 1.3 : 1;
    targets.forEach((target) => damageEntity(target, (target.kind === 'hq' ? 260 : 390) * airfieldBonus, null));
    sound.explode();
    showToast(`حملهٔ هوایی به ${targets.length.toLocaleString('fa-IR')} هدف اصابت کرد.`);
    const blast = new THREE.Mesh(new THREE.RingGeometry(.7, 7.2, 36), new THREE.MeshBasicMaterial({ color: 0xffc56d, transparent: true, opacity: .6, side: THREE.DoubleSide }));
    blast.rotation.x = -Math.PI / 2;
    blast.position.set(x, .12, z);
    scene.add(blast);
    effects.push({ object: blast, remaining: .7, scale: true });
  }
  abilityMode = null;
  abilityCooldown = 60;
  $('#placementHint').classList.add('hidden');
  updateUI(true);
}

function updateSoundButton() {
  const button = $('#soundBtn');
  if (!button) return;
  button.innerHTML = `<span>${sound.muted ? '🔇' : '♪'}</span><small>${sound.muted ? 'بی‌صدا' : 'صدا'}</small>`;
  button.classList.toggle('muted', sound.muted);
  button.title = sound.muted ? 'صدا خاموش است' : 'صدا روشن است';
  button.setAttribute('aria-label', sound.muted ? 'روشن کردن صدا' : 'خاموش کردن صدا');
}

function setDifficulty(id) {
  if (!DIFFICULTIES[id]) return;
  selectedDifficulty = id;
  document.querySelectorAll('.difficulty-option').forEach((button) => button.classList.toggle('active', button.dataset.difficulty === id));
  const hint = $('#difficultyHint');
  if (hint) hint.textContent = DIFFICULTIES[id].hint;
  try { localStorage.setItem('frontline.difficulty', id); } catch (error) { /* private mode */ }
}

function openHelp() {
  helpWasPaused = gameStarted && !gameEnded && !paused;
  if (helpWasPaused) togglePause();
  $('#helpScreen').classList.remove('hidden');
  sound.ui();
}

function closeHelp() {
  $('#helpScreen').classList.add('hidden');
  if (helpWasPaused && paused) togglePause();
  helpWasPaused = false;
}

function showStartScreen() {
  gameStarted = false;
  gameEnded = false;
  paused = false;
  abilityMode = null;
  cancelPlacement();
  clearEntities();
  $('#startScreen').classList.remove('hidden');
  $('#resultScreen').classList.add('hidden');
  $('#helpScreen').classList.add('hidden');
  $('#pauseVeil').classList.add('hidden');
  $('#placementHint').classList.add('hidden');
  $('#pauseBtn').innerHTML = '<span>Ⅱ</span>';
  $('#pauseBtn').title = 'توقف بازی';
  $('#creditsValue').textContent = '۰';
  $('#powerValue').textContent = '۰ / ۰';
  $('#powerValue').style.color = '#edf4f1';
  $('#unitValue').textContent = '۰';
  $('#timerValue').textContent = '۰۰:۰۰';
  $('#abilityBtn').disabled = true;
  $('#activeBoost').classList.add('hidden');
  $('#selectionCard').innerHTML = `<div class="selection-placeholder"><span class="selection-cross">⌖</span><div><strong>واحدی انتخاب نشده</strong><small>روی واحد یا ساختمان خود بزنید</small></div></div>`;
  updateSoundButton();
}

$('#abilityBtn').addEventListener('click', useAbility);
$('#startBtn').addEventListener('click', () => { sound.init(); startGame(selectedFactionId); });
$('#restartBtn').addEventListener('click', () => {
  if (!gameStarted) { showStartScreen(); return; }
  startGame(selectedFactionId);
});
$('#playAgainBtn').addEventListener('click', () => { sound.init(); startGame(selectedFactionId); });
$('#changeFactionBtn').addEventListener('click', showStartScreen);
$('#pauseBtn').addEventListener('click', togglePause);
$('#soundBtn').addEventListener('click', () => {
  const muted = sound.toggle();
  updateSoundButton();
  showToast(muted ? 'صدا خاموش شد.' : 'صدا روشن شد.');
});
$('#helpBtn').addEventListener('click', openHelp);
$('#helpLink').addEventListener('click', openHelp);
$('#helpCloseBtn').addEventListener('click', closeHelp);
$('#helpStartBtn').addEventListener('click', closeHelp);
document.querySelectorAll('.difficulty-option').forEach((button) => {
  button.addEventListener('click', () => { sound.ui(); setDifficulty(button.dataset.difficulty); });
});

try {
  const storedDifficulty = localStorage.getItem('frontline.difficulty');
  if (storedDifficulty && DIFFICULTIES[storedDifficulty]) setDifficulty(storedDifficulty); else setDifficulty(selectedDifficulty);
} catch (error) {
  setDifficulty(selectedDifficulty);
}
updateSoundButton();

function togglePause() {
  if (!gameStarted || gameEnded) return;
  paused = !paused;
  $('#pauseVeil').classList.toggle('hidden', !paused);
  $('#pauseBtn').innerHTML = paused ? '<span>▶</span>' : '<span>Ⅱ</span>';
  $('#pauseBtn').title = paused ? 'ادامهٔ بازی' : 'توقف بازی';
  updateToolbarAvailability();
  sound.ui();
}

function cancelModes() {
  if (placementKind || abilityMode) {
    cancelPlacement();
    $('#placementHint').classList.add('hidden');
  }
}

function focusHome() {
  const hq = buildings.find((building) => building.owner === 'player' && building.kind === 'hq');
  cameraTarget.set(hq ? hq.x : -23, 0, hq ? hq.z : -9);
  updateCamera();
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!$('#helpScreen').classList.contains('hidden')) { closeHelp(); return; }
    cancelModes();
    return;
  }
  if (!$('#helpScreen').classList.contains('hidden')) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (gameStarted && !gameEnded) togglePause();
    return;
  }
  if (!gameStarted || paused || gameEnded) return;
  if (event.key === '+' || event.key === '=') { zoomCamera(-4); return; }
  if (event.key === '-' || event.key === '_') { zoomCamera(4); return; }
  if (event.key.toLowerCase() === 'h') { focusHome(); return; }
  const step = cameraHeight * .08;
  if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') cameraTarget.x -= step;
  if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') cameraTarget.x += step;
  if (event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') cameraTarget.z -= step;
  if (event.key.toLowerCase() === 's' || event.key === 'ArrowDown') cameraTarget.z += step;
  updateCamera();
});

function showToast(message, tone = '') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast show${tone ? ` ${tone}` : ''}`;
  toastTimer = tone === 'warn' ? 3.4 : 2.6;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function canTargetEntity(attacker, target) {
  if (!target || target.destroyed || target.hp <= 0) return false;
  if (target.owner === attacker.owner) return false;
  if (target.air && !attacker.canHitAir) return false;
  if (attacker.antiAirOnly && !target.air) return false;
  return true;
}

function nearestEnemy(attacker, maxRange) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const candidate of [...units, ...buildings]) {
    if (!canTargetEntity(attacker, candidate)) continue;
    const d = distance(attacker, candidate);
    if (d <= maxRange && d < nearestDistance) { nearest = candidate; nearestDistance = d; }
  }
  return nearest;
}

function updateMovement(dt) {
  for (const unit of [...units]) {
    if (unit.destroyed || unit.holdPosition) continue;
    let goal = unit.moveTarget;
    if (unit.attackTarget && !unit.attackTarget.destroyed && unit.attackTarget.hp > 0 && distance(unit, unit.attackTarget) > unit.attackRange * .82) {
      goal = { x: unit.attackTarget.x, z: unit.attackTarget.z };
      unit.moveTarget = goal;
    }
    if (!goal) continue;
    const dx = goal.x - unit.x;
    const dz = goal.z - unit.z;
    const d = Math.hypot(dx, dz);
    if (d < .28) {
      unit.moveTarget = null;
      if (unit.staging) unit.holdPosition = true;
      continue;
    }
    const speedBoost = unit.owner === 'player' && boostUntil.overdrive > elapsed ? 1.65 : 1;
    const droneportBoost = unit.owner === 'player' && playerBuildingCount('droneport') > 0 ? 1.12 : 1;
    const speed = unit.speed * speedBoost * droneportBoost;
    const step = Math.min(d, speed * dt);
    unit.x += dx / d * step;
    unit.z += dz / d * step;
    const lift = unit.air ? unit.altitude + Math.sin(elapsed * 2.2 + unit.bobSeed) * .16 : 0;
    unit.group.position.set(unit.x, lift, unit.z);
    unit.group.rotation.y = Math.atan2(dx, dz);
    // Keep the health bar facing the (fixed) camera instead of spinning with the chassis.
    if (unit.healthBar?.group) unit.healthBar.group.rotation.y = -unit.group.rotation.y;
  }
}

function updateUnitSeparation() {
  for (let i = 0; i < units.length; i++) {
    const a = units[i];
    if (a.destroyed || a.air) continue;
    for (let j = i + 1; j < units.length; j++) {
      const b = units[j];
      if (b.destroyed || b.air) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const sizeOf = (unit) => (unit.kind === 'tank' || unit.kind === 'artillery' ? 1.7 : unit.kind === 'ifv' || unit.kind === 'mlrs' ? 1.4 : 1.05);
      const minDistance = sizeOf(a) + sizeOf(b);
      if (d >= minDistance || d < .0001) continue;
      const push = (minDistance - d) * .5;
      const nx = dx / d;
      const nz = dz / d;
      a.x = THREE.MathUtils.clamp(a.x - nx * push, -HALF_W + 1.5, HALF_W - 1.5);
      a.z = THREE.MathUtils.clamp(a.z - nz * push, -HALF_D + 1.5, HALF_D - 1.5);
      b.x = THREE.MathUtils.clamp(b.x + nx * push, -HALF_W + 1.5, HALF_W - 1.5);
      b.z = THREE.MathUtils.clamp(b.z + nz * push, -HALF_D + 1.5, HALF_D - 1.5);
      if (!a.air) a.group.position.set(a.x, a.altitude || 0, a.z);
      if (!b.air) b.group.position.set(b.x, b.altitude || 0, b.z);
    }
  }
}

function updateCombat() {
  const attackers = [...buildings, ...units].filter((entity) => !entity.destroyed && entity.damage > 0);
  for (const attacker of attackers) {
    let target = attacker.attackTarget;
    if (!canTargetEntity(attacker, target)) {
      attacker.attackTarget = null;
      target = null;
    }
    const scanBonus = attacker.owner === 'player' && boostUntil.recon > elapsed ? 5 : 0;
    const specialBonus = attacker.owner === 'player'
      ? (playerBuildingCount('sensor') > 0 ? 2.5 : 0)
        + (playerBuildingCount('droneport') > 0 ? 1.5 : 0)
        + (playerBuildingCount('radar') > 0 ? 3 : 0)
      : 0;
    if (!target) {
      const acquireRange = attacker.holdPosition
        ? attacker.attackRange
        : (attacker.scanRange || attacker.attackRange) + scanBonus + specialBonus;
      target = nearestEnemy(attacker, acquireRange);
      if (target) attacker.attackTarget = target;
    }
    if (!target) continue;
    let dist = distance(attacker, target);
    if (attacker.entityType === 'unit' && dist > attacker.attackRange) {
      const nearby = nearestEnemy(attacker, attacker.attackRange);
      if (nearby) {
        target = nearby;
        attacker.attackTarget = nearby;
        dist = distance(attacker, target);
      }
    }
    const rangeBonus = attacker.owner === 'player' ? (playerFaction().rangeMult ? 0 : 0) : 0;
    const range = attacker.attackRange + rangeBonus + (attacker.owner === 'player' && playerBuildingCount('sensor') > 0 ? 1.4 : 0);
    if (attacker.entityType === 'unit' && dist > range) {
      if (attacker.holdPosition) continue;
      attacker.moveTarget = { x: target.x, z: target.z };
      continue;
    }
    const powerFactor = attacker.entityType === 'building' ? (attacker.owner === 'player' ? power.factor : enemyPower.factor) : 1;
    const cooldown = attacker.cooldown / Math.max(.45, powerFactor);
    if (dist <= range && elapsed - attacker.lastShot >= cooldown) {
      attacker.lastShot = elapsed;
      let damage = attacker.damage;
      const attackerFaction = factionById(attacker.factionId);
      if (attackerFaction.turretMult && (attacker.kind === 'turret' || attacker.kind === 'bastion')) damage *= attackerFaction.turretMult;
      if (attacker.owner === 'player' && playerBuildingCount('bastion') > 0 && attacker.entityType === 'building' && attacker.kind === 'turret') damage *= 1.2;
      if (attacker.owner === 'player' && playerFaction().ability === 'airstrike' && (playerBuildingCount('airfield') > 0 || playerBuildingCount('airbase') > 0)) damage *= 1.1;
      createShot(attacker, target);
      sound.shot(attacker.owner === 'player');
      damageEntity(target, damage, attacker);
      if (attacker.splash > 0) {
        for (const splashTarget of [...units, ...buildings]) {
          if (splashTarget === target || !canTargetEntity(attacker, splashTarget)) continue;
          if (Math.hypot(splashTarget.x - target.x, splashTarget.z - target.z) <= attacker.splash) {
            damageEntity(splashTarget, damage * .45, attacker);
          }
        }
      }
    }
  }
}

function createShot(attacker, target) {
  const attackerLift = attacker.entityType === 'unit' ? (attacker.air ? attacker.altitude : 0) : 0;
  const startY = (attacker.entityType === 'building' ? 2.25 : 1.0) + attackerLift;
  const targetLift = target.air ? target.altitude : 0;
  const endY = (target.entityType === 'building' ? 1.55 : .85) + targetLift;
  const points = [new THREE.Vector3(attacker.x, startY, attacker.z), new THREE.Vector3(target.x, endY, target.z)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const color = attacker.owner === 'player' ? new THREE.Color(playerFaction().color) : new THREE.Color(enemyFaction().color);
  const material = new THREE.LineBasicMaterial({
    color: attacker.missile ? new THREE.Color(0xffd27a) : color,
    transparent: true,
    opacity: attacker.missile ? .95 : .88,
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  effects.push({ object: line, remaining: attacker.missile ? .3 : .16 });
}

function damageEntity(target, amount, attacker) {
  if (!target || target.destroyed) return;
  let reduction = 1;
  if (target.armor) {
    const penetration = Math.max(20, attacker?.penetration || 100);
    reduction *= 1 - Math.min(.62, target.armor / (target.armor + penetration * 2.4));
  }
  if (target.owner === 'player') {
    if (playerFaction().armorMult) reduction *= playerFaction().armorMult;
    if (boostUntil.ironclad > elapsed) reduction *= .58;
    if (boostUntil.fortify > elapsed && target.entityType === 'building') reduction *= .62;
    if (playerBuildingCount('armory') > 0) reduction *= .9;
  } else if (target.owner === 'enemy') {
    const targetFaction = factionById(target.factionId);
    if (targetFaction.armorMult) reduction *= targetFaction.armorMult;
  }
  const applied = Math.max(1, amount * reduction);
  target.hp -= applied;
  if (target.owner === 'player' && target.entityType === 'building') lastPlayerHitAt = elapsed;
  updateHealthBar(target);
  if (selectedEntity === target) refreshSelectionHealth();
  if (target.hp <= 0) destroyEntity(target, attacker);
}

function healEntity(entity, amount) {
  if (!entity || entity.destroyed) return;
  entity.hp = Math.min(entity.maxHp, entity.hp + amount);
  updateHealthBar(entity);
  if (selectedEntity === entity) refreshSelectionHealth();
}

function spawnBlast(x, z, radius = 2.4, y = .14) {
  const blast = new THREE.Mesh(
    new THREE.RingGeometry(radius * .35, radius, 28),
    new THREE.MeshBasicMaterial({ color: 0xffb066, transparent: true, opacity: .75, side: THREE.DoubleSide }),
  );
  blast.rotation.x = -Math.PI / 2;
  blast.position.set(x, y, z);
  scene.add(blast);
  effects.push({ object: blast, remaining: .55, scale: true });
}

function destroyEntity(entity, attacker) {
  if (!entity || entity.destroyed) return;
  entity.destroyed = true;
  scene.remove(entity.group);
  disposeObject(entity.group);
  const list = entity.entityType === 'building' ? buildings : units;
  const index = list.indexOf(entity);
  if (index >= 0) list.splice(index, 1);
  for (const other of [...buildings, ...units]) if (other.attackTarget === entity) other.attackTarget = null;
  if (selectedEntity === entity) setSelection(null);
  if (entity.owner === 'enemy') stats.kills += 1;
  else stats.losses += 1;
  spawnBlast(entity.x, entity.z, entity.entityType === 'building' ? 3.2 : 2.1, entity.air ? entity.altitude : .14);
  sound.explode();
  if (entity.kind === 'hq') {
    finishGame(entity.owner === 'enemy');
  } else if (entity.owner === 'player') {
    const lost = entity.entityType === 'building' ? `${entity.name} از دست رفت.` : `${entity.name} منهدم شد.`;
    showToast(lost, 'warn');
  }
  updateUI(true);
}

function finishGame(victory) {
  gameEnded = true;
  paused = false;
  $('#pauseVeil').classList.add('hidden');
  $('#resultScreen').classList.remove('hidden');
  $('#resultIcon').textContent = victory ? '✦' : '×';
  $('#resultIcon').style.background = victory ? 'linear-gradient(135deg,#b5f2d8,#61cca9)' : 'linear-gradient(135deg,#ffb3a2,#dc6962)';
  $('#resultTitle').textContent = victory ? 'پیروزی!' : 'پایگاه سقوط کرد';
  $('#resultText').textContent = victory ? `مرکز فرماندهی ${enemyFaction().name} نابود شد. عملیات با موفقیت پایان یافت.` : 'مرکز فرماندهی شما نابود شد. برای تغییر تاکتیک دوباره وارد میدان شوید.';
  $('#resultEyebrow').textContent = victory ? 'عملیات موفق' : 'عملیات ناموفق';
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  $('#resultStats').innerHTML = `
    <div class="result-stat"><small>زمان نبرد</small><strong>${faDigits(String(minutes).padStart(2, '0'))}:${faDigits(String(seconds).padStart(2, '0'))}</strong></div>
    <div class="result-stat"><small>اهداف منهدم‌شده</small><strong>${fmt(stats.kills)}</strong></div>
    <div class="result-stat"><small>تلفات ما</small><strong>${fmt(stats.losses)}</strong></div>`;
  if (victory) sound.victory(); else sound.defeat();
  $('#helpScreen').classList.add('hidden');
}

function computePower(owner) {
  const owned = buildings.filter((building) => building.owner === owner);
  const supply = owned.reduce((total, building) => total + (building.powerOutput || 0), 0);
  const usage = owned.reduce((total, building) => total + (building.powerUse || 0), 0);
  const factor = usage > supply ? Math.max(.4, supply / Math.max(1, usage)) : 1;
  return { supply, usage, factor };
}

function updatePowerStates() {
  power = computePower('player');
  enemyPower = computePower('enemy');
  if (power.factor < 1 && !powerWarned) {
    powerWarned = true;
    showToast('کمبود برق: تولید و آتش برجک‌ها کند شده است. نیروگاه بساز.', 'warn');
    sound.alert();
  } else if (power.factor >= 1 && powerWarned) {
    powerWarned = false;
    showToast('تأمین برق پایگاه متعادل شد.', 'good');
  }
}

function updateEconomy(dt) {
  if (playerBuildingCount('hq') === 0) return;
  const refineries = buildings.filter((building) => building.owner === 'player' && building.kind === 'refinery').length;
  const logistics = buildings.filter((building) => building.owner === 'player' && building.kind === 'logistics').length;
  const specialCount = buildings.filter((building) => building.owner === 'player' && building.kind === playerFaction().special.kind).length;
  let income = 20 + refineries * 12 + logistics * 8;
  income += specialCount * (playerFaction().special.income || 0);
  if (playerFaction().incomeMult) income *= playerFaction().incomeMult;
  if (power.factor < 1) income *= .85;
  credits += income * dt;
}

function updateEngineers(dt) {
  repairFxTimer -= dt;
  for (const engineer of units) {
    if (engineer.destroyed || engineer.kind !== 'engineer' || engineer.holdPosition) continue;
    if (engineer.moveTarget || engineer.attackTarget) continue;
    let best = null;
    let bestDistance = Infinity;
    for (const entity of [...buildings, ...units]) {
      if (entity.owner !== engineer.owner || entity.destroyed || entity.hp >= entity.maxHp - .5) continue;
      const d = distance(engineer, entity);
      if (d > 9 || d >= bestDistance) continue;
      best = entity;
      bestDistance = d;
    }
    if (!best) continue;
    engineer.group.rotation.y = Math.atan2(best.x - engineer.x, best.z - engineer.z);
    if (engineer.healthBar?.group) engineer.healthBar.group.rotation.y = -engineer.group.rotation.y;
    healEntity(best, engineer.repairRate * dt * .75);
    if (repairFxTimer <= 0 && engineer.owner === 'player') {
      repairFxTimer = .55;
      const startY = .9;
      const endY = best.entityType === 'building' ? 1.8 : .7;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(engineer.x, startY, engineer.z),
        new THREE.Vector3(best.x, endY, best.z),
      ]);
      const beam = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x8ff0d0, transparent: true, opacity: .7 }));
      scene.add(beam);
      effects.push({ object: beam, remaining: .3 });
    }
  }
}

function updatePassiveHealing(dt) {
  if (playerFaction().ability !== 'repair' || playerBuildingCount('hospital') === 0) return;
  passiveHealTimer += dt;
  if (passiveHealTimer < 1) return;
  passiveHealTimer = 0;
  const hospitals = buildings.filter((building) => building.owner === 'player' && building.kind === 'hospital');
  for (const entity of [...buildings, ...units]) {
    if (entity.owner !== 'player') continue;
    if (hospitals.some((hospital) => distance(entity, hospital) < 12)) healEntity(entity, entity.maxHp * .012);
  }
}

function enemyBuildingCount(kind) {
  return buildings.filter((building) => building.owner === 'enemy' && (!kind || building.kind === kind)).length;
}

function findEnemyBuildSpot(kind) {
  const hq = buildings.find((building) => building.owner === 'enemy' && building.kind === 'hq');
  if (kind === 'hq') {
    for (const [x, z] of [[26, 16], [28, 10], [22, 22], [30, 22], [20, 12], [26, 26]]) {
      if (validBuildSpotFor('enemy', x, z, 'hq')) return { x, z };
    }
    return null;
  }
  if (!hq) return null;
  const towardPlayer = Math.atan2(-hq.z, -hq.x);
  const startAngle = kind === 'turret' ? towardPlayer : Math.random() * Math.PI * 2;
  const radii = kind === 'turret' ? [8, 11, 14, 17, 20] : [9, 12, 15, 18, 21, 24];
  for (const radius of radii) {
    for (let step = 0; step < 24; step++) {
      const angle = startAngle + (step % 2 ? 1 : -1) * Math.ceil(step / 2) * (Math.PI / 12);
      const x = Math.round((hq.x + Math.cos(angle) * radius) / 2) * 2;
      const z = Math.round((hq.z + Math.sin(angle) * radius) / 2) * 2;
      if (validBuildSpotFor('enemy', x, z, kind)) return { x, z };
    }
  }
  // Fallback: sweep the enemy half of the map so a crowded base can still expand.
  for (let z = -HALF_D + 6; z <= HALF_D - 6; z += 2) {
    for (let x = 6; x <= HALF_W - 6; x += 2) {
      if (validBuildSpotFor('enemy', x, z, kind)) return { x, z };
    }
  }
  return null;
}

function enemyDesiredBuilding() {
  const diff = difficulty();
  const count = (kind) => enemyBuildingCount(kind);
  if (count('hq') === 0) return 'hq';
  if (enemyPower.supply < enemyPower.usage + 55) return 'generator';
  if (count('refinery') < 2) return 'refinery';
  if (count('barracks') < 1) return 'barracks';
  if (count('turret') < Math.max(1, diff.turrets - 1)) return 'turret';
  if (count('sam') < 1) return 'sam';
  if (count('logistics') < 1) return 'logistics';
  if (count('armor') < 1) return 'armor';
  if (count('airfield') < 1) return 'airfield';
  if (count('sam') < 2 && elapsed > 110) return 'sam';
  if (count('turret') < diff.turrets + 1 && elapsed > 120) return 'turret';
  if (count('refinery') < 3 && elapsed > 150) return 'refinery';
  if (count('armor') < 2 && elapsed > 190) return 'armor';
  if (count('barracks') < 2 && elapsed > 220) return 'barracks';
  return null;
}

function enemyBuildDecision() {
  const kind = enemyDesiredBuilding();
  if (!kind) return null;
  const info = BUILDING_INFO[kind];
  if (!info || enemyCredits < info.cost) return null;
  const spot = findEnemyBuildSpot(kind);
  if (!spot) return null;
  enemyCredits -= info.cost;
  return createBuilding(kind, 'enemy', spot.x, spot.z, enemyFactionId);
}

function enqueueEnemyUnit(kind) {
  const info = UNIT_INFO[kind];
  if (!info) return false;
  if (enemyUnitCount() + queuedCount('enemy') >= difficulty().cap) return false;
  const producers = buildings.filter((building) => building.owner === 'enemy' && building.kind === info.requires && !building.destroyed && (building.queue?.length || 0) < 4);
  if (!producers.length) return false;
  const producer = producers.sort((a, b) => (a.queue?.length || 0) - (b.queue?.length || 0))[0];
  const cost = Math.ceil(info.cost * .95);
  if (enemyCredits < cost) return false;
  enemyCredits -= cost;
  producer.queue.push({ kind, total: info.buildTime, remaining: info.buildTime });
  return true;
}

function pickEnemyUnitKind() {
  const roll = Math.random();
  const hasArmor = enemyBuildingCount('armor') > 0;
  const hasAirfield = enemyBuildingCount('airfield') > 0;
  if (hasAirfield && elapsed > 110) {
    // Make sure the first gunship and the first jet actually show up once the
    // airfield is standing, then keep them in the normal rotation.
    if (enemyAirSpawned.heli === 0) return 'heli';
    if (enemyAirSpawned.jet === 0) return 'jet';
    if (roll < .18) return 'jet';
    if (roll < .4) return 'heli';
  }
  if (hasArmor && elapsed > 80) {
    if (roll < .5) return 'tank';
    if (roll < .72) return 'ifv';
    if (roll < .86) return 'mlrs';
  }
  if (roll < .3) return 'atgm';
  return 'scout';
}

function recruitEnemyUnit() {
  const diff = difficulty();
  if (enemyUnitCount() + queuedCount('enemy') >= diff.cap) return false;
  // Commit to one unit at a time and save for it: this is what lets the AI
  // field expensive tanks, gunships and jets instead of endless cheap scouts.
  if (!enemyUnitGoal) enemyUnitGoal = pickEnemyUnitKind();
  const info = UNIT_INFO[enemyUnitGoal];
  if (!info) { enemyUnitGoal = null; return false; }
  if (enemyBuildingCount(info.requires) === 0) { enemyUnitGoal = null; return false; }
  if (enemyCredits < Math.ceil(info.cost * .95)) return false;
  if (enqueueEnemyUnit(enemyUnitGoal)) { enemyUnitGoal = null; return true; }
  return false;
}

function stagedEnemyUnits() {
  return units.filter((unit) => unit.owner === 'enemy' && !unit.destroyed && (unit.staging || unit.holdPosition));
}

function launchAssault(group = stagedEnemyUnits()) {
  if (!group.length) return 0;
  const anchor = group[0];
  const target = nearestPlayerBuilding(anchor) || buildings.find((building) => building.owner === 'player' && building.kind === 'hq');
  if (!target) return 0;
  for (const unit of group) {
    unit.staging = false;
    unit.holdPosition = false;
    unit.attackTarget = target;
    unit.moveTarget = { x: target.x, z: target.z };
  }
  enemyWaveNumber += 1;
  if (group.length >= 3) {
    showToast('هشدار: دشمن حملهٔ هماهنگ را آغاز کرد.', 'warn');
    sound.alert();
  }
  return group.length;
}

function updateEnemyAI(dt) {
  const diff = difficulty();
  const refineries = enemyBuildingCount('refinery');
  if (enemyBuildingCount('hq') > 0) {
    enemyCredits += dt * (20 + refineries * 12 + enemyBuildingCount('logistics') * 8) * diff.income * (enemyFaction().incomeMult || 1);
  }
  enemyThinkTimer -= dt;
  if (enemyThinkTimer <= 0) {
    enemyThinkTimer = diff.think;
    enemyBuildDecision();
    const intruders = units.filter((unit) => unit.owner === 'player' && !unit.destroyed && buildings.some((building) => building.owner === 'enemy' && distance(unit, building) < 15));
    if (intruders.length) {
      if (enemyUnitCount() + queuedCount('enemy') < diff.cap) enqueueEnemyUnit('tank');
      for (const defender of stagedEnemyUnits()) {
        let threat = null;
        let threatDistance = Infinity;
        for (const intruder of intruders) {
          const d = distance(defender, intruder);
          if (d < threatDistance) { threat = intruder; threatDistance = d; }
        }
        if (!threat) continue;
        defender.staging = false;
        defender.holdPosition = false;
        defender.attackTarget = threat;
        defender.moveTarget = { x: threat.x, z: threat.z };
      }
    }
  }
  enemyRecruitTimer -= dt;
  if (enemyRecruitTimer <= 0) {
    enemyRecruitTimer = Math.max(4.2, diff.wave * .22);
    const desired = enemyDesiredBuilding();
    const reserve = desired ? BUILDING_INFO[desired].cost + 140 : 0;
    if (enemyCredits >= reserve) {
      recruitEnemyUnit();
      if (Math.random() < .35) recruitEnemyUnit();
    }
  }
  enemyWaveTimer -= dt;
  const staged = stagedEnemyUnits();
  const groupSize = selectedDifficulty === 'hard' ? 4 : selectedDifficulty === 'easy' ? 6 : 5;
  if (staged.length >= groupSize || (enemyWaveTimer <= 0 && staged.length >= 2)) {
    enemyWaveTimer = diff.wave;
    if (staged.length) launchAssault(staged);
  }
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.remaining -= dt;
    if (effect.scale) {
      const progress = 1 - Math.max(0, effect.remaining) / .7;
      effect.object.scale.setScalar(.6 + progress * .6);
      effect.object.material.opacity = Math.max(0, effect.remaining / .7 * .6);
    } else if (effect.object.material) {
      effect.object.material.opacity = Math.max(0, effect.remaining / .16);
    }
    if (effect.remaining <= 0) {
      scene.remove(effect.object);
      effect.object.geometry?.dispose();
      if (Array.isArray(effect.object.material)) effect.object.material.forEach((material) => material.dispose());
      else effect.object.material?.dispose();
      effects.splice(i, 1);
    }
  }
}

function updateGame(dt) {
  elapsed += dt;
  if (abilityCooldown > 0) abilityCooldown = Math.max(0, abilityCooldown - dt);
  updatePowerStates();
  updateEconomy(dt);
  updateProduction(dt);
  updateMovement(dt);
  updateUnitSeparation();
  updateCombat();
  updateEnemyAI(dt);
  if (elapsed - lastPlayerHitAt < 1.6 && elapsed - attackAlertAt > 14) {
    attackAlertAt = elapsed;
    showToast('پایگاه زیر حمله است! نیرو بفرست یا پدافند بساز.', 'warn');
    sound.alert();
  }
  updateEngineers(dt);
  updatePassiveHealing(dt);
  updateEffects(dt);
  uiTimer += dt;
  if (uiTimer > .18) {
    uiTimer = 0;
    updateUI();
  }
}

function updateUI(force = false) {
  if (!gameStarted) return;
  $('#creditsValue').textContent = fmt(credits);
  $('#powerValue').textContent = `${fmt(power.supply)} / ${fmt(power.usage)}`;
  $('#powerValue').style.color = power.factor < 1 ? '#fb8a7c' : '#edf4f1';
  $('#powerValue').title = power.factor < 1 ? 'کمبود برق: تولید و آتش کندتر می‌شود' : 'برق کافی است';
  $('#unitValue').textContent = `${fmt(playerUnitCount())} / ${fmt(UNIT_LIMIT)}`;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  $('#timerValue').textContent = `${faDigits(String(minutes).padStart(2, '0'))}:${faDigits(String(seconds).padStart(2, '0'))}`;
  $('#abilityStatus').textContent = abilityCooldown > 0 ? `آماده‌سازی ${faDigits(Math.ceil(abilityCooldown))} ثانیه` : (abilityMode ? 'نقطهٔ هدف را انتخاب کن' : 'آماده');
  $('#abilityBtn').disabled = paused || gameEnded || abilityCooldown > 0;
  $('#abilityBtn').classList.toggle('armed', Boolean(abilityMode === 'airstrike'));
  const boosts = [];
  if (boostUntil.fortify > elapsed) boosts.push(`سپر دفاعی ${faDigits(Math.ceil(boostUntil.fortify - elapsed))}ث`);
  if (boostUntil.overdrive > elapsed) boosts.push(`شتاب ${faDigits(Math.ceil(boostUntil.overdrive - elapsed))}ث`);
  if (boostUntil.ironclad > elapsed) boosts.push(`زره واکنشی ${faDigits(Math.ceil(boostUntil.ironclad - elapsed))}ث`);
  if (boostUntil.recon > elapsed) boosts.push(`اسکن ${faDigits(Math.ceil(boostUntil.recon - elapsed))}ث`);
  $('#activeBoost').textContent = boosts.join('  ·  ');
  $('#activeBoost').classList.toggle('hidden', boosts.length === 0);
  if (selectedEntity && !selectedEntity.destroyed) refreshSelectionHealth();
  updateProductionBars();
  const signature = `${playerFaction().id}:${BUILDINGS.map((item) => playerBuildingCount(item.kind)).join('')}:${playerBuildingCount(playerFaction().special.kind)}`;
  if (signature !== techSignatureCache) {
    techSignatureCache = signature;
    renderToolbar();
  }
  updateToolbarAvailability();
  updateToolbarHint();
  drawMinimap();
}

function updateProductionBars() {
  for (const building of buildings) {
    if (!building.productionBar) continue;
    const job = building.queue?.[0];
    building.productionBar.group.visible = Boolean(job);
    if (!job) continue;
    const progress = THREE.MathUtils.clamp(1 - Math.max(0, job.remaining) / Math.max(.001, job.total), .02, 1);
    building.productionBar.fill.scale.x = progress;
    building.productionBar.fill.position.x = -(building.productionBar.width * (1 - progress)) / 2;
  }
}

function drawMinimap() {
  if (!minimapCtx) return;
  const width = minimap.width;
  const height = minimap.height;
  const px = (x) => (x + HALF_W) / MAP_W * width;
  const py = (z) => (z + HALF_D) / MAP_D * height;
  minimapCtx.clearRect(0, 0, width, height);
  minimapCtx.fillStyle = '#45614e';
  minimapCtx.fillRect(0, 0, width, height);
  minimapCtx.fillStyle = 'rgba(155,145,105,.38)';
  minimapCtx.fillRect(0, py(-1.8), width, (3.6 / MAP_D) * height);
  minimapCtx.fillStyle = 'rgba(155,145,105,.22)';
  minimapCtx.fillRect(px(-1.5), 0, (3 / MAP_W) * width, height);
  minimapCtx.strokeStyle = 'rgba(218,227,191,.16)';
  minimapCtx.lineWidth = 1;
  for (let x = -30; x <= 30; x += 10) { minimapCtx.beginPath(); minimapCtx.moveTo(px(x), 0); minimapCtx.lineTo(px(x), height); minimapCtx.stroke(); }
  for (let z = -20; z <= 20; z += 10) { minimapCtx.beginPath(); minimapCtx.moveTo(0, py(z)); minimapCtx.lineTo(width, py(z)); minimapCtx.stroke(); }
  for (const building of buildings) {
    minimapCtx.fillStyle = building.owner === 'player' ? '#9df3d6' : '#ff8d80';
    minimapCtx.beginPath();
    const size = building.kind === 'hq' ? 5 : building.kind === 'turret' ? 3.6 : 3.2;
    minimapCtx.arc(px(building.x), py(building.z), size, 0, Math.PI * 2);
    minimapCtx.fill();
  }
  for (const unit of units) {
    minimapCtx.fillStyle = unit.owner === 'player' ? '#e6fff7' : '#ffc9c2';
    minimapCtx.beginPath();
    minimapCtx.arc(px(unit.x), py(unit.z), 2.1, 0, Math.PI * 2);
    minimapCtx.fill();
  }
  const viewWidth = Math.min(cameraHeight * viewport.clientWidth / Math.max(1, viewport.clientHeight), MAP_W);
  const viewHeight = Math.min(cameraHeight, MAP_D);
  minimapCtx.strokeStyle = 'rgba(242,238,199,.65)';
  minimapCtx.lineWidth = 1.2;
  minimapCtx.strokeRect(px(cameraTarget.x - viewWidth / 2), py(cameraTarget.z - viewHeight / 2), viewWidth / MAP_W * width, viewHeight / MAP_D * height);
  minimapCtx.strokeStyle = 'rgba(238,241,218,.75)';
  minimapCtx.strokeRect(1, 1, width - 2, height - 2);
}

function toggleToastTimer(dt) {
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) $('#toast').classList.remove('show');
  }
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(.05, Math.max(.001, (now - lastFrame) / 1000));
  lastFrame = now;
  toggleToastTimer(dt);
  if (gameStarted && !paused && !gameEnded) updateGame(dt);
  for (const unit of units) {
    if (unit.destroyed) continue;
    if (unit.air) unit.group.position.y = unit.altitude + Math.sin(elapsed * 2.2 + unit.bobSeed) * .16;
    if (unit.rotor) unit.rotor.rotation.y += dt * 26;
    if (unit.tailRotor) unit.tailRotor.rotation.x += dt * 34;
  }
  renderer.render(scene, camera);
}

buildStaticWorld();
renderFactionGrid();
setToolbarTab('build');
window.addEventListener('resize', resize);
resize();

// Read-only snapshot used by the automated smoke test and handy while debugging a battle.
window.__frontline = {
  build: (kind, x, z) => {
    if (!gameStarted) return false;
    placementKind = kind;
    placeBuildingAt(x, z);
    placementKind = null;
    if (placementGhost) { scene.remove(placementGhost); placementGhost = null; }
    $('#placementHint').classList.add('hidden');
    updateUI(true);
    return buildings.some((building) => building.owner === 'player' && building.kind === kind);
  },
  train: (kind) => { trainUnit(kind); return true; },
  spawn: (kind, owner, x, z) => createUnit(kind, owner, x, z, owner === 'player' ? selectedFactionId : enemyFactionId),
  hpOf: (kind, owner) => units.filter((unit) => unit.owner === owner && unit.kind === kind).map((unit) => Math.round(unit.hp)),
  rush: () => {
    const target = buildings.find((building) => building.owner === 'enemy' && building.kind === 'hq');
    if (!target) return false;
    for (const unit of units) {
      if (unit.owner !== 'player' || unit.destroyed) continue;
      unit.staging = false;
      unit.holdPosition = false;
      unit.attackTarget = target;
      unit.moveTarget = { x: target.x, z: target.z };
    }
    return true;
  },
  grant: (amount) => { credits += amount; updateUI(true); return credits; },
  hq: () => buildings.find((building) => building.owner === 'player' && building.kind === 'hq') || null,
  ai: () => ({ desired: enemyDesiredBuilding(), goal: enemyUnitGoal, credits: Math.round(enemyCredits), airBuilt: { ...enemyAirSpawned }, power: { ...enemyPower }, spot: enemyDesiredBuilding() ? findEnemyBuildSpot(enemyDesiredBuilding()) : null }),
  entities: () => ({ buildings: buildings.length, units: units.length }),
  snapshot: () => ({
    elapsed: Math.round(elapsed),
    credits: Math.round(credits),
    paused,
    gameStarted,
    gameEnded,
    difficulty: selectedDifficulty,
    power: { supply: power.supply, usage: power.usage, factor: Math.round(power.factor * 100) / 100 },
    player: {
      buildings: buildings.filter((building) => building.owner === 'player').map((building) => ({ kind: building.kind, hp: Math.round(building.hp), x: building.x, z: building.z, queue: building.queue.length })),
      units: units.filter((unit) => unit.owner === 'player').map((unit) => ({ kind: unit.kind, hp: Math.round(unit.hp) })),
    },
    enemy: {
      credits: Math.round(enemyCredits),
      buildings: buildings.filter((building) => building.owner === 'enemy').map((building) => ({ kind: building.kind, hp: Math.round(building.hp), x: building.x, z: building.z, queue: building.queue.length })),
      units: units.filter((unit) => unit.owner === 'enemy').map((unit) => ({ kind: unit.kind, hp: Math.round(unit.hp) })),
    },
    stats: { ...stats },
  }),
};

requestAnimationFrame(animate);
