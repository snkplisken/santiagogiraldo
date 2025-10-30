document.addEventListener('DOMContentLoaded', function() {
    // Clock functionality
    function updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // JavaScript months are 0-based.
        const year = now.getFullYear();
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        const formattedDate = `${month}/${day}/${year}`;
        document.getElementById('clock').textContent = `${formattedDate} ${formattedTime}`;
    }

    // Update the clock immediately and then every 1 second.
    updateClock();
    setInterval(updateClock, 1000);

    // Functionality for showing project galleries
    function showGallery(projectId) {
        var galleries = document.querySelectorAll('.portfolio-gallery');
        var menuItems = document.querySelectorAll('.portfolio-menu a');
        galleries.forEach(function(gallery) {
            gallery.style.display = 'none';
        });
        menuItems.forEach(function(menuItem) {
            menuItem.classList.remove('active');
        });

        var selectedGallery = document.getElementById(projectId);
        var selectedItem = document.querySelector('.portfolio-menu a[data-target="' + projectId + '"]');
        if (selectedGallery && selectedItem) {
            selectedGallery.style.display = 'block';
            selectedItem.classList.add('active');
        }
    }

    document.querySelectorAll('.portfolio-menu a').forEach(function(menuItem) {
        menuItem.addEventListener('click', function() {
            var targetGallery = this.getAttribute('data-target');
            showGallery(targetGallery);
        });
    });

    showGallery('project1'); // Optionally show the first gallery by default

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
        setInterval(scrollText, 20);
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
            this.parentElement.style.display = 'none';
        };
    }

    // Horizontal Gallery Scrolling Functionality
    const gallery = document.querySelector('.horizontal-gallery');
    if (gallery) {
        gallery.addEventListener('wheel', (event) => {
            const dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX)
                ? event.deltaY
                : event.deltaX;

            if (dominantDelta !== 0) {
                event.preventDefault();
                gallery.scrollLeft += dominantDelta;
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') {
                gallery.scrollLeft += 100;
            } else if (event.key === 'ArrowLeft') {
                gallery.scrollLeft -= 100;
            }
        });
    }
});

