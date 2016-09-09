const _ = require('underscore');


/**
 * Gets the mutual addToTrip Activities for 2 users.
 * Activity.trip, activity.trip.publicTripDetail, and activity.trip.creator are all included in the response.
 *
 * Requires a sessionToken for finding activities for the currentUser.
 *
 * Returns a Promise with the mutual Activity objects.
 */
exports.mutualTrunks = function(user, toUser, limit, token) {
  // Get the User's trunks
  const query = new Parse.Query('Activity');
  query.equalTo('toUser', user);
  query.equalTo('type', 'addToTrip');
  query.limit(1000); // Get all of the current user's trips. This can be optimized in the future.

  return query.find({sessionToken: token})
  .then(activities => {
    console.log('Found %d trunks for %s', activities.length, user.id);

    // We have to use map not pluck because activity is a Parse.Object,
    // so we need to call activity.get('trip') instead of just plucking activity.trip
    const trunks = _.map(activities, activity => {
      return activity.get('trip');
    });

    // Now get the toUser's trunks that are mutual
    const mutualQuery = new Parse.Query('Activity');
    mutualQuery.equalTo('toUser', toUser);
    mutualQuery.equalTo('type', 'addToTrip');
    mutualQuery.containedIn('trip', trunks); // find trunks that are mutual only.
    mutualQuery.exists('fromUser');
    mutualQuery.exists('toUser');
    mutualQuery.exists('trip');
    mutualQuery.include('trip').include('trip.publicTripDetail').include('trip.creator');
    mutualQuery.descending('updatedAt');
    mutualQuery.limit(limit ? limit : 100); // Set the limit to the passed one or 100.
    return mutualQuery.find({useMasterKey: true});
  });
};

/**
 * Gets the addToTrip Activities for a list of friends
 * Activity.trip, activity.trip.publicTripDetail, and activity.trip.creator are all included in the response.
 *
 * Requires a sessionToken for finding activities for the currentUser.
 *
 * Returns a Promise with the UNIQUE trips, contained in Activity objects.
 * Note that since we are unique on TRIP not on ACTIVITY, we are not returning certain activities because we already have one for that Trip.
 * TODO: Change the app to expect Trip objects returned, and then just return Trips not Activites.
 */
exports.uniqueTrunks = function(user, friends, latitude, longitude, limit, skip, sessionToken) {
  const query = new Parse.Query('Activity');

  if (latitude && longitude) {
    query.equalTo('latitude', latitude);
    query.equalTo('longitude', longitude);
  }
  query.equalTo('type', 'addToTrip');
  query.containedIn('toUser', friends);
  query.include('toUser');
  query.include('trip', 'trip.creator', 'trip.publicTripDetail');
  query.descending('updatedAt');
  query.exists('trip');
  query.exists('fromUser');
  query.exists('toUser');
  query.limit(1000); // max the limit
  if (skip) query.skip(skip);

  return query.find({sessionToken})
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
};
