import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sampleCamera, canonicalRanges, type CameraPose } from './camera';
import { HERO_FRAMES_REVEAL } from './timeline';

export type WorldFrame = {
  progress: number;
  scene: string;
  local: number;
  reducedMotion: boolean;
  pointer: { x: number; y: number };
  time: number;
};

export type WorldMetrics = {
  drawCalls: number;
  triangles: number;
  pixelRatio: number;
  contextLost: boolean;
  frameTime: number;
};

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (a: number, b: number, p: number) => {
  const t = clamp((p - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function brushedTexture() {
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);
  let seed = 1741;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < height; y++) {
    const line = random() * 17;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const shade = 183 + line + random() * 12;
      data[i] = data[i + 1] = data[i + 2] = shade;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 8);
  texture.needsUpdate = true;
  return texture;
}

function gearGeometry() {
  const outline = new THREE.Shape();
  const teeth = 14;
  for (let i = 0; i < teeth * 4; i++) {
    const angle = i / (teeth * 4) * Math.PI * 2;
    const radius = i % 4 === 1 || i % 4 === 2 ? 3.05 : 2.55;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) outline.moveTo(x, y);
    else outline.lineTo(x, y);
  }
  outline.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, 0.92, 0, Math.PI * 2, true);
  outline.holes.push(bore);
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.65, bevelEnabled: true, bevelThickness: 0.08,
    bevelSize: 0.07, bevelSegments: 3, curveSegments: 48,
  });
  geometry.translate(0, 0, -0.325);
  return geometry;
}

function ribbonGeometry() {
  // Closed, substantial architectural band; the gentle half-twist catches the softboxes.
  const segments = 180;
  const across = 12;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    for (let j = 0; j <= across; j++) {
      const v = (j / across - 0.5) * 1.9;
      const radius = 3.65 + v * Math.cos(a * 1.5);
      vertices.push(radius * Math.cos(a), radius * Math.sin(a) * 1.12, v * Math.sin(a * 1.5) + Math.sin(a * 2) * 0.28);
      uvs.push(i / segments, j / across);
      if (i < segments && j < across) {
        const k = i * (across + 1) + j;
        indices.push(k, k + 1, k + across + 1, k + 1, k + across + 2, k + across + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Deliberately owns no animation loop. ExperienceDirector's one GSAP ticker supplies
 * every frame, making the camera, geometry, and semantic overlays share one clock.
 */
export class ExperienceWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, 0.08, 180);
  private canvas: HTMLCanvasElement;
  private environmentTarget?: THREE.WebGLRenderTarget;
  private brush = brushedTexture();
  private portal = new THREE.Group();
  private heroUniverse?: THREE.Mesh;
  private portalUniverseReady: Promise<void> = Promise.resolve();
  private outroArtworkReady: Promise<void> = Promise.resolve();
  private leftHinge = new THREE.Group();
  private rightHinge = new THREE.Group();
  private heroArchitecture = new THREE.Group();
  private heroFrameMaterial?: THREE.Material;
  private duality = new THREE.Group();
  private organic = new THREE.Group();
  private engineered = new THREE.Group();
  private genesis = new THREE.Group();
  private ribbon: THREE.Mesh;
  private outro = new THREE.Group();
  private floor: THREE.Mesh;
  private key: THREE.SpotLight;
  private rim: THREE.DirectionalLight;
  private keyTarget = new THREE.Object3D();
  private target = new THREE.Vector3();
  private position = new THREE.Vector3();
  private cameraPose: CameraPose = { position: [0, 0, 0], target: [0, 0, 0], fov: 43 };
  private width = 1;
  private height = 1;
  private mobile = false;
  private lost = false;
  private disposed = false;
  private dpr = 1;
  private lastTime = 0;
  private averageFrameTime = 16.7;
  private slowFrames = 0;
  private shadowDirty = true;
  private previousProgress = -1;
  private readonly onLost: (event: Event) => void;
  private readonly onRestored: () => void;

  async prepare(frame: WorldFrame) {
    if (this.disposed || this.lost) throw new Error('Cannot prepare a disposed or unavailable WebGL scene.');

    await Promise.all([this.portalUniverseReady, this.outroArtworkReady]);
    this.render(frame, false);
    await this.renderer.compileAsync(this.scene, this.camera);

    if (this.disposed || this.lost) throw new Error('WebGL scene became unavailable during shader preparation.');
    this.shadowDirty = true;
  }

  constructor(canvas: HTMLCanvasElement, onError?: () => void) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x0b1736, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x0b1736, 0.025);
    this.scene.environmentIntensity = 0.2;
    this.createEnvironment();

    const metal = new THREE.MeshPhysicalMaterial({
      color: 0x111112, metalness: 0.92, roughness: 0.42,
      bumpMap: this.brush, bumpScale: 0.022, anisotropy: 0.45,
      envMapIntensity: 0.6, clearcoat: 0.025, clearcoatRoughness: 0.5,
    });
    const edge = new THREE.MeshPhysicalMaterial({ color: 0x393a39, metalness: 1, roughness: 0.38, envMapIntensity: 0.7, bumpMap: this.brush, bumpScale: 0.008 });
    const black = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.7, metalness: 0.4, envMapIntensity: 0.3 });

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 190), new THREE.MeshStandardMaterial({ color: 0x0b1736, roughness: 0.69, metalness: 0.25, envMapIntensity: 0.35, bumpMap: this.brush, bumpScale: 0.012 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(0, -3.35, -67);
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    this.buildPortal(metal, edge, black);
    this.buildHero(black);

    const stone = new THREE.MeshPhysicalMaterial({ color: 0xd2cbbc, roughness: 0.72, metalness: 0.03, clearcoat: 0.06, bumpMap: this.brush, bumpScale: 0.018 });
    // Restore the ivory open book with blue binding and printed page details.
    const cover = new THREE.MeshStandardMaterial({ color: 0x163b66, metalness: 0.25, roughness: 0.48 });
    const ink = new THREE.MeshStandardMaterial({ color: 0x777c80, roughness: 0.8 });
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.rotation.y = side * 0.18;
      leaf.add(this.box(2.45, 5.5, 0.16, cover, side * 1.225, 0, -0.18));
      leaf.add(this.box(2.28, 5.24, 0.34, stone, side * 1.18, 0, 0.06));
      for (let line = 0; line < 11; line++) {
        leaf.add(this.box(line === 10 ? 1.12 : 1.7, 0.025, 0.012, ink, side * 1.18, 1.9 - line * 0.35, 0.237));
      }
      this.organic.add(leaf);
    }
    this.organic.add(this.box(0.15, 5.5, 0.44, cover, 0, 0, -0.08));
    this.organic.traverse((object) => {
      if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
    });
    this.organic.rotation.set(0.05, -0.25, 0.3);
    this.duality.add(this.organic);
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0x929596, metalness: 1, roughness: 0.24, envMapIntensity: 2.2, anisotropy: 0.75, bumpMap: this.brush, bumpScale: 0.01 });
    const gear = new THREE.Mesh(gearGeometry(), chrome);
    gear.castShadow = true;
    gear.receiveShadow = true;
    this.engineered.add(gear);
    const hub = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 12, 64), edge);
    hub.position.z = 0.4;
    this.engineered.add(hub);
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 6), black);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(Math.cos(angle) * 1.72, Math.sin(angle) * 1.72, 0.4);
      this.engineered.add(bolt);
    }
    this.duality.add(this.engineered);
    this.duality.position.set(0, 0, -46);
    this.scene.add(this.duality);

    this.ribbon = new THREE.Mesh(ribbonGeometry(), new THREE.MeshPhysicalMaterial({
      color: 0x66696b, metalness: 0.95, roughness: 0.28, envMapIntensity: 1.4,
      side: THREE.DoubleSide, anisotropy: 0.65, bumpMap: this.brush,
      bumpScale: 0.008, clearcoat: 0.05,
    }));
    this.ribbon.castShadow = true;
    this.genesis.add(this.ribbon);
    this.genesis.position.set(2.2, 0.4, -98);
    this.scene.add(this.genesis);

    this.buildOutro();

    this.scene.add(new THREE.HemisphereLight(0xf6f8fc, 0x0b1736, 0.3));
    this.key = new THREE.SpotLight(0x00c8e8, 180, 60, 0.68, 0.85, 1.5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.bias = -0.00008;
    this.key.shadow.normalBias = 0.04;
    this.key.shadow.camera.near = 0.5;
    this.key.shadow.camera.far = 55;
    this.key.target = this.keyTarget;
    this.scene.add(this.key, this.keyTarget);
    this.rim = new THREE.DirectionalLight(0xdce4eb, 1.4);
    this.rim.position.set(-7, 4, -5);
    this.scene.add(this.rim, this.rim.target);

    this.onLost = (event) => {
      event.preventDefault();
      this.lost = true;
      // Release the old context's disposal listeners before Three replaces its
      // resource caches. Calling GL deletion while the context is lost is a
      // harmless no-op; calling those stale listeners after restore is invalid.
      // CPU geometry, material settings and texture pixels remain available.
      this.releaseSceneGpuResources();
      onError?.();
    };
    this.onRestored = () => {
      if (this.disposed) return;
      this.lost = false;
      this.createEnvironment();
      this.brush.needsUpdate = true;
      this.shadowDirty = true;
      this.resize();
      canvas.dispatchEvent(new CustomEvent('threshold:context-restored'));
    };
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
    this.resize();
  }

  private createEnvironment() {
    this.environmentTarget?.dispose();
    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = generator.fromScene(environment, 0.055);
    this.scene.environment = this.environmentTarget.texture;
    generator.dispose();
    environment.dispose();
  }

  private box(width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  private buildPortal(metal: THREE.Material, edge: THREE.Material, black: THREE.Material) {
    this.portal.position.set(1.15, 0, 0);
    this.leftHinge.position.set(-2.225, 0, 0);
    this.rightHinge.position.set(2.225, 0, 0);
    const geometry = new RoundedBoxGeometry(2.21, 6.5, 0.48, 3, 0.035);
    const left = new THREE.Mesh(geometry, metal);
    left.position.x = 1.105;
    left.castShadow = true;
    left.receiveShadow = true;
    const right = new THREE.Mesh(geometry, metal);
    right.position.x = -1.105;
    right.castShadow = true;
    right.receiveShadow = true;
    this.leftHinge.add(left);
    this.rightHinge.add(right);

    // The two fine edge highlights are part of each hinged leaf, never a CSS reveal.
    this.leftHinge.add(this.box(0.018, 6.34, 0.012, edge, 2.19, 0, 0.246));
    this.rightHinge.add(this.box(0.018, 6.34, 0.012, edge, -2.19, 0, 0.246));
    this.leftHinge.add(this.box(0.012, 6.12, 0.012, edge, 0.08, 0, 0.246));
    this.rightHinge.add(this.box(0.012, 6.12, 0.012, edge, -0.08, 0, 0.246));
    this.portal.add(this.leftHinge, this.rightHinge);
    const outer = new THREE.Mesh(new RoundedBoxGeometry(0.24, 6.85, 0.78, 2, 0.02), black);
    outer.position.set(-2.4, 0.02, -0.1);
    const outerRight = outer.clone();
    outerRight.position.x = 2.4;
    this.portal.add(outer, outerRight, this.box(5.04, 0.22, 0.78, black, 0, 3.4, -0.1));
    // Receding jambs make the aperture read as a heavy architectural volume.
    this.portal.add(this.box(0.035, 6.54, 1.5, edge, -2.25, 0, -0.65));
    this.portal.add(this.box(0.035, 6.54, 1.5, edge, 2.25, 0, -0.65));
    this.portal.add(this.box(4.5, 0.025, 1.5, edge, 0, 3.26, -0.65));
    const interiorLight = new THREE.PointLight(0xd7a64b, 70, 15, 1.8);
    interiorLight.position.set(0, 1, -2.8);
    this.portal.add(interiorLight);

    // A low-energy, elongated soft light footprint on the actual 3D ground plane.
    const footprint = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 11), new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0xe0d4bd) }, strength: { value: 0.22 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv; uniform vec3 color; uniform float strength; void main(){float a=pow(max(0.,1.-abs(vUv.x-.5)*2.),2.5)*pow(vUv.y,3.)*strength; gl_FragColor=vec4(color,a);}',
      transparent: true, depthWrite: false,
    }));
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.set(0, -3.335, 5.1);
    this.portal.add(footprint);
    this.scene.add(this.portal);
  }

  private buildHero(black: THREE.Material) {
    const frameMaterial = black.clone();
    frameMaterial.transparent = true;
    this.heroFrameMaterial = frameMaterial;
    let resolveUniverse: () => void = () => {};
    let rejectUniverse: (error: Error) => void = () => {};
    this.portalUniverseReady = new Promise<void>((resolve, reject) => {
      resolveUniverse = resolve;
      rejectUniverse = reject;
    });
    const universeTexture = new THREE.TextureLoader().load(
      '/assets/ensam-rabat-universe.png',
      () => resolveUniverse(),
      undefined,
      () => rejectUniverse(new Error('The ENSAM Rabat doorway artwork could not be loaded.')),
    );
    universeTexture.colorSpace = THREE.SRGBColorSpace;
    universeTexture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    universeTexture.wrapS = THREE.ClampToEdgeWrapping;
    universeTexture.repeat.set(0.52, 1);
    universeTexture.offset.x = 0.24;
    const universeMaterial = new THREE.MeshBasicMaterial({
      map: universeTexture,
      color: 0xc7d8ff,
      transparent: true,
      opacity: 0.74,
      toneMapped: false,
    });
    const doorwayIndex = 3;
    const doorwayZ = -17 - doorwayIndex * 5.8;
    const doorwayWidth = 14.8;
    const doorwayOpeningWidth = doorwayWidth - 0.58;
    const doorwayOpeningHeight = 15.25;
    this.heroUniverse = new THREE.Mesh(
      new THREE.PlaneGeometry(doorwayOpeningWidth, doorwayOpeningHeight),
      universeMaterial,
    );
    this.heroUniverse.position.set(0, 4, doorwayZ - 0.04);
    this.heroUniverse.renderOrder = -1;
    this.heroArchitecture.add(this.heroUniverse);

    for (let i = 0; i < 3; i++) {
      const z = -17 - i * 5.8;
      const width = 12 + i * 0.4;
      this.heroArchitecture.add(this.box(0.28, 14, 0.38, frameMaterial, -width / 2, 3.5, z));
      this.heroArchitecture.add(this.box(0.28, 14, 0.38, frameMaterial, width / 2, 3.5, z));
      this.heroArchitecture.add(this.box(width, 0.28, 0.38, frameMaterial, 0, 10.35, z));
    }
    const deepFrameZ = -17 - 3 * 5.8;
    this.heroArchitecture.add(this.box(0.34, 16, 0.46, frameMaterial, -doorwayWidth / 2, 4, deepFrameZ));
    this.heroArchitecture.add(this.box(0.34, 16, 0.46, frameMaterial, doorwayWidth / 2, 4, deepFrameZ));
    this.heroArchitecture.add(this.box(doorwayWidth, 0.34, 0.46, frameMaterial, 0, 11.82, deepFrameZ));
    const overhead = new THREE.PointLight(0xe8e0d2, 125, 30, 1.8);
    overhead.position.set(0, 5, -24);
    this.heroArchitecture.add(overhead);
    this.scene.add(this.heroArchitecture);
  }

  private buildOutro() {
    // Echo the first portal, now permanently open. The visitor has crossed the threshold.
    this.outro.position.set(0, 0.8, -128);
    this.outro.rotation.y = -0.1;
    let resolveArtwork: () => void = () => {};
    let rejectArtwork: (error: Error) => void = () => {};
    this.outroArtworkReady = new Promise<void>((resolve, reject) => {
      resolveArtwork = resolve;
      rejectArtwork = reject;
    });
    const artworkTexture = new THREE.TextureLoader().load(
      '/assets/ensam-creative-pic.png',
      () => resolveArtwork(),
      undefined,
      () => rejectArtwork(new Error('The ENSAM Rabat outro artwork could not be loaded.')),
    );
    artworkTexture.colorSpace = THREE.SRGBColorSpace;
    artworkTexture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    artworkTexture.wrapS = THREE.ClampToEdgeWrapping;
    artworkTexture.wrapT = THREE.ClampToEdgeWrapping;
    // Match the actual opening, so the image cannot extend outside the arch.
    const opening = new THREE.Shape();
    opening.moveTo(-2.4, -4.1);
    opening.lineTo(2.4, -4.1);
    opening.lineTo(2.4, 0.1);
    opening.bezierCurveTo(4.5, 2.3, 3.4, 5.5, 0, 5.8);
    opening.bezierCurveTo(-3.4, 5.5, -4.5, 2.3, -2.4, 0.1);
    opening.closePath();
    const artworkGeometry = new THREE.ShapeGeometry(opening, 48);
    const positions = artworkGeometry.getAttribute('position');
    const uvs = artworkGeometry.getAttribute('uv');
    // Cover the full 9.9-unit height with a centered crop, preserving image proportions.
    const imageWidth = 9.9 * (1672 / 941);
    for (let i = 0; i < positions.count; i++) {
      uvs.setXY(i, 0.5 + positions.getX(i) / imageWidth, (positions.getY(i) + 4.1) / 9.9);
    }
    uvs.needsUpdate = true;
    const artwork = new THREE.Mesh(
      artworkGeometry,
      new THREE.MeshBasicMaterial({
        map: artworkTexture,
        color: 0xffffff,
        toneMapped: false,
      }),
    );
    // Seat the image at the rear of the opening, behind the visible stone reveals.
    artwork.position.set(0, 0, -1.105);
    this.outro.add(artwork);
    const artworkWash = new THREE.Mesh(
      artworkGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x174d91,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    artworkWash.position.set(0, 0, -1.095);
    this.outro.add(artworkWash);
    // Rabat-inspired pointed horseshoe arch, framed by a restrained rectangular alfiz.
    const stone = new THREE.MeshStandardMaterial({ color: 0x3c4549, roughness: 0.88 });
    const carved = new THREE.MeshStandardMaterial({ color: 0x3c4549, roughness: 0.72, metalness: 0.06 });
    const innerStone = new THREE.MeshStandardMaterial({ color: 0x96734f, roughness: 0.82, metalness: 0.02 });
    const recess = stone;
    const facade = new THREE.Shape();
    facade.moveTo(-7.2, -4.1);
    facade.lineTo(-7.2, 7.1);
    facade.lineTo(7.2, 7.1);
    facade.lineTo(7.2, -4.1);
    facade.lineTo(2.4, -4.1);
    facade.lineTo(2.4, 0.1);
    facade.bezierCurveTo(4.5, 2.3, 3.4, 5.5, 0, 5.8);
    facade.bezierCurveTo(-3.4, 5.5, -4.5, 2.3, -2.4, 0.1);
    facade.lineTo(-2.4, -4.1);
    facade.closePath();
    const masonry = new THREE.Mesh(new THREE.ExtrudeGeometry(facade, {
      depth: 1.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045,
      bevelSegments: 2, curveSegments: 48,
    }), [stone, innerStone]);
    masonry.position.z = -1.1;
    masonry.castShadow = true;
    masonry.receiveShadow = true;
    this.outro.add(masonry);

    const archPath = new THREE.CurvePath<THREE.Vector3>();
    const v = (x: number, y: number) => new THREE.Vector3(x, y, 0);
    archPath.add(new THREE.LineCurve3(v(-2.4, -4.1), v(-2.4, 0.1)));
    archPath.add(new THREE.CubicBezierCurve3(v(-2.4, 0.1), v(-4.5, 2.3), v(-3.4, 5.5), v(0, 5.8)));
    archPath.add(new THREE.CubicBezierCurve3(v(0, 5.8), v(3.4, 5.5), v(4.5, 2.3), v(2.4, 0.1)));
    archPath.add(new THREE.LineCurve3(v(2.4, 0.1), v(2.4, -4.1)));
    for (const scale of [1, 1.1]) {
      const moulding = new THREE.Mesh(new THREE.TubeGeometry(archPath, 160, 0.075, 6, false), carved);
      moulding.scale.set(scale, scale, 1);
      moulding.position.z = 0.09;
      this.outro.add(moulding);
    }
    // The alfiz and shallow diamond frieze provide identity without dense ornament.
    for (const side of [-1, 1]) {
      this.outro.add(this.box(0.14, 10.6, 0.14, carved, side * 4.25, 1.2, 0.12));
      this.outro.add(this.box(1.1, 0.3, 1.45, carved, side * 6.55, 7.15, -0.45));
      this.outro.add(this.box(15, 10.8, 1.2, recess, side * 14.7, 1.3, -3));
    }
    this.outro.add(this.box(8.65, 0.14, 0.14, carved, 0, 6.5, 0.12));
    this.outro.add(this.box(14.5, 0.2, 1.35, carved, 0, 7.05, -0.45));
    for (let i = -6; i <= 6; i++) {
      const diamond = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 4, 4), carved);
      diamond.position.set(i * 0.55, 6.83, 0.1);
      this.outro.add(diamond);
    }
    const lightSource = new THREE.PointLight(0xffe7c5, 120, 30, 1.8);
    lightSource.position.set(0, 3, -3);
    this.outro.add(lightSource);
    this.scene.add(this.outro);
  }

  resize() {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(rect.width, 1);
    this.height = Math.max(rect.height, 1);
    this.mobile = this.width < 768 || this.width / this.height < 0.92;
    const cap = this.mobile ? 1.25 : 1.65;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap, this.dpr < 1 ? this.dpr : cap);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.shadowDirty = true;
  }

  render(frame: WorldFrame, draw = true) {
    if (this.disposed || this.lost) return false;
    const range = canonicalRanges[frame.scene];
    // Reduced motion presents one composed still per chapter: no dolly, orbit,
    // hinge animation, or ambient movement while the visitor reads and scrolls.
    const local = frame.reducedMotion ? (frame.scene === 'portal' ? 0.64 : 0.45) : clamp(frame.local, 0, 1);
    const p = range ? lerp(range[0], range[1], local) : clamp(frame.progress, 0, 1);
    const motion = frame.reducedMotion ? 0 : 1;
    const time = frame.time;
    if (draw && this.lastTime && time > this.lastTime && !document.hidden) {
      const elapsed = Math.min((time - this.lastTime) * 1000, 150);
      this.averageFrameTime += (elapsed - this.averageFrameTime) * 0.025;
      if (elapsed > 30) this.slowFrames++;
      else this.slowFrames = Math.max(0, this.slowFrames - 0.5);
      if (this.slowFrames > 120 && this.dpr > 0.85) {
        this.dpr = Math.max(0.8, this.dpr - 0.2);
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(this.width, this.height, false);
        this.slowFrames = 0;
      }
    }
    if (draw) this.lastTime = time;

    const pose = sampleCamera(p, this.cameraPose);
    this.position.fromArray(pose.position);
    this.target.fromArray(pose.target);
    if (this.mobile) {
      // Framing preserves the tall doorway; sculpture pairs are composed vertically.
      this.position.x *= 0.32;
      this.position.z += 0.8 * (1 - smooth(0.08, 0.16, p));
      this.target.x = lerp(0.85, this.target.x * 0.65, smooth(0.08, 0.16, p));
    }
    this.position.x += (frame.pointer.x * 0.1 + Math.sin(time * 0.14) * 0.025) * motion;
    this.position.y += (frame.pointer.y * 0.055 + Math.cos(time * 0.18) * 0.018) * motion;
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.target);
    this.camera.fov = pose.fov + (this.mobile ? lerp(2, 9, smooth(0.08, 0.17, p)) : 0);
    this.camera.updateProjectionMatrix();

    const opening = smooth(0.083, 0.174, p);
    this.leftHinge.rotation.y = opening * Math.PI * 0.485;
    this.rightHinge.rotation.y = -opening * Math.PI * 0.485;
    const doorArrival = smooth(0.02, 0.16, p);
    this.portal.position.x = lerp(6.5, 0, doorArrival);
    const doorScale = lerp(0.42, 1, doorArrival);
    this.portal.scale.setScalar(doorScale);
    this.portal.visible = p < 0.28;
    const roomReveal = smooth(HERO_FRAMES_REVEAL[0], HERO_FRAMES_REVEAL[1], p);
    this.heroArchitecture.visible = roomReveal > 0 && p < 0.53;
    if (this.heroFrameMaterial) {
      this.heroFrameMaterial.opacity = roomReveal;
      this.heroFrameMaterial.depthWrite = roomReveal === 1;
    }
    if (this.heroUniverse) {
      this.heroUniverse.visible = roomReveal > 0 && p < 0.31;
      (this.heroUniverse.material as THREE.MeshBasicMaterial).opacity = 0.74 * roomReveal;
    }
    this.duality.visible = p > 0.415 && p < 0.69;
    this.genesis.visible = p > 0.72 && p < 0.95;
    this.outro.visible = p > 0.835;

    const separation = smooth(0.535, 0.625, p);
    this.duality.scale.setScalar(smooth(0.475, 0.537, p));
    this.organic.position.set(lerp(-2.65, -5.3, separation), this.mobile ? 0.65 : 0.15, 0);
    this.organic.rotation.y = lerp(-0.28, 0.5, separation);
    this.organic.rotation.z = lerp(0.35, 0.8, separation);
    this.engineered.position.set(lerp(2.95, 5.5, separation), this.mobile ? -0.8 : 0.1, 0.35);
    this.engineered.rotation.set(0.12, lerp(-0.55, -1.0, separation), lerp(-0.15, -0.3, separation));
    if (this.mobile) {
      this.organic.position.x *= 0.65;
      this.engineered.position.x *= 0.65;
      this.organic.scale.setScalar(0.82);
      this.engineered.scale.setScalar(0.82);
    } else {
      this.organic.scale.setScalar(1);
      this.engineered.scale.setScalar(1);
    }

    const emergence = smooth(0.747, 0.823, p);
    this.genesis.scale.setScalar(lerp(0.025, 0.96, emergence));
    this.ribbon.rotation.set(lerp(0.9, 0.17, emergence), lerp(-1.1, 0.5, smooth(0.77, 0.88, p)), lerp(-0.8, 0.2, smooth(0.77, 0.88, p)));
    // The studio rig travels with the narrative, avoiding a light switch at cues.
    const litZ = -23 * smooth(0.16, 0.25, p)
      - 23 * smooth(0.39, 0.53, p)
      - 52 * smooth(0.64, 0.79, p)
      - 30 * smooth(0.855, 0.93, p);
    this.key.position.set(5, 9, litZ + 6);
    this.key.intensity = 75 + 125 * smooth(0.15, 0.25, p);
    this.keyTarget.position.set(0, 0, litZ);
    this.rim.position.set(-6, 4, litZ - 4);
    this.rim.intensity = 0.8 + 0.8 * smooth(0.15, 0.25, p);
    this.rim.target.position.set(0, 0, litZ);
    this.renderer.toneMappingExposure = 1.05 + 0.1 * smooth(0.48, 0.53, p) * (1 - smooth(0.62, 0.68, p));

    if (this.shadowDirty || Math.abs(p - this.previousProgress) > 0.000001) {
      this.renderer.shadowMap.needsUpdate = true;
      if (draw) {
        this.shadowDirty = false;
        this.previousProgress = p;
      }
    }
    if (!draw) return false;
    this.renderer.render(this.scene, this.camera);
    return true;
  }

  getMetrics(): WorldMetrics {
    return { drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, pixelRatio: this.dpr, contextLost: this.lost, frameTime: this.averageFrameTime };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    this.releaseSceneGpuResources();
    this.renderer.dispose();
    this.scene.clear();
  }

  private releaseSceneGpuResources() {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => materials.add(material));
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    this.brush.dispose();
    this.scene.environment = null;
    this.environmentTarget?.dispose();
    this.environmentTarget = undefined;
    this.key.shadow.dispose();
    this.key.shadow.map = null;
    this.key.shadow.mapPass = null;
  }
}
