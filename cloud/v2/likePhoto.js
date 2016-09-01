/**
 * A User Likes a Photo
 *
 * Params:
 * photoId
 */

Parse.Cloud.define('Activity.Like', function(request, response) {
  const user = request.user;
  const sessionToken = request.user.getSessionToken();

  const photoId = request.params.photoId;

  const query = new Parse.Query('Photo');
  query.include('trip', 'trip.publicTripDetail');

  query.get(photoId, { sessionToken: sessionToken })
  .then(photo => {
    console.log('LIKING PHOTO %s', photoId);
    // Increment the photo's likeCount - Note, this will need masterKey.
    photo.increment('likes');
    const publicTripDetail = photo.get('trip').get('publicTripDetail');
    publicTripDetail.increment('totalLikes');

    // Create a new Activity for liking the photo
    const Activity = Parse.Object.extend('Activity');
    const activity = new Activity();
    activity.set('type', 'like');
    activity.set('fromUser', user);
    activity.set('photo', photo);
    activity.set('toUser', photo.get('user'));
    activity.set('trip', photo.get('trip'));

    // Set the correct permission
    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(true); // Everyone can see the likes
    acl.setWriteAccess(photo.get('user').id, true);
    acl.setWriteAccess(photo.get('trip').get('creator').id, true);
    activity.setACL(acl);

    // Save the activity
    // This will also cause the changed linked-objects to save, so Photo and publicTripDetail will be saved
    // Because Photo is saved, we must useMasterKey.
    return activity.save(null, {useMasterKey: true});
  })
  .then(activity => {
    response.success('LikePhoto Success');
  })
  .catch(err => {
    response.error(err);
  });
});
