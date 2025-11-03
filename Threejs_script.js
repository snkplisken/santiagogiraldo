import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Three.js Scene Setup
const scene = new THREE.Scene();

const container = document.getElementById('threejs-container');

const getContainerSize = () => {
    if (!container) {
        return { width: window.innerWidth, height: window.innerHeight };
    }

    const { clientWidth, clientHeight } = container;
    return {
        width: clientWidth || window.innerWidth,
        height: clientHeight || window.innerHeight,
    };
};

const { width: initialWidth, height: initialHeight } = getContainerSize();

const camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 1000);
camera.position.set(0, 4, 8);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0); // Transparent background
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(initialWidth, initialHeight);

if (container) {
    container.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}

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

// Replace with your actual model URL
const modelUrl = 'SantiagoLogo.glb'; // Replace with your model's URL

// Function to set the position and rotation of the model
function setupModel(model) {
    model.position.set(-.35, 0, -.5); // Set position
    model.rotation.set(-.25, 0, 0); // Set rotation
}

// Load the model
function loadModel(url) {
    loader.load(url, function (gltf) {
        const model = gltf.scene;
        setupModel(model);
        scene.add(model);

        // Make the camera look at the model
        camera.lookAt(model.position);
    }, undefined, function (error) {
        console.error('An error happened while loading the model:', error);
    });
}

const controls = new OrbitControls(camera, renderer.domElement);

// Function to control camera zoom based on window width
function setCameraZoom() {
    const { width } = getContainerSize();
    const zoomLevel = width < 720 ? 50 : 30;
    camera.fov = zoomLevel;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    setCameraZoom(); // Update zoom level based on window width
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const { width, height } = getContainerSize();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    setCameraZoom(); // Adjust zoom on resize
});

// Load the model
loadModel(modelUrl);

// DOM Content Loaded Event for Other Interactions
document.addEventListener('DOMContentLoaded', function() {
    // Scrolling Text Functionality in Footer
    const footerText = document.querySelector('.footer-text'); 
    if (footerText) {
        let scrollAmount = 0;
        function scrollText() {
            scrollAmount++;
            if (scrollAmount >= footerText.offsetWidth) {
                scrollAmount = -window.innerWidth;
            }
            footerText.style.transform = `translateX(${-scrollAmount}px)`;
        }
        setInterval(scrollText, 20); // Adjust speed as necessary
    }

    // Hamburger Menu Functionality
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navUl = document.querySelector('nav ul');
    if (hamburgerMenu && navUl) {
        hamburgerMenu.addEventListener('click', function() {
            navUl.classList.toggle('open');
        });
    }

    // Footer Close Button Functionality
    const closeButton = document.getElementById('footerCloseButton');
    if (closeButton) {
        closeButton.onclick = function() {
            this.parentElement.style.display = 'none'; // Hides the footer
        };
    }
});
