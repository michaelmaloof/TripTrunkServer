/**
 * BEFORE SAVE
 */
Parse.Cloud.beforeSave('Trip', function(request, response) {

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

  response.success(trunk);

});

/*
 * AFTER SAVE
 */
Parse.Cloud.afterSave('Trip', function(request) {
  const sessionToken = request.user.getSessionToken();

  const trunk = request.object;
  if (trunk.existed()) return; // Trunk already exists (not trunk creation) so just return

	// First time trunk is being saved
	// Set up a Role for their members.
	// Trunk Roles are only used if a user sets their account to Private,
	// but we set it up now so it'll be ready if they ever switch their account

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
    const trunkACL = trunk.getACL();
    trunkACL.setRoleReadAccess(trunkRole, true);
    // TODO: Should the trunkMembers Role get WRITE access?
    trunk.setACL(trunkACL);
    return trunk.save(null, {sessionToken: sessionToken});
  })
  .catch(error => {
    console.log('Error saving new role: %s', error.description);
  });

});

/**
 * Cloud Function that updates a Trip object with lat and lon coordinates.
 * Params: {lat (number), lon (number), and trip (object)}
 */
Parse.Cloud.define("updateTrunkLocation", function(request, response) {
  Parse.Cloud.useMasterKey();

  var lat = request.params.latitude;
  var lon = request.params.longitude;
  var Trip = Parse.Object.extend("Trip");
  var trip = new Trip();
  trip.id = request.params.tripId;

  if (!lat || !lon || !trip.id) {
  	response.error('Invalid parameters - Please try again');
  }

	trip.fetch().then(function(trip) {
		trip.set('lat', lat);
		trip.set('longitude', lon);
		return trip.save();

  }).then(function(trip) {
    response.success("Success! - Trip Location Updated");
  }, function(error) {
    response.error(error);
  });
});


/**
 * Cloud Function that deletes publicTripDetail associated with Trip
 * Params: {tripId:<trip.objectId>}
 */
Parse.Cloud.define("removePublicTripDetailsForTrip", function(request, response) {
//   Parse.Cloud.useMasterKey();
   
   var Trip = Parse.Object.extend("Trip");
   var trip = new Trip();
   trip.id = request.params.tripId;
                   
    var query = new Parse.Query("PublicTripDetail");
    query.limit(1);
    query.equalTo('trip',trip);
   
    query.find({
        success: function(details) {
        Parse.Object.destroyAll(details).then(function() {
            response.success("success");
        });
        },
            error: function(error) {
            response.error("Error finding posts " + error.code + ": " + error.message);
        },
    });
});


