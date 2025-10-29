const slider = document.querySelector('.slider');

function activate(e) {
  const items = document.querySelectorAll('.item');
  if (e.target.matches('.next') || e.keyCode === 39) { // Right arrow key
    slider.append(items[0]);
  }
  if (e.target.matches('.prev') || e.keyCode === 37) { // Left arrow key
    slider.prepend(items[items.length - 1]);
  }
}

// Existing click event listener
document.addEventListener('click', activate, false);

// New keyboard event listener for arrow keys
document.addEventListener('keydown', activate, false);
