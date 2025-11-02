import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('about-three-container');

if (!container) {
  throw new Error('Missing #about-three-container element for Three.js scene.');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(0, 4, 8);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const keyLight = new THREE.PointLight(0xffffff, 2, 100);
keyLight.position.set(0, 0, 10);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xffffff, 1, 100);
fillLight.position.set(10, 0, 10);
scene.add(fillLight);

const backLight = new THREE.PointLight(0xffffff, 1, 100);
backLight.position.set(0, 0, -10);
scene.add(backLight);

const loader = new GLTFLoader();
const modelUrl = 'SantiagoLogo.glb';

function setupModel(model) {
  model.position.set(-0.35, 0, -0.5);
  model.rotation.set(-0.25, 0, 0);
}

function loadModel(url) {
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      setupModel(model);
      scene.add(model);
      camera.lookAt(model.position);
      controls.target.copy(model.position);
      controls.update();
    },
    undefined,
    (error) => {
      console.error('An error happened while loading the model:', error);
    }
  );
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function resizeRendererToDisplaySize() {
  const { clientWidth, clientHeight } = container;
  if (!clientWidth || !clientHeight) {
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(clientWidth * pixelRatio);
  const height = Math.floor(clientHeight * pixelRatio);
  const canvas = renderer.domElement;

  if (canvas.width !== width || canvas.height !== height) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
}

function updateCameraFov() {
  const width = container.clientWidth;
  const zoomLevel = width < 480 ? 65 : width < 768 ? 55 : 45;
  if (camera.fov !== zoomLevel) {
    camera.fov = zoomLevel;
    camera.updateProjectionMatrix();
  }
}

function animate() {
  requestAnimationFrame(animate);
  resizeRendererToDisplaySize();
  updateCameraFov();
  controls.update();
  renderer.render(scene, camera);
}

const resizeObserver = new ResizeObserver(() => {
  resizeRendererToDisplaySize();
  updateCameraFov();
});
resizeObserver.observe(container);

resizeRendererToDisplaySize();
updateCameraFov();
loadModel(modelUrl);
animate();
