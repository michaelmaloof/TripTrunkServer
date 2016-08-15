const block = require('./block');
const _ = require('underscore');

/**
 * Checks if an Activity already exists for adding this user to the trip.
 * Thros an error if user has already been added
 * @param  {Parse.User} user
 * @param  {Parse.Trip} trip
 * @param  {Session Token} sessionToken
 * @return {True or Error}
 */
function checkDuplicates(users, trip, sessionToken) {
  const query = new Parse.Query('Activity');
  query.equalTo('trip', trip);
  query.equalTo('type', 'addToTrip');
  query.containedIn('toUser', users);

  return query.find({useMasterKey: true})
  .then(objs => {
    if (objs.length > 0) {
      return Parse.Promise.error('ERROR: User already added to trunk');
    }
    return true;
  });
}

/**
 * Get the Member Role for the trunk
 * @param  {String } tripId
 * @return {Promise of a Role}
 */
function getTrunkRole(tripId) {
  console.log('Trip Id: %s', tripId);
  if (!tripId) {
    return Parse.Promise.error('No trip id passed so we have no Role Name');
  }
  const roleName = `trunkMembersOf_${tripId}`;


  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo('name', roleName);
  console.log('Looking for role name: %s', roleName);

  return roleQuery.find({useMasterKey: true});
}

/**
 * Add a list of users to the ACL for a Trip.
 * @param {Array} users        Parse.User objects or userIds
 * @param {Trip} trip         Trip object - only has to have .id, we'll fetch the rest.
 * @param {sessionToken} sessionToken
 */
function addUsersToTripACL(users, trip, sessionToken) {
  console.log('Adding users to Trip ACL');
  return trip.fetch({sessionToken: sessionToken})
  .then(trip => {
    const acl = trip.getACL();
    _.each(users, user => {
      acl.setReadAccess(user, true);
      acl.setWriteAccess(user, true);
    });
    trip.setACL(acl);
    return trip.save(null, {sessionToken: sessionToken});
  });
}


/**
 * AddMembersToTrip Cloud Function
 * Allows the app to Add Members to a Trunk
 *
 * Accepts the params:

{ tripId: 'OjlRSeNC16',
  fromUserId: '82yTvrtvO7',
  content: 'Dexter City',
  longitude: -81.472884,
  latitude: 39.659651,
  tripCreatorId: '82yTvrtvO7',
  users: [ '82yTvrtvO7' ],
  private: false }
 *
 */

Parse.Cloud.define('AddMembersToTrip', function(request, response) {
  console.log(request.params);
  const sessionToken = request.user.getSessionToken();

  const fromUser = new Parse.User();
  fromUser.id = request.params.fromUserId;

  const creator = new Parse.User();
  creator.id = request.params.tripCreatorId;

  const privateTrip = request.params.private;

  const Trip = Parse.Object.extend('Trip');
  const trip = new Trip();
  trip.id = request.params.tripId;

  const content = request.params.content;
  const latitude = request.params.latitude;
  const longitude = request.params.longitude;

  const newMembers = _.map(request.params.users, user => {
    const newUser = new Parse.User();
    newUser.id = user;
    return newUser;
  });

  // TODO: right now block.allowed is passing in the same user - i.e. not actually checking if the newMembers have blocked the fromUser.
  // Change block.allowed to accept an array so we can check all of them.
  block.allowed(fromUser, fromUser, sessionToken)
  .then(allowed => {
    /*
     * Ensure we aren't adding duplicate users to a Trunk
     * i.e. if the user clicks Next in trunk creation, then goes back to the user screen and clicks next again.
     */
    return checkDuplicates(newMembers, trip, sessionToken);
  })
  .then(success => {
    // Get the Trunk Member Role.
    return getTrunkRole(trip.id, sessionToken);
  })
  .then(roles => {
    const role = roles[0];
    if (role) {
      role.getUsers().add(newMembers);
      return role.save(null, {useMasterKey: true});
    }
    return Parse.Promise.error('No Role found' );

  })
  .then(role => {
    // Role Updated with new members - If it's private, add the users to the Trip's ACL
    if (privateTrip) {
      return addUsersToTripACL(newMembers, trip, sessionToken);
    }
    return Promise.resolve();
  })
  .then(() => Promise.all(_.each(newMembers, user => {
    // Create an Activity for addToTrip
    const Activity = Parse.Object.extend('Activity');
    const activity = new Activity();
    activity.set('type', 'addToTrip');
    activity.set('trip', trip);
    activity.set('fromUser', fromUser);
    activity.set('toUser', user);
    activity.set('content', content);
    activity.set('latitude', latitude);
    activity.set('longitude', longitude);

    const acl = new Parse.ACL(fromUser);
    acl.setPublicReadAccess(true); // Initially, we set up the Role to have public
    acl.setWriteAccess(user, true); // We give public write access to the role also - Anyone can decide to be someone's friend (aka follow them)
    acl.setWriteAccess(creator, true);
    activity.setACL(acl);
    return activity.save(null, {useMasterKey: true});
  })))
  .then(activities => {
    // Successfully saved activities for all members of the trunk.
    return response.success();
  })
  .catch(error => {
    /* ERROR */
    console.error(error);

    return response.error(error);
  });

});
