/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337/restaurants`;
  }

  static get REVIEWS_URL() {
    return `http://localhost:1337/reviews`;
  }  

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then(response => {
      return response.json();
    }).then(response => {
      let dbPromise = idb.open('restaurant', 1, upgradeDb => {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });   
        upgradeDb.createObjectStore('reviews', {
          keyPath: 'id'
        });
        upgradeDb.createObjectStore('pending', {
          keyPath: 'id',
          autoIncrement: true
        });                      
      });
      dbPromise.then(function(db) {
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        response.forEach(function(restaurant) {
          store.put(restaurant);
        });
        let reviewsPromise = new Promise(resolve => {
          let i = 0;
          var arr1 = [];      
          for (let restaurant of response) {
            fetch(DBHelper.REVIEWS_URL+'/?restaurant_id='+restaurant.id).then(reviewsResponse => {
              return reviewsResponse.json();
            }).then(reviewsResponse => {
              arr1 = [...arr1, ...reviewsResponse];                  
              i++;
              var tx = db.transaction('reviews', 'readwrite');
              var store = tx.objectStore('reviews');
              reviewsResponse.forEach(function(review) {
                store.put(review);
              });       
              if (i === 10) {
                resolve(arr1);
              };
            });            
          }       
        })
        reviewsPromise.then(reviewsResponse => {
          callback(null, response, reviewsResponse);               
        })
      }).then(function() {
        console.log('Added restaurants to restaurant IDB');
      });  
    }).catch(error => {
      console.log('offline');
      idb.open('restaurant', 1).then(function(db) {
        var tx = db.transaction('restaurants');
        var store = tx.objectStore('restaurants');
        var reviewstx = db.transaction('reviews');
        var reviewsstore = reviewstx.objectStore('reviews');
        function getRestaurants() {
          return new Promise(resolve => {
            store.getAll().then(function(restaurants) {
              resolve(restaurants);
            })
          })
        }
        function getReviews() {
          return new Promise(resolve => {
            reviewsstore.getAll().then(function(reviews) {
              resolve(reviews);
            })
          })
        }        
        async function asyncCall() {
          let data = await Promise.all([getRestaurants(), getReviews()]);
          callback(null, data[0], data[1]);          
        };
        asyncCall();
      });
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        let restaurantReviews = reviews.filter(val => {
          return val.restaurant_id == id;
        })
        if (restaurant) { // Got the restaurant
          callback(null, restaurant, restaurantReviews);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      idb.open('restaurant', 1).then(function(db) {    
        var pendingtx = db.transaction('pending');
        var pendingstore = pendingtx.objectStore('pending');
        pendingstore.getAll().then(function(reviews) {
          for (let review of reviews) {
            let reviewId = review.id;
            delete review.id;
            fetch('http://localhost:1337/reviews', {
              method: 'POST',
              body: JSON.stringify(review)
            }).then(response => {
              return response.json();
            }).then(data => {
              var pendingtx = db.transaction('pending', 'readwrite');
              var pendingstore = pendingtx.objectStore('pending');
              pendingstore.delete(reviewId);          
            });            
          }
        });
      });           
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return (`/img/${restaurant.photograph}-400x300.jpg`);
    } else {
      return (`/img/${restaurant.id}-400x300.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
