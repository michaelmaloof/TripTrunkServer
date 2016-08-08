let initialLimit = 0;

const TTUser = require('./TTUser');


function getTrunksForUser(limit, skip, latitude, longitude, user, callback) {


  const newUser = new TTUser(user.id);
  newUser.friends()
  .then(friends => {
    console.log(friends);
    const query = new Parse.Query('Activity');
    
  });



  const trunkQuery = new Parse.Query('Activity');
  if (latitude && longitude) {
    trunkQuery.equalTo('latitude', latitude);
    trunkQuery.equalTo('longitude', longitude);
  }
  trunkQuery.equalTo('type', 'addToTrip');
  trunkQuery.containedIn('toUser', friends);
  trunkQuery.notContainedIn('trip', trips);
  trunkQuery.include(['trip', 'trip.publicTripDetail']);
  trunkQuery.include('toUser');
  trunkQuery.include(['trip', 'trip.creator']);
  trunkQuery.descending('updatedAt');
  trunkQuery.exists('trip');
  trunkQuery.exists('fromUser');
  trunkQuery.exists('toUser');
  trunkQuery.limit(1000); // max the limit

  if (skip) trunkQuery.skip = skip;

  const objects = [];

  trunkQuery.find()
  .then(trunks => {
    initialLimit += objects.length;

    trunks.forEach(obj => {
      const trip = obj.get('trip');
      if (trip) {
        const publicTrip = trip.get('publicTripDetail');
        if (publicTrip || user.id === trip.get('creator').id) {

        }
      }
    });


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
              // add object to trunk array
              trunks.push(object);
            }
          }
          // check if the return limit has been reached
          if(trunks.length >= limit){
            break; // this is where we enforce the limit
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

Parse.Cloud.define('queryForUniqueTrunks', (request, response) => {
  const trunks = []; // Added to clear arrays that were auto cleared on parse.com
  const trips = []; // Added to clear arrays that were auto cleared on parse.com
  const tripIds = []; // Added to clear arrays that were auto cleared on parse.com

  const latitude = request.params.latitude;
  const longitude = request.params.longitude;
  const limit = parseInt(request.params.limit, 10);
  const skip  = parseInt(request.params.skip, 10);
  const user = request.user;

  // Map the IDs array into Friend objects
  const friends = request.params.objectIds.map(friend => {
    return {
      __type: 'Pointer',
      className: '_User',
      objectId: friend,
    };
  });

  getTrunksForUser(limit, skip, latitude, longitude, user, {
    success: function(returnValue) {
      console.log('Performed first trunk query successfully');

      return response.success(trunks);
    },
    error: function(error) {
      console.log('Performed first trunk query with failure');
      response.error(error);
    },
  });
});


// Query Unique Trunks for a user
//
function trunksForUser(user) {
  // Query trunks from the Activity class
  // we want the User's trunks AND trunks they're in.
  const trunkQuery = new Parse.Query('Activity');
  if (latitude && longitude) {
    trunkQuery.equalTo('latitude', latitude);
    trunkQuery.equalTo('longitude', longitude);
  }
  trunkQuery.equalTo('type', 'addToTrip');
  trunkQuery.containedIn('toUser', friends);
  trunkQuery.notContainedIn('trip', trips);
  trunkQuery.include(['trip', 'trip.publicTripDetail']);
  trunkQuery.include('toUser');
  trunkQuery.include(['trip', 'trip.creator']);
  trunkQuery.descending('updatedAt');
  trunkQuery.exists('trip');
  trunkQuery.exists('fromUser');
  trunkQuery.exists('toUser');
  trunkQuery.limit(1000); // max the limit

  if (skip) trunkQuery.skip = skip;

  const objects = [];

  trunkQuery.find()
  .then(trunks => {
    initialLimit += objects.length;

    trunks.forEach(obj => {
      const trip = obj.get('trip');
      if (trip) {
        const publicTrip = trip.get('publicTripDetail');
        if (publicTrip || user.id === trip.get('creator').id) {

        }
      }
    });

}




Parse.Cloud.define("queryForMutualTrunks", function(request, response) {
  var limit = parseInt(request.params.limit);
    var user = request.user;
    console.log("user: "+user.Id);
    var user1Object = {
        __type: "Pointer",
        className: "_User",
        objectId: request.params.user1
      };
      
      var user2Object = {
        __type: "Pointer",
        className: "_User",
        objectId: request.params.user2
      };
      
  getMutualTrunks(limit,user1Object,user2Object,user, {
    success: function(returnValue) {
      console.log("Performed first trunk query successfully");
            response.success(trunks);
        },
          error: function(error) {
            console.log("Performed first trunk query with failure");
              response.error(error);
          }
      });
});

function getMutualTrunks(limit,user1,user2,user,callback){    
    
      var trunkQuery1 = new Parse.Query("Activity");
      trunkQuery1.equalTo('toUser',user1);
      trunkQuery1.equalTo('type', "addToTrip");
    
      var trunkQuery2 = new Parse.Query("Activity");
      trunkQuery2.equalTo('toUser',user2);
      trunkQuery2.equalTo('type', "addToTrip");
    
      var subQuery = Parse.Query.or(trunkQuery1,trunkQuery2);
      subQuery.include(['trip','trip.publicTripDetail']);
      subQuery.include(['trip','trip.creator']);
      subQuery.exists('fromUser');
      subQuery.exists('toUser');
      subQuery.exists('trip');
      subQuery.descending('updatedAt');
      subQuery.limit = limit;

    var token = user.getSessionToken();
    
    var mutualTrips = new Array();
    var user2Trips = new Array();
    
    subQuery.find({ sessionToken: token }).then(function (objects) {  
    for (var i = 0; i < objects.length; i++) {
      var object = objects[i];
      var trip = object.get("trip")
      if(trip){
        var publicTrip = trip.get("publicTripDetail");
        var user = request.user;
//          if(publicTrip || Parse.User.current().id == trip.get("creator").id){
        if(publicTrip || user.id == trip.get("creator").id){
        for(var x = 0; x < objects.length; x++) {
          var compareObject = objects[x];
          var compareTrip = compareObject.get("trip")
          if(compareTrip){
            var tripId = trip.id;
          if(!containsObject(tripId,tripIds)){
            if(object.get("fromUser") != compareObject.get("fromUser")){
              if(trip.id == compareTrip.id){
                if(trip.get("creator")){
                  tripIds.push(tripId);
                  var acl = trip.get("ACL");
//                    if(acl.getReadAccess(Parse.User.current()) || acl.getPublicReadAccess()){
                  if(acl.getReadAccess(user) || acl.getPublicReadAccess()){
                    // add object to trunk array
                    trunks.push(object);
                  }
                }
              }         
            }
          }
          }else{
            console.log("The activity " + object.id + " is missing it's Trip (while comparing)");
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
    callback.error("Error with getMutualTrunks subQuery.find()"+error);
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