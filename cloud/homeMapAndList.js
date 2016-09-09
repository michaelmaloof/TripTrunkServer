/**
 * matt schoch
 * 9/9/2016
 *
 * This file is no longer needed. It has been replaced by
 * /v2/trunkQuery.js and v2/functions/uniqueTrunks.js
 */

/*
const _ = require('underscore');

var trunks = new Array();
var trips = new Array();
var tripIds = new Array();
var friends = new Array();
var initialLimit = 0;

Parse.Cloud.define("queryForUniqueTrunks-old", function(request, response) {
  const sessionToken = request.user.getSessionToken();
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

		getTrunksForUser(limit,skip,latitude,longitude,user, sessionToken, {
		success: function(returnValue) {
			console.log("Performed first trunk query successfully");
			//query again if we don't have as many trunks as the limit &
			//if the limit is less than the amount in the query
			if(trunks.length < limit && limit < initialLimit){
				getTrunksForUser(limit,skip,latitude,longitude,user, sessionToken, {
				success: function(returnValue) {
				console.log("Performed second trunk query successfully");
					//query again if we don't have as many trunks as the limit &
					//if the limit is less than the amount in the query
					if(trunks.length < limit && limit < initialLimit){
						getTrunksForUser(limit,skip,latitude,longitude,user, sessionToken, {
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

function getTrunksForUser(limit,skip,latitude,longitude,user, sessionToken, callback) {
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
  			trunkQuery.skip(skip);	
  		}

  		var objects = new Array();
		//query db for trunks
    		trunkQuery.find({sessionToken: sessionToken}).then(function (objects) {
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
*/
