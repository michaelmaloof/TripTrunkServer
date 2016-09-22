/**
 * Matt Schoch
 * 9/22/2016
 *
 * These functions are for updated Trip locations from the Google Places API
 * This was created as part of the switch from geobytes/Apple to Google Places API for locations.
 * Ongoing use of this should only be for user's who have NOT updated to the latest version of TripTrunk
 * and thus will be using the old APIs in the app.
 */


const request = require('request');

/**
 * Queries the Google Places API for the Trip's city/state/country and updates the Trip with the returned lat/long and gpID
 * @param  {Trip} trip
 * @return {Promise}      Trip Object that has been updated
 */
function updateFromGoogle(trip) {
  const location = `${trip.get('city')}, ${trip.get('state')}, ${trip.get('country')}`;
  const url = JSON.parse(JSON.stringify(`https://maps.googleapis.com/maps/api/place/textsearch/json?key=AIzaSyCONAKKh7ltCHHXEWsfJDsx5kL_I_JS6dw&type=cities&query=${location}`));

  console.log(url);
  return new Promise((resolve, reject) => {
    request(encodeURI(url), (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body).results[0];
        const updates = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          gpID: result.place_id,
        };

        resolve(updates);
      }
      else {
        console.log(error);
        console.log(body);
        reject(error);
      }
    });
  })
  .then(updates => {
    trip.set('gpID', updates.gpID);
    console.log(`Old Latitude: ${trip.get('lat')} - New: ${updates.latitude}`);
    console.log(`Old Longitude: ${trip.get('longitude')} - New: ${updates.longitude}`);
    trip.set('lat', updates.latitude);
    trip.set('longitude', updates.longitude);
    return trip.save(null, {useMasterKey: true});
  });
}

/**
 * Copies the Lat/Long and gpID from the Trip to every addToTrip activity for this trip
 * @param  {Trip} trip Trip object with a gpID
 * @return {Promise}
 */
function copyToActivities(trip) {
  const query = new Parse.Query('Activity');
  query.equalTo('trip', trip);
  query.equalTo('type', 'addToTrip');
  return query.find({useMasterKey: true})
  .then(activities => {
    // for each activity, update the lat/lon/gpid with the Trip's.
    return Promise.all(
      activities.map(activity => {
        activity.set('latitude', trip.get('lat'));
        activity.set('longitude', trip.get('longitude'));
        activity.set('gpID', trip.get('gpID'));
        return activity.save(null, {useMasterKey: true});
      })
    );
  });
}

module.exports = {
  updateFromGoogle,
  copyToActivities,
};
