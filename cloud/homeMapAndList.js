const _ = require('underscore');

var trunks = new Array();
var trips = new Array();
var tripIds = new Array();
var friends = new Array();
var initialLimit = 0;

Parse.Cloud.define("queryForUniqueTrunks", function(request, response) {
		trunks = []; //Added to clear arrays that were auto cleared on parse.com
		trips = []; //Added to clear arrays that were auto cleared on parse.com
		tripIds = []; //Added to clear arrays that were auto cleared on parse.com
		friends = []; //Added to clear arrays that were auto cleared on parse.com
    	var latitude = request.params.latitude;
    	var longitude = request.params.longitude;
    	var limit = parseInt(request.params.limit);
    	var skip  = parseInt(request.params.skip);
    	var user = request.user;
    	
	for (var i = 0; i < parseInt(request.params.objectIds.length); i++) {
		var friend = request.params.objectIds[i];
		var friendObject = {
  				__type: "Pointer",
  				className: "_User",
  				objectId: friend
  				};
		friends.push(friendObject);
	}  		

		getTrunksForUser(limit,skip,latitude,longitude,user, {
		success: function(returnValue) {
			console.log("Performed first trunk query successfully");
			//query again if we don't have as many trunks as the limit &
			//if the limit is less than the amount in the query
			if(trunks.length < limit && limit < initialLimit){
				getTrunksForUser(limit,skip,latitude,longitude,user, {
				success: function(returnValue) {
				console.log("Performed second trunk query successfully");
					//query again if we don't have as many trunks as the limit &
					//if the limit is less than the amount in the query
					if(trunks.length < limit && limit < initialLimit){
						getTrunksForUser(limit,skip,latitude,longitude,user, {
						success: function(returnValue) {
						console.log("Performed third trunk query successfully");
						//query again if we don't have as many trunks as the limit &
						//if the limit is less than the amount in the query
							if(trunks.length < limit && limit < initialLimit){
								//We've maxed out the limit on queries which is 3
								response.success(trunks);
							}else{
								response.success(trunks);
							}
						},
						error: function(error) {
							console.log("Performed third trunk query with failure");
							response.error(error);
						}
						});
										
					}else{
        					response.success(trunks);
					}
    				},
    				error: function(error) {
    					console.log("Performed second trunk query with failure");
      					response.error(error);
    				}
  				});
								
			}else{
        			response.success(trunks);
			}
    		},
    			error: function(error) {
    				console.log("Performed first trunk query with failure");
      				response.error(error);
    			}
  		});
});

function getTrunksForUser(limit,skip,latitude,longitude,user,callback) {
    	var trunkQuery = new Parse.Query("Activity");
    	if(latitude && longitude){
  			trunkQuery.equalTo('latitude',latitude);
  			trunkQuery.equalTo('longitude',longitude);
  		}
  		trunkQuery.equalTo('type', "addToTrip");
  		trunkQuery.containedIn('toUser', friends);
		trunkQuery.notContainedIn('trip',trips);
  		trunkQuery.include(['trip','trip.publicTripDetail']);
  		trunkQuery.include('toUser');
 		trunkQuery.include(['trip','trip.creator']);
  		trunkQuery.descending('updatedAt');
  		trunkQuery.exists('trip');
  		trunkQuery.exists('fromUser');
  		trunkQuery.exists('toUser');
  		trunkQuery.limit(1000); //max the limit
   		
  		if(skip){
  			trunkQuery.skip = skip;	
  		}

  		var objects = new Array();
		//query db for trunks
    		trunkQuery.find().then(function (objects) {
			initialLimit += objects.length;
			for (var i = 0; i < objects.length; i++) {
				var object = objects[i];
				var trip = object.get("trip");
				if(trip){
					var publicTrip = trip.get("publicTripDetail");
					if(publicTrip || user.id == trip.get("creator").id){
						var tripId = trip.id;
						if(!containsObject(tripId,tripIds)){
							if(trip.get("creator")){
								trips.push(trip);
								tripIds.push(tripId);
								var acl = trip.get("ACL");
								if(acl.getReadAccess(user) || acl.getPublicReadAccess()){
									//add object to trunk array
									trunks.push(object);
								}
							}
							//check if the return limit has been reached
							if(trunks.length >= limit){
								break; //this is where we enforce the limit
							}
						}
					}else{
						console.log("The trip ("+trip.get('name')+" in "+trip.get('city')+") is missing it's publicTripDetail");
					}
				}else{
					console.log("The activity " + object.id + " is missing it's Trip");
				}
			}
			trunks.sort(date_sort_desc);
			callback.success(trunks);
				
    		}, function (error) {
			callback.error("Error with trunkQuery.find() "+error);
    		});
}

/**
 * Gets the mutual addToTrip Activities for 2 users.
 * Activity.trip, activity.trip.publicTripDetail, and activity.trip.creator are all included in the response.
 *
 * Requires a sessionToken for finding activities for the currentUser.
 *
 * Returns a Promise with the mutual Activity objects.
 */
function mutualTrunks(user, toUser, limit, token) {
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
}


/**
 * Accepts params "user1" and "limit".
 * Returns the mutual trunks for the request.user and user1, limited to the passed limit (or 100);
 */
Parse.Cloud.define('queryForMutualTrunks', function(request, response) {
  const limit = parseInt(request.params.limit, 10);
  const user = request.user;
  const toUser = new Parse.User();
  toUser.id = request.params.user1;

  mutualTrunks(user, toUser, limit, user.getSessionToken())
  .then(activities => {
    console.log('Found %d mutual trunks for %s and $s', activities.length, user.id, toUser.id);
    response.success(activities);
  })
  .catch(err => {
    console.error('Error in queryForMutualTrunks: %s', err.message);
    response.error(err);
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

var date_sort_asc = function (obj1, obj2) {
	var trip = obj1.get("trip").get("mostRecentPhoto");
	var date1 = new Date(trip);
	var trip = obj2.get("trip").get("mostRecentPhoto");
	var date2 = new Date(trip);
  if (date1 > date2) return 1;
  if (date1 < date2) return -1;
  return 0;
};

var date_sort_desc = function (obj1, obj2) {
	var trip = obj1.get("trip").get("mostRecentPhoto");
	var date1 = new Date(trip);
	var trip = obj2.get("trip").get("mostRecentPhoto");
	var date2 = new Date(trip);
  if (date1 > date2) return -1;
  if (date1 < date2) return 1;
  return 0;
};