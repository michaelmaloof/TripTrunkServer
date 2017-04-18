/**
 * Increment view count for video
 *
 * Params:
 * photoId
 * count
 */

Parse.Cloud.define('IncrementVideoViewCount', function(request, response) {
  const user = request.user;
  const sessionToken = request.user.getSessionToken();

  const photoId = request.params.photoId;
  const count = request.params.count;

  const query = new Parse.Query('Photo');
  query.include('trip', 'trip.publicTripDetail');

  query.get(photoId, { sessionToken: sessionToken })
  .then(photo => {
    console.log('INCREMENTING VIDEO VIEWS: %s', photoId);
    // Increment the video's viewCount - Note, this will need masterKey.
    photo.increment('viewCount',count);

    // Because Photo is saved, we must useMasterKey.
    return photo.save(null, {useMasterKey: true});
  })
   .then(res => {
    response.success('Video Increment Success');
  })
  .catch(err => {
    response.error(err);
  });
});
