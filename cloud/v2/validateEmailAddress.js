/**
 * check for unique email
 *
 * Params:
 * emailaddress (string)
 */

Parse.Cloud.define('ValidateEmailAddress', function(request, response) {
	const emailaddress = request.params.emailaddress;

	var query = new Parse.Query(Parse.User);
	query.equalTo("email",emailaddress);
	query.find({
		success: function(results){
			if(results.length === 0){
    			response.success("Email Address available.");
			}else{
    			response.error("Email Address unavailable.");
			}
	},
        error: function () {
		response.error("Query failed. Unable to check unique for email address.");
		}
	});
});
