let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { //Got an error!
      console.log(error);
    } else {
      fillBreadcrumb();
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
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
  });
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
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
    DBHelper.fetchRestaurantById(id, (error, restaurant, reviews) => {
      self.restaurant = restaurant;
      self.reviews = reviews;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `image of ${restaurant.name} restaurant`;
  const source1 = document.getElementById('source1');  
  source1.media = '(min-width: 1024px)';
  source1.srcset = `img/${restaurant.id}-1600x1200.webp`;  
  const source2 = document.getElementById('source2');
  source2.media = '(min-width: 400px)';
  source2.srcset = `img/${restaurant.id}.webp 1x, img/${restaurant.id}-1600x1200.webp 2x`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (restaurant = self.restaurant, reviews = self.reviews) => {
  console.log('reviews', reviews, restaurant)
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  const nameLabel = document.createElement('label');
  nameLabel.innerHTML = 'Name:';
  nameLabel.htmlFor = 'name';
  container.appendChild(nameLabel);  
  const name = document.createElement('input');
  name.id = 'name';
  name.placeholder = 'Name';
  name.style.display = 'block';
  container.appendChild(name);
  const ratingLabel = document.createElement('label');
  ratingLabel.innerHTML = 'Rating (1-5):';
  ratingLabel.htmlFor = 'rating';  
  container.appendChild(ratingLabel);  
  const rating = document.createElement('input');
  rating.id = 'rating';
  rating.placeholder = 'Rating (1-5)';
  rating.style.minWidth = '100px';
  rating.type = 'number';  
  rating.max = 5;
  rating.min = 1;
  rating.style.display = 'block';  
  container.appendChild(rating);
  const commentLabel = document.createElement('label');
  commentLabel.innerHTML = 'Comment (optional):';
  commentLabel.htmlFor = 'comment';  
  container.appendChild(commentLabel);   
  const comment = document.createElement('textarea');
  comment.id = 'comment';
  comment.placeholder = 'Comment (optional)';
  comment.style.display = 'block';
  comment.rows = 4;    
  container.appendChild(comment);
  const review = document.createElement('button');
  review.type = 'submit'
  review.innerHTML = 'Add Review';
  review.style.margin = '0 0 1em 0';
  review.onclick = (e) => {
    // for (let i = 1; i < 2; i++) {
    // fetch(`http://localhost:1337/reviews/${i}`, {
    //   method: 'DELETE'
    // }).then(response => {
    //   return response.json();
    // }).then(data => {
    //   console.log(data);
    // })      
    // } 
    let name = document.getElementById('name');
    let rating = document.getElementById('rating');
    let comment = document.getElementById('comment');
    if (name.value && rating.value) {
      let review = {
        'restaurant_id': restaurant.id,
        'name': name.value,
        'rating': parseInt(rating.value),
        'comments': comment.value
      };      
      fetch('http://localhost:1337/reviews', {
        method: 'POST',
        body: JSON.stringify(review)
      }).then(response => {
        return response.json();
      }).then(data => {
        console.log('send form data', data);
        alert('Thanks for submitting a review!');
        idb.open('restaurant', 1).then(function(db) {
          var tx = db.transaction('reviews', 'readwrite');
          var store = tx.objectStore('reviews');
          store.put(data);
        });
      }).catch(error => {
        alert('Thanks for submitting a review offline!');
        idb.open('restaurant', 1).then(function(db) {
          var tx = db.transaction('pending', 'readwrite');
          var store = tx.objectStore('pending');
          store.put(review);
        });
      });    
      name.value = '';
      rating.value = '';
      comment.value = '';
      let ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));      
    } else {
      alert('Please enter your name and give a rating!');
    }
  };  
  container.appendChild(review);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  // const date = document.createElement('p');
  // date.innerHTML = new Date(review.updatedAt);
  // li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
