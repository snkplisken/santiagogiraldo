import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('about-three-container');

if (!container) {
  throw new Error('Missing #about-three-container element for Three.js scene.');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 2.8, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const keyLight = new THREE.PointLight(0xffffff, 2.2, 100);
keyLight.position.set(0, 2, 8);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xffffff, 1.2, 100);
fillLight.position.set(6, 2, 4);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 0.8, 100);
rimLight.position.set(-4, -1, -6);
scene.add(rimLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.addEventListener('change', render);

const loader = new GLTFLoader();
let activeModel = null;

loader.load(
  'SantiagoLogo.glb',
  (gltf) => {
    activeModel = gltf.scene;
    activeModel.position.set(0, -0.6, 0);
    scene.add(activeModel);

    controls.target.copy(activeModel.position);
    onResize();
    render();
  },
  undefined,
  (error) => {
    console.error('An error happened while loading the model:', error);
  }
);

function onResize() {
  const { clientWidth, clientHeight } = container;
  if (!clientWidth || !clientHeight) {
    return;
  }

  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  adjustCamera();
  render();
}

function adjustCamera() {
  if (!activeModel) {
    return;
  }

  const boundingBox = new THREE.Box3().setFromObject(activeModel);
  const size = boundingBox.getSize(new THREE.Vector3());
  const center = boundingBox.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = Math.max(fitHeightDistance, fitWidthDistance) + 0.5;

  camera.position.set(center.x, center.y + maxDim * 0.25, center.z + distance);
  camera.lookAt(center);
  controls.target.copy(center);
}

function render() {
  renderer.render(scene, camera);
}

window.addEventListener('resize', onResize);

if (typeof ResizeObserver !== 'undefined') {
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);
}

onResize();
