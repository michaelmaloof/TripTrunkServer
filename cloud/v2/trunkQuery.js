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

// Returns unique trunks...
exports.uniqueTrunks = function() {

};
