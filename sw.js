let staticCacheName = 'restaurant-app-v3';

self.addEventListener('install', function(event) {
  let urlsToCache = [
	'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
	'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
	'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
	'data/restaurants.json',
	'img/1.jpg',
	'img/2.jpg',
	'img/3.jpg',
	'img/4.jpg',
	'img/5.jpg',
	'img/6.jpg',
	'img/7.jpg',
	'img/8.jpg',
	'img/9.jpg',
	'img/10.jpg',
	'img/1-400x300.jpg',
	'img/2-400x300.jpg',
	'img/3-400x300.jpg',
	'img/4-400x300.jpg',
	'img/5-400x300.jpg',
	'img/6-400x300.jpg',
	'img/7-400x300.jpg',
	'img/8-400x300.jpg',
	'img/9-400x300.jpg',
	'img/10-400x300.jpg',
	'img/1-1600x1200.jpg',
	'img/2-1600x1200.jpg',
	'img/3-1600x1200.jpg',
	'img/4-1600x1200.jpg',
	'img/5-1600x1200.jpg',
	'img/6-1600x1200.jpg',
	'img/7-1600x1200.jpg',
	'img/8-1600x1200.jpg',
	'img/9-1600x1200.jpg',
	'img/10-1600x1200.jpg',
	'css/styles.css',
	'js/dbhelper.js',
	'js/main.js',
	'index.html',
	'restaurant.html'
  ];
  event.waitUntil(
  	caches.open(staticCacheName).then(cache => {
  		return cache.addAll(urlsToCache);
  	})
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
	    caches.keys().then(cacheNames => {
  			return Promise.all(
		    	cacheNames.filter(cacheName => {
		    		return cacheName.startsWith('restaurant-') &&
		    			cacheName != staticCacheName;
		    	}).map(cacheName => {
		    		return caches.delete(cacheName);
		    	})
		    )
	    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
  	caches.match(event.request).then(response => {
  		if (response) {
  			// console.log(event.request);
  			return response;
  		} else {
  			// console.log(event.request);
  			return fetch(event.request);
  		};
  	})
  );
});

