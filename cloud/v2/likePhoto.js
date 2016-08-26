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
  query.include('trip');

  query.get(photoId, { sessionToken: sessionToken })
  .then(photo => {
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
    return activity.save(null, {sessionToken: sessionToken});

    // TODO: Increment Like Count 

  })
  .then(activity => {
    response.success(activity);
  })
  .catch(err => {
    response.error(err);
  });
});
