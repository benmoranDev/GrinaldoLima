document.addEventListener('DOMContentLoaded', function () {

    /* -------------------------------------------------
       Menu mobile (hamburguer) — JS puro, sem depender
       do Bootstrap JS/jQuery
    ------------------------------------------------- */
    var navToggle = document.getElementById('navToggle');
    var navLinksEl = document.getElementById('navLinks');

    if (navToggle && navLinksEl) {
        navToggle.addEventListener('click', function () {
            var isOpen = navLinksEl.classList.toggle('open');
            navToggle.classList.toggle('open', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        navLinksEl.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinksEl.classList.remove('open');
                navToggle.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* -------------------------------------------------
       Scroll suave para links internos (#âncoras)
    ------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId.length > 1) {
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    var offset = 72; // altura do header fixo
                    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            }
        });
    });

    /* -------------------------------------------------
       Interatividade: elementos aparecem suavemente
       conforme entram na tela (estilo Apple)
    ------------------------------------------------- */
    var revealTargets = document.querySelectorAll(
        '.eyebrow, .section-title, .section-title-light, ' +
        '.about-photo, .about-text, .link-arrow, ' +
        '.talk-card, .book-slide, .video-slide, .social-slide, ' +
        '.contact-list, .contact-form'
    );

    revealTargets.forEach(function (el) {
        if (!el.closest('.hero')) {
            el.classList.add('reveal');
        }
    });

    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.reveal').forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        // navegador sem suporte: mostra tudo direto, sem animação
        document.querySelectorAll('.reveal').forEach(function (el) {
            el.classList.add('in-view');
        });
    }

    /* -------------------------------------------------
       Parallax sutil no emblema do hero ao rolar
    ------------------------------------------------- */
    var heroLogo = document.querySelector('.hero-badge-logo');
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (heroLogo && !prefersReducedMotion) {
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    var offset = window.scrollY;
                    if (offset < 700) {
                        heroLogo.style.transform = 'translateY(' + (offset * 0.12) + 'px)';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* -------------------------------------------------
       Carrossel (livros e vídeos) — JS puro (setas +
       indicadores). A rolagem em si funciona por
       scroll-snap no CSS, então continua utilizável
       mesmo se o JS falhar
    ------------------------------------------------- */
    function setupCarousel(trackId, dotsId, prevId, nextId, slideSelector, scrollAmount) {
        var track = document.getElementById(trackId);
        var dotsWrap = document.getElementById(dotsId);
        var prevBtn = document.getElementById(prevId);
        var nextBtn = document.getElementById(nextId);

        if (!track || !dotsWrap) return;

        var slides = Array.prototype.slice.call(track.querySelectorAll(slideSelector));

        slides.forEach(function (slide, i) {
            var dot = document.createElement('button');
            dot.setAttribute('aria-label', 'Ir para o item ' + (i + 1));
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', function () {
                slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
            dotsWrap.appendChild(dot);
        });

        var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('button'));

        function updateActiveItem() {
            var trackCenter = track.scrollLeft + track.offsetWidth / 2;
            var closestIndex = 0;
            var closestDistance = Infinity;

            slides.forEach(function (slide, i) {
                var slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
                var distance = Math.abs(slideCenter - trackCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            });

            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === closestIndex);
            });
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === closestIndex);
            });
        }

        updateActiveItem();

        var scrollTimeout;
        track.addEventListener('scroll', function () {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateActiveItem, 80);
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        /* Arraste suave com o mouse (desktop) */
        var isDragging = false;
        var dragStartX = 0;
        var dragStartScroll = 0;
        var didDrag = false;

        track.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'touch') return; // no touch o scroll nativo já é ótimo
            isDragging = true;
            didDrag = false;
            dragStartX = e.pageX;
            dragStartScroll = track.scrollLeft;
            track.classList.add('dragging');
            track.setPointerCapture(e.pointerId);
        });

        track.addEventListener('pointermove', function (e) {
            if (!isDragging) return;
            var delta = e.pageX - dragStartX;
            if (Math.abs(delta) > 4) didDrag = true;
            track.scrollLeft = dragStartScroll - delta;
        });

        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            track.classList.remove('dragging');
        }
        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);
        track.addEventListener('pointerleave', endDrag);

        // evita que o arraste dispare cliques indesejados em links/botões dentro do slide
        track.addEventListener('click', function (e) {
            if (didDrag) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }

    setupCarousel('bookCarousel', 'bookDots', 'bookPrev', 'bookNext', '.book-slide', 300);
    setupCarousel('videoCarousel', 'videoDots', 'videoPrev', 'videoNext', '.video-slide', 440);
    setupCarousel('socialCarousel', 'socialDots', 'socialPrev', 'socialNext', '.social-slide', 280);

    /* -------------------------------------------------
       Formulário de contato
       Sem backend por enquanto: valida e mostra confirmação.
       TODO: trocar pelo envio real (ex: fetch para uma API,
       Formspree, EmailJS, WhatsApp link, etc.)
    ------------------------------------------------- */
    var contactForm = document.getElementById('contactForm');

    if (contactForm) {
        var successMsg = document.createElement('div');
        successMsg.className = 'form-success';
        successMsg.textContent = 'Mensagem enviada! Em breve retornaremos o contato.';
        contactForm.appendChild(successMsg);

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            // Placeholder de envio — substituir pela integração real
            successMsg.style.display = 'block';
            contactForm.reset();

            setTimeout(function () {
                successMsg.style.display = 'none';
            }, 5000);
        });
    }

});