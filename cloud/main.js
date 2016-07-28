/*
 * This file is just for including all of the files needed in the app.
 */

require('/var/app/current/cloud/installation.js');
require('/var/app/current/cloud/activity.js');
require('/var/app/current/cloud/photo.js');
require('/var/app/current/cloud/user.js');
require('/var/app/current/cloud/report.js');
require('/var/app/current/cloud/block.js');
require('/var/app/current/cloud/trunk.js');
require('/var/app/current/cloud/updateFriendRoles.js');
require('/var/app/current/cloud/pushNotifications.js');
require('/var/app/current/cloud/homeMapAndList.js');
// require('/var/app/current/cloud/databaseFunctions.js');

/*
TODO: timeouts happen on Follows.
Instead of using the beforeSave Activity hook, we should call a cloud Function instead, because that gives us like 10 seconds.
The other option, is to not worry about adding roles on Follows, instead just add all Followers to the friendsOf_ role when a
user switchings to a private account.
 */