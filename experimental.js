const stage = document.getElementById('glb-stage');
const addForm = document.getElementById('glb-add-form');
const modelInput = document.getElementById('glb-url');
const targetInput = document.getElementById('target-url');
const labelInput = document.getElementById('glb-label');
const presetButtons = document.querySelectorAll('.glb-preset');

const TAP_DISTANCE_THRESHOLD = 6;
const DEFAULT_ITEM_WIDTH = 220;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const computeStageBounds = () => {
  const rect = stage.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
};

const positionWithinStage = (left, top, itemWidth, itemHeight) => {
  const { width, height } = computeStageBounds();
  const clampedLeft = clamp(left, 0, Math.max(0, width - itemWidth));
  const clampedTop = clamp(top, 0, Math.max(0, height - itemHeight));
  return { left: clampedLeft, top: clampedTop };
};

const createDragController = (item) => {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;
  let moved = false;

  const applyPosition = (left, top) => {
    const { left: clampedLeft, top: clampedTop } = positionWithinStage(
      left,
      top,
      item.offsetWidth,
      item.offsetHeight
    );
    item.style.left = `${clampedLeft}px`;
    item.style.top = `${clampedTop}px`;
  };

  const handlePointerMove = (event) => {
    if (pointerId === null || event.pointerId !== pointerId) {
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (!moved && Math.hypot(deltaX, deltaY) > TAP_DISTANCE_THRESHOLD) {
      moved = true;
    }

    applyPosition(originLeft + deltaX, originTop + deltaY);
  };

  const endDrag = () => {
    if (pointerId !== null) {
      pointerId = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    }
  };

  const startDrag = (event) => {
    if (pointerId !== null) {
      return;
    }
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    originLeft = item.offsetLeft;
    originTop = item.offsetTop;
    moved = false;
    item.setPointerCapture?.(pointerId);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', endDrag, { passive: true });
    window.addEventListener('pointercancel', endDrag, { passive: true });
  };

  const hasMoved = () => moved;

  return { startDrag, endDrag, hasMoved };
};

const createGlbItem = ({ modelUrl, targetUrl, label }) => {
  const item = document.createElement('article');
  item.className = 'glb-item';
  item.style.width = `${DEFAULT_ITEM_WIDTH}px`;

  const hint = stage.querySelector('.glb-stage-hint');
  if (hint) {
    hint.remove();
  }

  const modelViewer = document.createElement('model-viewer');
  modelViewer.src = modelUrl;
  modelViewer.setAttribute('camera-controls', '');
  modelViewer.setAttribute('auto-rotate', '');
  modelViewer.setAttribute('interaction-prompt', 'none');
  modelViewer.setAttribute('disable-pan', '');
  modelViewer.setAttribute('touch-action', 'none');
  modelViewer.setAttribute('ar', '');
  modelViewer.setAttribute('shadow-intensity', '0.5');

  const caption = document.createElement('div');
  caption.className = 'glb-caption';
  caption.textContent = label || targetUrl || 'GLB';

  item.appendChild(modelViewer);
  item.appendChild(caption);
  stage.appendChild(item);

  // Randomize the initial position so new items do not stack.
  const { width, height } = computeStageBounds();
  const itemHeight = modelViewer.offsetHeight || 240;
  const randomLeft = Math.random() * Math.max(0, width - DEFAULT_ITEM_WIDTH);
  const randomTop = Math.random() * Math.max(0, height - itemHeight);
  item.style.left = `${randomLeft}px`;
  item.style.top = `${randomTop}px`;

  const { startDrag, endDrag, hasMoved } = createDragController(item);

  item.addEventListener('pointerdown', (event) => {
    item.classList.add('is-dragging');
    startDrag(event);
  });

  item.addEventListener('pointerup', (event) => {
    item.classList.remove('is-dragging');
    endDrag();
    if (!hasMoved() && targetUrl) {
      window.location.href = targetUrl;
    }
  });

  item.addEventListener('pointercancel', () => {
    item.classList.remove('is-dragging');
    endDrag();
  });

  item.addEventListener('dblclick', () => {
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  });
};

const addGlbFromForm = (event) => {
  event.preventDefault();
  const modelUrl = modelInput.value.trim();
  const targetUrl = targetInput.value.trim();
  const label = labelInput.value.trim();

  if (!modelUrl || !targetUrl) {
    return;
  }

  createGlbItem({ modelUrl, targetUrl, label });
  addForm.reset();
  modelInput.focus();
};

const addGlbFromPreset = (event) => {
  const button = event.currentTarget;
  const modelUrl = button.dataset.model;
  const targetUrl = button.dataset.target;
  const label = button.textContent || '';
  createGlbItem({ modelUrl, targetUrl, label });
};

const bootstrap = () => {
  if (!stage) {
    return;
  }

  addForm?.addEventListener('submit', addGlbFromForm);
  presetButtons.forEach((button) => {
    button.addEventListener('click', addGlbFromPreset);
  });

  // Seed the stage with a single default item for quick interaction.
  createGlbItem({
    modelUrl: 'SantiagoLogo.glb',
    targetUrl: 'Portfolio_3D.html',
    label: 'Portfolio logo',
  });
};

window.addEventListener('DOMContentLoaded', bootstrap);
