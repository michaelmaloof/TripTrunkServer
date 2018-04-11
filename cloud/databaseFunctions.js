

/**
 * TODO: 8/8/2016 - Mattschoch
 * This isn't being included in main.js and nothing in iOS calls these...can we delete?
 */

Parse.Cloud.useMasterKey();

Parse.Cloud.define("copyColumnUsernameToUsernameBack", function(request, response) {

	var copyQuery = new Parse.Query("User");
	copyQuery.limit(1);
	copyQuery.doesNotExist("username_back");
	
    copyQuery.find({
        success: function(results) {
           for (var i = 0; i < results.length; i++) {
					var object = results[i];
					var username = results[i].get("username");
					object.set("username_back",username);
                	object.save(null,{
                  			success: function (object) { 
                    			//response.success(object);
								console.log("success");
                  			}, 
                			error: function (object, error) { 
                  				//response.error(error);
								console.log("failed");
               	 			 }
              		});
		  }
        },
        error: function(error) {
			response.error(error);
            console.log("failed");
        }
    });

});

Parse.Cloud.define("copyColumnLowercaseUsernameToUsername", function(request, response) {

	var copyQuery = new Parse.Query("User");
	copyQuery.limit(1);
	//You must create a column called u_back_temp before running this script.
	//Then delete it after you run the script as many times as you need
	copyQuery.doesNotExist("u_back_temp");
	
    copyQuery.find({
        success: function(results) {
           for (var i = 0; i < results.length; i++) {
					var object = results[i];
					var lowercaseUsername = results[i].get("lowercaseUsername");
					object.set("username", lowercaseUsername);
					object.set("u_back_temp","done");
                	object.save(null,{
                  			success: function (object) { 
                    			//response.success(object);
								console.log("success");
                  			}, 
                			error: function (object, error) { 
                  				//response.error(error);
								console.log("failed");
               	 			 }
              		});
		  }
        },
        error: function(error) {
			response.error(error);
            console.log("failed");
        }
    });

});

Parse.Cloud.define("saveUserToIncludeHometownGeoPoint", function(request, response) {
 	var latitude = request.params.latitude;
    var longitude = request.params.longitude;
     var userId = request.params.userId;
     var loc = new Parse.GeoPoint(latitude, longitude);
 	var query = new Parse.Query("User");
//  			query.limit(1);
 			query.equalTo('objectId',userId);
	
	Parse.Cloud.useMasterKey();
  	const sessionToken = request.user.getSessionToken();
	query.find({
		success: function(results){
			var object = results[0];
			object.set('hometownGeoPoint',loc);
			object.save({sessionToken: sessionToken},{
				success: function (object) { 
						console.log("success");
						response.success("user geopoint saved");
                 }, 
                error: function (object, error) { 
						console.log("failed");
						response.error(error);
               	 }
			});
		},
		error: function(error) {
			response.error(error);
		}
	});

});

Parse.Cloud.define("copyHomeAtCreationGeoPointToTrip", function(request, response) {

	var query = new Parse.Query("Trip");
	query.limit(1000);
	query.doesNotExist("homeAtCreation");
	query.exists("publicTripDetail");
	query.include("publicTripDetail");
	var user = request.user;
	
    query.find({
        success: function(results) {
           for (var i = 0; i < results.length; i++) {
					const trip = results[i];
					const ptd = trip.get("publicTripDetail");
					trip.set("homeAtCreation",ptd.get("homeAtCreation"));
					trip.save(null,{ useMasterKey: true }).then(function (objects) {
//                     			response.success("trip saved.");
								console.log("success: homeAtCreation updated");
                  			}, function (error) {
//                   				response.error("Error, trip not saved: "+error.message);
								console.log("homeAt Creation update failed");
               	 			 });
		  }
		  response.success("copyHomeAtCreationGeoPointToTrip finished: "+i);
        },
        error: function(error) {
			response.error(error.message);
//             console.log("failed");
        }
    });

});

Parse.Cloud.define("setGeoPointToPublicTripForHomeAtCreation", function(request, response) {
	var id = request.params.objectId;
	var loc = new Parse.GeoPoint(request.params.lat, request.params.long);
	
	var query = new Parse.Query("Trip");
	query.equalTo("objectId",id);

	query.find({
        success: function(results) {
					
					const trip = results[i];
					trip.set("homeAtCreation",loc);
					trip.save(null,{ useMasterKey: true }).then(function (objects) {
                    			response.success("trip saved.");
// 								console.log("success: homeAtCreation updated");
                  			}, function (error) {
                  				response.error("Error, trip not saved: "+error.message);
// 								console.log("homeAt Creation update failed");
               	 			 });
		  
		  
        },
        error: function(error) {
			response.error(error.message);
//             console.log("failed");
        }
    });
});



// Parse.Cloud.define("copyColumnLatitudeToLatitudeString", function(request, response) {
// 
// 	var copyQuery = new Parse.Query("Activity");
// 	copyQuery.limit(10);
// 	copyQuery.exists("latitude");
// 	copyQuery.doesNotExist("latitudeString");
// 	var user = request.user;
// 	
//     copyQuery.find({
//         success: function(results) {
//            for (var i = 0; i < results.length; i++) {
// 					var object = results[i];
// 					var lat = results[i].get("latitude");
// 					object.set("latitudeString",lat.toString());
// 					object.save(null,{ useMasterKey: true }).then(function (objects) {
//                     			response.success("All done.");
// 								console.log("success");
//                   			}, function (error) {
//                   				response.error("Error, sorry: "+error.message);
// 								console.log("failed");
//                	 			 });
// 		  }
//         },
//         error: function(error) {
// 			response.error(error.message);
//             console.log("failed");
//         }
//     });
// 
// });
// 
// Parse.Cloud.define("copyColumnLongitudeToLongitudeString", function(request, response) {
// 
// 	var copyQuery = new Parse.Query("Activity");
// 	copyQuery.limit(10);
// 	copyQuery.exists("longitude");
// 	copyQuery.doesNotExist("longitudeString");
// 	var user = request.user;
// 	
//     copyQuery.find({
//         success: function(results) {
//            for (var i = 0; i < results.length; i++) {
// 					var object = results[i];
// 					var long = results[i].get("longitude");
// 					object.set("longitudeString",long.toString());
// 					object.save(null,{ useMasterKey: true }).then(function (objects) {
//                     			response.success("All done.");
// 								console.log("success");
//                   			}, function (error) {
//                   				response.error("Error, sorry: "+error.message);
// 								console.log("failed");
//                	 			 });
// 		  }
//         },
//         error: function(error) {
// 			response.error(error.message);
//             console.log("failed");
//         }
//     });
// 
// });
// 
// Parse.Cloud.define("copyColumnsForLatAndLong", function(request, response) {
// 
// 	var copyQuery = new Parse.Query("Activity");
// 	copyQuery.limit(1000);
// 	copyQuery.exists("latitude");
// 	copyQuery.exists("longitude");
// 	copyQuery.doesNotExist("latitudeString");
// 	copyQuery.doesNotExist("longitudeString");
// 	var user = request.user;
// 	
//     copyQuery.find({
//         success: function(results) {
//            for (var i = 0; i < results.length; i++) {
// 					var object = results[i];
// 					var lat = results[i].get("latitude");
// 					var long = results[i].get("longitude");
// 					object.set("latitudeString",lat.toString());
// 					object.set("longitudeString",long.toString());
// 					object.save(null,{ useMasterKey: true }).then(function (objects) {
//                     			response.success("All done.");
// 								console.log("success");
//                   			}, function (error) {
//                   				response.error("Error, sorry: "+error.message);
// 								console.log("failed");
//                	 			 });
// 		  }
//         },
//         error: function(error) {
// 			response.error(error.message);
//             console.log("failed");
//         }
//     });
// 
// });
