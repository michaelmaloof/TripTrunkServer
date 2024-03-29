const _ = require('underscore');

/**
 * BEFORE SAVE
 */
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  // Save the user's name in lowercase also so we can search easier.
  const user = request.object;
  if (user.get('name')) {
    user.set('lowercaseName', user.get('name').toLowerCase());
    user.set('firstNameLowercase', user.get('firstName').toLowerCase());
    user.set('lastNameLowercase', user.get('lastName').toLowerCase());
  }
  response.success(user);
});


/*
 * AFTER SAVE
 *
 * Sets up the User's friendsOf role if needed.
 */
Parse.Cloud.afterSave(Parse.User, function(request) {
  const user = request.object;
  const sessionToken = user.getSessionToken();
  if (user.existed()) return; // user already exists (not account creation) so just return

	// First time user is being saved
	// Set up a Role for their friends.
	// Friend Roles are only used if a user sets their account to Private,
  // but we set it up now so it'll be ready if they ever switch their account

  const roleName = `friendsOf_${user.id}`; // Unique role name
  const acl = new Parse.ACL(user);
  acl.setPublicReadAccess(true); // Initially, we set up the Role to have public
  acl.setPublicWriteAccess(true); // We give public write access to the role also - Anyone can decide to be someone's friend (aka follow them)

  // In the future, if the user makes their account Private,
  // the ACL for their role gets changed. This lets existing followers be part of
  // the role still even though they didn't have to 'request' to follow

  const friendRole = new Parse.Role(roleName, acl);
  friendRole.save(null, {sessionToken: sessionToken})
  .then(friendRole => {
    console.log('Successfully saved new role: %s', roleName);
  })
  .catch(error => {
    console.log('Error saving new role: %s', error.description);
  });
});


/**
 * Cloud Function that changes the request User's role ACL to be private so they must approve new people joining their role.
 * No Parameters
 */
Parse.Cloud.define("becomePrivate", function(request, response) {
    console.log("running becomePrivate");
  Parse.Cloud.useMasterKey();
  const sessionToken = request.user.getSessionToken();
  var user = request.user;
  user.set("private", true);
  user.save();

  var userRole;

  var roleName = "friendsOf_" + request.user.id;
  var roleQuery = new Parse.Query("_Role");
  roleQuery.equalTo("name", roleName);

  roleQuery.first({sessionToken: sessionToken})
  .then(function(role) {
    if (!role) {
      // If for some reason their role doesn't exist already, create it.
      var acl = new Parse.ACL(user);
      role = new Parse.Role(roleName, acl); 
    }
    else {
      // Otherwise, just set the ACL to Private (read/write only by the currentUser)
      role.setACL(new Parse.ACL(user));
    }

    userRole = role;

    // Set up the query for finding all Followers & return the results to the next function in the chain.
    var query = new Parse.Query('Activity');
    query.equalTo('toUser', user);
    query.equalTo('type', "follow");
    query.limit(10000); // set a higher limit otherwise it only does 100.
    return query.find({sessionToken: sessionToken});

  }).then(function(activities) {

    // For each Follow Activity
    var usersInRole = userRole.getUsers();
    _.each(activities, function(activity) {
      var userToFriend = activity.get('fromUser');
      usersInRole.add(userToFriend);
    });

    return userRole.save(null, {sessionToken: sessionToken});

  }).then(function(role) {
  
    // Query for all of the user's photo
    var query = new Parse.Query('Photo');
    query.equalTo('user', user);
    return query.find({sessionToken: sessionToken});

  }).then(function(photos) {

    var counter = 0;
    var photoPromise = Parse.Promise.as();
    console.log("found photos: " + photos.length);

    _.each(photos, function(photo) {
      console.log('photo process');
      photoPromise = photoPromise.then(function() {
        // Update the photo's ACL to remove public read access
        var acl = photo.getACL();
        acl.setPublicReadAccess(false);
        photo.setACL(acl);
        
        //Set the Video ACL the same as the photo
        console.log("Setting ACL for video");
        const video = photo.get('video');
        if(video){
            video.setACL(photo.getACL());
            console.log("Video ACL set successfully");
        }else{
            console.log("Video ACL not set, Must be a photo.");
        }

        if (counter % 100 === 0) {
          // Set the  job's progress status
          console.log(counter + " photos processed.");
        }
        counter += 1;
        return photo.save(null, {sessionToken: sessionToken});
      });
    });

    return photoPromise;
  }).then(function() {
    response.success("Success! - Account Now Private");
  }, function(error) {
    response.error(error);
  });
});

/*
 * Function that changes the request User's role ACL to be Public so anyone can follow them. 
 * This is the default for new users already.
 * No Parameters
 */
Parse.Cloud.define("becomePublic", function(request, response) {
    console.log("running becomePublic");
  Parse.Cloud.useMasterKey();
  var user = request.user;

  user.set("private", false);
  user.save();

  var roleName = "friendsOf_" + request.user.id;
  var roleQuery = new Parse.Query("_Role");
  roleQuery.equalTo("name", roleName);

  roleQuery.first().then(function(role) {
  	var acl = new Parse.ACL(user);
		acl.setPublicReadAccess(true); // Initially, we set up the Role to have public
		acl.setPublicWriteAccess(true); // We give public write access to the role also - Anyone can decide to be someone's friend (aka follow them)
    role.setACL(acl);
    return role.save();

  }).then(function(role) {

    // Query for all of the user's photo
    var query = new Parse.Query('Photo');
    query.equalTo('user', user);
    query.include('video');
    return query.find();

  }).then(function(photos) {
    var photoPromise = Parse.Promise.as();
    var counter = 0;

    _.each(photos, function(photo) {
      photoPromise = photoPromise.then(function() {
        // Update the photo's ACL to remove public read access
        var acl = photo.getACL();
        acl.setPublicReadAccess(true);
        photo.setACL(acl);
        
        //Set the Video ACL the same as the photo
        console.log("Setting ACL for video");
        const video = photo.get('video');
        if(video){
            video.setACL(photo.getACL());
            console.log("Video ACL set successfully");
        }else{
            console.log("Video ACL not set, Must be a photo.");
        }

        if (counter % 100 === 0) {
          // Set the  job's progress status
          console.log(counter + " photos processed.");
        }
        counter += 1;
        return photo.save();
      });
    });

    return photoPromise;
  }).then(function(automaticFollowApproval) {
        var query = new Parse.Query('Activity');
        query.equalTo('toUser', request.user);
        query.equalTo('type', "pending_follow");
        query.exists('fromUser');
        query.limit(10000);
        return query.find();
        
  }).then(function(updateFollow) {
    var followPromise = Parse.Promise.as();
    _.each(updateFollow, function(follow) {
      followPromise = followPromise.then(function() {
        follow.set("type","follow");
	var acl = follow.getACL();
        acl.setPublicReadAccess(true);
        follow.setACL(acl);
        return follow.save();
      });
    });
    
    return followPromise;
    
  }).then(function(activity) {
          var promises = [];
          if(activity){
            var fromUser = activity.get("fromUser");
            if(fromUser){
                promises.push(addToFriendRole(fromUser.id, request.user.id));
            }
                promises.push(sendPushNotificationForAcceptedFollowRequest(activity, request));
            }
          return Parse.Promise.when(promises);
    
  }).then(function() {
    response.success("Success! - Account Now Public");
  }, function(error) {
    response.error(error);
  });
});



