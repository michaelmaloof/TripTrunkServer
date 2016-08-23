const _ = require('underscore');
const block = require('./block');
const notificationBuilder = require('./pushNotifications');

// return number of notificatons since last logoff
Parse.Cloud.define('queryForActivityNotifications', function(request, response) {

  const date = new Date(request.params.date);
  const query = new Parse.Query('Activity');
  query.equalTo('toUser', request.user);
  query.notEqualTo('fromUser', request.user);
  query.greaterThan('createdAt', date);

  query.count({
    success: function(count) {
      response.success(count);
    },
    error: function(error) {
      response.error(error);
      console.log('Could not count activities: ' + error.message);
    },
  } );
});

Parse.Cloud.define("queryForNewsFeed", function(request, response) {
	
	var followees = new Array();
	var mainPhotos = new Array();
	var photos = new Array();
	var subPhotos = new Array();
	var allPhotos = new Array();
	var userTrips = new Array();
	
	for (var i = 0; i < parseInt(request.params.objectIds.length); i++) {
	var followee = request.params.objectIds[i];
	var followeeObject = {
  		__type: "Pointer",
  		className: "_User",
  		objectId: followee
  		};
  		
  		followees.push(followeeObject);
	}
	
	var photoQuery = new Parse.Query("Activity");
	photoQuery.descending('updatedAt');
	photoQuery.equalTo('type', 'addedPhoto');
	photoQuery.containedIn('fromUser', followees);
	photoQuery.notContainedIn('objectId',request.params.activityObjectIds);
	var createdAt = new Date(request.params.createdDate);
		if(request.params.isRefresh == "YES"){
		    photoQuery.greaterThanOrEqualTo('createdAt',createdAt);
		}else{
		    photoQuery.lessThanOrEqualTo('createdAt',createdAt);
		}
	
	photoQuery.include('fromUser');
	photoQuery.include('photo');
	photoQuery.include('trip','trip.publicTripDetail');
	photoQuery.exists('trip');
	photoQuery.exists('fromUser');
	photoQuery.exists('toUser');
		
	photoQuery.limit(200);
		
	photoQuery.find({sessionToken: request.user.getSessionToken()}).then(function(objects) {
		for(var i=0; i<objects.length;i++){
			var object = objects[i];
			var savedTripIndex = containsTripObject(object,mainPhotos);
			if(savedTripIndex == -1){ //not found
				var trip = object.get('trip');
				if(trip){
					if(request.params.isRefresh == "YES"){
						mainPhotos.push(object); //main photo
		            			photos.push(object.get("photo"));
					}else{
						if(!containsObject(trip.id+"."+object.get('fromUser').id,request.params.userTrips)){
							mainPhotos.push(object); //main photo
		            				photos.push(object.get("photo"));
		            				userTrips.push(trip.id+"."+object.get('fromUser').id);
						}
					}
		            		
		        	}
		        }
		}
		
		var subQuery = new Parse.Query("Activity");
		subQuery.descending('updatedAt');
		subQuery.equalTo('type', 'addedPhoto');
		subQuery.notContainedIn('photo',photos);
		subQuery.notContainedIn('objectId',request.params.activityObjectIds);
		subQuery.containedIn('fromUser', followees);
		
		subQuery.include('fromUser');
		subQuery.include('photo');
		subQuery.include('trip','trip.publicTripDetail');
		subQuery.exists('trip');
		subQuery.exists('fromUser');
		subQuery.exists('toUser');
		
		subQuery.limit(200);
		
		subQuery.find({sessionToken: request.user.getSessionToken()}).then(function(objects) {
			for(var i=0; i<objects.length;i++){
			var object = objects[i];
			    var trip = object.get('trip');
			    if(trip){
// 		            	if(request.params.isRefresh == "YES"){
						subPhotos.push(object); 
// 					}else{
// 						if(!containsObject(trip.id+"."+object.get('fromUser').id,request.params.userTrips)){
// 							subPhotos.push(object); 
// 		            				userTrips.push(trip.id+"."+object.get('fromUser').id);
// 						}
// 					}
		           }
		}
		
		mainPhotos.sort(date_sort_desc);
		if(request.params.isRefresh == "YES"){
		    subPhotos.sort(date_sort_asc);
		 }
		    
			allPhotos.push(mainPhotos);
			allPhotos.push(subPhotos);
			allPhotos.push(userTrips);
			response.success(allPhotos);
		
		});
	}, function (error) {
		response.error("Error with queryForNewsFeed or query: "+error.message);
    	});
});

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }

    return false;
}

function containsTripObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
    	if(obj.get("trip") && list[i].get("trip")){
        	if (list[i].get("trip").id == obj.get("trip").id) {
        		if(list[i].get("fromUser") && obj.get("fromUser")){
        			if(list[i].get("fromUser").id == obj.get("fromUser").id){
            				return i;
            			}
            		}
        	}
        }else{
        	return -2;	
        }
    }

    return -1;
}

var date_sort_asc = function (obj1, obj2) {
	var trip = obj1.get("createdAt");
	var date1 = new Date(trip);
	var trip = obj2.get("createdAt");
	var date2 = new Date(trip);
  if (date1 > date2) return 1;
  if (date1 < date2) return -1;
  return 0;
};

var date_sort_desc = function (obj1, obj2) {
	var trip = obj1.get("createdAt");
	var date1 = new Date(trip);
	var trip = obj2.get("createdAt");
	var date2 = new Date(trip);
  if (date1 > date2) return -1;
  if (date1 < date2) return 1;
  return 0;
};


/**
 * Adds the fromUser to the toUser's friendsOf_ role.
 * 
 * Returns a deferred Promise.
 */
var addToFriendRole = function(fromUserId, toUserId, sessionToken) {
  var promise = new Parse.Promise();
  console.log("addToFriendRole starting");
  console.log("FromUserID: " + fromUserId);
  console.log("toUserId: " + toUserId);

  var userToFriend = new Parse.User();
  userToFriend.id = fromUserId;
  var approvingUser = new Parse.User();
  approvingUser.id = toUserId;

  var roleName = "friendsOf_";
  // If an ApprovingUser is passed in
  if (approvingUser.id) {
    roleName = roleName + approvingUser.id
  }

  var roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo("name", roleName);

  roleQuery.first({useMasterKey: true})
  .then(function(role) {
    if (role) {
      console.log("addToFriendRole found Role");

      role.getUsers().add(userToFriend);

      // Returns role in THIS promise chain.
      return role.save(null, {useMasterKey: true});

    }
    else
    {
      console.log("addToFriendRole no Role found");

      // Returns in THIS promise chain.
      return Parse.Promise.error("No Role found for name: " + roleName);
    }

  }).then(function(role) {
    console.log("addToFriendRole about to resolve");
    // Resolve the whole function's promise (this is a function embedded in a promise chain)
    promise.resolve();

  }, function(error) {
    console.log("addToFriendRole about to reject");
    // Reject the whole function's promise (this is a function embedded in a promise chain)
    promise.reject(error);

  });

  return promise;
};


/*
 * BEFORE SAVE - ACTIVITY
 */
Parse.Cloud.beforeSave('Activity', function(request, response) {
  if (request.object.existed()) return response.success();

  const fromUser = request.object.get('fromUser');
  const toUser = request.object.get('toUser');
  const activity = request.object;

/*
 * FOLLOW ACTIVITY FLOW
 */
  if (activity.get('type') === 'follow') {
    return block.allowed(toUser, fromUser, request.user.getSessionToken())
    .then(allowed => {
      // USER IS ALLOWED TO DO THIS - NOT BLOCKED.
      return response.success();
    })
    .catch(error => {
      /* User is blocked. */
      return response.error(error);
    });
  }

  // For every other activity type, move on and save it.
  return response.success();
});

/*
 * AFTER SAVE - ACTIVITY
 */

// Wrapper for sending push notifications to prevent redundant code.
function sendPush(data, toUser) {
  const query = new Parse.Query(Parse.Installation);
  query.equalTo('user', toUser);

  console.log('sending push notification');
  return Parse.Push.send({
    where: query, // Set our Installation query.
    data: data,
  }, {
    useMasterKey: true,
  })
  .then(() => {
    console.log('Sent Push');
    return Promise.resolve();
  })
  .catch(error => {
    throw new Error('Push Error ' + error.code + ' : ' + error.message);
  });
}

Parse.Cloud.afterSave('Activity', function(request) {
  // Only send push notifications for new activities
  if (request.object.existed()) {
    console.log('AfterSave: Object existed');
    return;
  }

  const activity = request.object;

  const toUser = activity.get('toUser');
  if (!toUser) {
    throw new Error('Undefined toUser. Skipping push for Activity ' + activity.get('type') + ' : ' + activity.id);
  }

  // If the activity is to the user making the request (i.e. toUser and fromUser are the same), don't send a push notification
  // That happens when we add a "addToTrip" Activity for "self" to aid in querying later, so it shouldn't notify the user.
  if (!toUser || toUser.id === request.user.id) {
    return;
  }

  // If it's addToTrip, we'll populate the Trip before we call the Push Notification.
  // It's redundant code, but it saves refactoring everything right now.
  // TODO: Get rid of the duplicate Push.send blocks, refactor so we don't have the exact same code twice.

  if (activity.get('type') === 'addToTrip') {
    // Check if the trunk is private or not.
    activity.get('trip').fetch()
    .then(thisTrip => {
      activity.set('trip', thisTrip);
      return sendPush(notificationBuilder.alertPayload(activity, request.user), toUser);
    });
  }
  else {
    sendPush(notificationBuilder.alertPayload(activity, request.user), toUser);
  }
});

/*
 * Activity AFTER DELETE
 * used to handle Role Change for an Unfollow activity
 * It's an AfterDelete because in the case of a failure to either Delete the Activity or Update the Role, it's better to delete the activity
 * and leave the role (unfollowed user but old follower still has read permission) than to update the role but still have the activity
 * (still following but can't read data). Hopefully failure doesn't occur, but we use an afterDelete to be safe.
 */
Parse.Cloud.afterDelete('Activity', function(request) {
  // If it's deleting a Follow then it's an Unfollow, so we need to remove them from that user's role as well.
  if (request.object.get('type') === 'follow') {
    const userToUnfollow = request.object.get('toUser');

    const roleName = 'friendsOf_' + userToUnfollow.id;
    console.log('Unfollowing user and removing from role name: ' + roleName);

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', roleName);

    roleQuery.first({useMasterKey: true})
    .then(role => {
      console.log('Attempt to remove user: ' + request.user.id);
      const currentUser = new Parse.User();
      currentUser.id = request.user.id;
      role.getUsers().remove(currentUser);

      console.log(role.getUsers());
      return role.save(null, {useMasterKey: true});
    })
    .catch(error => {
      console.error('Error updating role: ' + error);
    });

  }
  /* REMOVE FROM TRIP */
  else if (request.object.get('type') === 'addToTrip') {
    const userLeaving = request.object.get('toUser');

    const roleName = 'trunkMembersOf_' + request.object.get('trip').id;
    console.log('Leaving trunk with role name: ' + roleName);

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', roleName);
    roleQuery.first({useMasterKey: true})
    .then(role => {
      role.getUsers().remove(userLeaving);

      return role.save(null, {useMasterKey: true});
    })
    .catch(error => {
      console.error('Error updating role: ' + error);
    });
  }
});

function sendPushNotificationForAcceptedFollowRequest(activity, sessionToken) {

  // toUser Accepted fromUser's follow request
  return activity.get('toUser')
  .fetch({sessionToken: sessionToken})
  .then(toUser => {
    // Send the fromUser a push notification telling them that their request was accepted.
    const pushMessage = `${toUser.get('name')} (@${toUser.get('username')}) accepted your follow request.`;
    return sendPush({
      alert: pushMessage.substring(0, 140), // Trim our message to 140 characters when we send it
      p: 'a', // Payload Type: Activity
      t: 'f', // Activity Type: Follow
      fu: activity.get('toUser').id, // From User - it's actually the toUser in this case since it's an "accepted" notificaiton.
    }, activity.get('fromUser'));
  });

}

// ACCEPTED
// Get the Pending Follow and change it to a follow
function approveFollower(activity, sessionToken) {
  // Change the type to follow
  activity.set('type', 'follow');

  // Pending_follow activities are readable only by the two users involved.
  // It should be public now that it's a 'follow' activity.
  const acl = activity.getACL();
  acl.setPublicReadAccess(true);
  activity.setACL(acl);

  return activity.save(null, {sessionToken: sessionToken})
  .then(activity => {

    const promises = [];
    promises.push(addToFriendRole(activity.get('fromUser').id, activity.get('toUser').id));
    promises.push(sendPushNotificationForAcceptedFollowRequest(activity, sessionToken));

    return Promise.all(promises);
  });
}

// REJECTED
// Delete the pending request.
function rejectFollower(activity, sessionToken) {
  return activity.destroy({sessionToken: sessionToken});
}

/*
 * Function to let a user Accept a Follow request - Adds the given user Id into the friend Role for the current User
 * Accepts a "fromUserId" parameter and a "accepted" parameter
 */
Parse.Cloud.define('approveFriend', function(request, response) {
  const sessionToken = request.user.getSessionToken();

  const userToFriend = new Parse.User();
  userToFriend.id = request.params.fromUserId;
  const didApprove = request.params.accepted;

  const query = new Parse.Query('Activity');
  query.equalTo('fromUser', userToFriend);
  query.equalTo('toUser', request.user);
  query.equalTo('type', 'pending_follow');

  query.first({sessionToken: sessionToken})
  .then(activity => {
    if (!activity) return Parse.Promise.error('No Pending Follow Activity Found');

    if (didApprove) {
      return approveFollower(activity, sessionToken);
    }
    return rejectFollower(activity, sessionToken);
  })
  .then(() => {
    // Object successfully deleted
    response.success('approveFriend function Success');
  })
  .catch(error => {
    response.error(error);
  });
});



