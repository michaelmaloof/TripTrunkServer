/*
 * This file is just for including all of the files needed in the app.
 */

require('./installation.js');
require('./activity.js');
require('./photo.js');
require('./user.js');
require('./report.js');
require('./block.js');
require('./trunk.js');
require('./updateFriendRoles.js');
require('./pushNotifications.js');
require('./homeMapAndList.js');
// require('./databaseFunctions.js');

/*
TODO: timeouts happen on Follows.
Instead of using the beforeSave Activity hook, we should call a cloud Function instead, because that gives us like 10 seconds.
The other option, is to not worry about adding roles on Follows, instead just add all Followers to the friendsOf_ role when a
user switchings to a private account.
 */