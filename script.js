document.addEventListener('DOMContentLoaded', function() {
    const rootElement = document.documentElement;
    if (!rootElement) {
        return;
    }

    const footerElement = document.querySelector('footer');
    const isInstagramWebView = (() => {
        const navigatorInfo = window.navigator || {};
        const userAgent = (
            navigatorInfo.userAgent ||
            navigatorInfo.vendor ||
            ''
        ).toLowerCase();
        return userAgent.includes('instagram');
    })();

    if (isInstagramWebView) {
        rootElement.classList.add('is-instagram-webview');
    }
    let lastAppliedOffset = null;
    let stabilizationHandle = null;
    let stabilizationDeadline = 0;

    const getNow = () => {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            return performance.now();
        }
        return Date.now();
    };

    const updateViewportOffset = () => {
        if (isInstagramWebView) {
            if (lastAppliedOffset !== 0) {
                lastAppliedOffset = 0;
                rootElement.style.setProperty('--viewport-offset-bottom', '0px');
            }
            return 0;
        }

        let viewportBottomSpace = 0;

        if (window.visualViewport) {
            const viewport = window.visualViewport;
            viewportBottomSpace = Math.max(
                viewportBottomSpace,
                Math.round(window.innerHeight - (viewport.height + viewport.offsetTop))
            );
        }

        viewportBottomSpace = Math.max(
            viewportBottomSpace,
            Math.round(window.innerHeight - rootElement.clientHeight)
        );

        if (footerElement) {
            const footerRect = footerElement.getBoundingClientRect();
            const footerOverlap = Math.ceil(footerRect.bottom - window.innerHeight);
            if (footerOverlap > 0) {
                viewportBottomSpace = Math.max(viewportBottomSpace, footerOverlap);
            }
        }

        const appliedOffset = Math.max(0, viewportBottomSpace);

        if (lastAppliedOffset !== appliedOffset) {
            lastAppliedOffset = appliedOffset;
            rootElement.style.setProperty('--viewport-offset-bottom', `${appliedOffset}px`);
        }

        return appliedOffset;
    };

    const requestViewportStabilization = (durationMs = 600) => {
        const now = getNow();
        stabilizationDeadline = Math.max(stabilizationDeadline, now + durationMs);

        if (stabilizationHandle) {
            return;
        }

        const step = () => {
            stabilizationHandle = null;
            const currentTime = getNow();
            updateViewportOffset();

            if (currentTime < stabilizationDeadline) {
                stabilizationHandle = requestAnimationFrame(step);
            }
        };

        stabilizationHandle = requestAnimationFrame(step);
    };

    const handleViewportMutation = (durationMs = 600) => {
        updateViewportOffset();
        requestViewportStabilization(durationMs);
    };

    if (isInstagramWebView) {
        updateViewportOffset();
    } else {
        handleViewportMutation(1200);
        setTimeout(() => handleViewportMutation(1200), 120);
        setTimeout(() => handleViewportMutation(1200), 480);

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportMutation);
            window.visualViewport.addEventListener('scroll', handleViewportMutation);
        }

        window.addEventListener('resize', handleViewportMutation);
        window.addEventListener('orientationchange', handleViewportMutation);
        window.addEventListener('scroll', handleViewportMutation, { passive: true });
        window.addEventListener('load', () => handleViewportMutation(1200));
        window.addEventListener('pageshow', () => handleViewportMutation(1200));
        window.addEventListener('focus', () => handleViewportMutation(1200));
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                handleViewportMutation(1200);
            }
        });
    }

    // Clock functionality
    const clockElement = document.getElementById('clock');
    if (clockElement) {
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
            clockElement.textContent = `${formattedDate} ${formattedTime}`;
        }

        // Update the clock immediately and then every 1 second.
        updateClock();
        setInterval(updateClock, 1000);
    }

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
    const bodyElement = document.body;
    if (bodyElement) {
        bodyElement.classList.remove('menu-open');
    }

    const pageHeader = document.querySelector('header');
    const hamburgerMenu = pageHeader ? pageHeader.querySelector('.hamburger-menu') : null;
    const navUl = pageHeader ? pageHeader.querySelector('nav ul') : null;
    if (navUl) {
        navUl.classList.remove('open');
    }
    const closeMenuButton = pageHeader ? pageHeader.querySelector('.menu-close') : null;

    const applyMenuState = (isOpen) => {
        if (!navUl) {
            return;
        }

        if (isOpen) {
            navUl.classList.add('open');
        } else {
            navUl.classList.remove('open');
        }

        if (bodyElement) {
            bodyElement.classList.toggle('menu-open', isOpen);
        }
    };

    if (hamburgerMenu && navUl) {
        hamburgerMenu.addEventListener('click', function() {
            applyMenuState(!navUl.classList.contains('open'));
        });
    }

    if (closeMenuButton && navUl) {
        closeMenuButton.addEventListener('click', function() {
            applyMenuState(false);
        });
    }

    if (navUl) {
        navUl.querySelectorAll('a').forEach((navLink) => {
            navLink.addEventListener('click', () => applyMenuState(false));
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
        }, { passive: false });

        gallery.querySelectorAll('img').forEach((image) => {
            image.setAttribute('draggable', 'false');
        });

        let isDragging = false;
        let dragStartX = 0;
        let dragScrollLeft = 0;
        let capturedPointerId = null;

        const beginDrag = (clientX) => {
            isDragging = true;
            dragStartX = clientX;
            dragScrollLeft = gallery.scrollLeft;
            gallery.classList.add('is-dragging');
        };

        const updateDrag = (clientX) => {
            if (!isDragging) {
                return;
            }
            gallery.scrollLeft = dragScrollLeft - (clientX - dragStartX);
        };

        const endDrag = () => {
            if (!isDragging) {
                return;
            }
            isDragging = false;
            gallery.classList.remove('is-dragging');
            capturedPointerId = null;
        };

        const pointerMoveHandler = (event) => {
            if (!isDragging) {
                return;
            }
            event.preventDefault();
            updateDrag(event.clientX);
        };

        const pointerUpHandler = (event) => {
            if (!isDragging) {
                return;
            }
            if (
                capturedPointerId !== null &&
                event &&
                event.pointerId === capturedPointerId &&
                gallery.releasePointerCapture
            ) {
                gallery.releasePointerCapture(event.pointerId);
                capturedPointerId = null;
            }
            endDrag();
        };

        gallery.addEventListener('pointerdown', (event) => {
            const isPrimaryButton = event.button === undefined || event.button === 0;
            const pointerType = event.pointerType;
            const isMousePointer = !pointerType || pointerType === 'mouse';

            if (!isPrimaryButton || !isMousePointer) {
                return;
            }

            beginDrag(event.clientX);
            if (gallery.setPointerCapture && event.pointerId !== undefined) {
                gallery.setPointerCapture(event.pointerId);
                capturedPointerId = event.pointerId;
            } else {
                capturedPointerId = null;
            }
            event.preventDefault();
        });

        gallery.addEventListener('pointermove', pointerMoveHandler);
        gallery.addEventListener('pointerup', pointerUpHandler);
        gallery.addEventListener('pointerleave', pointerUpHandler);
        gallery.addEventListener('pointercancel', pointerUpHandler);

        gallery.addEventListener('dragstart', (event) => {
            event.preventDefault();
        });

        if (!window.PointerEvent) {
            const hasTouchSupport = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
            let isMouseDragging = false;

            const mouseMoveHandler = (event) => {
                if (!isMouseDragging) {
                    return;
                }
                event.preventDefault();
                updateDrag(event.clientX);
            };

            const mouseUpHandler = () => {
                if (!isMouseDragging) {
                    return;
                }
                isMouseDragging = false;
                endDrag();
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };

            gallery.addEventListener('mousedown', (event) => {
                if (hasTouchSupport) {
                    return;
                }
                if (event.button !== 0) {
                    return;
                }

                isMouseDragging = true;
                beginDrag(event.clientX);
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
                event.preventDefault();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') {
                gallery.scrollLeft += 100;
            } else if (event.key === 'ArrowLeft') {
                gallery.scrollLeft -= 100;
            }
        });
    }

    const interactionHint = document.querySelector('[data-interaction-hint]');
    if (interactionHint) {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const updateHintText = (queryEvent) => {
            if (!queryEvent) {
                return;
            }
            interactionHint.textContent = queryEvent.matches
                ? 'Move the model with your finger and adjust the lighting'
                : 'Move the model with your cursor and adjust the lighting';
        };

        const handleMediaChange = (event) => updateHintText(event);

        updateHintText(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleMediaChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleMediaChange);
        }

        const cleanupMediaListener = () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleMediaChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleMediaChange);
            }
        };

        requestAnimationFrame(() => {
            interactionHint.classList.add('is-visible');
        });

        const displayDuration = (() => {
            const { hintDuration } = interactionHint.dataset;
            const parsedDuration = hintDuration ? parseInt(hintDuration, 10) : NaN;
            return Number.isFinite(parsedDuration) && parsedDuration >= 0 ? parsedDuration : 10000;
        })();

        let hideTimeoutId = null;

        const removeHint = () => {
            if (hideTimeoutId !== null) {
                window.clearTimeout(hideTimeoutId);
                hideTimeoutId = null;
            }
            cleanupMediaListener();
            if (interactionHint.parentElement) {
                interactionHint.parentElement.removeChild(interactionHint);
            }
        };

        interactionHint.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && interactionHint.classList.contains('is-fading')) {
                removeHint();
            }
        });

        hideTimeoutId = window.setTimeout(() => {
            interactionHint.classList.add('is-fading');
        }, displayDuration);
    }
});

