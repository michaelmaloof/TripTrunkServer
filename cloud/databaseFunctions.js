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
