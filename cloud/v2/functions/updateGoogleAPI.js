const PlaceUpdater = require('../PlaceUpdater');

function updateFactory(trip) {
  return function() {
    return PlaceUpdater.updateFromGoogle(trip);
  };
}

/**
 * Cloud function to update 1000 Trips to have a gpID from Google Places, and update the Lat/Long
 *
 * Run with this:
 * curl -X POST \
     -H "X-Parse-Application-Id: hgAFtnU5haxHqyFnupsASx6MwZmEQs0wY0E43uwI" \
     -H "Content-Type: application/json" \
     http://localhost:3000/parse/functions/UpdatePlacesToGoogle
 */
Parse.Cloud.define('UpdatePlacesToGoogle', function(request, response) {

  const query = new Parse.Query('Trip');
  query.doesNotExist('gpID');
  query.limit(1000);
  query.find({useMasterKey: true})
  .then(trips => {

    return trips.reduce((prev, trip) => {
      return prev.then(updateFactory(trip));
    }, Promise.resolve());
  })
  .then(results => {
    response.success(results);
  })
  .catch(err => {
    response.error(err);
  });
});

function copyFromTrip(activity) {
  return function() {
    console.log(activity);
    const trip = activity.get('trip');
    if (!trip) {
      // Trip doesn't exist.
      console.log('DELETING ACTIVITY FOR NON EXISTING TRIP');
      return activity.remove({useMasterKey: true});
    }
    activity.set('latitude', trip.get('lat'));
    activity.set('longitude', trip.get('longitude'));
    activity.set('gpID', trip.get('gpID'));
    return activity.save(null, {useMasterKey: true});
  };
}
/**
 * Cloud function update the Activities from 1000 Trips that already have a gpID.
 *
 * Run with this:
 * curl -X POST \
     -H "X-Parse-Application-Id: hgAFtnU5haxHqyFnupsASx6MwZmEQs0wY0E43uwI" \
     -H "Content-Type: application/json" \
     http://localhost:3000/parse/functions/CopyCoordinatesToActivity
 */
Parse.Cloud.define('CopyCoordinatesToActivity', function(request, response) {

  const query = new Parse.Query('Activity');
  query.doesNotExist('gpID');
  query.equalTo('type', 'addToTrip');
  query.limit(1000);
  query.include('trip');
  query.find({useMasterKey: true})
  .then(activities => {
    return activities.reduce((prev, activity) => {
      return prev.then(copyFromTrip(activity));
    }, Promise.resolve());
  })
  .then(results => {
    response.success(results);
  })
  .catch(err => {
    response.error(err);
  });
});

