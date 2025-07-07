// JavaScript principal pour arkly.capital
(function() {
    'use strict';

    // Configuration et constantes
    const CONFIG = {
        animationDelay: 150,
        scrollThreshold: 0.1,
        headerScrollThreshold: 50,
        smoothScrollDuration: 800
    };

    // État de l'application
    const state = {
        isScrolled: false,
        currentSection: '',
        isLoading: false,
        animations: new Set()
    };

    // Utilitaires
    const utils = {
        // Debounce function pour optimiser les performances
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Throttle function pour les events fréquents
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Vérifier si un élément est visible dans le viewport
        isInViewport(element, threshold = CONFIG.scrollThreshold) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            
            return (
                rect.top <= windowHeight * (1 - threshold) &&
                rect.bottom >= windowHeight * threshold
            );
        },

        // Animation smooth scroll
        smoothScrollTo(target, duration = CONFIG.smoothScrollDuration) {
            const startPosition = window.pageYOffset;
            const targetPosition = target.offsetTop - 80; // Offset pour le header
            const distance = targetPosition - startPosition;
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }

            function easeInOutQuad(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            }

            requestAnimationFrame(animation);
        }
    };

    // Gestion du header
    const header = {
        element: null,
        
        init() {
            this.element = document.querySelector('.arkly-header');
            if (!this.element) return;
            
            this.bindEvents();
        },

        bindEvents() {
            // Effet scroll sur le header
            window.addEventListener('scroll', utils.throttle(() => {
                this.handleScroll();
            }, 16)); // 60fps
        },

        handleScroll() {
            const scrolled = window.pageYOffset > CONFIG.headerScrollThreshold;
            
            if (scrolled !== state.isScrolled) {
                state.isScrolled = scrolled;
                this.element.classList.toggle('arkly-header--scrolled', scrolled);
            }
        }
    };

    // Gestion du header premium avec scroll
    function initHeaderEffects() {
        const header = document.querySelector('.arkly-header');
        if (!header) return;

        const handleScroll = utils.throttle(() => {
            const scrolled = window.scrollY > CONFIG.headerScrollThreshold;
            
            if (scrolled !== state.isScrolled) {
                state.isScrolled = scrolled;
                header.classList.toggle('scrolled', scrolled);
                
                // Animation premium du logo au scroll
                const logo = header.querySelector('.arkly-logo');
                if (logo) {
                    if (scrolled) {
                        logo.style.transform = 'scale(0.95)';
                    } else {
                        logo.style.transform = 'scale(1)';
                    }
                }
            }
        }, 16); // 60fps

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initialiser l'état
    }

    // Gestion de la navigation
    const navigation = {
        init() {
            this.bindEvents();
            this.handleActiveSection();
        },

        bindEvents() {
            // Navigation smooth scroll
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;
                
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    utils.smoothScrollTo(target);
                    this.updateActiveLink(targetId);
                }
            });

            // Mise à jour de la section active au scroll
            window.addEventListener('scroll', utils.throttle(() => {
                this.handleActiveSection();
            }, 100));
        },

        handleActiveSection() {
            const sections = document.querySelectorAll('section[id]');
            let currentSection = '';

            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    currentSection = section.id;
                }
            });

            if (currentSection !== state.currentSection) {
                state.currentSection = currentSection;
                this.updateActiveLink(currentSection);
            }
        },

        updateActiveLink(sectionId) {
            // Retirer la classe active de tous les liens
            document.querySelectorAll('.arkly-nav-link').forEach(link => {
                link.classList.remove('arkly-nav-link--active');
            });

            // Ajouter la classe active au lien correspondant
            const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('arkly-nav-link--active');
            }
        }
    };

    // Gestion des animations au scroll
    const scrollAnimations = {
        init() {
            this.elements = document.querySelectorAll('.animate-fade-in-up, .scroll-animate');
            this.bindEvents();
            this.checkVisibility(); // Check initial visibility
        },

        bindEvents() {
            window.addEventListener('scroll', utils.throttle(() => {
                this.checkVisibility();
            }, 16));
        },

        checkVisibility() {
            this.elements.forEach((element, index) => {
                if (state.animations.has(element)) return; // Déjà animé
                
                if (utils.isInViewport(element)) {
                    this.animateElement(element, index);
                    state.animations.add(element);
                }
            });
        },

        animateElement(element, index) {
            // Délai progressif pour les éléments multiples
            const delay = index * CONFIG.animationDelay;
            
            setTimeout(() => {
                element.classList.add('in-view');
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, delay);
        }
    };

    // Gestion du menu mobile
    const mobileMenu = {
        toggle: null,
        menu: null,
        isOpen: false,

        init() {
            this.toggle = document.querySelector('.arkly-mobile-menu-toggle');
            this.menu = document.querySelector('.arkly-nav-links');
            
            if (!this.toggle || !this.menu) return;
            
            this.bindEvents();
        },

        bindEvents() {
            this.toggle.addEventListener('click', () => {
                this.toggleMenu();
            });

            // Fermer le menu lors du clic sur un lien
            this.menu.addEventListener('click', (e) => {
                if (e.target.classList.contains('arkly-nav-link')) {
                    this.closeMenu();
                }
            });

            // Fermer le menu avec Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });
        },

        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        },

        openMenu() {
            this.isOpen = true;
            this.toggle.classList.add('arkly-mobile-menu-toggle--open');
            this.menu.classList.add('arkly-nav-links--open');
            document.body.style.overflow = 'hidden';
        },

        closeMenu() {
            this.isOpen = false;
            this.toggle.classList.remove('arkly-mobile-menu-toggle--open');
            this.menu.classList.remove('arkly-nav-links--open');
            document.body.style.overflow = '';
        }
    };

    // Gestion des statistiques (statiques, sans animation)
    const stats = {
        init() {
            // Les statistiques sont maintenant statiques, pas d'animation
            this.elements = document.querySelectorAll('.arkly-stat-number');
            // Simplement marquer comme initialisées
            this.elements.forEach(element => {
                element.dataset.animated = 'true';
            });
        }
    };

    // Gestion des performances
    const performance = {
        init() {
            this.optimizeImages();
            this.prefetchLinks();
        },

        optimizeImages() {
            // Lazy loading pour les images si pas supporté nativement
            if ('loading' in HTMLImageElement.prototype) return;
            
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        },

        prefetchLinks() {
            // Précharger les liens au hover (sur desktop)
            if (!window.matchMedia('(hover: hover)').matches) return;
            
            document.addEventListener('mouseover', (e) => {
                const link = e.target.closest('a[href]');
                if (!link || link.dataset.prefetched) return;
                
                const linkElement = document.createElement('link');
                linkElement.rel = 'prefetch';
                linkElement.href = link.href;
                document.head.appendChild(linkElement);
                link.dataset.prefetched = 'true';
            });
        }
    };

    // Gestion des erreurs
    const errorHandler = {
        init() {
            window.addEventListener('error', this.handleError);
            window.addEventListener('unhandledrejection', this.handlePromiseRejection);
        },

        handleError(event) {
            console.error('JavaScript error:', event.error);
            // Ici on pourrait envoyer l'erreur à un service de monitoring
        },

        handlePromiseRejection(event) {
            console.error('Unhandled promise rejection:', event.reason);
            // Ici on pourrait envoyer l'erreur à un service de monitoring
        }
    };

    // Initialisation principale
    function init() {
        // Vérifier que le DOM est chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Initialiser tous les modules
        try {
            initHeaderEffects();  // Nouveau : effets premium du header
            header.init();
            navigation.init();
            scrollAnimations.init();
            mobileMenu.init();
            stats.init();
            performance.init();
            errorHandler.init();
            
            console.log('🚀 arkly.capital initialized successfully (Premium Edition)');
        } catch (error) {
            console.error('Error initializing arkly.capital:', error);
        }
    }

    // Démarrer l'application
    init();

    // Exposer certaines fonctions globalement si nécessaire
    window.arkly = {
        utils,
        scrollToSection: (sectionId) => {
            const section = document.getElementById(sectionId);
            if (section) utils.smoothScrollTo(section);
        }
    };

})();
