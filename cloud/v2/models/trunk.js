const PlaceUpdater = require('../PlaceUpdater');
/**
 * BEFORE SAVE
 */
Parse.Cloud.beforeSave('Trip', function(request, response) {
  if (request.object.existed()) return response.success();

  const trunk = request.object;

  // If the trip is private, we need to REMOVE the friendsOf_ role on the Trip's ACL - the app is setting it to READ.
  // This fixes an issue that's happening because of a bug in the app.
  if (trunk.get('isPrivate') === true) {
    const roleName = `friendsOf_${trunk.get('creator').id}`;
    console.log('BeforeSaveTrip - friendsOf role name: %s', roleName);
    const acl = trunk.getACL();
    acl.setRoleReadAccess(roleName, false);
    trunk.setACL(acl);
  }

  return response.success(trunk);

});

/*
 * AFTER SAVE
 *
 * Creates Trunk Members Role and sets it to the trunk
 */
Parse.Cloud.afterSave('Trip', function(request) {
  if (request.object.existed()) return;

  const sessionToken = request.user.getSessionToken();

  const trunk = request.object;

	// First time trunk is being saved
	// Set up a Role for their members.
	// Trunk Member Roles are used for Photo and Trunk Permissions if a User or Trunk is private.

  const roleName = `trunkMembersOf_${trunk.id}`; // Unique role name
  console.log('AfterSaveTrip - trunkMembersOf role name: %s', roleName);
  const acl = new Parse.ACL(request.user); // Only the creator of the trunk gets permission for the Role.
  acl.setRoleReadAccess(roleName, true);
  acl.setRoleWriteAccess(roleName, true);

  const trunkMember = new Parse.Role(roleName, acl);
  trunkMember.save(null, {sessionToken: sessionToken})
  .then(trunkRole => {
    console.log('Successfully saved new role: %s', roleName);

    // Make sure the Trunk Role is set to READ on the Trunk.
    // We do it here not in beforeSave because we don't have the Trunk ID in beforeSave.
    const trunkACL = trunk.getACL();
    trunkACL.setRoleReadAccess(trunkRole, true);
    trunkACL.setRoleWriteAccess(trunkRole, true);

    trunk.setACL(trunkACL);
    return trunk.save(null, {sessionToken: sessionToken});
  })
  .then(trunk => {
    // check if we have a gpID - meaning is the user using the old version of the app.
    if (!trunk.get('gpID')) {
      // Update the Trip from the Google API, then copy that location to the Activity objects.
      return PlaceUpdater.updateFromGoogle(trunk).then(PlaceUpdater.copyToActivities(trunk));
    }
    return Promise.resolve(trunk);
  })
  .catch(error => {
    console.log('Error saving new role: %s', error.description);
  });

});


/**
 * Cloud Function that deletes publicTripDetail associated with Trip
 * Params: {tripId:<trip.objectId>}
 */
Parse.Cloud.define('removePublicTripDetailsForTrip', function(request, response) {
  const sessionToken = request.user.getSessionToken();
  const Trip = Parse.Object.extend('Trip');
  const trip = new Trip();
  trip.id = request.params.tripId;
  const query = new Parse.Query('PublicTripDetail');
  query.equalTo('trip', trip);
  query.find({sessionToken: sessionToken})
  .then(details => {
    return Parse.Object.destroyAll(details, {sessionToken: sessionToken});
  })
  .then(res => {
    response.success('Successfully Removed PublicTripDetail');
  })
  .catch(error => {
    response.error('Error removing publicTripDetail');
  });
});


