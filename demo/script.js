// Enable debug logs and DOM scanning for already loaded scripts/styles
QuiqlLazy.config.debug = true;
QuiqlLazy.config.scanExistingResources = true;

// 1. Initialize LazyLoad for all .lazy[data-src] and .lazy[data-bg] elements
const imagesObserver = new QuiqlLazy.LazyLoad({
    onLoad: (target) => {
        console.log('Media loaded:', target);
    }
});

// 2. CustomLoad for IMask (demonstrates scanExistingResources + .add())
const phoneElement = document.getElementById('tel');
const phoneElement2 = document.querySelector('input[name="phone"]');

if (phoneElement || phoneElement2) {
    const imaskObserver = new QuiqlLazy.CustomLoad({
        targets: phoneElement,
        load: () => {
            // Since imask.js is already in index.html and scanExistingResources is true,
            // QuiqlLazy resolves immediately without loading the script a second time.
            QuiqlLazy.loadScript('https://unpkg.com/imask@7.6.1/dist/imask.js', () => {
                console.log('IMask ready!');

                if (phoneElement) {
                    IMask(phoneElement, { mask: '+{\\0}(\\0\\06)000-00-00' });
                }
                if (phoneElement2) {
                    IMask(phoneElement2, { mask: '+{\\0}(999)000-00-00' });
                }
            });
        }
    });

    // Add second visible input to trigger intersection
    if (phoneElement2) {
        imaskObserver.add(phoneElement2);
    }
}

// 3. CustomLoad for Swiper (demonstrates dynamic CSS/JS loading & shouldRunIfLoaded)
const swiperObserver = new QuiqlLazy.CustomLoad({
    options: {
        rootMargin: '30%',
        threshold: 0.0
    },
    load: async () => {
        console.log('Swiper loading...');

        // First call: fetches and injects Swiper CSS
        const style = await QuiqlLazy.loadStyle(
            'https://cdn.jsdelivr.net/npm/swiper@14.4.0/swiper-bundle.min.css'
        );

        console.log('Swiper CSS loaded:', style);

        // Second call: already cached, callback is skipped because shouldRunIfLoaded is false
        await QuiqlLazy.loadStyle(
            'https://cdn.jsdelivr.net/npm/swiper@14.4.0/swiper-bundle.min.css',
            () => {
                console.log('This callback will NOT execute because shouldRunIfLoaded is false.');
            },
            {
                shouldRunIfLoaded: false
            }
        );

        // Load Swiper JS and initialize the slider
        QuiqlLazy.loadScript(
            'https://cdn.jsdelivr.net/npm/swiper@14.4.0/swiper-bundle.min.js',
            () => {
                new Swiper('.swiper', {
                    loop: true,
                    pagination: {
                        el: '.swiper-pagination',
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    scrollbar: {
                        el: '.swiper-scrollbar',
                    },
                });

                console.log('Swiper initialized!');
            }
        );

        console.log('Swiper script is loading...');
    }
});

swiperObserver.add(document.querySelectorAll('.swiper'));


const showHiddenBtn = document.getElementById('show-hidden-btn');
const hiddenMedia = document.getElementById('hidden-media');

if (showHiddenBtn && hiddenMedia) {
    showHiddenBtn.addEventListener('click', () => {
        hiddenMedia.style.display = '';
        showHiddenBtn.remove();
    });
}
