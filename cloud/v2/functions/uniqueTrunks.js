const _ = require('underscore');
const trunkQuery = require('../trunkQuery');

/**
 * Accepts params "objectIds", "limit", "skip", "latitude", "longitude"
 * Returns Activity objects containing unique Trunks for the userId(objectIds) list passed in.
 */
Parse.Cloud.define('queryForUniqueTrunks', function(request, response) {
  const user = request.user;
  const sessionToken = user.getSessionToken();

  const latitude = request.params.latitude;
  const longitude = request.params.longitude;
  const limit = parseInt(request.params.limit, 10);
  const skip  = parseInt(request.params.skip, 10);
  const objectIds = request.params.objectIds;

  // Get the objectId array into Parse Object pointers so we can use it in the query.
  const friends = objectIds.map(objectId => {
    return {
      __type: 'Pointer',
      className: '_User',
      objectId: objectId,
    };
  });

  // Query for the unique trunks
  trunkQuery.uniqueTrunks(user, friends, latitude, longitude, limit, skip, sessionToken)
  .then(activities => {
    response.success(activities);
  })
  .catch(error => {
    console.error('Trunk Query FAILED');
    response.error(error);
  });
});

