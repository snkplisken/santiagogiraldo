import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Pages can override the model and container by attaching data attributes
// to the <script type="module" src="Threejs_script.js"> tag, e.g.
// <script type="module" src="Threejs_script.js" data-model-url="MyModel.glb"></script>
// Any data-* attribute becomes available through scriptDataset below.
const scriptElement = document.querySelector('script[type="module"][src$="Threejs_script.js"]');
const scriptDataset = scriptElement?.dataset ?? {};

if (!scriptElement) {
    console.info(
        'Threejs_script.js: using default model configuration. Add data attributes to the module script tag to override the model per page.'
    );
}

const DEFAULT_MODEL_URL = 'SantiagoLogo.glb';
const DEFAULT_CONTAINER_ID = 'threejs-container';
const DEFAULT_MODEL_POSITION = [-0.35, 0, -0.5];
const DEFAULT_MODEL_ROTATION = [-0.25, 0, 0];
const DEFAULT_MODEL_SCALE = [1, 1, 1];
const DEFAULT_CAMERA_POSITION = [0, 4, 8];

const parseVector = (value, fallback) => {
    if (!value) {
        return fallback;
    }

    const parsed = value
        .split(',')
        .map((segment) => Number.parseFloat(segment.trim()))
        .filter((number) => !Number.isNaN(number));

    return parsed.length === fallback.length ? parsed : fallback;
};

const parseOptionalVector = (value, expectedLength = 3) => {
    if (!value) {
        return null;
    }

    const parsed = value
        .split(',')
        .map((segment) => Number.parseFloat(segment.trim()))
        .filter((number) => !Number.isNaN(number));

    return parsed.length === expectedLength ? parsed : null;
};

const resolveContainer = () => {
    if (scriptDataset.containerId) {
        const customContainer = document.getElementById(scriptDataset.containerId);
        if (customContainer) {
            return customContainer;
        }
    }

    return document.getElementById(DEFAULT_CONTAINER_ID);
};

const container = resolveContainer();

// Three.js Scene Setup
const scene = new THREE.Scene();
const clock = new THREE.Clock();
let mixer = null;
let currentModel = null;
let pendingModelRequestId = 0;

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
const cameraPosition = parseVector(scriptDataset.cameraPosition, DEFAULT_CAMERA_POSITION);
const cameraTargetVector = parseOptionalVector(scriptDataset.cameraTarget);
const explicitCameraTarget = cameraTargetVector ? new THREE.Vector3(...cameraTargetVector) : null;
camera.position.set(...cameraPosition);

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

const lightingSliderConfigurations = [
    { inputId: 'key-light-x', valueId: 'key-light-x-value', apply: (value) => { keyLight.position.x = value; } },
    { inputId: 'key-light-y', valueId: 'key-light-y-value', apply: (value) => { keyLight.position.y = value; } },
    { inputId: 'key-light-z', valueId: 'key-light-z-value', apply: (value) => { keyLight.position.z = value; } },
    { inputId: 'key-light-intensity', valueId: 'key-light-intensity-value', apply: (value) => { keyLight.intensity = value; } },
    { inputId: 'fill-light-x', valueId: 'fill-light-x-value', apply: (value) => { fillLight.position.x = value; } },
    { inputId: 'fill-light-y', valueId: 'fill-light-y-value', apply: (value) => { fillLight.position.y = value; } },
    { inputId: 'fill-light-z', valueId: 'fill-light-z-value', apply: (value) => { fillLight.position.z = value; } },
    { inputId: 'fill-light-intensity', valueId: 'fill-light-intensity-value', apply: (value) => { fillLight.intensity = value; } },
    { inputId: 'back-light-x', valueId: 'back-light-x-value', apply: (value) => { backLight.position.x = value; } },
    { inputId: 'back-light-y', valueId: 'back-light-y-value', apply: (value) => { backLight.position.y = value; } },
    { inputId: 'back-light-z', valueId: 'back-light-z-value', apply: (value) => { backLight.position.z = value; } },
    { inputId: 'back-light-intensity', valueId: 'back-light-intensity-value', apply: (value) => { backLight.intensity = value; } },
];

const lightingColorConfigurations = [
    { inputId: 'key-light-color', apply: (value) => { keyLight.color.set(value); } },
    { inputId: 'fill-light-color', apply: (value) => { fillLight.color.set(value); } },
    { inputId: 'back-light-color', apply: (value) => { backLight.color.set(value); } },
];

const loader = new GLTFLoader();

// Allow each page to define its own model and transform
const modelUrl = scriptDataset.modelUrl || DEFAULT_MODEL_URL;
if (scriptDataset.modelUrl) {
    console.info(`Threejs_script.js: loading per-page model override from data-model-url="${scriptDataset.modelUrl}".`);
} else {
    console.info(
        `Threejs_script.js: loading default model "${DEFAULT_MODEL_URL}". Set data-model-url on the module script tag to load a different model on this page.`
    );
}
const modelPosition = parseVector(scriptDataset.modelPosition, DEFAULT_MODEL_POSITION);
const modelRotation = parseVector(scriptDataset.modelRotation, DEFAULT_MODEL_ROTATION);
const modelScale = parseVector(scriptDataset.modelScale, DEFAULT_MODEL_SCALE);

const disposeMaterial = (material) => {
    if (!material) {
        return;
    }

    if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
        return;
    }

    Object.keys(material).forEach((key) => {
        const value = material[key];
        if (value && typeof value === 'object' && 'dispose' in value && typeof value.dispose === 'function') {
            value.dispose();
        }
    });

    if (typeof material.dispose === 'function') {
        material.dispose();
    }
};

const disposeModel = (model) => {
    if (!model) {
        return;
    }

    model.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        if (child.geometry && typeof child.geometry.dispose === 'function') {
            child.geometry.dispose();
        }

        disposeMaterial(child.material);
    });
};

const setupModel = (model, overrides = {}) => {
    const targetPosition = overrides.position ?? modelPosition;
    const targetRotation = overrides.rotation ?? modelRotation;
    const targetScale = overrides.scale ?? modelScale;

    if (Array.isArray(targetPosition) && targetPosition.length === 3) {
        model.position.set(...targetPosition);
    }

    if (Array.isArray(targetRotation) && targetRotation.length === 3) {
        model.rotation.set(...targetRotation);
    }

    if (Array.isArray(targetScale) && targetScale.length === 3) {
        model.scale.set(...targetScale);
    }
};

const resolveCameraTarget = (overrides, model) => {
    if (Array.isArray(overrides.cameraTarget) && overrides.cameraTarget.length === 3) {
        return new THREE.Vector3(...overrides.cameraTarget);
    }

    if (explicitCameraTarget) {
        return explicitCameraTarget.clone();
    }

    return model.position.clone();
};

// Load the model
function loadModel(url, overrides = {}, lifecycle = {}) {
    if (!url) {
        console.warn('Threejs_script.js: loadModel called without a valid URL.');
        lifecycle.onError?.(new Error('Missing model URL'));
        lifecycle.onComplete?.();
        return;
    }

    const requestId = ++pendingModelRequestId;
    lifecycle.onStart?.();

    loader.load(
        url,
        (gltf) => {
            if (requestId !== pendingModelRequestId) {
                disposeModel(gltf.scene);
                lifecycle.onComplete?.();
                return;
            }

            if (currentModel) {
                scene.remove(currentModel);
                disposeModel(currentModel);
                currentModel = null;
            }

            if (mixer) {
                mixer.stopAllAction();
                mixer = null;
            }

            const model = gltf.scene;
            setupModel(model, overrides);
            scene.add(model);
            currentModel = model;

            if (gltf.animations?.length) {
                mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    const action = mixer.clipAction(clip);
                    action.reset();
                    action.play();
                });
            }

            const resolvedCameraPosition = overrides.cameraPosition ?? cameraPosition;
            if (Array.isArray(resolvedCameraPosition) && resolvedCameraPosition.length === 3) {
                camera.position.set(...resolvedCameraPosition);
            }

            const target = resolveCameraTarget(overrides, model);
            camera.lookAt(target);
            controls.target.copy(target);
            controls.update();

            lifecycle.onComplete?.();
        },
        undefined,
        (error) => {
            if (requestId === pendingModelRequestId) {
                console.error('An error happened while loading the model:', error);
            }

            lifecycle.onError?.(error);
            lifecycle.onComplete?.();
        }
    );
}

const controls = new OrbitControls(camera, renderer.domElement);

if (explicitCameraTarget) {
    camera.lookAt(explicitCameraTarget);
    controls.target.copy(explicitCameraTarget);
    controls.update();
}

const modelListElement = document.querySelector('[data-model-list]');
const modelButtons = modelListElement ? Array.from(modelListElement.querySelectorAll('[data-model-url]')) : [];
const shouldDelayInitialLoad = modelButtons.length > 0;

// Function to control camera zoom based on window width
function setCameraZoom() {
    const { width } = getContainerSize();
    const zoomLevel = width < 720 ? 50 : 30;
    camera.fov = zoomLevel;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }
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

// Load the model unless this page manages the loading through a model list
if (!shouldDelayInitialLoad) {
    loadModel(modelUrl);
}

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

    // Footer Close Button Functionality
    const closeButton = document.getElementById('footerCloseButton');
    if (closeButton) {
        closeButton.onclick = function() {
            this.parentElement.style.display = 'none'; // Hides the footer
        };
    }

    const lightingToggle = document.querySelector('[data-lighting-toggle]');
    const lightingControls = document.querySelector('[data-lighting-controls]');
    const lightingClose = document.querySelector('[data-lighting-close]');
    const pageBody = document.body;
    let lockedScrollPosition = 0;

    const underConstructionHero = document.querySelector('.hero--under-construction');

    if (underConstructionHero) {
        let lastTouchEnd = 0;

        const isHeroEvent = (event) => {
            const primaryTarget = event.target;
            if (primaryTarget instanceof Node && underConstructionHero.contains(primaryTarget)) {
                return true;
            }

            if ('touches' in event && event.touches) {
                return Array.from(event.touches).some((touch) => {
                    const touchTarget = touch.target;
                    return touchTarget instanceof Node && underConstructionHero.contains(touchTarget);
                });
            }

            return false;
        };

        const preventMultiTouch = (event) => {
            if (event.touches && event.touches.length > 1 && isHeroEvent(event)) {
                event.preventDefault();
            }
        };

        const preventWheelZoom = (event) => {
            if (event.ctrlKey && isHeroEvent(event)) {
                event.preventDefault();
            }
        };

        const preventDoubleTapZoom = (event) => {
            if (!isHeroEvent(event)) {
                return;
            }

            const currentTime = Date.now();
            if (currentTime - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = currentTime;
        };

        const preventGesture = (event) => {
            if (isHeroEvent(event)) {
                event.preventDefault();
            }
        };

        document.addEventListener('touchstart', preventMultiTouch, { passive: false });
        document.addEventListener('touchmove', preventMultiTouch, { passive: false });
        document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
        window.addEventListener('wheel', preventWheelZoom, { passive: false });
        document.addEventListener('gesturestart', preventGesture);
        document.addEventListener('gesturechange', preventGesture);
        document.addEventListener('gestureend', preventGesture);
    }

    const applyLightingPanelState = (isOpen) => {
        if (!lightingControls) {
            return;
        }

        lightingControls.classList.toggle('is-visible', isOpen);
        lightingControls.setAttribute('aria-hidden', String(!isOpen));

        if (lightingToggle) {
            lightingToggle.setAttribute('aria-expanded', String(isOpen));
        }

        if (pageBody) {
            if (isOpen) {
                lockedScrollPosition = window.scrollY || window.pageYOffset || 0;
                pageBody.classList.add('lighting-panel-open');
                pageBody.style.top = `-${lockedScrollPosition}px`;
            } else {
                pageBody.classList.remove('lighting-panel-open');
                pageBody.style.removeProperty('top');
                window.scrollTo(0, lockedScrollPosition);
                lockedScrollPosition = 0;
            }
        }
    };

    const handleDocumentPointerDown = (event) => {
        if (!lightingControls?.classList.contains('is-visible')) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Node)) {
            return;
        }

        if (lightingControls.contains(target) || lightingToggle?.contains(target)) {
            return;
        }

        applyLightingPanelState(false);
    };

    if (lightingToggle && lightingControls) {
        lightingToggle.addEventListener('click', () => {
            const isOpen = !lightingControls.classList.contains('is-visible');
            applyLightingPanelState(isOpen);
        });
    }

    if (lightingClose && lightingControls) {
        lightingClose.addEventListener('click', () => {
            applyLightingPanelState(false);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightingControls?.classList.contains('is-visible')) {
            applyLightingPanelState(false);
        }
    });

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    const bindLightingSlider = (configuration) => {
        const slider = document.getElementById(configuration.inputId);
        if (!slider) {
            return;
        }

        const valueDisplay = configuration.valueId
            ? document.getElementById(configuration.valueId)
            : null;

        const update = () => {
            const rawValue = Number.parseFloat(slider.value);
            if (Number.isNaN(rawValue)) {
                return;
            }

            configuration.apply(rawValue);

            if (valueDisplay) {
                valueDisplay.textContent = rawValue.toFixed(1);
            }
        };

        slider.addEventListener('input', update);
        slider.addEventListener('change', update);

        update();
    };

    lightingSliderConfigurations.forEach(bindLightingSlider);

    const bindLightingColor = (configuration) => {
        const colorInput = document.getElementById(configuration.inputId);
        if (!colorInput) {
            return;
        }

        const update = () => {
            configuration.apply(colorInput.value);
        };

        colorInput.addEventListener('input', update);
        colorInput.addEventListener('change', update);

        update();
    };

    lightingColorConfigurations.forEach(bindLightingColor);

    if (modelButtons.length) {
        let activeModelButton = null;
        const modelDescriptionTarget = document.querySelector('[data-model-description-target]');

        const parseModelOverrides = (dataset) => ({
            position: parseOptionalVector(dataset.modelPosition),
            rotation: parseOptionalVector(dataset.modelRotation),
            scale: parseOptionalVector(dataset.modelScale),
            cameraPosition: parseOptionalVector(dataset.cameraPosition),
            cameraTarget: parseOptionalVector(dataset.cameraTarget),
        });

        const setActiveModelButton = (button) => {
            if (activeModelButton === button) {
                return;
            }

            if (activeModelButton) {
                activeModelButton.classList.remove('is-active');
                activeModelButton.setAttribute('aria-pressed', 'false');
            }

            activeModelButton = button;

            if (activeModelButton) {
                activeModelButton.classList.add('is-active');
                activeModelButton.setAttribute('aria-pressed', 'true');
            }
        };

        modelButtons.forEach((button) => {
            button.setAttribute('aria-pressed', 'false');

            button.addEventListener('click', () => {
                const overrides = parseModelOverrides(button.dataset);
                if (modelDescriptionTarget) {
                    modelDescriptionTarget.textContent = button.dataset.modelDescription ?? '';
                }

                setActiveModelButton(button);

                loadModel(button.dataset.modelUrl, overrides, {
                    onStart: () => {
                        button.disabled = true;
                        button.setAttribute('data-loading', 'true');
                    },
                    onComplete: () => {
                        button.disabled = false;
                        button.removeAttribute('data-loading');
                    },
                });
            });
        });

        const initialButton = modelButtons.find((button) => button.dataset.loadOnInit === 'true');
        if (initialButton) {
            initialButton.click();
        }
    }
});
