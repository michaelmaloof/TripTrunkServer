const trunkQuery = require('../trunkQuery');

/**
 * Accepts params "user1" and "limit".
 * Returns the mutual trunks for the request.user and user1, limited to the passed limit (or 100);
 */
Parse.Cloud.define('queryForMutualTrunks', function(request, response) {
  const user = request.user;
  const toUser = new Parse.User();
  toUser.id = request.params.user1;
  const limit = parseInt(request.params.limit, 10);

  trunkQuery.mutualTrunks(user, toUser, limit, user.getSessionToken())
  .then(activities => {
    console.log('Found %d mutual trunks for %s and $s', activities.length, user.id, toUser.id);
    response.success(activities);
  })
  .catch(err => {
    console.error('Error in queryForMutualTrunks: %s', err.message);
    response.error(err);
  });

});
