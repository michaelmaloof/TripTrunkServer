/**
 * check for unique username
 *
 * Params:
 * username (string)
 */

Parse.Cloud.define('ValidateUsername', function(request, response) {
	const username = request.params.username;

	var query = new Parse.Query(Parse.User);
	query.equalTo("username",username);
	query.find({
		success: function(results){
			if(results.length === 0){
    			response.success("Username available.");
			}else{
    			response.error("Username unavailable.");
			}
	},
        error: function () {
		response.error("Query failed. Unable to check unique for username.");
		}
	});
});
