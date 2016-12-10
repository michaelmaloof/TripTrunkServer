const _ = require('underscore');


/**
 * BEFORE SAVE
 */
Parse.Cloud.beforeSave('Photo', (request, response) => {
  if (request.object.existed()) return response.success();

  const user = request.user;
  const sessionToken = user.getSessionToken();
  const photo = request.object;

  return photo.get('trip')
  .fetch({sessionToken: sessionToken})
  .then(trip => {

    if (!trip) {
      // Trip Doesn't Exist??
      throw new Error('Error saving Photo - Trip does not exist!');
    }

    // Set the correct permissions - we ignore what the App sent because it's probably wrong.

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
      acl.setRoleReadAccess(friendsRole, true);
    }

    // Set the ACL
    photo.setACL(acl);

    return response.success(photo);
  })
  .catch(error => {
    return response.error('Error Saving Photo: %s', error.message);
  });
});


/**
 * AFTER SAVE
 *
 * Creates an Activity for addedPhoto and updates the Trip's mostRecentPhoto
 */
Parse.Cloud.afterSave('Photo', function(request) {

  if (request.object.existed()) return;

  const photo = request.object;

  const trip = request.object.get('trip');

  // Ensure the trip and user objects exist, otherwise we don't want to send notifications.
  if (!trip) {
    throw new Error('Undefined trip. Skipping push for Photo: ' + request.object.id);
  }

  const user = request.object.get('user');
  if (!user) {
    throw new Error('Undefined user adding the photo. Skipping push for Photo: ' + request.object.id);
  }

  trip.fetch({useMasterKey: true}) // Use the masterKey because the person may be a member - meaning only Read permissions
  .then(trip =>{
    // Update the Trip object
    trip.set('mostRecentPhoto', new Date());
    return trip.save(null, {useMasterKey: true});
  })
  .then(trip => {

    // Create an Activity for addedPhoto
    const Activity = Parse.Object.extend('Activity');
    const activity = new Activity();
    activity.set('type', 'addedPhoto');
    activity.set('photo', request.object);
    activity.set('trip', trip);
    activity.set('fromUser', request.user);
    activity.set('toUser', trip.get('creator'));

    // Set the Activity ACL to the same as the Photo so people who can't see the photo won't see the ACL.
    activity.setACL(request.object.getACL());

    // If the Photo has a caption, we want to add it as the first comment also.
/*
This was added by Matt Schoch 9/15/2016, but not used.
This will add the Photo's Caption comment when uploading a photo -- and it works -- but due to
how mentions currently work we have to add the Photo Caption Comment object from the iOS side.
TODO: if mentions get rewritten onto the server, then uncomment this and remove the addComment
functionaly from the iOS photoUpload code.

    if (photo.get('caption') && photo.get('caption') !== '') {
      const comment = new Activity();
      comment.set('type', 'comment');
      comment.set('photo', photo);
      comment.set('fromUser', request.user);
      comment.set('toUser', photo.get('user'));
      comment.set('trip', trip);
      comment.set('content', photo.get('caption'));
      comment.set('isCaption', true);
      // ACL is the same as the Photo - that should be read/write access for the owner
      comment.setACL(request.object.getACL());

      // TODO: in Activity afterSave, check for Mentions in Comments.

      return Promise.all([
        comment.save(null, {sessionToken: request.user.getSessionToken()}),
        activity.save(null, {sessionToken: request.user.getSessionToken()}),
      ]);
    }
*/
    return activity.save(null, {sessionToken: request.user.getSessionToken()});
  });

});

function deleteFromCloudinary(photo) {
  console.log('deleting photo...');
  const index = photo.get('imageUrl').lastIndexOf('/') + 1;
  const filename = photo.get('imageUrl').substr(index);
  const publicId = filename.substr(0, filename.lastIndexOf('.')) || filename;

  const url = `https://334349235853935:YZoImSo-gkdMtZPH3OJdZEOvifo@api.cloudinary.com/v1_1/triptrunk/resources/image/upload?public_ids=${publicId}`;

  return Parse.Cloud.httpRequest({
    method: 'DELETE',
    url: url,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  });
}

/**
 * BEFORE DELETE
 *
 * Before Deleting a Photo, send a DELETE request to Cloudinary as well.
 */
Parse.Cloud.beforeDelete('Photo', function(request, response) {

  if (request.object.get('imageUrl')) {
    deleteFromCloudinary(request.object)
    .then(httpResponse => {
      console.log(httpResponse.text);
    })
    .catch(httpResponse => {
      response.error('Error ' + error.code + ' : ' + error.message + ' when deleting photo from Cloudinary.');
    });
  }
  // Continue with delete no matter what
  response.success();

});

/**
 * Removes a User's Photos from a Trip
 *
 * @param  tripId
 * @param  user
 */
Parse.Cloud.define('RemovePhotosForUser', function(request, response) {
  const sessionToken = request.user.getSessionToken();
  console.log('removing user photos from the trip');
  const Trip = Parse.Object.extend('Trip');
  const trip = new Trip();
  trip.id = request.params.tripId;

  const user = request.params.user;

  const query = new Parse.Query('Photo');
  query.equalTo('trip', trip);
  query.equalTo('user', user);
  query.find({sessionToken: sessionToken})
  .then(photos => {
    if (photos.length > 0) {
      // Remove the photo objects, which will trigger a Cloudinary delete through the beforeDelete hook.
      return Parse.Object.destroyAll(photos, {sessionToken: sessionToken});
    }
    return Promise.resolve();
  })
  .then(res => {
    response.success();
  })
  .catch(error => {
    response.error(error);
  });
});

