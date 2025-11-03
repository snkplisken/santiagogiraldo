import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('about-three-container');

if (!container) {
  throw new Error('Missing #about-three-container element for Three.js scene.');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  1,
  0.1,
  100
);
camera.position.set(0, 2.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(4, 6, 8);
scene.add(directionalLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(-4, -3, -6);
scene.add(backLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.6;
controls.minDistance = 3;
controls.maxDistance = 10;

const loader = new GLTFLoader();
let activeModel = null;

loader.load(
  'SantiagoLogo.glb',
  (gltf) => {
    activeModel = gltf.scene;
    activeModel.position.set(0, -0.6, 0);
    activeModel.rotation.set(0, Math.PI / 4, 0);
    scene.add(activeModel);

    camera.lookAt(activeModel.position);
    controls.target.copy(activeModel.position);
    onResize();
    animate();
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

  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);

  if (activeModel) {
    activeModel.rotation.y += 0.0025;
  }

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', onResize);

if (typeof ResizeObserver !== 'undefined') {
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);
}

onResize();
