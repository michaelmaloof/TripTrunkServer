/**
 * A User Likes a Photo
 *
 * Params:
 * photoId
 */

Parse.Cloud.define('Activity.Like', function(request, response) {
  const user = request.user;
  const sessionToken = user.getSessionToken();

  const photoId = request.params.photoId;

  const query = new Parse.Query('Photo');
  query.include('trip', 'trip.publicTripDetail');

  query.get(photoId, { sessionToken: sessionToken })
  .then(photo => {

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

    return Promise.all([
      activity.save(null, {sessionToken: sessionToken}),
      photo.save(null, {useMasterKey: true}),
      publicTripDetail.save(null, {useMasterKey: true}),
    ]);
  })
  .then(activity => {
    response.success('LikePhoto Success');
  })
  .catch(err => {
    response.error(err);
  });
});
