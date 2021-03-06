/**
 * Common database helper functions.
 */

const dbVersion = 1;
let dbPromise = null;

class DBHelper {

  /**
   * Open IndexedDB restorevs database
   */
  static openDB() {
    return idb.open('restorevs', dbVersion, upgradeDb => {
      var store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });
    return dbPromise;
  };

  /**
   * API Data Services URL.
   */
  static get DATASERVICES_URL() {
    const apiServer = 'http://localhost:1337';
    return apiServer;
  }

  /**
   * Restaurants Data Service URL.
   */
  static get DATASERVICE_RESTAURANTS_URL() {
    const dataserviceUrl = `${DBHelper.DATASERVICES_URL}/restaurants`;
    return dataserviceUrl;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, reloadFromService = true) {
    dbPromise.then(db => {
        db.transaction('restaurants').objectStore('restaurants').getAll().then(localRestaurants => {
          if (callback) {
            callback(null, localRestaurants);
          }
          if (reloadFromService) {
            fetch(DBHelper.DATASERVICE_RESTAURANTS_URL)
              .then(response => response.json())
              .then(restaurants => {
                const tx = db.transaction('restaurants', 'readwrite');
                tx.objectStore('restaurants').clear().then(() => {
                  restaurants.forEach(r => {
                    tx.objectStore('restaurants').put(r);
                  });
                });
                if (callback) {
                  callback(null, restaurants);
                }
              })
              .catch(err => {
                console.log(err);
                if (callback) {
                  callback(null, localRestaurants);
                }
              });
          }
        });
      })
      .catch(err => {
        if (callback) {
          callback(err);
        } else {
          console.log(err);
        }
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    dbPromise.then(db => {
      if (id) {
        try {
          id = parseInt(id);
        } catch (ex) {
          console.log(ex);
          id = null;
        }
      }
      db.transaction('restaurants').objectStore('restaurants').get(id).then(restaurant => {
          if (restaurant) {
            callback(null, restaurant);
          } else {
            callback(`Restaurant with id '${id}' could not be found.`, null);
          }
        })
        .catch(err => {
          if (callback)
            callback(err, null);
          else
            console.log(err);
        });
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
    dbPromise.then(db => {
      db.transaction('restaurants').objectStore('restaurants').getAll().then(restaurants => {
          // Get all neighborhoods from all restaurants
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
          // Remove duplicates from neighborhoods
          const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
          if (callback)
            callback(null, uniqueNeighborhoods);
        })
        .catch(err => {
          if (callback)
            callback(err, null);
          else
            console.log(err);
        });
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    dbPromise.then(db => {
      db.transaction('restaurants').objectStore('restaurants').getAll().then(restaurants => {
          // Get all cuisines from all restaurants
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
          // Remove duplicates from cuisines
          const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
          if (callback)
            callback(null, uniqueCuisines);
        })
        .catch(err => {
          if (callback)
            callback(err, null);
          else
            console.log(err);
        });
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`${UrlHelper.ROOT_URL}restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, suffix = null) {
    let photoFileName = restaurant.photograph;
    if (!photoFileName)
      photoFileName = 'image-not-found';
    if (!photoFileName.endsWith('.jpg'))
      photoFileName += '.jpg';
    if (suffix)
      photoFileName = photoFileName.replace(/.jpg$/, `${suffix}.jpg`);
    return (`${UrlHelper.ROOT_URL}img/${photoFileName}`);
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
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

}

dbPromise = DBHelper.openDB();
