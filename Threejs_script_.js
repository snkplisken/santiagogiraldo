import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Three.js Scene Setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 10);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0); // Transparent background
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
let currentModel = null; // Variable to reference the loaded model

// Model URLs - Replace with your actual model URLs
const modelUrls = ['old_computer.glb', 'SantiagoLogo.glb', 'Floppy.glb', 'floppy_disk.glb'];
let currentModelIndex = 0;

// Function to modify the opacity of a model
function modifyModelOpacity(model, opacity) {
    if (!model) return;
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.opacity = opacity;
            child.material.transparent = true;
            child.material.depthWrite = opacity >= 1;
            child.material.alphaTest = 0.5; // Adjust as needed
        }
    });
}

// Function to slide and fade out a model
function fadeOutModel(model, duration = 1000, onComplete = () => {}) {
    if (!model) {
        onComplete();
        return;
    }

    let startOpacity = 1;
    let endOpacity = 0;
    let startPosX = model.position.x;
    let endPosX = -2; // Slide to the left
    let startTime = Date.now();

    function fade() {
        let currentTime = Date.now();
        let timeElapsed = currentTime - startTime;
        if (timeElapsed < duration) {
            let opacity = startOpacity + (endOpacity - startOpacity) * (timeElapsed / duration);
            let posX = startPosX + (endPosX - startPosX) * (timeElapsed / duration);
            model.position.x = posX;
            modifyModelOpacity(model, opacity);
            requestAnimationFrame(fade);
        } else {
            modifyModelOpacity(model, endOpacity);
            model.position.x = endPosX;
            scene.remove(model);
            onComplete();
        }
    }

    fade();
}

// Function to slide and fade in a model
function fadeInModel(model, duration = 1000) {
    if (!model) return;

    modifyModelOpacity(model, 0);
    model.position.x = 2; // Start position to the right
    scene.add(model);

    let startOpacity = 0;
    let endOpacity = 1;
    let startPosX = 2;
    let endPosX = 0; // Slide to center
    let startTime = Date.now();

    function fade() {
        let currentTime = Date.now();
        let timeElapsed = currentTime - startTime;
        if (timeElapsed < duration) {
            let opacity = startOpacity + (endOpacity - startOpacity) * (timeElapsed / duration);
            let posX = startPosX + (endPosX - startPosX) * (timeElapsed / duration);
            model.position.x = posX;
            modifyModelOpacity(model, opacity);
            requestAnimationFrame(fade);
        } else {
            modifyModelOpacity(model, endOpacity);
            model.position.x = endPosX;
        }
    }

    fade();
}

// Function to set the position of the model
function setModelPosition(model, x, y, z) {
    if (model) {
        model.position.set(3, 3, 0);
    }
}

// Function to set the rotation of the model
function setModelRotation(model, x, y, z) {
    if (model) {
        model.rotation.set(0, .5, 0);
    }
}

// Load a model by index
function loadModel(index) {
    loader.load(modelUrls[index], function (gltf) {
        fadeInModel(gltf.scene);
        currentModel = gltf.scene;
        setModelPosition(currentModel, 0, 0, 0); // Set initial position of the model
        setModelRotation(currentModel, 0, 0, 0); // Set initial rotation of the model
    }, undefined, function (error) {
        console.error('An error happened while loading the model:', error);
    });
}

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('keydown', function(event) {
    if (event.keyCode === 39) { // Right arrow key
        let nextModelIndex = (currentModelIndex + 1) % modelUrls.length;
        fadeOutModel(currentModel, 1000, () => {
            loadModel(nextModelIndex);
            currentModelIndex = nextModelIndex;
        });
    } else if (event.keyCode === 37) { // Left arrow key
        let nextModelIndex = (currentModelIndex - 1 + modelUrls.length) % modelUrls.length;
        fadeOutModel(currentModel, 1000, () => {
            loadModel(nextModelIndex);
            currentModelIndex = nextModelIndex;
        });
    }
});

// Load the first model initially with fade-in effect
loadModel(currentModelIndex);

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


