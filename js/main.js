let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
  updateRestaurants();  
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  }) 
  setTimeout(() => {
    let map = document.querySelector('.gm-style').getElementsByTagName('*');
    let array = Array.from(map);    
    array.map(elem => {
      elem.tabIndex = -1;
    })
    let mapImg = document.querySelector('.gm-style').getElementsByTagName('img');
    let arrayImg = Array.from(mapImg);    
    arrayImg.map(elem => {
      elem.alt = 'google map icon';
    })    
  }, 2000);  
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.style.position = 'relative';
  const picture = document.createElement('picture');
  const image = document.createElement('img');
  const source = document.createElement('source');  
  source.media = '(min-width: 400px) and (max-width: 768px)';
  source.srcset = `img/${restaurant.id}.webp 1x, img/${restaurant.id}-1600x1200.webp 2x`;
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `image of ${restaurant.name} restaurant`;
  picture.append(source);
  picture.append(image);
  li.append(picture);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.style.display = 'inline-block';
  name.id = `heading${restaurant.id}`;
  li.append(name);

  const favoriteStar = document.createElement('span');
  favoriteStar.style.fontSize = '3rem';
  favoriteStar.style.position = 'absolute';
  favoriteStar.style.right = '2%';
  favoriteStar.style.lineHeight = 1;
  favoriteStar.innerHTML = restaurant.is_favorite ? '&#9733' : '&#9734';  
  li.append(favoriteStar);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `view restaurant details of ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  const favorite = document.createElement('button');
  favorite.style.marginLeft = '10px';
  favorite.innerHTML = restaurant.is_favorite ? 'Unmark Favorite' : 'Mark Favorite';
  favorite.setAttribute('aria-label', `mark ${restaurant.name} as a favorite restaurant`);
  favorite.onclick = (e) => {
    let star = e.target.nextSibling;
    if (star.innerHTML === '☆') {
      fetch(`http://localhost:1337/restaurants/${restaurant.id}`, {
          method: 'PUT',
          body: JSON.stringify({is_favorite: true})
      }).then(response => {
        response.json();
        // console.log('favorited', response);
      });      
      star.innerHTML = '&#9733';
      favorite.innerHTML = 'Unmark Favorite';
    } else {
      fetch(`http://localhost:1337/restaurants/${restaurant.id}`, {
          method: 'PUT',
          body: JSON.stringify({is_favorite: false})          
      }).then(response => {
        response.json();
        // console.log('unfavorited', response);
      });        
      star.innerHTML = '&#9734';
      favorite.innerHTML = 'Mark Favorite';      
    }
  };  

  li.append(more);
  li.append(favorite);


  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
