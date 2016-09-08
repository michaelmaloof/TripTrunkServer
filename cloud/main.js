const glob = require('glob');
const config = require('../config');

/*
 * This file is just for including all of the files needed in the app.
 */

const files = glob.sync(config.root + '/cloud/v2/**/*.js');
files.forEach((file) => {
  require(file);
});

// Old Non-v2 files, included manually
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
require('./addToTrip');
// require('./databaseFunctions.js');
