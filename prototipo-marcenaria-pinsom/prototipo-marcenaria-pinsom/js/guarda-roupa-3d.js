/**
 * Cena Three.js do guarda-roupa: renderer, câmera, luzes, render sob demanda, seleção de peças
 * (Raycaster) e limpeza.
 *
 * - Carregado por import() dinâmico a partir de js/etapas-narrativa.js; uma falha aqui
 *   (WebGL indisponível, CDN fora do ar) não afeta os demais módulos: a galeria continua.
 * - Three.js r170 via import map no index.html ("three" e "three/addons/").
 * - Cor: saída sRGB, texturas sRGB e NeutralToneMapping (preserva a cor da madeira, sem o
 *   desbotamento do ACES). Luz suave (hemisférica + principal quente + preenchimento) e
 *   ambiente leve (RoomEnvironment pré-filtrado) para os reflexos do vidro e dos metais.
 * - Render sob demanda: só desenha quando progresso, destaque, tamanho ou visibilidade mudam.
 * - Pixel ratio limitado (1,5 no celular, 2 no desktop). Uma única cena e um único canvas.
 * - A câmera é controlada só pelo progresso da narrativa (sem OrbitControls, para não disputar
 *   a rolagem vertical). A seleção por clique/toque usa coordenadas relativas ao retângulo real
 *   do canvas (inclui redimensionamento e transforms da transição de seções).
 * - Enquadramento (setFraming): no computador o canvas cobre o palco inteiro e os cards ficam
 *   por cima, à esquerda. A câmera enquadra o móvel só na área livre ({ center, width } em
 *   frações da largura) e desloca a projeção com setViewOffset, sem mover a câmera.
 */
import { MODEL_SIZE, buildWardrobe, cameraPoseAt, stagingAt } from './guarda-roupa-modelo.js';

const FOV = 30;
const TARGET_Y = MODEL_SIZE.height / 2;

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

/**
 * @param {HTMLElement} host contêiner do canvas
 * @param {{onFirstFrame?: Function}} options
 */
export async function createWardrobe3D(host, { onFirstFrame } = {}) {
  if (!supportsWebGL()) throw new Error('WebGL indisponível neste navegador.');

  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const isSmall = window.matchMedia('(max-width: 767px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  if (isSmall && 'transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 0.5;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.touchAction = 'pan-y'; // a rolagem vertical por toque continua livre
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.5;

  scene.add(new THREE.HemisphereLight(0xfffaf3, 0x8c7260, 0.75));
  const keyLight = new THREE.DirectionalLight(0xfff6ec, 1.5); // quase neutra: a madeira mantém o próprio tom
  keyLight.position.set(2.5, 4.5, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
  fillLight.position.set(-3, 2, 3);
  scene.add(fillLight);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400); // longe o bastante para a parede larga

  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const model = buildWardrobe(THREE, { anisotropy });
  scene.add(model.root, model.room);

  // Grade de "prancheta" para a etapa de desenho técnico (larga: cobre o canvas de tela cheia).
  const grid = new THREE.GridHelper(16, 80, 0x2b211a, 0x2b211a);
  grid.material.transparent = true;
  scene.add(grid);

  // Sombra de contato suave (textura radial), mais leve que shadow maps.
  const shadowTexture = createShadowTexture(THREE);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(MODEL_SIZE.width * 1.35, MODEL_SIZE.depth * 2.4), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.003;
  scene.add(shadow);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let progress = 0;
  let needsRender = true;
  let frame = 0;
  let isVisible = true;
  let firstFrameDone = false;
  let framing = { center: 0.5, width: 1 };

  function updateCamera() {
    const { clientWidth: width, clientHeight: height } = host;
    const aspect = width / Math.max(height, 1);
    camera.aspect = aspect;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // Distância que enquadra o móvel inteiro (com margem para a vista explodida) na área livre.
    const regionAspect = aspect * framing.width;
    const fit = Math.max(1.5 / tan, 1.9 / (tan * regionAspect)) + MODEL_SIZE.depth / 2;
    const pose = cameraPoseAt(progress);
    const distance = fit * pose.dist;
    camera.position.set(
      Math.sin(pose.theta) * Math.cos(pose.phi) * distance,
      TARGET_Y + Math.sin(pose.phi) * distance,
      Math.cos(pose.theta) * Math.cos(pose.phi) * distance,
    );
    camera.lookAt(0, TARGET_Y - 0.05, 0);
    // Centro da área livre fora do meio do canvas: desloca só a projeção (o móvel vai para o lado).
    if (framing.center !== 0.5) camera.setViewOffset(width, height, (0.5 - framing.center) * width, 0, width, height);
    else if (camera.view?.enabled) camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function render() {
    frame = 0;
    if (!needsRender || !isVisible || document.hidden) return;
    needsRender = false;
    const staging = stagingAt(progress);
    grid.material.opacity = staging.grid;
    grid.visible = staging.grid > 0.01;
    shadowMaterial.opacity = staging.shadow;
    model.applyProgress(progress);
    updateCamera();
    renderer.render(scene, camera);
    if (!firstFrameDone) {
      firstFrameDone = true;
      onFirstFrame?.();
    }
  }

  function requestRender() {
    needsRender = true;
    if (!frame) frame = requestAnimationFrame(render);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    requestRender();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && needsRender) requestRender();
  });
  visibilityObserver.observe(host);

  const onVisibilityChange = () => { if (!document.hidden && needsRender) requestRender(); };
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();

  /** Um objeto só é selecionável se ele e todos os ancestrais estiverem visíveis. */
  function isShown(object) {
    for (let node = object; node; node = node.parent) if (!node.visible) return false;
    return true;
  }

  return {
    canvas: renderer.domElement,
    model,
    /** Atualiza a pose (0–1). Chamadas repetidas no mesmo frame geram um único render. */
    setProgress(value) {
      const next = Math.min(1, Math.max(0, value));
      if (next === progress && firstFrameDone) return;
      progress = next;
      requestRender();
    },
    getProgress: () => progress,
    /** Área livre para o móvel ({ center, width } em frações da largura) ou null = canvas inteiro. */
    setFraming(next) {
      const value = next
        ? { center: Math.min(0.85, Math.max(0.15, next.center)), width: Math.min(1, Math.max(0.25, next.width)) }
        : { center: 0.5, width: 1 };
      if (Math.abs(value.center - framing.center) < 0.002 && Math.abs(value.width - framing.width) < 0.002) return;
      framing = value;
      requestRender();
    },
    renderNow() {
      needsRender = true;
      render();
    },
    /** Componente lógico sob o ponto da tela (coordenadas do evento) ou null. */
    pickAt(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      updateCamera(); // mesma câmera do último quadro, mesmo após redimensionar
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(model.selectable, false).find((item) => isShown(item.object));
      return hit ? hit.object.userData.componentKey : null;
    },
    setHover(key) {
      model.setHighlight({ hover: key });
      requestRender();
    },
    setSelected(key) {
      model.setHighlight({ selected: key });
      requestRender();
    },
    getComponentInfo: (key) => model.getComponent(key),
    componentsByCategory: (categoria) => model.componentsByCategory(categoria),
    swatchFor: (materialId) => model.swatches[materialId] || null,
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      model.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      shadow.geometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function createShadowTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(128, 64, 8, 128, 64, 128);
  gradient.addColorStop(0, 'rgba(40, 30, 20, 0.9)');
  gradient.addColorStop(0.55, 'rgba(40, 30, 20, 0.35)');
  gradient.addColorStop(1, 'rgba(40, 30, 20, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
