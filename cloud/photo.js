const _ = require('underscore');


Parse.Cloud.beforeSave('Photo', (request, response) => {

  const user = request.user;
  const sessionToken = user.getSessionToken();
  const photo = request.object;

  return photo.get('trip')
  .fetch({sessionToken: sessionToken})
  .then(trip => {
    // Set the correct permissions - we don't care what the App sent because it's probably wrong.

    // Only User and Trip Creator get Write Permissions
    const acl = new Parse.ACL(user);
    acl.setReadAccess(trip.get('creator'), true);
    acl.setWriteAccess(trip.get('creator'), true);
    // Trunk members always get access
    const trunkRole = `trunkMembersOf_${photo.get('trip').id}`;

    acl.setRoleReadAccess(trunkRole, true);

    // We only have Public Read on a photo if the User AND the Trip are both NOT PRIVATE
    if (!trip.get('isPrivate') && !user.get('private')) {
      acl.setPublicReadAccess(true);
    }

    // Public Trunk - allow Friends to see it, doesn't matter if the user is private.
    // But this could be a private User, so we're not setting Public Read here.
    if (!trip.get('isPrivate')) {
      const friendsRole = `friendsOf_${user.id}`;
      acl.setReadAccess(friendsRole, true);
    }

    photo.setACL(acl);
    // Continue saving.
    return response.success(photo);
  })
  .catch(error => {
    return response.error('Error ensuring Photo Permissions: %s', error.message);
  });
});


/**
 * AFTER SAVE
 */
Parse.Cloud.afterSave('Photo', function(request) {

  // Only send push notifications for new activities
  if (request.object.existed()) {
    return;
  }

  const trip = request.object.get('trip');

// Ensure the trip and user objects exist, otherwise we don't want to send notifications.
  if (!trip) {
    throw new Error('Undefined trip. Skipping push for Photo: ' + request.object.id);
  }

  const user = request.object.get('user');
  if (!user) {
    throw new Error('Undefined user adding the photo. Skipping push for Photo: ' + request.object.id);
  }

  trip.fetch({useMasterKey: true})
  .then(trip =>{
  /*
   * Update the Trip object
   */
    trip.set('mostRecentPhoto', new Date());
    return trip.save(null, {useMasterKey: true});
  })
  .then(trip => {

    const creator = trip.get('creator');

    // Create an Activity for addedPhoto
    const Activity = Parse.Object.extend('Activity');
    const activity = new Activity();
    activity.set('type', 'addedPhoto');
    activity.set('photo', request.object);
    activity.set('trip', trip);
    activity.set('fromUser', request.user);
    activity.set('toUser', creator);

    // Set the Activity ACL to the same as the Photo so people who can't see the photo won't see the ACL.
    activity.setACL(request.object.getACL());

    return activity.save();

  });

});


/**
 * BEFORE DELETE
 * 
 * Before Deleting a Photo, send a DELETE request to Cloudinary as well.
 */
Parse.Cloud.beforeDelete('Photo', function(request, response) {

  if (request.object.get("imageUrl")) {

    var index = request.object.get("imageUrl").lastIndexOf("/") + 1;
    var filename = request.object.get("imageUrl").substr(index);
    var publicId = filename.substr(0, filename.lastIndexOf('.')) || filename;

    var url = "https://334349235853935:YZoImSo-gkdMtZPH3OJdZEOvifo@api.cloudinary.com/v1_1/triptrunk/resources/image/upload?public_ids=";

    url = url + publicId;

    Parse.Cloud.httpRequest({
      method: 'DELETE',
      url: url,
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      }
    }).then(function(httpResponse) {
        console.log(httpResponse.text);
    }, function(httpResponse) {
      response.error("Error " + error.code + " : " + error.message + " when deleting photo from Cloudinary.");
    });

  };
  // Continue with delete no matter what
  response.success();

});