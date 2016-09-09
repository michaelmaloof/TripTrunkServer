const _ = require('underscore');


function getTrunksForUser(user, friends, latitude, longitude, limit, skip, sessionToken) {
  const trunkQuery = new Parse.Query('Activity');

  if (latitude && longitude) {
    trunkQuery.equalTo('latitude', latitude);
    trunkQuery.equalTo('longitude', longitude);
  }
  trunkQuery.equalTo('type', 'addToTrip');
  trunkQuery.containedIn('toUser', friends);
  trunkQuery.include('toUser');
  trunkQuery.include('trip', 'trip.creator', 'trip.publicTripDetail');
  trunkQuery.descending('updatedAt');
  trunkQuery.exists('trip');
  trunkQuery.exists('fromUser');
  trunkQuery.exists('toUser');
  trunkQuery.limit(1000); // max the limit
  if (skip) trunkQuery.skip(skip);

  return trunkQuery.find({sessionToken: sessionToken})
  .then(activities => {

    const uniqueTripActivities = _.chain(activities)
    .filter(obj => {
      // Filter by if Trip exists
      // If the user doesn't have permission for a Private trip, then the Activity may be returned
      // but we won't have a Trip subdoc because they don't have permission for that.
      // This deals with old ACL permissions where Included fields get messed up.
      const trip = obj.get('trip');
      return trip && ( trip.get('ACL').getReadAccess(user) || trip.get('ACL').getPublicReadAccess() );
    })
    .uniq(obj => {
      return obj.get('trip').id;
    })
    // Sort by the trip's most recent photo
    .sortBy(obj => {
      return obj.get('trip').get('mostRecentPhoto');
    })
    // Make it descending
    .reverse()
    .value();

    return Promise.resolve(uniqueTripActivities.slice(0, limit));
  });
}

Parse.Cloud.define('queryForUniqueTrunks', function(request, response) {
  const user = request.user;
  const sessionToken = user.getSessionToken();
  const latitude = request.params.latitude;
  const longitude = request.params.longitude;
  const limit = parseInt(request.params.limit, 10);
  const skip  = parseInt(request.params.skip, 10);
  const objectIds = request.params.objectIds;

  const friends = objectIds.map(objectId => {
    return {
      __type: 'Pointer',
      className: '_User',
      objectId: objectId,
    };
  });

  getTrunksForUser(user, friends, latitude, longitude, limit, skip, sessionToken)
  .then(activities => {
    console.log('Performed trunk query successfully');
    response.success(activities);
  })
  .catch(error => {
    console.log('Performed trunk query with failure');
    response.error(error);
  });
});

