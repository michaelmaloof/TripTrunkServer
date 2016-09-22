const PlaceUpdater = require('../PlaceUpdater');

/**
 * Cloud function to update 1000 Trips to have a gpID from Google Places, and update the Lat/Long
 */
Parse.Cloud.define('UpdatePlacesToGoogle', function(request, response) {

  const query = new Parse.Query('Trip');
  query.doesNotExist('gpID');
  query.limit(1000);
  query.find({useMasterKey: true})
  .then(trips => {

    return trips.reduce((prev, trip) => {
      return prev.then(PlaceUpdater.updateFromGoogle(trip));
    }, Promise.resolve());
  })
  .then(results => {
    response.success(results);
  })
  .catch(err => {
    response.error(err);
  });
});

/**
 * Cloud function update the Activities from 1000 Trips that already have a gpID.
 */
Parse.Cloud.define('CopyCoordinatesToActivity', function(request, response) {

  const query = new Parse.Query('Trip');
  query.exists('gpID');
  query.limit(1000);
  query.find({useMasterKey: true})
  .then(trips => {
    return trips.reduce((prev, trip) => {
      return prev.then(PlaceUpdater.copyToActivities(trip));
    }, Promise.resolve());
  })
  .then(results => {
    response.success(results);
  })
  .catch(err => {
    response.error(err);
  });
});

