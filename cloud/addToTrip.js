Parse.Cloud.define('addToTripSprint13', function(request, response) {

  const sessionToken = request.user.getSessionToken();
  // Create full objects out of the ID's sent as params.
  const fromUser = new Parse.User();
  fromUser.id = request.params.fromUserId;

  const toUser = new Parse.User();
  toUser.id = request.params.toUserId;

  const creator = new Parse.User();
  creator.id = request.params.tripCreatorId;

  const Trip = Parse.Object.extend('Trip');
  const trip = new Trip();
  trip.id = request.params.tripId;

  const content = request.params.content;
  const latitude = request.params.latitude;
  const longitude = request.params.longitude;


  // MAKE SURE THE USER ISN'T BLOCKED
  const blockQuery = new Parse.Query('Block');
  blockQuery.equalTo('blockedUser', fromUser);
  blockQuery.equalTo('fromUser', toUser);

  blockQuery.find({sessionToken: sessionToken})
  .then((blocked) => {
    if (blocked.length > 0) {
      return Parse.Promise.error('User is blocked from performing this action');
    }

    // USER IS ALLOWED TO DO THIS - NOT BLOCKED.
    
    /*
     * Ensure we aren't adding duplicate users to a Trunk
     * i.e. if the user clicks Next in trunk creation, then goes back to the user screen and clicks next again.
     */
    const query = new Parse.Query('Activity');
    query.equalTo('trip', trip);
    query.equalTo('type', 'addToTrip');
    query.equalTo('toUser', toUser);

    return query.first({sessionToken: sessionToken});
  })
  .then((addToTripObject) => {
    // If an addToTrip Object, it already exists. 
    if (addToTripObject) {
      console.log('ADD TO TRIP OBJECT FOUND SO ALREADY ADDED');
      return Parse.Promise.error('User already added to trunk');
    }

    console.log('Trip Id: %s', trip.id);

    // ADD TRUNK MEMBER TO ROLE
    let roleName;
    // If an ApprovingUser is passed in
    if (trip.id) {
      roleName = 'trunkMembersOf_' + trip.id;
    }
    else  {
      return Parse.Promise.error('No trip id passed so we have no Role Name');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', roleName);
    console.log('Looking for role name: ' + roleName);

    return roleQuery.first({sessionToken: sessionToken});

  }).then(function(role) {
    console.log('Role Found: %s', role.get('name'));
    if (role) {
      role.getUsers({sessionToken: sessionToken}).add(toUser);
      console.log(role.getUsers({sessionToken: sessionToken}));
      return role.save({sessionToken: sessionToken});
    }
    return Parse.Promise.error('No Role found' );

  }).then(function() {
    /* SUCCESS */
    console.log('Role Updated, so now save the Activity');

        // Create an Activity for addedPhoto
    var Activity = Parse.Object.extend('Activity');
    var activity = new Activity();
    activity.set('type', 'addToTrip');
    activity.set('trip', trip);
    activity.set('fromUser', fromUser);
    activity.set('toUser', toUser);
    activity.set('content', content);
    activity.set('latitude', latitude);
    activity.set('longitude', longitude);

    var acl = new Parse.ACL(fromUser);
    acl.setPublicReadAccess(true); // Initially, we set up the Role to have public
    acl.setWriteAccess(toUser, true); // We give public write access to the role also - Anyone can decide to be someone's friend (aka follow them)
    acl.setWriteAccess(creator, true);
    activity.setACL(acl);
    return activity.save({sessionToken: sessionToken});
    
  })
  .then(function(activity) {
    console.log('Successfully saved Activity');
    return response.success();

  }, function(error) {
    /* ERROR */
    console.error(error);

    return response.error(error);
  });
});
