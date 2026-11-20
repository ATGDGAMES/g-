import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';

import type {
  BuildPieceType,
  ChestNode,
  CombatantState,
  GamePhase,
  HudSnapshot,
  KillFeedEntry,
  LootPickup,
  MaterialType,
  MinimapMarker,
  P2PMessage,
  SkinId,
  StormState,
  StructurePiece,
  WeaponId,
  WeaponRarity,
} from '../game/types';
import {
  getSurfaceRGB,
  getTerrainHeight,
  ISLAND_RADIUS,
  WATER_LEVEL,
  WORLD_HALF_EXTENT,
} from '../game/terrain';
import {
  createSeededRng,
  generateIslandWorld,
  GRID_SIZE,
  PLAYER_SPAWN,
  snapToBuildGrid,
  WALL_HEIGHT,
} from '../game/mapData';
import {
  applyDamage,
  applyHealing,
  BUILD_COST,
  canPlaceBuildPiece,
  computeShotDamage,
  createPlayerBuildPiece,
  damageStructure,
} from '../game/rules';
import { createInitialStorm, getStormDamagePerSecond, isInsideSafeZone, stepStorm } from '../game/storm';
import { computeBotIntent, createBotCombatant } from '../game/botAI';
import { getSkinDef } from '../game/skins';
import { RARITY_COLORS, WEAPONS } from '../game/weapons';
import { SoundEffects } from './audio';
import { createProceduralTexturePack, type ProceduralTexturePack } from './textures';
import {
  createBattleBusMesh,
  createCharacterRig,
  createChestMesh,
  createCloudCluster,
  createMaterialLibrary,
  createStructureMesh,
  createWeaponModel,
  type CharacterRig,
  type MaterialLibrary,
} from './meshes';

// Pre-allocated scratch math helpers (zero GC inside render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

const TOTAL_LOBBY_SIZE = 100;
const PARTICLE_POOL_SIZE = 220;
const TRACER_POOL_SIZE = 32;

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

interface TracerSlot {
  line: THREE.Line;
  life: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onSendP2P: (msg: P2PMessage) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private texPack: ProceduralTexturePack;
  private mats: MaterialLibrary;
  private sfx = new SoundEffects();

  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private hudEmitAccum = 0;
  private netStateAccum = 0;
  private worldSnapAccum = 0;

  // World & Gameplay State
  private phase: GamePhase = 'title';
  private isHost = true;
  private matchSeed = 101;
  private rand = createSeededRng(101);
  private matchTime = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private hitMarkerTimer = 0;
  private hitMarkerKind: HudSnapshot['hitMarkerKind'] = 'none';
  private damageDealt = 0;
  private structuresBuilt = 0;
  private killerName: string | null = null;
  private p2pPeersConnected = 0;

  // Entities
  private localPlayerId = 'local_player';
  private localPlayerName = 'Explorer';
  private selectedSkin: SkinId = 'jonesy';
  private localPlayer!: CombatantState;
  private combatants: CombatantState[] = [];
  private remotePeers = new Map<string, CombatantState>();
  private rigs = new Map<string, { rig: CharacterRig; walkPhase: number }>();

  private structures: StructurePiece[] = [];
  private structureMeshes = new Map<string, THREE.Group>();
  private structureColliders: THREE.Object3D[] = [];

  private chests: ChestNode[] = [];
  private chestVisuals = new Map<string, { root: THREE.Group; lid: THREE.Group; glow: THREE.PointLight }>();

  private loot: LootPickup[] = [];
  private lootMeshes = new Map<string, THREE.Group>();

  private storm: StormState = createInitialStorm(101);
  private stormWallMesh!: THREE.Mesh;
  private battleBus!: THREE.Group;
  private clouds: THREE.Group[] = [];
  private worldProps: THREE.Object3D[] = [];
  private buildPreviewGroup!: THREE.Group;
  private buildRotationQuarter = 0;
  private lastInteractPrompt: string | null = null;

  // Input state
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private mouseDown = false;
  private rightMouseDown = false;
  private pointerLocked = false;
  private isDraggingLook = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;

  // Pooled FX
  private particleMesh!: THREE.InstancedMesh;
  private particles: ParticleSlot[] = [];
  private particleCursor = 0;
  private tracers: TracerSlot[] = [];
  private tracerCursor = 0;
  private shotPings: Array<{ x: number; z: number; ttl: number }> = [];
  private killFeed: KillFeedEntry[] = [];
  private nextStructSeq = 1;
  private nextLootSeq = 1;

  // Camera smoothing
  private camPos = new THREE.Vector3(-4, 15, 65);
  private camTarget = new THREE.Vector3(0, 6, 0);
  private raycaster = new THREE.Raycaster();

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.94;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7cc4ff);
    this.scene.fog = new THREE.Fog(0x9bd6ff, 195, 560);

    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(68, aspect, 0.15, 760);

    // Studio IBL Environment Map for metallic & clearcoat materials
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.texPack = createProceduralTexturePack(
      this.isSoftwareGl ? 1 : Math.min(4, this.renderer.capabilities.getMaxAnisotropy()),
    );
    this.mats = createMaterialLibrary(this.texPack);

    this.setupLightingAndSky();
    this.buildTerrainAndWater();
    this.initPooledEffects();
    this.initBuildPreview();

    this.battleBus = createBattleBusMesh();
    this.battleBus.position.set(-28, 54, 10);
    this.scene.add(this.battleBus);

    // Populate stylized drifting Chapter 1 clouds
    const cloudCoords: Array<[number, number, number, number]> = [
      [-180, 92, -140, 1.3],
      [-60, 102, -210, 1.5],
      [110, 88, -160, 1.2],
      [210, 96, -30, 1.4],
      [-220, 86, 40, 1.1],
      [160, 105, 140, 1.6],
      [-90, 98, 190, 1.3],
      [35, 90, -45, 1.0],
      [-140, 110, 110, 1.4],
      [240, 94, -190, 1.2],
    ];
    for (const [cx, cy, cz, cs] of cloudCoords) {
      const cloud = createCloudCluster();
      cloud.position.set(cx, cy, cz);
      cloud.scale.setScalar(cs);
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }

    // Populate initial showcase world for the live Title Flyover
    this.loadWorld(101, 'Explorer', true, false);
    this.setPhase('title');

    // Render initial title lobby frame synchronously (character in right foreground + island vista)
    this.positionTitleShowcase(0);
    this.updateStormMesh();
    this.renderer.render(this.scene, this.camera);

    this.bindEvents();
    this.startLoop();
  }

  private setupLightingAndSky(): void {
    // Chapter 1 Season 1 warm late-afternoon Sky Dome
    const sky = new Sky();
    sky.scale.setScalar(1600);
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 3.6;
    skyUniforms['rayleigh'].value = 1.6;
    skyUniforms['mieCoefficient'].value = 0.004;
    skyUniforms['mieDirectionalG'].value = 0.82;
    const sunVec = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(138));
    skyUniforms['sunPosition'].value.copy(sunVec);
    this.scene.add(sky);

    // Cool sky / warm ground bounce HemisphereLight
    const hemi = new THREE.HemisphereLight(0x8ecaff, 0x3b5922, 0.54);
    this.scene.add(hemi);

    // Warm golden Key Sun Light
    const sun = new THREE.DirectionalLight(0xfff0cc, 1.5);
    sun.position.set(110, 165, 95);
    if (!this.isSoftwareGl) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 15;
      sun.shadow.camera.far = 420;
      const d = 140;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.02;
    }
    this.scene.add(sun);

    // Subtle cool Rim Light
    const rim = new THREE.DirectionalLight(0x93c5fd, 0.48);
    rim.position.set(-90, 60, -100);
    this.scene.add(rim);
  }

  private buildTerrainAndWater(): void {
    const segs = 140;
    const size = WORLD_HALF_EXTENT * 2;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const [r, g, b] = getSurfaceRGB(x, z, y);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: this.texPack.terrainDetailMap,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(geo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // Sparkling coastal ocean water plane with stylized caustics
    const waterGeo = new THREE.PlaneGeometry(WORLD_HALF_EXTENT * 4, WORLD_HALF_EXTENT * 4);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      map: this.texPack.waterMap,
      color: 0x38bdf8,
      roughness: 0.16,
      metalness: 0.28,
      transparent: true,
      opacity: 0.88,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = WATER_LEVEL;
    this.scene.add(waterMesh);

    // Purple Storm Wall Cylinder
    const stormGeo = new THREE.CylinderGeometry(1, 1, 96, 64, 1, true);
    const stormMat = new THREE.MeshBasicMaterial({
      map: this.texPack.stormMap,
      color: 0xd8b4fe,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.stormWallMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormWallMesh.position.y = 44;
    this.scene.add(this.stormWallMesh);
  }

  private initPooledEffects(): void {
    const pGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, PARTICLE_POOL_SIZE);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;

    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: 0xffffff,
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.scene.add(this.particleMesh);

    // Tracer line pool
    for (let i = 0; i < TRACER_POOL_SIZE; i++) {
      const lGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -100, 0),
        new THREE.Vector3(0, -100, 0),
      ]);
      const lMat = new THREE.LineBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(lGeo, lMat);
      line.frustumCulled = false;
      line.visible = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0 });
    }
  }

  private initBuildPreview(): void {
    this.buildPreviewGroup = new THREE.Group();
    this.buildPreviewGroup.visible = false;
    this.scene.add(this.buildPreviewGroup);
    this.rebuildPreviewGeometry('wall', true);
  }

  private rebuildPreviewGeometry(kind: BuildPieceType, valid: boolean): void {
    while (this.buildPreviewGroup.children.length > 0) {
      const c = this.buildPreviewGroup.children[0] as THREE.Mesh;
      c.geometry?.dispose();
      this.buildPreviewGroup.remove(c);
    }
    const mat = valid ? this.mats.blueprintValid : this.mats.blueprintInvalid;
    if (kind === 'wall') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(GRID_SIZE, WALL_HEIGHT, 0.24), mat);
      m.position.y = WALL_HEIGHT / 2;
      this.buildPreviewGroup.add(m);
    } else if (kind === 'floor') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(GRID_SIZE, 0.22, GRID_SIZE), mat);
      m.position.y = 0.11;
      this.buildPreviewGroup.add(m);
    } else if (kind === 'ramp') {
      const diag = Math.hypot(GRID_SIZE, WALL_HEIGHT);
      const m = new THREE.Mesh(new THREE.BoxGeometry(GRID_SIZE, 0.22, diag), mat);
      m.position.y = WALL_HEIGHT / 2;
      m.rotation.x = Math.atan2(WALL_HEIGHT, GRID_SIZE);
      this.buildPreviewGroup.add(m);
    } else {
      const m = new THREE.Mesh(new THREE.ConeGeometry(GRID_SIZE * 0.72, 2.2, 4), mat);
      m.position.y = 1.1;
      m.rotation.y = Math.PI / 4;
      this.buildPreviewGroup.add(m);
    }
  }

  private clearWorldVisuals(): void {
    for (const grp of this.structureMeshes.values()) {
      this.scene.remove(grp);
    }
    this.structureMeshes.clear();
    this.structureColliders = [];

    for (const c of this.chestVisuals.values()) {
      this.scene.remove(c.root);
    }
    this.chestVisuals.clear();

    for (const l of this.lootMeshes.values()) {
      this.scene.remove(l);
    }
    this.lootMeshes.clear();

    for (const r of this.rigs.values()) {
      this.scene.remove(r.rig.root);
    }
    this.rigs.clear();

    for (const prop of this.worldProps) {
      this.scene.remove(prop);
    }
    this.worldProps = [];
  }

  private loadWorld(
    seed: number,
    playerName: string,
    isHost: boolean,
    spawnBots: boolean,
    localPeerId = 'local_player',
  ): void {
    this.clearWorldVisuals();
    this.matchSeed = seed;
    this.isHost = isHost;
    this.localPlayerId = localPeerId;
    this.localPlayerName = playerName || 'Explorer';
    this.rand = createSeededRng(seed);
    this.matchTime = 0;
    this.damageDealt = 0;
    this.structuresBuilt = 0;
    this.killerName = null;
    this.killFeed = [];
    this.shotPings = [];
    this.hitMarkerTimer = 0;
    this.hitMarkerKind = 'none';

    const world = generateIslandWorld(seed);
    this.structures = world.structures;
    this.chests = world.chests;
    this.loot = world.loot;
    this.storm = createInitialStorm(seed);

    for (const piece of this.structures) {
      this.spawnStructureVisual(piece);
    }
    for (const chest of this.chests) {
      this.spawnChestVisual(chest);
    }
    for (const item of this.loot) {
      this.spawnLootVisual(item);
    }

    // Iconic Tilted Crossing Clock Tower Dial Face (south & east sides of 4th story)
    const clockGroup = new THREE.Group();
    const clockBaseY = getTerrainHeight(-34, -20) + WALL_HEIGHT * 3 + 1.6;
    clockGroup.position.set(-34, clockBaseY, -20);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef08a, emissiveIntensity: 0.25, roughness: 0.4 });
    const handMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const southDial = new THREE.Mesh(new THREE.CircleGeometry(1.05, 16), dialMat);
    southDial.position.set(0, 0, GRID_SIZE / 2 + 0.18);
    const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.08), handMat);
    hHand.position.set(0, 0.22, GRID_SIZE / 2 + 0.22);
    const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.08), handMat);
    mHand.position.set(0.22, 0, GRID_SIZE / 2 + 0.22);
    clockGroup.add(southDial, hHand, mHand);
    this.scene.add(clockGroup);
    this.worldProps.push(clockGroup);

    // Create Local Player at Spawn Overlook facing Tilted Crossing & Clock Tower
    const skinDef = getSkinDef(this.selectedSkin);
    this.localPlayer = {
      id: this.localPlayerId,
      name: this.localPlayerName,
      isHuman: true,
      isLocal: true,
      skinId: this.selectedSkin,
      colorHex: skinDef.shirtHex,
      x: PLAYER_SPAWN.x,
      y: PLAYER_SPAWN.y,
      z: PLAYER_SPAWN.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: PLAYER_SPAWN.yaw,
      pitch: -0.06,
      hp: 100,
      maxHp: 100,
      shield: 25,
      maxShield: 100,
      alive: true,
      grounded: true,
      crouching: false,
      eliminations: 0,
      activeWeapon: 'ar',
      activeRarity: 'common',
      buildMode: false,
      selectedBuild: 'wall',
      buildMaterial: 'wood',
      materials: { wood: 150, brick: 60, metal: 30 },
      slots: [
        { weaponId: 'pickaxe', rarity: 'common', ammo: 0, count: 1 },
        { weaponId: 'ar', rarity: 'common', ammo: 30, count: 1 },
        { weaponId: 'shotgun', rarity: 'common', ammo: 5, count: 1 },
        { weaponId: 'mini_shield', rarity: 'uncommon', ammo: 0, count: 2 },
        null,
      ],
      activeSlot: 1,
      fireCooldown: 0,
      reloadTimer: 0,
      swingAnim: 0,
      hurtFlash: 0,
    };

    this.combatants = [this.localPlayer];
    this.ensureRig(this.localPlayer);

    // Add any remote P2P peers
    for (const peer of this.remotePeers.values()) {
      this.combatants.push(peer);
      this.ensureRig(peer);
    }

    // Fill remaining slots up to TOTAL_LOBBY_SIZE with smart AI bots (Host authoritative)
    if (spawnBots && isHost) {
      const botCount = Math.max(8, TOTAL_LOBBY_SIZE - this.combatants.length);
      for (let i = 0; i < botCount; i++) {
        const bot = createBotCombatant(i, this.rand, PLAYER_SPAWN.x, PLAYER_SPAWN.z);
        this.combatants.push(bot);
        this.ensureRig(bot);
      }
    }

    this.camPos.set(PLAYER_SPAWN.x + 1.4, PLAYER_SPAWN.y + 3.2, PLAYER_SPAWN.z + 5.2);
    this.camTarget.set(PLAYER_SPAWN.x, PLAYER_SPAWN.y + 1.5, PLAYER_SPAWN.z - 6);
    this.emitHud();
  }

  private spawnStructureVisual(piece: StructurePiece): void {
    const grp = createStructureMesh(piece, this.mats);
    grp.userData.structureId = piece.id;
    grp.traverse((obj) => {
      obj.userData.structureId = piece.id;
    });
    this.scene.add(grp);
    this.structureMeshes.set(piece.id, grp);
    this.structureColliders.push(grp);
  }

  private removeStructureVisual(id: string): void {
    const grp = this.structureMeshes.get(id);
    if (!grp) return;
    this.scene.remove(grp);
    this.structureMeshes.delete(id);
    const idx = this.structureColliders.indexOf(grp);
    if (idx !== -1) this.structureColliders.splice(idx, 1);
  }

  private spawnChestVisual(chest: ChestNode): void {
    const visual = createChestMesh();
    visual.root.position.set(chest.x, chest.y, chest.z);
    visual.root.rotation.y = chest.rotY;
    if (chest.opened) {
      visual.lid.rotation.x = -1.35;
      visual.glow.intensity = 0;
    }
    this.scene.add(visual.root);
    this.chestVisuals.set(chest.id, visual);
  }

  private spawnLootVisual(item: LootPickup): void {
    if (item.collected) return;
    const grp = new THREE.Group();
    grp.position.set(item.x, item.y, item.z);

    const model = createWeaponModel(item.weaponId, item.rarity);
    model.scale.setScalar(1.35);
    model.position.y = 0.28;
    grp.add(model);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.56, 16),
      new THREE.MeshBasicMaterial({
        color: RARITY_COLORS[item.rarity].hex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.26;
    grp.add(ring);

    // Iconic Fortnite glowing vertical rarity beacon beam
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.26, 3.6, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: RARITY_COLORS[item.rarity].hex,
        transparent: true,
        opacity: item.rarity === 'common' ? 0.14 : 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    beam.position.y = 1.55;
    grp.add(beam);

    this.scene.add(grp);
    this.lootMeshes.set(item.id, grp);
  }

  private ensureRig(c: CombatantState): CharacterRig {
    let entry = this.rigs.get(c.id);
    if (!entry) {
      const rig = createCharacterRig(c.colorHex, this.mats, c.isLocal, c.skinId);
      rig.root.position.set(c.x, c.y, c.z);
      rig.root.rotation.y = c.yaw;
      rig.setWeapon(c.activeWeapon, c.activeRarity);
      this.scene.add(rig.root);
      entry = { rig, walkPhase: 0 };
      this.rigs.set(c.id, entry);
    }
    return entry.rig;
  }

  public setSelectedSkin(skinId: SkinId): void {
    this.selectedSkin = skinId;
    if (this.localPlayer) {
      const def = getSkinDef(skinId);
      this.localPlayer.skinId = skinId;
      this.localPlayer.colorHex = def.shirtHex;
      const old = this.rigs.get(this.localPlayer.id);
      if (old) {
        this.scene.remove(old.rig.root);
        this.rigs.delete(this.localPlayer.id);
      }
      this.ensureRig(this.localPlayer);
      if (this.phase === 'title') {
        this.positionTitleShowcase(performance.now() * 0.001);
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  public startMatch(opts: {
    seed: number;
    playerName: string;
    isHost: boolean;
    skinId?: SkinId;
    localPeerId?: string;
    p2pPeersConnected?: number;
  }): void {
    if (opts.skinId) {
      this.selectedSkin = opts.skinId;
    }
    this.p2pPeersConnected = opts.p2pPeersConnected ?? 0;
    this.keys.clear();
    this.justPressed.clear();
    this.mouseDown = false;
    this.rightMouseDown = false;
    this.loadWorld(
      opts.seed,
      opts.playerName,
      opts.isHost,
      true,
      opts.localPeerId || 'local_player',
    );
    this.setPhase('playing');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.renderer.domElement.focus();
  }

  public pauseGame(): void {
    if (this.phase !== 'playing') return;
    this.keys.clear();
    this.mouseDown = false;
    this.rightMouseDown = false;
    document.exitPointerLock?.();
    this.setPhase('paused');
  }

  public resumeGame(): void {
    if (this.phase !== 'paused') return;
    this.keys.clear();
    this.setPhase('playing');
  }

  public returnToTitle(): void {
    this.keys.clear();
    this.mouseDown = false;
    this.rightMouseDown = false;
    document.exitPointerLock?.();
    this.loadWorld(101, this.localPlayerName, true, false);
    this.setPhase('title');
  }

  public setMuted(muted: boolean): void {
    this.sfx.setMuted(muted);
    this.emitHud();
  }

  public setP2PPeerCount(count: number): void {
    this.p2pPeersConnected = count;
    this.emitHud();
  }

  public handleP2PMessage(fromPeerId: string, msg: P2PMessage): void {
    if (msg.type === 'player:state') {
      let peer = this.remotePeers.get(fromPeerId);
      if (!peer) {
        peer = {
          id: fromPeerId,
          name: msg.name,
          isHuman: true,
          isLocal: false,
          skinId: msg.skinId ?? 'jonesy',
          colorHex: getSkinDef(msg.skinId ?? 'jonesy').shirtHex,
          x: msg.x,
          y: msg.y,
          z: msg.z,
          vx: 0,
          vy: 0,
          vz: 0,
          yaw: msg.yaw,
          pitch: msg.pitch,
          hp: msg.hp,
          maxHp: 100,
          shield: msg.shield,
          maxShield: 100,
          alive: msg.alive,
          grounded: true,
          crouching: false,
          eliminations: 0,
          activeWeapon: msg.activeWeapon,
          activeRarity: msg.activeRarity,
          buildMode: msg.buildMode,
          selectedBuild: 'wall',
          buildMaterial: 'wood',
          materials: { wood: 100, brick: 50, metal: 20 },
          slots: [],
          activeSlot: 0,
          fireCooldown: 0,
          reloadTimer: 0,
          swingAnim: 0,
          hurtFlash: 0,
        };
        this.remotePeers.set(fromPeerId, peer);
        this.combatants.push(peer);
        this.ensureRig(peer);
      } else {
        peer.name = msg.name;
        peer.x = msg.x;
        peer.y = msg.y;
        peer.z = msg.z;
        peer.yaw = msg.yaw;
        peer.pitch = msg.pitch;
        peer.hp = msg.hp;
        peer.shield = msg.shield;
        peer.alive = msg.alive;
        peer.activeWeapon = msg.activeWeapon;
        peer.activeRarity = msg.activeRarity;
        peer.buildMode = msg.buildMode;
      }
      return;
    }

    if (msg.type === 'struct:place') {
      if (!this.structures.some((s) => s.id === msg.piece.id)) {
        this.structures.push(msg.piece);
        this.spawnStructureVisual(msg.piece);
      }
      return;
    }

    if (msg.type === 'struct:damage') {
      const piece = this.structures.find((s) => s.id === msg.id);
      if (piece && piece.hp > 0) {
        const res = damageStructure(piece, msg.damage, false, false);
        if (res.destroyed) {
          this.removeStructureVisual(piece.id);
          this.spawnBurst(piece.x, piece.y + 1.4, piece.z, 0xb47741, 14);
        }
      }
      return;
    }

    if (msg.type === 'combat:shot') {
      _v1.set(msg.ox, msg.oy, msg.oz);
      _v2.set(msg.ox + msg.dx * 55, msg.oy + msg.dy * 55, msg.oz + msg.dz * 55);
      this.spawnTracer(_v1, _v2);
      this.pushShotPing(msg.ox, msg.oz, 1.8);
      return;
    }

    if (msg.type === 'combat:hit') {
      if (msg.targetId === this.localPlayerId && this.localPlayer.alive) {
        const dmgRes = applyDamage(this.localPlayer, msg.damage, false);
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
        this.localPlayer.hurtFlash = 0.25;
        if (dmgRes.eliminated) {
          this.onLocalPlayerEliminated(msg.attackerName);
        }
      } else {
        const bot = this.combatants.find((c) => c.id === msg.targetId);
        if (bot && !bot.isHuman && this.isHost) {
          const dmgRes = applyDamage(bot, msg.damage, false);
          bot.aiLastDamagedTime = this.matchTime;
          if (dmgRes.eliminated) {
            this.pushKillFeed(msg.attackerName, bot.name, WEAPONS[msg.weaponId].shortName);
            this.dropCombatantLoot(bot);
          }
        }
      }
      return;
    }

    if (msg.type === 'chest:open') {
      const chest = this.chests.find((c) => c.id === msg.chestId);
      if (chest && !chest.opened) {
        chest.opened = true;
        const vis = this.chestVisuals.get(chest.id);
        if (vis) {
          vis.lid.rotation.x = -1.35;
          vis.glow.intensity = 0;
        }
      }
      return;
    }

    if (msg.type === 'loot:collect') {
      const item = this.loot.find((l) => l.id === msg.lootId);
      if (item && !item.collected) {
        item.collected = true;
        const mesh = this.lootMeshes.get(item.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.lootMeshes.delete(item.id);
        }
      }
      return;
    }

    if (msg.type === 'world:snapshot' && !this.isHost) {
      this.storm = { ...msg.storm };
      // Sync bot positions/states from host
      for (const bSnap of msg.bots) {
        let bot = this.combatants.find((c) => c.id === bSnap.id);
        if (!bot) {
          bot = {
            id: bSnap.id,
            name: bSnap.name,
            isHuman: false,
            isLocal: false,
            archetype: bSnap.archetype,
            skinId: bSnap.skinId ?? 'jonesy',
            colorHex: bSnap.colorHex,
            x: bSnap.x,
            y: bSnap.y,
            z: bSnap.z,
            vx: 0,
            vy: 0,
            vz: 0,
            yaw: bSnap.yaw,
            pitch: 0,
            hp: bSnap.hp,
            maxHp: 100,
            shield: bSnap.shield,
            maxShield: 100,
            alive: bSnap.alive,
            grounded: true,
            crouching: false,
            eliminations: 0,
            activeWeapon: bSnap.activeWeapon,
            activeRarity: 'uncommon',
            buildMode: false,
            selectedBuild: 'wall',
            buildMaterial: 'wood',
            materials: { wood: 100, brick: 50, metal: 20 },
            slots: [],
            activeSlot: 1,
            fireCooldown: 0,
            reloadTimer: 0,
            swingAnim: 0,
            hurtFlash: 0,
          };
          this.combatants.push(bot);
          this.ensureRig(bot);
        } else {
          bot.x = bSnap.x;
          bot.y = bSnap.y;
          bot.z = bSnap.z;
          bot.yaw = bSnap.yaw;
          bot.hp = bSnap.hp;
          bot.shield = bSnap.shield;
          bot.alive = bSnap.alive;
          bot.activeWeapon = bSnap.activeWeapon;
        }
      }
    }
  }

  private setPhase(next: GamePhase): void {
    this.phase = next;
    document.body.dataset.state = next;
    this.callbacks.onPhaseChange(next);
    this.emitHud();
  }

  private bindEvents(): void {
    const onResize = () => {
      if (this.disposed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.render(this.scene, this.camera);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);

      if (e.code === 'KeyM') {
        this.setMuted(!this.sfx.isMuted());
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.phase === 'playing') {
          this.pauseGame();
        } else if (this.phase === 'paused') {
          this.resumeGame();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this.phase !== 'playing' || !this.localPlayer.alive) return;
      if (this.pointerLocked) {
        // Ignore Chromium first-frame pointer-lock warp spikes
        if (Math.abs(e.movementX) > 140 || Math.abs(e.movementY) > 140) return;
        const sens = this.rightMouseDown ? 0.0014 : 0.0024;
        this.localPlayer.yaw -= e.movementX * sens;
        this.localPlayer.pitch = THREE.MathUtils.clamp(
          this.localPlayer.pitch - e.movementY * sens,
          -1.05,
          1.05,
        );
      } else if (this.isDraggingLook) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.localPlayer.yaw -= dx * 0.004;
        this.localPlayer.pitch = THREE.MathUtils.clamp(
          this.localPlayer.pitch - dy * 0.004,
          -1.05,
          1.05,
        );
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (this.phase !== 'playing') return;
      if (e.target !== this.renderer.domElement) return;

      if (e.button === 0) {
        this.mouseDown = true;
        this.isDraggingLook = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        if (!this.pointerLocked && this.renderer.domElement.requestPointerLock) {
          try {
            const p = this.renderer.domElement.requestPointerLock() as unknown as Promise<void> | undefined;
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } catch {
            // ignore pointer lock rejection in headless browser
          }
        }
      } else if (e.button === 2) {
        this.rightMouseDown = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.mouseDown = false;
        this.isDraggingLook = false;
      } else if (e.button === 2) {
        this.rightMouseDown = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (this.phase === 'playing') e.preventDefault();
    };

    const onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
      this.emitHud();
    };

    const onBlur = () => {
      this.keys.clear();
      this.mouseDown = false;
      this.rightMouseDown = false;
      this.isDraggingLook = false;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', onBlur);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('visibilitychange', onBlur);

    this.unbindCleanup = () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('visibilitychange', onBlur);
    };
  }

  private unbindCleanup: () => void = () => {};

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.step(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = window.requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = window.requestAnimationFrame(tick);
    }
  }

  private positionTitleShowcase(tNow: number): void {
    const charX = PLAYER_SPAWN.x + 0.65;
    const charZ = PLAYER_SPAWN.z + 0.8;
    const charY = getTerrainHeight(charX, charZ);
    const entry = this.localPlayer ? this.rigs.get(this.localPlayer.id) : undefined;
    if (entry) {
      entry.rig.root.visible = true;
      entry.rig.root.position.set(charX, charY, charZ);
      // Face 3/4 toward the camera (+Z) so front features (Neegy's nose, blue eyes, buck teeth) are clearly visible
      entry.rig.root.rotation.y = Math.PI - 0.36 + Math.sin(tNow * 0.7) * 0.14;
      entry.rig.setWeapon('ar', 'rare');
      entry.rig.updatePose(0.2, true, 0, 0.016, tNow * 1.5);
    }

    this.camPos.set(PLAYER_SPAWN.x - 1.15, PLAYER_SPAWN.y + 1.85, PLAYER_SPAWN.z + 4.75);
    this.camTarget.set(PLAYER_SPAWN.x - 0.55, PLAYER_SPAWN.y + 1.35, PLAYER_SPAWN.z - 6);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  private step(dt: number): void {
    // Animate Battle Bus & drifting clouds smoothly across sky
    this.battleBus.position.x += dt * 5.2;
    if (this.battleBus.position.x > 290) this.battleBus.position.x = -290;
    this.battleBus.position.y = 76 + Math.sin(performance.now() * 0.0012) * 1.5;

    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.position.x += dt * (1.2 + (i % 3) * 0.4);
      if (c.position.x > 340) c.position.x = -340;
    }

    this.texPack.waterMap.offset.x += dt * 0.015;
    this.texPack.waterMap.offset.y += dt * 0.008;

    // Spin loot pickups & bob gently
    const tNow = performance.now() * 0.001;
    for (const [id, mesh] of this.lootMeshes) {
      mesh.rotation.y = tNow * 1.8;
      const item = this.loot.find((l) => l.id === id);
      if (item) {
        mesh.position.y = item.y + Math.sin(tNow * 3 + item.x) * 0.08;
      }
    }

    // Update FX particles & tracers in real time even during hitstop
    this.updateParticlesAndTracers(dt);
    this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.6);
    if (this.hitMarkerTimer > 0) {
      this.hitMarkerTimer -= dt;
      if (this.hitMarkerTimer <= 0) this.hitMarkerKind = 'none';
    }

    if (this.phase === 'title') {
      this.positionTitleShowcase(tNow);
      this.updateStormMesh();
      this.justPressed.clear();
      return;
    }

    if (this.phase === 'paused') {
      this.justPressed.clear();
      return;
    }

    // Gameplay simulation (playing or gameover spectate beat)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateThirdPersonCamera(dt);
      this.justPressed.clear();
      return;
    }

    this.matchTime += dt;

    // Step Storm (Host authoritative)
    if (this.isHost) {
      stepStorm(this.storm, dt, this.rand);
    }
    this.updateStormMesh();

    // Update Local Player Controls
    if (this.phase === 'playing' && this.localPlayer.alive) {
      this.handleLocalPlayerInput(dt);
      this.moveCombatant(this.localPlayer, dt);
    }

    // Update Bots (Host runs AI; non-host interpolates)
    if (this.isHost) {
      this.updateBots(dt);
    }

    // Storm Damage Tick for local player (and host bots)
    for (const c of this.combatants) {
      if (!c.alive) continue;
      if (!c.isLocal && !this.isHost) continue;
      if (!isInsideSafeZone(c.x, c.z, this.storm)) {
        const dps = getStormDamagePerSecond(this.storm);
        const res = applyDamage(c, dps * dt, true);
        if (res.eliminated) {
          if (c.isLocal) {
            this.onLocalPlayerEliminated('The Storm');
          } else {
            this.pushKillFeed('The Storm', c.name, 'Storm');
            this.dropCombatantLoot(c);
          }
        }
      }
    }

    // Sync Character Rigs (distance-culled at 195m to keep 100-player frame rates fast)
    const camX = this.camera.position.x;
    const camZ = this.camera.position.z;
    for (const c of this.combatants) {
      const entry = this.rigs.get(c.id);
      if (!entry) continue;
      const dx = c.x - camX;
      const dz = c.z - camZ;
      const inRange = c.alive && (c.isLocal || dx * dx + dz * dz < 195 * 195);
      entry.rig.root.visible = inRange;
      if (!inRange) continue;

      entry.rig.root.position.set(c.x, c.y, c.z);
      entry.rig.root.rotation.y = c.yaw;
      entry.rig.setWeapon(c.activeWeapon, c.activeRarity);

      const horizSpeed = Math.hypot(c.vx, c.vz);
      entry.walkPhase += horizSpeed * dt * 1.45;
      if (c.swingAnim > 0) c.swingAnim = Math.max(0, c.swingAnim - dt * 3.2);
      entry.rig.updatePose(horizSpeed, c.grounded, c.swingAnim, dt, entry.walkPhase);
    }

    // Check Victory Condition
    if (this.phase === 'playing' && this.localPlayer.alive) {
      const aliveList = this.combatants.filter((c) => c.alive);
      if (aliveList.length === 1 && aliveList[0].id === this.localPlayerId) {
        this.sfx.playVictory();
        document.exitPointerLock?.();
        this.setPhase('gameover');
      }
    }

    // Broadcast P2P network state
    this.netStateAccum += dt;
    if (this.p2pPeersConnected > 0 && this.netStateAccum >= 0.066) {
      this.netStateAccum = 0;
      this.callbacks.onSendP2P({
        type: 'player:state',
        peerId: this.localPlayerId,
        name: this.localPlayerName,
        skinId: this.localPlayer.skinId,
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        z: this.localPlayer.z,
        yaw: this.localPlayer.yaw,
        pitch: this.localPlayer.pitch,
        hp: this.localPlayer.hp,
        shield: this.localPlayer.shield,
        alive: this.localPlayer.alive,
        activeWeapon: this.localPlayer.activeWeapon,
        activeRarity: this.localPlayer.activeRarity,
        buildMode: this.localPlayer.buildMode,
      });
    }

    this.worldSnapAccum += dt;
    if (this.isHost && this.p2pPeersConnected > 0 && this.worldSnapAccum >= 0.14) {
      this.worldSnapAccum = 0;
      this.callbacks.onSendP2P({
        type: 'world:snapshot',
        structures: [],
        chests: [],
        storm: this.storm,
        bots: this.combatants
          .filter((c) => !c.isHuman)
          .map((b) => ({
            id: b.id,
            name: b.name,
            archetype: b.archetype ?? 'rotator',
            skinId: b.skinId,
            x: b.x,
            y: b.y,
            z: b.z,
            yaw: b.yaw,
            hp: b.hp,
            shield: b.shield,
            alive: b.alive,
            activeWeapon: b.activeWeapon,
            colorHex: b.colorHex,
          })),
      });
    }

    this.updateThirdPersonCamera(dt);

    // Decay shot pings
    for (let i = this.shotPings.length - 1; i >= 0; i--) {
      this.shotPings[i].ttl -= dt;
      if (this.shotPings[i].ttl <= 0) this.shotPings.splice(i, 1);
    }

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.1) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }

    this.justPressed.clear();
  }

  private handleLocalPlayerInput(dt: number): void {
    const p = this.localPlayer;
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);

    // Handle Reload timer
    if (p.reloadTimer > 0) {
      p.reloadTimer -= dt;
      if (p.reloadTimer <= 0) {
        const slot = p.slots[p.activeSlot];
        if (slot) {
          slot.ammo = WEAPONS[slot.weaponId].magSize;
        }
        this.emitHud();
      }
    }

    // Arrow key camera look fallback (helpful for keyboard-only & automated testing)
    if (this.keys.has('ArrowLeft')) p.yaw += dt * 2.1;
    if (this.keys.has('ArrowRight')) p.yaw -= dt * 2.1;
    if (this.keys.has('ArrowUp')) p.pitch = THREE.MathUtils.clamp(p.pitch + dt * 1.4, -1.0, 1.0);
    if (this.keys.has('ArrowDown')) p.pitch = THREE.MathUtils.clamp(p.pitch - dt * 1.4, -1.0, 1.0);

    // Toggle Build Mode [Q]
    if (this.justPressed.has('KeyQ')) {
      p.buildMode = !p.buildMode;
      this.emitHud();
    }

    // Cycle Materials [F]
    if (this.justPressed.has('KeyF')) {
      const order: MaterialType[] = ['wood', 'brick', 'metal'];
      p.buildMaterial = order[(order.indexOf(p.buildMaterial) + 1) % order.length];
      this.emitHud();
    }

    // Build Piece Hotkeys [Z/X/C/V] or [1-4] in build mode
    if (this.justPressed.has('KeyZ')) {
      p.buildMode = true;
      p.selectedBuild = 'wall';
    } else if (this.justPressed.has('KeyX')) {
      p.buildMode = true;
      p.selectedBuild = 'floor';
    } else if (this.justPressed.has('KeyC')) {
      p.buildMode = true;
      p.selectedBuild = 'ramp';
    } else if (this.justPressed.has('KeyV')) {
      p.buildMode = true;
      p.selectedBuild = 'roof';
    }

    // Slot switching [1]-[5]
    const slotCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
    for (let i = 0; i < slotCodes.length; i++) {
      if (this.justPressed.has(slotCodes[i])) {
        if (p.buildMode && i < 4) {
          const buildPieces: BuildPieceType[] = ['wall', 'floor', 'ramp', 'roof'];
          p.selectedBuild = buildPieces[i];
        } else if (p.slots[i]) {
          p.buildMode = false;
          p.activeSlot = i;
          p.activeWeapon = p.slots[i]!.weaponId;
          p.activeRarity = p.slots[i]!.rarity;
          p.reloadTimer = 0;
        }
        this.emitHud();
      }
    }

    // Rotate build piece OR reload weapon [R]
    if (this.justPressed.has('KeyR')) {
      if (p.buildMode) {
        this.buildRotationQuarter = (this.buildRotationQuarter + 1) % 4;
      } else {
        this.startReload(p);
      }
    }

    // Movement vector in camera yaw space
    const fwdInput = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const sideInput = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    const fx = -Math.sin(p.yaw);
    const fz = -Math.cos(p.yaw);
    const rx = Math.cos(p.yaw);
    const rz = -Math.sin(p.yaw);

    let wishX = fx * fwdInput + rx * sideInput;
    let wishZ = fz * fwdInput + rz * sideInput;
    const wishLen = Math.hypot(wishX, wishZ);
    if (wishLen > 0) {
      wishX /= wishLen;
      wishZ /= wishLen;
    }

    const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const moveSpeed = this.rightMouseDown ? 5.2 : sprinting && fwdInput > 0 ? 10.6 : 8.2;
    p.vx = THREE.MathUtils.damp(p.vx, wishX * moveSpeed, 14, dt);
    p.vz = THREE.MathUtils.damp(p.vz, wishZ * moveSpeed, 14, dt);

    // Coyote time + Jump buffering
    if (p.grounded) {
      this.coyoteTimer = 0.1;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    if (this.justPressed.has('Space')) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      p.vy = 10.4;
      p.grounded = false;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    // Interact [E] (open chests / collect ground loot)
    const prompt = this.findNearestInteractable();
    this.lastInteractPrompt = prompt?.label ?? null;
    if (this.justPressed.has('KeyE') && prompt) {
      if (prompt.chest) {
        this.openChest(prompt.chest);
      } else if (prompt.loot) {
        this.collectLoot(p, prompt.loot);
      }
    }

    // Build Mode Blueprint Preview & Placement
    if (p.buildMode) {
      const snapped = snapToBuildGrid(p.x, p.y, p.z, p.yaw, p.selectedBuild, this.buildRotationQuarter);
      const valid = canPlaceBuildPiece(
        p,
        p.buildMaterial,
        this.structures,
        snapped.x,
        snapped.y,
        snapped.z,
        p.selectedBuild,
      );
      this.buildPreviewGroup.visible = true;
      this.buildPreviewGroup.position.set(snapped.x, snapped.y, snapped.z);
      this.buildPreviewGroup.rotation.y = snapped.rotY;
      this.rebuildPreviewGeometry(p.selectedBuild, valid);

      if (this.mouseDown && p.fireCooldown <= 0 && valid) {
        p.fireCooldown = 0.16;
        p.materials[p.buildMaterial] -= BUILD_COST;
        this.structuresBuilt += 1;
        const piece = createPlayerBuildPiece(
          `pb_${this.localPlayerId}_${this.nextStructSeq++}`,
          p.id,
          p.selectedBuild,
          p.buildMaterial,
          snapped.x,
          snapped.y,
          snapped.z,
          snapped.rotY,
        );
        this.structures.push(piece);
        this.spawnStructureVisual(piece);
        this.sfx.playBuildPlace();
        this.callbacks.onSendP2P({ type: 'struct:place', piece });
        this.emitHud();
      }
      return;
    } else {
      this.buildPreviewGroup.visible = false;
    }

    // Combat / Harvesting / Healing on Left Click
    if (this.mouseDown && p.fireCooldown <= 0 && p.reloadTimer <= 0) {
      const slot = p.slots[p.activeSlot];
      const def = WEAPONS[p.activeWeapon];

      if (def.kind === 'heal') {
        if (slot && slot.count > 0 && applyHealing(p, p.activeWeapon)) {
          p.fireCooldown = 1 / def.fireRate;
          slot.count -= 1;
          this.sfx.playChestOpen();
          if (slot.count <= 0) {
            p.slots[p.activeSlot] = null;
            p.activeSlot = 1;
            if (!p.slots[1]) p.activeSlot = 0;
            const next = p.slots[p.activeSlot]!;
            p.activeWeapon = next.weaponId;
            p.activeRarity = next.rarity;
          }
          this.emitHud();
        }
        return;
      }

      if (def.kind !== 'melee' && slot && slot.ammo <= 0) {
        this.startReload(p);
        return;
      }

      this.fireWeapon(p);
    }
  }

  private startReload(c: CombatantState): void {
    const slot = c.slots[c.activeSlot];
    if (!slot) return;
    const def = WEAPONS[slot.weaponId];
    if (def.magSize <= 0 || slot.ammo >= def.magSize || c.reloadTimer > 0) return;
    c.reloadTimer = def.reloadTime;
    this.emitHud();
  }

  private fireWeapon(shooter: CombatantState): void {
    const def = WEAPONS[shooter.activeWeapon];
    shooter.fireCooldown = 1 / def.fireRate;

    if (shooter.isLocal) {
      this.sfx.playShoot(shooter.activeWeapon);
    }

    if (def.kind === 'melee') {
      shooter.swingAnim = 1.0;
    } else {
      const slot = shooter.slots[shooter.activeSlot];
      if (slot && shooter.isLocal) {
        slot.ammo = Math.max(0, slot.ammo - 1);
      }
      if (shooter.isLocal) {
        this.cameraTrauma = Math.min(1, this.cameraTrauma + (def.id === 'shotgun' || def.id === 'sniper' ? 0.25 : 0.08));
      }
    }

    // Compute ray origin & direction
    const origin = new THREE.Vector3();
    const dir = new THREE.Vector3();

    if (shooter.isLocal) {
      origin.copy(this.camera.position);
      this.camera.getWorldDirection(dir);
    } else {
      origin.set(shooter.x, shooter.y + 1.45, shooter.z);
      dir.set(-Math.sin(shooter.yaw) * Math.cos(shooter.pitch), Math.sin(shooter.pitch), -Math.cos(shooter.yaw) * Math.cos(shooter.pitch)).normalize();
    }

    this.pushShotPing(shooter.x, shooter.z, 1.8);

    const pellets = def.pellets;
    for (let pIdx = 0; pIdx < pellets; pIdx++) {
      const spreadX = (Math.random() - 0.5) * def.spread;
      const spreadY = (Math.random() - 0.5) * def.spread;
      const spreadZ = (Math.random() - 0.5) * def.spread;
      const shotDir = dir.clone().add(new THREE.Vector3(spreadX, spreadY, spreadZ)).normalize();

      let closestDist = def.range;
      let hitCombatant: CombatantState | null = null;
      let isHeadshot = false;
      let hitStructure: StructurePiece | null = null;
      let hitPoint = origin.clone().addScaledVector(shotDir, def.range);

      // 1. Check ray vs nearby destructible structures (spatial filter for 100-player speed)
      const midX = origin.x + shotDir.x * (def.range * 0.5);
      const midZ = origin.z + shotDir.z * (def.range * 0.5);
      const halfSpan = def.range * 0.5 + 8;
      const nearColliders: THREE.Object3D[] = [];
      for (let cIdx = 0; cIdx < this.structureColliders.length; cIdx++) {
        const col = this.structureColliders[cIdx];
        if (Math.abs(col.position.x - midX) <= halfSpan && Math.abs(col.position.z - midZ) <= halfSpan) {
          nearColliders.push(col);
        }
      }
      this.raycaster.set(origin, shotDir);
      this.raycaster.near = shooter.isLocal ? 2.5 : 0.2;
      this.raycaster.far = def.range;
      const structHits = nearColliders.length > 0 ? this.raycaster.intersectObjects(nearColliders, true) : [];
      if (structHits.length > 0) {
        const hit = structHits[0];
        const stId = hit.object.userData.structureId as string | undefined;
        const found = stId ? this.structures.find((s) => s.id === stId && s.hp > 0) : undefined;
        if (found) {
          closestDist = hit.distance;
          hitStructure = found;
          hitPoint.copy(hit.point);
        }
      }

      // 2. Check ray vs combatants
      for (const other of this.combatants) {
        if (!other.alive || other.id === shooter.id) continue;
        // Ray-capsule approx against standing combatant bounds
        const cx = other.x;
        const cz = other.z;
        const baseY = other.y;
        const toTargetX = cx - origin.x;
        const toTargetY = baseY + 1.1 - origin.y;
        const toTargetZ = cz - origin.z;
        const proj = toTargetX * shotDir.x + toTargetY * shotDir.y + toTargetZ * shotDir.z;
        if (proj <= 0 || proj >= closestDist) continue;

        const px = origin.x + shotDir.x * proj;
        const py = origin.y + shotDir.y * proj;
        const pz = origin.z + shotDir.z * proj;
        const horizErr = Math.hypot(px - cx, pz - cz);
        if (horizErr < 0.62 && py >= baseY && py <= baseY + 2.05) {
          closestDist = proj;
          hitCombatant = other;
          hitStructure = null;
          isHeadshot = py >= baseY + 1.52;
          hitPoint.set(px, py, pz);
        }
      }

      // Visual Tracer from gun barrel
      if (def.kind !== 'melee') {
        const muzzleStart = new THREE.Vector3(
          shooter.x + Math.cos(shooter.yaw) * 0.35,
          shooter.y + 1.42,
          shooter.z - Math.sin(shooter.yaw) * 0.35,
        );
        this.spawnTracer(muzzleStart, hitPoint);
        if (shooter.isLocal && pIdx === 0) {
          this.callbacks.onSendP2P({
            type: 'combat:shot',
            shooterId: shooter.id,
            ox: muzzleStart.x,
            oy: muzzleStart.y,
            oz: muzzleStart.z,
            dx: shotDir.x,
            dy: shotDir.y,
            dz: shotDir.z,
            weaponId: shooter.activeWeapon,
          });
        }
      }

      // Apply Combatant Hit
      if (hitCombatant) {
        const dmg = computeShotDamage(shooter.activeWeapon, shooter.activeRarity, isHeadshot, closestDist);
        const dmgRes = applyDamage(hitCombatant, dmg, false);
        hitCombatant.hurtFlash = 0.25;
        if (!hitCombatant.isHuman) {
          hitCombatant.aiLastDamagedTime = this.matchTime;
        }
        this.spawnBurst(hitPoint.x, hitPoint.y, hitPoint.z, dmgRes.shieldLost > 0 ? 0x38bdf8 : 0xef4444, 8);

        if (shooter.isLocal) {
          this.damageDealt += dmg;
          this.hitMarkerTimer = 0.22;
          this.hitMarkerKind = dmgRes.eliminated ? 'kill' : isHeadshot ? 'crit' : 'body';
          this.sfx.playHitMarker(dmgRes.eliminated ? 'kill' : isHeadshot ? 'crit' : 'body');

          if (hitCombatant.isHuman) {
            this.callbacks.onSendP2P({
              type: 'combat:hit',
              targetId: hitCombatant.id,
              attackerId: shooter.id,
              attackerName: shooter.name,
              damage: dmg,
              weaponId: shooter.activeWeapon,
            });
          }
        }

        if (dmgRes.eliminated) {
          shooter.eliminations += 1;
          this.hitstopTimer = shooter.isLocal ? 0.045 : 0;
          this.pushKillFeed(shooter.name, hitCombatant.name, def.shortName);
          this.dropCombatantLoot(hitCombatant);
          if (hitCombatant.isLocal) {
            this.onLocalPlayerEliminated(shooter.name);
          }
        }
      } else if (hitStructure) {
        // Apply Structure Damage & Harvesting
        const isPickaxe = def.kind === 'melee';
        const isWeakPoint = isPickaxe && Math.random() < 0.45;
        const sRes = damageStructure(hitStructure, def.structureDamage, isPickaxe, isWeakPoint);
        const burstCol =
          hitStructure.material === 'metal' ? 0x94a3b8 : hitStructure.material === 'brick' ? 0xc4624c : 0xb47741;
        this.spawnBurst(hitPoint.x, hitPoint.y, hitPoint.z, burstCol, sRes.destroyed ? 18 : 6);

        if (shooter.isLocal) {
          if (sRes.harvestedAmount > 0) {
            shooter.materials[sRes.harvestedMaterial] = Math.min(
              999,
              shooter.materials[sRes.harvestedMaterial] + sRes.harvestedAmount,
            );
          }
          if (isPickaxe) {
            this.sfx.playHarvestHit(hitStructure.material, isWeakPoint);
          }
          this.hitMarkerTimer = 0.14;
          this.hitMarkerKind = 'structure';
          this.callbacks.onSendP2P({
            type: 'struct:damage',
            id: hitStructure.id,
            damage: isPickaxe && isWeakPoint ? def.structureDamage * 2 : def.structureDamage,
            attackerId: shooter.id,
          });
        }

        if (sRes.destroyed) {
          this.removeStructureVisual(hitStructure.id);
        }
      }
    }
  }

  private moveCombatant(c: CombatantState, dt: number): void {
    const prevX = c.x;
    const prevZ = c.z;
    const nextX = THREE.MathUtils.clamp(c.x + c.vx * dt, -ISLAND_RADIUS + 4, ISLAND_RADIUS - 4);
    const nextZ = THREE.MathUtils.clamp(c.z + c.vz * dt, -ISLAND_RADIUS + 4, ISLAND_RADIUS - 4);

    // Simple horizontal collision vs solid walls, trees, rocks (spatial AABB cull)
    let blocked = false;
    for (let i = 0; i < this.structures.length; i++) {
      const s = this.structures[i];
      if (s.hp <= 0) continue;
      if (s.kind === 'floor' || s.kind === 'ramp' || s.kind === 'roof') continue;
      if (Math.abs(nextX - s.x) > 7 || Math.abs(nextZ - s.z) > 7) continue;

      if (s.isTree || s.isRock) {
        if (Math.hypot(nextX - s.x, nextZ - s.z) < 1.15 && c.y < s.y + 3.5) {
          blocked = true;
          break;
        }
        continue;
      }

      if (c.y + 0.3 > s.y + WALL_HEIGHT || c.y + 1.7 < s.y) continue;

      // Transform player into wall's local space
      const dx = nextX - s.x;
      const dz = nextZ - s.z;
      const cosR = Math.cos(-s.rotY);
      const sinR = Math.sin(-s.rotY);
      const lx = dx * cosR - dz * sinR;
      const lz = dx * sinR + dz * cosR;

      if (Math.abs(lx) < GRID_SIZE * 0.5 + 0.35 && Math.abs(lz) < 0.55) {
        // Allow walking cleanly through doorways!
        if (s.variant === 'doorway' && Math.abs(lx) < 0.72) continue;
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      c.x = nextX;
      c.z = nextZ;
    } else {
      // Slide along X or Z
      c.x = prevX;
      c.z = prevZ;
    }

    // Vertical gravity & terrain + walkable floor/ramp surface height
    c.vy -= 26 * dt;
    c.y += c.vy * dt;

    let supportY = getTerrainHeight(c.x, c.z);

    // Check walkable Floors & Ramps beneath combatant
    for (let i = 0; i < this.structures.length; i++) {
      const s = this.structures[i];
      if (s.hp <= 0) continue;
      if (s.kind !== 'floor' && s.kind !== 'ramp') continue;
      if (Math.abs(c.x - s.x) > 5 || Math.abs(c.z - s.z) > 5) continue;

      const dx = c.x - s.x;
      const dz = c.z - s.z;
      const cosR = Math.cos(-s.rotY);
      const sinR = Math.sin(-s.rotY);
      const lx = dx * cosR - dz * sinR;
      const lz = dx * sinR + dz * cosR;

      if (Math.abs(lx) <= GRID_SIZE * 0.52 && Math.abs(lz) <= GRID_SIZE * 0.52) {
        let surfY = s.y + 0.22;
        if (s.kind === 'ramp') {
          const t = (GRID_SIZE * 0.5 - lz) / GRID_SIZE;
          surfY = s.y + THREE.MathUtils.clamp(t, 0, 1) * WALL_HEIGHT + 0.22;
        }
        if (surfY <= c.y + 0.95 && surfY > supportY) {
          supportY = surfY;
        }
      }
    }

    if (c.y <= supportY) {
      c.y = supportY;
      c.vy = 0;
      c.grounded = true;
    } else {
      c.grounded = false;
    }
  }

  private updateBots(dt: number): void {
    for (let i = 0; i < this.combatants.length; i++) {
      const bot = this.combatants[i];
      if (bot.isHuman || !bot.alive) continue;

      bot.fireCooldown = Math.max(0, bot.fireCooldown - dt);
      const intent = computeBotIntent(bot, this.combatants, this.storm, this.loot, this.structures, this.matchTime, dt);

      bot.yaw = intent.aimYaw;
      bot.pitch = intent.aimPitch;
      bot.activeWeapon = intent.weaponToUse;

      const speed = bot.archetype === 'rusher' ? 7.4 : 6.4;
      bot.vx = THREE.MathUtils.damp(bot.vx, intent.moveX * speed, 10, dt);
      bot.vz = THREE.MathUtils.damp(bot.vz, intent.moveZ * speed, 10, dt);

      if (intent.jump && bot.grounded) {
        bot.vy = 9.5;
        bot.grounded = false;
      }

      if (intent.healRequest && (bot.slots[3]?.count ?? 0) > 0) {
        if (applyHealing(bot, 'mini_shield')) {
          bot.slots[3]!.count -= 1;
        }
      }

      if (intent.buildRequest) {
        const snapped = snapToBuildGrid(bot.x, bot.y, bot.z, bot.yaw, intent.buildRequest, 0);
        if (canPlaceBuildPiece(bot, 'wood', this.structures, snapped.x, snapped.y, snapped.z, intent.buildRequest)) {
          bot.materials.wood -= BUILD_COST;
          const piece = createPlayerBuildPiece(
            `bb_${bot.id}_${this.nextStructSeq++}`,
            bot.id,
            intent.buildRequest,
            'wood',
            snapped.x,
            snapped.y,
            snapped.z,
            snapped.rotY,
          );
          this.structures.push(piece);
          this.spawnStructureVisual(piece);
          this.callbacks.onSendP2P({ type: 'struct:place', piece });
        }
      }

      this.moveCombatant(bot, dt);

      // Bot picks up nearby ground loot
      for (const item of this.loot) {
        if (item.collected) continue;
        if (Math.hypot(item.x - bot.x, item.z - bot.z) < 2.2) {
          this.collectLoot(bot, item);
          break;
        }
      }

      if (intent.shoot && bot.fireCooldown <= 0) {
        // Slight bot accuracy tuning so firefights feel dramatic and fair
        bot.yaw += (Math.random() - 0.5) * 0.085;
        bot.pitch += (Math.random() - 0.5) * 0.045;
        this.fireWeapon(bot);
        // Pace bot shots slightly slower than max weapon ROF for authentic gunfights
        bot.fireCooldown += 0.14;
      }
    }
  }

  private findNearestInteractable(): { label: string; chest?: ChestNode; loot?: LootPickup } | null {
    const p = this.localPlayer;
    let bestDist = 3.2;
    let result: { label: string; chest?: ChestNode; loot?: LootPickup } | null = null;

    for (const c of this.chests) {
      if (c.opened) continue;
      const d = Math.hypot(c.x - p.x, c.z - p.z) + Math.abs(c.y - p.y) * 0.6;
      if (d < bestDist) {
        bestDist = d;
        result = { label: 'Open Loot Chest', chest: c };
      }
    }

    for (const item of this.loot) {
      if (item.collected) continue;
      const d = Math.hypot(item.x - p.x, item.z - p.z) + Math.abs(item.y - p.y) * 0.6;
      if (d < bestDist) {
        bestDist = d;
        result = {
          label: `Pick up ${RARITY_COLORS[item.rarity].label} ${WEAPONS[item.weaponId].shortName}`,
          loot: item,
        };
      }
    }

    return result;
  }

  private openChest(chest: ChestNode): void {
    chest.opened = true;
    const vis = this.chestVisuals.get(chest.id);
    if (vis) {
      vis.lid.rotation.x = -1.35;
      vis.glow.intensity = 0;
    }
    this.sfx.playChestOpen();
    this.spawnBurst(chest.x, chest.y + 0.8, chest.z, 0xfbbf24, 16);
    this.callbacks.onSendP2P({ type: 'chest:open', chestId: chest.id });

    // Spawn 1 rare/epic weapon + 1 healing item + bonus mats
    const weapons: WeaponId[] = ['ar', 'shotgun', 'smg', 'sniper'];
    const rarities: WeaponRarity[] = ['rare', 'epic', 'legendary'];
    const wId = weapons[Math.floor(this.rand() * weapons.length)];
    const rId = rarities[Math.floor(this.rand() * rarities.length)];

    const drop1: LootPickup = {
      id: `loot_ch_${this.nextLootSeq++}`,
      weaponId: wId,
      rarity: rId,
      ammo: WEAPONS[wId].magSize,
      count: 1,
      x: chest.x + (this.rand() - 0.5) * 1.4,
      y: chest.y + 0.35,
      z: chest.z + 1.1,
      collected: false,
    };
    const drop2: LootPickup = {
      id: `loot_ch_${this.nextLootSeq++}`,
      weaponId: this.rand() > 0.35 ? 'mini_shield' : 'medkit',
      rarity: 'uncommon',
      ammo: 0,
      count: 2,
      x: chest.x - 0.9,
      y: chest.y + 0.35,
      z: chest.z + 0.9,
      collected: false,
    };
    this.loot.push(drop1, drop2);
    this.spawnLootVisual(drop1);
    this.spawnLootVisual(drop2);

    this.localPlayer.materials.wood = Math.min(999, this.localPlayer.materials.wood + 30);
    this.localPlayer.materials.brick = Math.min(999, this.localPlayer.materials.brick + 20);
  }

  private collectLoot(actor: CombatantState, item: LootPickup): void {
    item.collected = true;
    const mesh = this.lootMeshes.get(item.id);
    if (mesh) {
      this.scene.remove(mesh);
      this.lootMeshes.delete(item.id);
    }
    this.callbacks.onSendP2P({ type: 'loot:collect', lootId: item.id });

    // Place into matching weapon slot or first empty slot (slots 1..4)
    let placed = false;
    for (let i = 1; i <= 4; i++) {
      const existing = actor.slots[i];
      if (!existing) {
        actor.slots[i] = {
          weaponId: item.weaponId,
          rarity: item.rarity,
          ammo: item.ammo,
          count: item.count,
        };
        if (actor.isLocal) {
          actor.activeSlot = i;
          actor.activeWeapon = item.weaponId;
          actor.activeRarity = item.rarity;
        }
        placed = true;
        break;
      } else if (existing.weaponId === item.weaponId) {
        if (WEAPONS[item.weaponId].kind === 'heal') {
          existing.count += item.count;
        } else {
          existing.rarity = item.rarity;
          existing.ammo = WEAPONS[item.weaponId].magSize;
        }
        placed = true;
        break;
      }
    }
    if (!placed && actor.activeSlot > 0) {
      actor.slots[actor.activeSlot] = {
        weaponId: item.weaponId,
        rarity: item.rarity,
        ammo: item.ammo,
        count: item.count,
      };
      actor.activeWeapon = item.weaponId;
      actor.activeRarity = item.rarity;
    }

    if (actor.isLocal) {
      this.sfx.playBuildPlace();
      this.emitHud();
    }
  }

  private dropCombatantLoot(victim: CombatantState): void {
    const item: LootPickup = {
      id: `loot_drop_${this.nextLootSeq++}`,
      weaponId: victim.activeWeapon === 'pickaxe' ? 'ar' : victim.activeWeapon,
      rarity: victim.activeRarity,
      ammo: WEAPONS[victim.activeWeapon === 'pickaxe' ? 'ar' : victim.activeWeapon].magSize,
      count: 1,
      x: victim.x,
      y: victim.y + 0.35,
      z: victim.z,
      collected: false,
    };
    this.loot.push(item);
    this.spawnLootVisual(item);
  }

  private pushShotPing(x: number, z: number, ttl: number): void {
    if (!this.localPlayer) return;
    if (Math.hypot(x - this.localPlayer.x, z - this.localPlayer.z) > 115) return;
    this.shotPings.push({ x, z, ttl });
    if (this.shotPings.length > 10) {
      this.shotPings.shift();
    }
  }

  private pushKillFeed(killerName: string, victimName: string, weaponName: string): void {
    this.killFeed.unshift({
      id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      killerName,
      victimName,
      weaponName,
      timestamp: this.matchTime,
    });
    if (this.killFeed.length > 4) this.killFeed.length = 4;
  }

  private onLocalPlayerEliminated(killerName: string): void {
    this.killerName = killerName;
    this.sfx.playDefeat();
    document.exitPointerLock?.();
    this.setPhase('gameover');
  }

  private updateThirdPersonCamera(dt: number): void {
    const p = this.localPlayer;
    const isAds = this.rightMouseDown && !p.buildMode && p.activeWeapon !== 'pickaxe';
    const targetFov = isAds ? (p.activeWeapon === 'sniper' ? 34 : 50) : 68;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 12, dt);
      this.camera.updateProjectionMatrix();
    }

    const fwdX = -Math.sin(p.yaw) * Math.cos(p.pitch);
    const fwdY = Math.sin(p.pitch);
    const fwdZ = -Math.cos(p.yaw) * Math.cos(p.pitch);
    const rightX = Math.cos(p.yaw);
    const rightZ = -Math.sin(p.yaw);

    const camBack = isAds ? 2.4 : 4.35;
    const camRight = isAds ? 0.88 : 1.05;
    const shoulderY = p.y + 1.72;

    const anchor = _v1.set(p.x, shoulderY, p.z);
    const desired = _v2.set(
      p.x - fwdX * camBack + rightX * camRight,
      shoulderY - fwdY * camBack + 0.35,
      p.z - fwdZ * camBack + rightZ * camRight,
    );

    // Prevent camera from dipping below terrain or clipping behind walls
    const groundAtCam = getTerrainHeight(desired.x, desired.z) + 0.55;
    if (desired.y < groundAtCam) desired.y = groundAtCam;

    const toCam = _v3.subVectors(desired, anchor);
    const dist = toCam.length();
    if (dist > 0.1) {
      const nearWallColliders: THREE.Object3D[] = [];
      for (let i = 0; i < this.structureColliders.length; i++) {
        const col = this.structureColliders[i];
        if (Math.abs(col.position.x - p.x) < 12 && Math.abs(col.position.z - p.z) < 12) {
          nearWallColliders.push(col);
        }
      }
      if (nearWallColliders.length > 0) {
        this.raycaster.set(anchor, toCam.normalize());
        this.raycaster.near = 0.2;
        this.raycaster.far = dist;
        const wallHits = this.raycaster.intersectObjects(nearWallColliders, true);
        if (wallHits.length > 0) {
          const safeDist = Math.max(0.8, wallHits[0].distance - 0.35);
          desired.copy(anchor).addScaledVector(toCam, safeDist);
        }
      }
    }

    const alpha = 1 - Math.exp(-18 * dt);
    this.camPos.lerp(desired, alpha);
    const lookTarget = _v3.set(
      p.x + fwdX * 18 + rightX * 0.45,
      shoulderY + fwdY * 18,
      p.z + fwdZ * 18 + rightZ * 0.45,
    );
    this.camTarget.lerp(lookTarget, alpha);

    this.camera.position.copy(this.camPos);
    if (this.cameraTrauma > 0) {
      const shake = this.cameraTrauma * this.cameraTrauma * 0.14;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
    }
    this.camera.lookAt(this.camTarget);
  }

  private updateStormMesh(): void {
    this.stormWallMesh.position.x = this.storm.centerX;
    this.stormWallMesh.position.z = this.storm.centerZ;
    this.stormWallMesh.scale.set(this.storm.radius, 1, this.storm.radius);
    this.texPack.stormMap.offset.x += 0.0012;
  }

  private spawnBurst(x: number, y: number, z: number, colorHex: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_SIZE;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.z = z;
      slot.vx = (Math.random() - 0.5) * 9;
      slot.vy = 2.5 + Math.random() * 6;
      slot.vz = (Math.random() - 0.5) * 9;
      slot.maxLife = 0.35 + Math.random() * 0.35;
      slot.life = slot.maxLife;
      slot.size = 0.7 + Math.random() * 0.8;
      slot.color = colorHex;
    }
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3): void {
    const slot = this.tracers[this.tracerCursor];
    this.tracerCursor = (this.tracerCursor + 1) % TRACER_POOL_SIZE;
    const posAttr = slot.line.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, start.x, start.y, start.z);
    posAttr.setXYZ(1, end.x, end.y, end.z);
    posAttr.needsUpdate = true;
    slot.line.visible = true;
    slot.life = 0.075;
  }

  private updateParticlesAndTracers(dt: number): void {
    let anyParticle = false;
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      anyParticle = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vy -= 18 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const s = p.size * (p.life / p.maxLife);
      _scale.set(s, s, s);
      _v1.set(p.x, p.y, p.z);
      _mat4.compose(_v1, _quat, _scale);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, _color.setHex(p.color));
    }
    if (anyParticle) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < this.tracers.length; i++) {
      const tr = this.tracers[i];
      if (tr.life > 0) {
        tr.life -= dt;
        if (tr.life <= 0) tr.line.visible = false;
      }
    }
  }

  private emitHud(): void {
    const aliveCount = this.combatants.filter((c) => c.alive).length;
    const placement = this.localPlayer.alive ? aliveCount : aliveCount + 1;

    const markers: MinimapMarker[] = [];
    for (const c of this.combatants) {
      if (!c.alive) continue;
      if (c.isLocal) {
        markers.push({ x: c.x, z: c.z, yaw: c.yaw, kind: 'player' });
      } else if (c.isHuman) {
        markers.push({ x: c.x, z: c.z, kind: 'peer' });
      }
    }
    for (const ping of this.shotPings) {
      markers.push({ x: ping.x, z: ping.z, kind: 'shot' });
    }

    this.callbacks.onHudUpdate({
      phase: this.phase,
      hp: Math.round(this.localPlayer.hp),
      maxHp: this.localPlayer.maxHp,
      shield: Math.round(this.localPlayer.shield),
      maxShield: this.localPlayer.maxShield,
      aliveCount,
      totalCombatants: this.combatants.length,
      eliminations: this.localPlayer.eliminations,
      damageDealt: Math.round(this.damageDealt),
      structuresBuilt: this.structuresBuilt,
      placement,
      materials: { ...this.localPlayer.materials },
      slots: this.localPlayer.slots.map((s) => (s ? { ...s } : null)),
      activeSlot: this.localPlayer.activeSlot,
      buildMode: this.localPlayer.buildMode,
      selectedBuild: this.localPlayer.selectedBuild,
      buildMaterial: this.localPlayer.buildMaterial,
      buildRotation: this.buildRotationQuarter * 90,
      isReloading: this.localPlayer.reloadTimer > 0,
      isAiming: this.rightMouseDown && !this.localPlayer.buildMode,
      inStorm: !isInsideSafeZone(this.localPlayer.x, this.localPlayer.z, this.storm),
      stormPhase: this.storm.phase,
      stormTimer: Math.max(0, Math.ceil(this.storm.phaseTimer)),
      stormShrinking: this.storm.isShrinking,
      stormCenterX: this.storm.centerX,
      stormCenterZ: this.storm.centerZ,
      stormRadius: this.storm.radius,
      stormTargetCenterX: this.storm.targetCenterX,
      stormTargetCenterZ: this.storm.targetCenterZ,
      stormTargetRadius: this.storm.targetRadius,
      playerX: this.localPlayer.x,
      playerZ: this.localPlayer.z,
      playerYaw: this.localPlayer.yaw,
      interactPrompt: this.lastInteractPrompt,
      hitMarkerKind: this.hitMarkerKind,
      killFeed: [...this.killFeed],
      minimapMarkers: markers,
      pointerLocked: this.pointerLocked,
      muted: this.sfx.isMuted(),
      matchTime: this.matchTime,
      p2pPeersConnected: this.p2pPeersConnected,
      killerName: this.killerName,
    });
  }

  public dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.unbindCleanup();
    this.clearWorldVisuals();
    this.mats.dispose();
    this.texPack.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
