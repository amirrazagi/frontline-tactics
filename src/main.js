import * as THREE from 'three';
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
const UNIT_LIMIT = 24;

const factions = [
  { id: 'cn', name: 'چین', code: 'CN', color: '#ef5a61', trait: 'تولید انبوه', description: 'هزینهٔ ساخت و تولید نیرو کمتر است.', abilityName: 'تدارکات سریع', abilityText: '۵۰۰ اعتبار دریافت کن.', ability: 'supply', costMult: .88, unitCostMult: .9, special: { kind: 'arsenal', name: 'مجتمع صنعتی', icon: '▥', cost: 880, description: 'درآمد پایگاه را افزایش می‌دهد.', hp: 1100, powerUse: 30, income: 8 } },
  { id: 'ir', name: 'ایران', code: 'IR', color: '#64c695', trait: 'دفاع استوار', description: 'برجک‌های دفاعی برد و قدرت بیشتری دارند.', abilityName: 'سپر دفاعی', abilityText: 'ساختمان‌ها را ترمیم و برای مدتی تقویت کن.', ability: 'fortify', turretMult: 1.28, special: { kind: 'bastion', name: 'پدافند سپهر', icon: '⌁', cost: 920, description: 'برج دفاعی دوربرد با آتش سنگین.', hp: 1050, powerUse: 38, range: 17, damage: 48, cooldown: 1.15 } },
  { id: 'tr', name: 'ترکیه', code: 'TR', color: '#5fa9db', trait: 'تحرک بالا', description: 'واحدهای زمینی سریع‌تر حرکت می‌کنند.', abilityName: 'شتاب رزمی', abilityText: 'سرعت نیروهای زمینی را موقتاً افزایش بده.', ability: 'overdrive', speedMult: 1.2, special: { kind: 'droneport', name: 'پایگاه پهپادی', icon: '◈', cost: 860, description: 'برد دید و تحرک نیروها را افزایش می‌دهد.', hp: 900, powerUse: 32 } },
  { id: 'us', name: 'آمریکا', code: 'US', color: '#5c9cf2', trait: 'پشتیبانی هوایی', description: 'توانایی حملهٔ هوایی تاکتیکی در اختیار است.', abilityName: 'حملهٔ هوایی', abilityText: 'نقطه‌ای روی میدان انتخاب کن تا هدف‌گیری شود.', ability: 'airstrike', special: { kind: 'airfield', name: 'پایگاه هوایی', icon: '✈', cost: 980, description: 'قدرت پشتیبانی هوایی را افزایش می‌دهد.', hp: 1050, powerUse: 45 } },
  { id: 'ru', name: 'روسیه', code: 'RU', color: '#d67962', trait: 'زره سنگین', description: 'واحدها و ساختمان‌ها آسیب کمتری می‌گیرند.', abilityName: 'زره واکنشی', abilityText: 'برای مدتی آسیب دریافتی را کاهش بده.', ability: 'ironclad', armorMult: .84, special: { kind: 'armory', name: 'کارخانهٔ زرهی', icon: '▤', cost: 900, description: 'زره نیروهای زمینی را تقویت می‌کند.', hp: 1250, powerUse: 42 } },
  { id: 'il', name: 'اسرائیل', code: 'IL', color: '#d8bf61', trait: 'شناسایی دقیق', description: 'واحدها دشمن را از فاصلهٔ دورتری تشخیص می‌دهند.', abilityName: 'اسکن میدان', abilityText: 'برد دید نیروها را برای مدتی افزایش بده.', ability: 'recon', rangeMult: 1.2, special: { kind: 'sensor', name: 'مرکز شنود', icon: '⌖', cost: 820, description: 'برد شناسایی و درگیری نیروها را افزایش می‌دهد.', hp: 800, powerUse: 28 } },
  { id: 'in', name: 'هند', code: 'IN', color: '#e99b54', trait: 'اقتصاد پویا', description: 'اعتبار بیشتری از درآمد دوره‌ای به دست می‌آید.', abilityName: 'تجارت منطقه‌ای', abilityText: '۶۵۰ اعتبار به ذخیرهٔ پایگاه اضافه کن.', ability: 'trade', incomeMult: 1.18, special: { kind: 'solar', name: 'مزرعهٔ خورشیدی', icon: '☼', cost: 740, description: 'تولید برق و درآمد پایگاه را بالا می‌برد.', hp: 720, powerOutput: 95, income: 5 } },
  { id: 'fr', name: 'فرانسه', code: 'FR', color: '#75c2c3', trait: 'پشتیبانی میدانی', description: 'ساختمان‌ها از ابتدا مقاوم‌ترند و ترمیم می‌شوند.', abilityName: 'تعمیر اضطراری', abilityText: 'سلامتی نیروها و ساختمان‌ها را بازیابی کن.', ability: 'repair', hpMult: 1.1, special: { kind: 'hospital', name: 'مرکز امداد', icon: '✚', cost: 860, description: 'نیروهای نزدیک را به‌آرامی ترمیم می‌کند.', hp: 980, powerUse: 34 } },
];

const BUILDINGS = [
  { kind: 'generator', name: 'نیروگاه', icon: 'ϟ', cost: 320, hp: 620, powerOutput: 130, powerUse: 0, description: 'تأمین برق پایگاه' },
  { kind: 'barracks', name: 'پادگان', icon: '▰', cost: 500, hp: 900, powerUse: 22, description: 'تولید گشتی و مهندس' },
  { kind: 'factory', name: 'کارخانه', icon: '▥', cost: 720, hp: 1150, powerUse: 42, description: 'تولید زرهی و توپخانه' },
  { kind: 'turret', name: 'برجک دفاعی', icon: '⌖', cost: 470, hp: 840, powerUse: 24, range: 13, damage: 34, cooldown: 1.05, description: 'دفاع خودکار از محدوده' },
  { kind: 'refinery', name: 'پالایشگاه', icon: '♨', cost: 650, hp: 980, powerUse: 26, income: 9, description: 'افزایش درآمد دوره‌ای' },
  { kind: 'radar', name: 'رادار', icon: '◉', cost: 540, hp: 700, powerUse: 24, description: 'گسترش دید تاکتیکی' },
];

const UNITS = [
  { kind: 'scout', name: 'خودروی گشتی', icon: '◈', cost: 320, hp: 360, speed: 4.4, range: 7, scan: 10, damage: 23, cooldown: .9, requires: 'barracks', requiresName: 'پادگان' },
  { kind: 'engineer', name: 'مهندس', icon: '⚒', cost: 240, hp: 260, speed: 3.5, range: 0, scan: 0, damage: 0, cooldown: 0, requires: 'barracks', requiresName: 'پادگان' },
  { kind: 'tank', name: 'تانک زرهی', icon: '▣', cost: 580, hp: 820, speed: 2.7, range: 9, scan: 12, damage: 47, cooldown: 1.35, requires: 'factory', requiresName: 'کارخانه' },
  { kind: 'artillery', name: 'توپخانه', icon: '➤', cost: 690, hp: 500, speed: 1.9, range: 15, scan: 17, damage: 62, cooldown: 2.0, requires: 'factory', requiresName: 'کارخانه' },
];

const BUILDING_INFO = Object.fromEntries([
  ...BUILDINGS,
  { kind: 'hq', name: 'مرکز فرماندهی', icon: '⌂', cost: 0, hp: 2500, powerUse: 0, range: 9.5, damage: 17, cooldown: 1.25 },
].map((item) => [item.kind, item]));
const UNIT_INFO = Object.fromEntries(UNITS.map((item) => [item.kind, item]));

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
let selectedEntity = null;
let activeTab = 'build';
let placementKind = null;
let placementGhost = null;
let abilityMode = null;
let abilityCooldown = 0;
let boostUntil = { fortify: 0, overdrive: 0, ironclad: 0, recon: 0 };
let enemyWaveTimer = 28;
let toastTimer = 0;
let uiTimer = 0;
let passiveHealTimer = 0;
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
  const padSize = kind === 'factory' || kind === 'airfield' ? 5.6 : 4.9;
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
  } else if (kind === 'factory' || kind === 'airfield') {
    addBox(group, 4.55, 1.8, 3.55, 0, 1.11, 0, dark);
    addBox(group, 4.9, .27, 3.9, 0, 2.12, -.02, mid);
    addBox(group, 2.2, 1.35, .18, 0, .95, 1.84, '#252f2c');
    addBox(group, 2.4, .14, .2, 0, 1.68, 1.88, color);
    if (kind === 'airfield') {
      addBox(group, 5.1, .06, 1.15, 0, .34, 2.1, '#454d42');
      for (let i = -2; i <= 2; i++) addBox(group, .48, .035, .1, i * .85, .38, 2.1, '#d7d0aa');
      addCylinder(group, .48, .58, 1.1, 12, 1.65, 2.0, -.75, '#7b8171');
    } else {
      addCylinder(group, .34, .4, 1.5, 10, -1.65, 2.28, -.95, '#777f70');
      addCylinder(group, .43, .46, .15, 10, -1.65, 3.08, -.95, color);
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

function createUnitVisual(kind, color) {
  const group = new THREE.Group();
  const dark = new THREE.Color(color).multiplyScalar(.58);
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
  } else if (kind === 'artillery') {
    addBox(group, 1.35, .42, 2.0, 0, .54, 0, dark);
    addBox(group, .85, .3, .85, 0, .88, -.35, color);
    const barrel = addBox(group, .28, .28, 2.35, 0, 1.08, .82, '#656e61');
    barrel.rotation.x = -.08;
    for (const side of [-1, 1]) {
      for (const z of [-.65, 0, .65]) {
        const wheel = addCylinder(group, .25, .25, .18, 10, side * .72, .37, z, '#2b322d');
        wheel.rotation.z = Math.PI / 2;
      }
    }
  } else {
    const isTank = kind === 'tank';
    addBox(group, isTank ? 1.75 : 1.4, .45, isTank ? 2.25 : 1.8, 0, .58, 0, dark);
    addBox(group, isTank ? 1.35 : 1.05, .39, isTank ? 1.45 : 1.05, 0, .91, -.15, color);
    for (const side of [-1, 1]) {
      for (const z of [-.67, 0, .67]) {
        const wheel = addCylinder(group, isTank ? .26 : .22, isTank ? .26 : .22, .19, 10, side * (isTank ? .88 : .71), .38, z, '#252d29');
        wheel.rotation.z = Math.PI / 2;
      }
    }
    if (isTank) {
      const turret = addCylinder(group, .45, .5, .35, 10, 0, 1.15, -.14, '#657064');
      turret.rotation.x = .02;
      addBox(group, .18, .18, 1.3, 0, 1.22, .65, '#bbc09e');
    } else {
      addBox(group, .48, .22, .62, 0, 1.13, -.1, '#c3c5a0');
    }
  }
  return group;
}

function addEntityDecor(entity, radius, height) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * .88, radius, 32), new THREE.MeshBasicMaterial({ color: getEntityColor(entity.owner, entity.factionId), transparent: true, opacity: .92, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .075;
  ring.visible = false;
  entity.group.add(ring);
  entity.selectionRing = ring;

  const barWidth = entity.entityType === 'building' ? 3.15 : 1.55;
  const barY = height + .52;
  const back = new THREE.Mesh(new THREE.BoxGeometry(barWidth, .13, .09), new THREE.MeshBasicMaterial({ color: 0x17201c, transparent: true, opacity: .9 }));
  back.position.set(0, barY, 0);
  entity.group.add(back);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(barWidth - .06, .085, .13), new THREE.MeshBasicMaterial({ color: 0x6ee0ad }));
  fill.position.set(0, barY + .01, .015);
  entity.group.add(fill);
  entity.healthBar = { fill, width: barWidth - .06 };
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
  const color = owner === 'player' ? faction.color : (owner === 'enemy' ? faction.color : faction.color);
  const hpMult = owner === 'player' ? (faction.hpMult || 1) : 1;
  const group = createBuildingVisual(kind, color, factionId);
  const entity = {
    entityType: 'building', kind, owner, factionId, name: info.name || 'ساختمان', icon: info.icon || '▥',
    x, z, hp: (info.hp || 800) * hpMult, maxHp: (info.hp || 800) * hpMult,
    powerUse: info.powerUse || 0, powerOutput: info.powerOutput || 0, income: info.income || 0,
    attackRange: info.range || (kind === 'hq' ? 9.5 : 0), scanRange: info.range || (kind === 'hq' ? 10 : 0),
    damage: info.damage || (kind === 'hq' ? 17 : 0), cooldown: info.cooldown || (kind === 'hq' ? 1.25 : 0),
    lastShot: 0, attackTarget: null, destroyed: false, group,
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
  const hpMult = owner === 'player' ? (faction.hpMult || 1) : 1;
  const group = createUnitVisual(kind, faction.color);
  const entity = {
    entityType: 'unit', kind, owner, factionId, name: info.name, icon: info.icon,
    x, z, hp: info.hp * hpMult, maxHp: info.hp * hpMult,
    speed: info.speed * (owner === 'player' ? (faction.speedMult || 1) : 1),
    attackRange: info.range * (owner === 'player' ? (faction.rangeMult || 1) : 1),
    scanRange: info.scan * (owner === 'player' ? (faction.rangeMult || 1) : 1), damage: info.damage,
    cooldown: info.cooldown, lastShot: 0, attackTarget: null, moveTarget: null, destroyed: false, group,
  };
  group.position.set(x, 0, z);
  group.userData.entity = entity;
  addEntityDecor(entity, kind === 'tank' || kind === 'artillery' ? 1.65 : .98, kind === 'engineer' ? 1.8 : 1.8);
  scene.add(group);
  units.push(entity);
  updateHealthBar(entity);
  return entity;
}

function clearEntities() {
  for (const entity of [...buildings, ...units]) scene.remove(entity.group);
  buildings.length = 0;
  units.length = 0;
  effects.forEach((effect) => scene.remove(effect.object));
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

function getBuildingCost(kind) {
  const info = findBuildingInfo(kind) || BUILDING_INFO.generator;
  return Math.ceil(info.cost * (playerFaction().costMult || 1));
}

function getUnitCost(kind) {
  const info = UNIT_INFO[kind];
  return Math.ceil(info.cost * (playerFaction().unitCostMult || playerFaction().costMult || 1));
}

function renderToolbar() {
  const list = $('#buildList');
  const options = activeTab === 'build'
    ? [...BUILDINGS, playerFaction().special]
    : UNITS;
  list.innerHTML = options.map((item) => {
    const isBuilding = activeTab === 'build';
    const price = isBuilding ? getBuildingCost(item.kind) : getUnitCost(item.kind);
    const requirement = !isBuilding && playerBuildingCount(item.requires) === 0 ? item.requiresName : '';
    const extra = item.description || (isBuilding ? '' : 'آمادهٔ تولید');
    return `<button type="button" class="build-card ${isBuilding ? '' : 'train-card'}" data-kind="${item.kind}" data-building="${isBuilding}" ${requirement ? 'disabled' : ''} title="${extra}">
      <span class="build-icon" style="color:${isBuilding ? playerFaction().color : '#9de4cc'}">${item.icon}</span>
      <span class="build-copy"><strong>${item.name}</strong><small class="cost">◆ ${fmt(price)}</small>${requirement ? `<small class="requires">نیاز: ${requirement}</small>` : ''}</span>
    </button>`;
  }).join('');

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
    if (!isBuilding) missingRequirement = playerBuildingCount(UNIT_INFO[kind].requires) === 0;
    button.disabled = !gameStarted || paused || gameEnded || credits < cost || missingRequirement || (!isBuilding && playerUnitCount() >= UNIT_LIMIT);
    button.classList.toggle('active', isBuilding && placementKind === kind);
    const costNode = button.querySelector('.cost');
    if (costNode) costNode.textContent = `◆ ${fmt(cost)}`;
  });
}

function setToolbarTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.toolbar-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
  $('#toolbarHint').textContent = tab === 'build' ? 'گزینه‌ای را انتخاب کنید، سپس محل ساخت را روی زمین بزنید' : 'تولید نیرو نیازمند ساختمان مناسب است';
  renderToolbar();
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
  credits = 2350;
  abilityCooldown = 0;
  boostUntil = { fortify: 0, overdrive: 0, ironclad: 0, recon: 0 };
  enemyWaveTimer = 26;
  passiveHealTimer = 0;
  placementKind = null;
  abilityMode = null;
  cameraHeight = 44;
  cameraTarget.set(-18, 0, -11);
  updateCamera();
  $('#startScreen').classList.add('hidden');
  $('#resultScreen').classList.add('hidden');
  $('#pauseVeil').classList.add('hidden');
  $('#placementHint').classList.add('hidden');
  $('#pauseBtn').innerHTML = '<span>Ⅱ</span>';
  $('#pauseBtn').title = 'توقف بازی';

  createBuilding('hq', 'player', -24, -14, selectedFactionId);
  createBuilding('generator', 'player', -30, -14, selectedFactionId);
  createBuilding('barracks', 'player', -23, -20, selectedFactionId);
  createUnit('tank', 'player', -17.5, -15.4, selectedFactionId);
  createUnit('scout', 'player', -17, -11.6, selectedFactionId);
  createUnit('engineer', 'player', -25.6, -8.8, selectedFactionId);
  if (selectedFactionId === 'us') createUnit('scout', 'player', -20, -8.6, selectedFactionId);

  createBuilding('hq', 'enemy', 24, 14, enemyFactionId);
  createBuilding('generator', 'enemy', 30, 14, enemyFactionId);
  createBuilding('barracks', 'enemy', 23, 20, enemyFactionId);
  createBuilding('factory', 'enemy', 29, 20, enemyFactionId);
  const enemyTank = createUnit('tank', 'enemy', 17, 15.5, enemyFactionId);
  enemyTank.attackTarget = buildings.find((building) => building.owner === 'player' && building.kind === 'hq');
  const enemyScout = createUnit('scout', 'enemy', 17, 11, enemyFactionId);
  enemyScout.attackTarget = buildings.find((building) => building.owner === 'player' && building.kind === 'hq');

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
  updateUI(true);
  showToast(`فرمانده ${playerFaction().name}، پایگاه آماده است. مرکز دشمن را پیدا کن.`);
}

function setSelection(entity) {
  if (selectedEntity && selectedEntity.selectionRing) selectedEntity.selectionRing.visible = false;
  selectedEntity = entity && !entity.destroyed ? entity : null;
  if (selectedEntity && selectedEntity.selectionRing) selectedEntity.selectionRing.visible = true;
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
    actions = `<div class="selection-actions"><button class="mini-action" data-action="stop">توقف حرکت</button>${selectedEntity.damage > 0 ? '<button class="mini-action" data-action="attack">حالت حمله</button>' : ''}</div>`;
  } else if (friendly && ['barracks', 'factory'].includes(selectedEntity.kind)) {
    actions = `<div class="selection-actions"><button class="mini-action" data-action="train">رفتن به تولید نیرو</button></div>`;
  } else if (friendly && selectedEntity.kind === 'hq') {
    actions = `<div class="selection-actions"><button class="mini-action" data-action="build">فرمان‌های ساخت</button></div>`;
  }
  card.innerHTML = `<div class="selection-entity-head"><span class="selection-entity-icon" style="color:${factionById(selectedEntity.factionId).color}">${selectedEntity.icon}</span><div class="selection-data"><strong>${selectedEntity.name}</strong><small>${selectedEntity.entityType === 'unit' ? 'واحد میدانی' : 'ساختمان پایگاه'}</small></div><span class="owner-tag" style="color:${friendly ? '#86d9b5' : '#f28b7f'}">${friendly ? 'خودی' : 'دشمن'}</span></div><div class="health-track"><span style="width:${ratio}%"></span></div>${actions}`;
  card.querySelectorAll('.mini-action').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'stop') { selectedEntity.moveTarget = null; selectedEntity.attackTarget = null; showToast('دستور حرکت لغو شد.'); }
    if (action === 'attack') { abilityMode = 'unitAttack'; showToast('برای حمله، روی واحد یا ساختمان دشمن بزنید.'); }
    if (action === 'train') setToolbarTab('train');
    if (action === 'build') setToolbarTab('build');
  }));
}

function startPlacement(kind) {
  if (!gameStarted || paused || gameEnded) return;
  placementKind = kind;
  abilityMode = null;
  $('#placementHint').classList.remove('hidden');
  $('#placementHint').innerHTML = 'نقطهٔ ساخت را انتخاب کنید <kbd>Esc</kbd> برای لغو';
  if (placementGhost) scene.remove(placementGhost);
  placementGhost = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, .08, 32), new THREE.MeshBasicMaterial({ color: 0x6de2b1, transparent: true, opacity: .28 }));
  plate.position.y = .15;
  placementGhost.add(plate);
  const outline = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.72, 32), new THREE.MeshBasicMaterial({ color: 0x8af0c4, transparent: true, opacity: .95, side: THREE.DoubleSide }));
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

function validBuildSpot(x, z, kind) {
  const boundary = kind === 'factory' ? 4.2 : 3.4;
  if (Math.abs(x) > HALF_W - boundary || Math.abs(z) > HALF_D - boundary) return false;
  const friendly = buildings.filter((building) => building.owner === 'player');
  const connected = friendly.some((building) => Math.hypot(building.x - x, building.z - z) < 16.2);
  if (!connected) return false;
  const overlap = buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 5.5);
  return !overlap;
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
    showToast('این نقطه مناسب نیست؛ نزدیک پایگاه و دور از ساختمان‌ها انتخاب کن.');
    return;
  }
  const cost = getBuildingCost(kind);
  if (credits < cost) {
    showToast('اعتبار کافی نیست.');
    return;
  }
  credits -= cost;
  createBuilding(kind, 'player', point.x, point.z, selectedFactionId);
  cancelPlacement();
  updateUI(true);
  showToast(`${(findBuildingInfo(kind) || {}).name || 'ساختمان'} ساخته شد.`);
}

function trainUnit(kind) {
  const info = UNIT_INFO[kind];
  if (!info || !gameStarted || paused || gameEnded) return;
  if (playerBuildingCount(info.requires) === 0) {
    showToast(`برای تولید ${info.name} به ${info.requiresName} نیاز داری.`);
    return;
  }
  if (playerUnitCount() >= UNIT_LIMIT) {
    showToast('ظرفیت نیروها پر شده است.');
    return;
  }
  const cost = getUnitCost(kind);
  if (credits < cost) {
    showToast('اعتبار کافی نیست.');
    return;
  }
  const producer = buildings.find((building) => building.owner === 'player' && building.kind === info.requires);
  if (!producer) return;
  credits -= cost;
  const offset = units.length % 2 ? 3.7 : 4.1;
  const unit = createUnit(kind, 'player', producer.x + offset, producer.z + 1.5, selectedFactionId);
  if (selectedEntity && selectedEntity.owner === 'player' && selectedEntity.entityType === 'unit') setSelection(selectedEntity);
  updateUI(true);
  showToast(`${info.name} در میدان مستقر شد.`);
  if (unit) unit.moveTarget = { x: producer.x + offset + 2, z: producer.z + 1.5 };
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
    if (selectedEntity?.entityType === 'unit' && selectedEntity.owner === 'player') selectedEntity.attackTarget = clicked;
    else units.filter((unit) => unit.owner === 'player' && unit.damage > 0).forEach((unit) => { unit.attackTarget = clicked; unit.moveTarget = { x: clicked.x, z: clicked.z }; });
    abilityMode = null;
    showToast('دستور حمله صادر شد.');
    return;
  }
  if (clicked) {
    if (clicked.owner === 'player') {
      setSelection(clicked);
      if (button === 2 && selectedEntity?.entityType === 'unit') {
        selectedEntity.moveTarget = { x: clicked.x, z: clicked.z };
      }
      return;
    }
    if (selectedEntity?.owner === 'player' && selectedEntity.entityType === 'unit' && selectedEntity.damage > 0) {
      selectedEntity.attackTarget = clicked;
      selectedEntity.moveTarget = { x: clicked.x, z: clicked.z };
      showToast(`هدف انتخاب شد: ${clicked.name}`);
    } else if (button === 2) {
      units.filter((unit) => unit.owner === 'player' && unit.damage > 0).forEach((unit) => { unit.attackTarget = clicked; unit.moveTarget = { x: clicked.x, z: clicked.z }; });
      showToast('نیروهای در دسترس به هدف حمله می‌کنند.');
    } else {
      setSelection(clicked);
    }
    return;
  }
  if (point && selectedEntity?.owner === 'player' && selectedEntity.entityType === 'unit') {
    selectedEntity.attackTarget = null;
    selectedEntity.moveTarget = { x: point.x, z: point.z };
    abilityMode = null;
    showToast('دستور حرکت صادر شد.');
  } else if (point && button === 2) {
    units.filter((unit) => unit.owner === 'player').forEach((unit) => { unit.attackTarget = null; unit.moveTarget = { x: point.x, z: point.z }; });
  } else if (point && selectedEntity && selectedEntity.owner !== 'player') {
    setSelection(null);
  }
}

renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button === 2) event.preventDefault();
  pointerState = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, button: event.button };
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
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
  if (!pointerState || pointerState.id !== event.pointerId) return;
  const state = pointerState;
  pointerState = null;
  if (!state.moved) handleCanvasAction(event.clientX, event.clientY, state.button);
});
renderer.domElement.addEventListener('pointercancel', () => { pointerState = null; });
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraHeight = THREE.MathUtils.clamp(cameraHeight + Math.sign(event.deltaY) * 2.4, 30, 70);
  resize();
}, { passive: false });

minimap.addEventListener('pointerdown', (event) => {
  if (!gameStarted) return;
  const rect = minimap.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * MAP_W - HALF_W;
  const z = (event.clientY - rect.top) / rect.height * MAP_D - HALF_D;
  cameraTarget.set(x, 0, z);
  updateCamera();
});

function useAbility() {
  if (!gameStarted || paused || gameEnded || abilityCooldown > 0) return;
  const ability = playerFaction().ability;
  if (ability === 'airstrike') {
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
    const airfieldBonus = playerBuildingCount('airfield') > 0 ? 1.3 : 1;
    targets.forEach((target) => damageEntity(target, (target.kind === 'hq' ? 260 : 390) * airfieldBonus, null));
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

$('#abilityBtn').addEventListener('click', useAbility);
$('#startBtn').addEventListener('click', () => startGame(selectedFactionId));
$('#restartBtn').addEventListener('click', () => {
  if (!gameStarted) { $('#startScreen').classList.remove('hidden'); return; }
  startGame(selectedFactionId);
});
$('#playAgainBtn').addEventListener('click', () => startGame(selectedFactionId));
$('#pauseBtn').addEventListener('click', togglePause);

function togglePause() {
  if (!gameStarted || gameEnded) return;
  paused = !paused;
  $('#pauseVeil').classList.toggle('hidden', !paused);
  $('#pauseBtn').innerHTML = paused ? '<span>▶</span>' : '<span>Ⅱ</span>';
  $('#pauseBtn').title = paused ? 'ادامهٔ بازی' : 'توقف بازی';
  updateToolbarAvailability();
}

function cancelModes() {
  if (placementKind || abilityMode) {
    cancelPlacement();
    $('#placementHint').classList.add('hidden');
  }
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { cancelModes(); return; }
  if (!gameStarted || paused || gameEnded) return;
  const step = cameraHeight * .08;
  if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') cameraTarget.x -= step;
  if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') cameraTarget.x += step;
  if (event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') cameraTarget.z -= step;
  if (event.key.toLowerCase() === 's' || event.key === 'ArrowDown') cameraTarget.z += step;
  updateCamera();
});

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = 2.5;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function nearestEnemy(attacker, maxRange) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const candidate of [...units, ...buildings]) {
    if (candidate.owner === attacker.owner || candidate.destroyed || candidate.hp <= 0) continue;
    const d = distance(attacker, candidate);
    if (d <= maxRange && d < nearestDistance) { nearest = candidate; nearestDistance = d; }
  }
  return nearest;
}

function updateMovement(dt) {
  for (const unit of [...units]) {
    if (unit.destroyed) continue;
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
      continue;
    }
    const speedBoost = unit.owner === 'player' && boostUntil.overdrive > elapsed ? 1.65 : 1;
    const droneportBoost = unit.owner === 'player' && playerBuildingCount('droneport') > 0 ? 1.12 : 1;
    const speed = unit.speed * speedBoost * droneportBoost;
    const step = Math.min(d, speed * dt);
    unit.x += dx / d * step;
    unit.z += dz / d * step;
    unit.group.position.set(unit.x, 0, unit.z);
    unit.group.rotation.y = Math.atan2(dx, dz);
  }
}

function updateCombat(now) {
  const attackers = [...buildings, ...units].filter((entity) => !entity.destroyed && entity.damage > 0);
  for (const attacker of attackers) {
    let target = attacker.attackTarget;
    if (!target || target.destroyed || target.hp <= 0 || target.owner === attacker.owner) {
      attacker.attackTarget = null;
      target = null;
    }
    const scanBonus = attacker.owner === 'player' && boostUntil.recon > elapsed ? 5 : 0;
    const specialBonus = attacker.owner === 'player' ? (playerBuildingCount('sensor') > 0 ? 2.5 : 0) + (playerBuildingCount('droneport') > 0 ? 1.5 : 0) : 0;
    if (!target) {
      target = nearestEnemy(attacker, (attacker.scanRange || attacker.attackRange) + scanBonus + specialBonus);
      if (target) attacker.attackTarget = target;
    }
    if (!target) continue;
    const dist = distance(attacker, target);
    const rangeBonus = attacker.owner === 'player' ? (playerFaction().rangeMult ? 0 : 0) : 0;
    const range = attacker.attackRange + rangeBonus + (attacker.owner === 'player' && playerBuildingCount('sensor') > 0 ? 1.4 : 0);
    if (attacker.entityType === 'unit' && dist > range) {
      attacker.moveTarget = { x: target.x, z: target.z };
      continue;
    }
    if (dist <= range && elapsed - attacker.lastShot >= attacker.cooldown) {
      attacker.lastShot = elapsed;
      let damage = attacker.damage;
      if (attacker.owner === 'player' && playerFaction().turretMult && (attacker.kind === 'turret' || attacker.kind === 'bastion')) damage *= playerFaction().turretMult;
      if (attacker.owner === 'player' && playerBuildingCount('bastion') > 0 && attacker.entityType === 'building' && attacker.kind === 'turret') damage *= 1.2;
      if (attacker.owner === 'player' && playerFaction().ability === 'airstrike' && playerBuildingCount('airfield') > 0) damage *= 1.1;
      createShot(attacker, target);
      damageEntity(target, damage, attacker);
    }
  }
}

function createShot(attacker, target) {
  const startY = attacker.entityType === 'building' ? 2.25 : 1.0;
  const endY = target.entityType === 'building' ? 1.55 : .85;
  const points = [new THREE.Vector3(attacker.x, startY, attacker.z), new THREE.Vector3(target.x, endY, target.z)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const color = attacker.owner === 'player' ? new THREE.Color(playerFaction().color) : new THREE.Color(enemyFaction().color);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .88 }));
  scene.add(line);
  effects.push({ object: line, remaining: .16 });
}

function damageEntity(target, amount, attacker) {
  if (!target || target.destroyed) return;
  let reduction = 1;
  if (target.owner === 'player') {
    if (playerFaction().armorMult) reduction *= playerFaction().armorMult;
    if (boostUntil.ironclad > elapsed) reduction *= .58;
    if (playerBuildingCount('armory') > 0) reduction *= .9;
  }
  const applied = Math.max(1, amount * reduction);
  target.hp -= applied;
  updateHealthBar(target);
  if (selectedEntity === target) renderSelection();
  if (target.hp <= 0) destroyEntity(target, attacker);
}

function healEntity(entity, amount) {
  if (!entity || entity.destroyed) return;
  entity.hp = Math.min(entity.maxHp, entity.hp + amount);
  updateHealthBar(entity);
}

function destroyEntity(entity, attacker) {
  if (!entity || entity.destroyed) return;
  entity.destroyed = true;
  scene.remove(entity.group);
  const list = entity.entityType === 'building' ? buildings : units;
  const index = list.indexOf(entity);
  if (index >= 0) list.splice(index, 1);
  for (const other of [...buildings, ...units]) if (other.attackTarget === entity) other.attackTarget = null;
  if (selectedEntity === entity) setSelection(null);
  if (entity.kind === 'hq') {
    finishGame(entity.owner === 'enemy');
  } else if (entity.owner === 'player') {
    showToast(`${entity.name} از دست رفت.`);
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
}

function updateEconomy(dt) {
  const refineries = buildings.filter((building) => building.owner === 'player' && building.kind === 'refinery').length;
  const specialCount = buildings.filter((building) => building.owner === 'player' && building.kind === playerFaction().special.kind).length;
  let income = 17 + refineries * 9;
  income += specialCount * (playerFaction().special.income || 0);
  if (playerFaction().incomeMult) income *= playerFaction().incomeMult;
  credits += income * dt;
}

function updatePower() {
  const playerBuildings = buildings.filter((building) => building.owner === 'player');
  const generation = playerBuildings.reduce((total, building) => total + (building.powerOutput || 0), 0);
  const usage = playerBuildings.reduce((total, building) => total + (building.powerUse || 0), 0);
  return { supply: generation, usage };
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

function updateEnemyAI(dt) {
  enemyWaveTimer -= dt;
  if (enemyWaveTimer > 0) return;
  enemyWaveTimer = Math.max(19, 34 - elapsed / 95);
  if (enemyUnitCount() >= 12) return;
  const enemyHQ = buildings.find((building) => building.owner === 'enemy' && building.kind === 'hq');
  const playerHQ = buildings.find((building) => building.owner === 'player' && building.kind === 'hq');
  if (!enemyHQ || !playerHQ) return;
  const type = elapsed > 105 && Math.random() > .45 ? 'tank' : 'scout';
  const unit = createUnit(type, 'enemy', enemyHQ.x - 5, enemyHQ.z - 2.6, enemyFactionId);
  unit.attackTarget = playerHQ;
  unit.moveTarget = { x: playerHQ.x, z: playerHQ.z };
  if (enemyUnitCount() <= 5) showToast('هشدار: نیروهای دشمن در حال پیشروی هستند.');
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
  updateEconomy(dt);
  updateMovement(dt);
  updateCombat(performance.now());
  updateEnemyAI(dt);
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
  const power = updatePower();
  $('#powerValue').textContent = `${fmt(power.supply)} / ${fmt(power.usage)}`;
  $('#powerValue').style.color = power.supply < power.usage ? '#fb8a7c' : '#edf4f1';
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
  if (selectedEntity && !selectedEntity.destroyed) renderSelection();
  updateToolbarAvailability();
  drawMinimap();
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
    minimapCtx.fillStyle = building.owner === 'player' ? playerFaction().color : enemyFaction().color;
    minimapCtx.beginPath();
    const size = building.kind === 'hq' ? 5 : building.kind === 'turret' ? 3.6 : 3.2;
    minimapCtx.arc(px(building.x), py(building.z), size, 0, Math.PI * 2);
    minimapCtx.fill();
  }
  for (const unit of units) {
    minimapCtx.fillStyle = unit.owner === 'player' ? '#dcfff0' : '#ffe0dc';
    minimapCtx.beginPath();
    minimapCtx.arc(px(unit.x), py(unit.z), 2.2, 0, Math.PI * 2);
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
  renderer.render(scene, camera);
}

buildStaticWorld();
renderFactionGrid();
setToolbarTab('build');
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
