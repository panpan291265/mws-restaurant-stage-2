const cachePrefix = 'resto-revs';
const cacheVersion = 'v0001';
const cacheName = `${cachePrefix}-${cacheVersion}`;

self.addEventListener('install', event => {
    // console.log('Service worker install event handler called :', event);

    event.waitUntil(
        caches.open(cacheName)
        .then(function (cache) {
            // Cache main application resources
            let requests = [
                'index.html', 'restaurant.html', 'unavailable.html',
                'data/restaurants.json',
                'img/restaurant-128.png',
                'img/restaurant-256.png',
                'img/restaurant.png',
                'css/styles.css', 'css/styles.min.css',
                'js/urlhelper.js', 'js/urlhelper.min.js',
                'js/dbhelper.js', 'js/dbhelper.min.js',
                'js/main.js', 'js/main.min.js',
                'js/restaurant_info.js', 'js/restaurant_info.min.js'
            ];

            const dataImgSuffs = ['', '-200', '-300', '-400', '-500', '-600'];
            for (let i = 1; i <= 10; i++) {
                // Cache data images preactivelly
                dataImgSuffs.forEach(imgSuffix => requests.push(`img/${i}${imgSuffix}.jpg`));

                // Cache restaurant sites preactivelly
                // requests.push(`restaurant.html?id=${i}`);
            }
            return cache.addAll(requests).then(() => self.skipWaiting());
        })
        .catch(err => console.error(err))
    );
});

self.addEventListener('activate', event => {
    // console.log('Service worker activate event handler called :', event);
    // event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    // console.log('Service worker fetch event handler called :', event);

    const responsePromise = new Promise((resolve, reject) => {
        caches.open(cacheName).then(cache => {
            let cacheKey = event.request.url;
            cache.match(cacheKey).then(cachedResponse => {
                if (cachedResponse)
                    return resolve(cachedResponse);
                fetch(event.request).then(networkResponse => {
                        // console.log(`Adding new cache item: '${cacheKey}'`);
                        cache.put(cacheKey, networkResponse.clone());
                        return resolve(networkResponse);
                    })
                    .catch(err => {
                        if (event.request.url.includes('restaurant.html?id=')) {
                            cache.match('unavailable.html').then(unavailableResponse => {
                                return resolve(unavailableResponse);
                            });
                        } else {
                            return reject(err);
                        }

                    });
            });
        });
    });

    event.respondWith(responsePromise);
});

/*
self.addEventListener('message', event => {
    // console.log('Service worker message event handler called :', event);
});
*/