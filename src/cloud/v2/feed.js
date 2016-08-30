const _ = require('underscore');
/*
@{
   @"objectIds" : followingObjectIds,
   @"activityObjectIds" : self.objid,
   @"createdDate" : photo.createdAt ? photo.createdAt : dateString,
   @"isRefresh" : [NSString stringWithFormat:@"%@",isRefresh ? @"YES" : @"NO"],
   @"userTrips" : self.userTrips
 };


 Structure of response should be:
// const photo = {
//   photoId,
//   imageUrl,
//   caption,
//   updatedAt,
//   likes,
//   user: {
//     id,
//     username,
//     name,
//     profilePicUrl,
//   },
//   trip: {
//     id,
//     name,
//     city,
//     country,
//     isPrivate,
//     photos: [{
//       id,
//       imageUrl,
//     }],
//   },
// };

 */


class FeedPhoto {
  constructor(photo) {
    this.id = photo.id;
    this.imageUrl = photo.get('imageUrl');
    this.caption = photo.get('caption');
    this.updatedAt = photo.get('updatedAt');
    this.likes = photo.get('likes');
    this.user = {
      id: photo.get('user').id,
      username: photo.get('user').get('username'),
      name: photo.get('user').get('name'),
      profilePicUrl: photo.get('user').get('profilePicUrl'),
    };
    this.trip = {
      id: photo.get('trip').id,
      name: photo.get('trip').get('name'),
      city: photo.get('trip').get('city'),
      country: photo.get('trip').get('country'),
      isPrivate: photo.get('trip').get('isPrivate'),
    };
  }

  setTripPhotos(photos) {
    console.log('setting trip photos');
    this.trip.photos = _.map(photos, photo => {
      return {
        id: photo.id,
        imageUrl: photo.get('imageUrl'),
      };
    }).slice(0, 5);
  }
}


/**
 * 8/23/2016 - MS
 * In Progress of cleaning up the queryForNewFeed function.
 */


function following(userId) {
  const query = new Parse.Query('Activity');
  query.equalTo('type', 'follow');
  query.equalTo('fromUser', {
    __type: 'Pointer',
    className: '_User',
    objectId: userId,
  });
  query.exists('fromUser');
  query.exists('toUser');
  // TODO: Do we need a limit()?
  // Get the Activities
  return query.find()
  .then(activities => {

    // Return just the ids for the users they follow
    const followees = activities.map(activity => {
      return activity.get('toUser');
    });
    return followees;
  });
}

Parse.Cloud.define('Feed.find', function(request, response) {

  /*
  Things to include:
  Photos of Followees, Photos of trunk participation, include trip, photo, user details.
   */

  const user = request.user;
  const sessionToken = user.getSessionToken();
  const skip = request.params.skip ? request.params.limit : 0;
  const limit = request.params.limit ? request.params.limit : 20;
  following(user.id)
  .then(following => {
    console.log('Found %d followings', following.length);

    const query = new Parse.Query('Photo');
    console.log(following);
    query.containedIn('user', following);
    query.descending('updatedAt');
    query.limit(limit);
    query.skip(skip);
    query.include('user');
    query.include('trip');

    return query.find({sessionToken});
  })
  .then(photos => {
    console.log('Found %d photos', photos.length);

    // We have all of the Photos, now we need to build our correct response object & query for the trip's other photos.

    const uniqueTrips = _.chain(photos).map(photo => {
      return photo.get('trip');
    })
    .uniq('id')
    .value();
    console.log('Found %d unique trips', uniqueTrips.length);
    const query = new Parse.Query('Photo');
    query.containedIn('trip', uniqueTrips);
    query.addDescending(['trip', 'updatedAt']);
    // TODO: Ensure uniqueTrips is correct, and that tripPhotos works.
    return query.find({sessionToken})
    .then(tripPhotos => {
      console.log('Found %d tripPhotos', tripPhotos.length);

      const grouped = _.groupBy(tripPhotos, tripPhoto => {
        return tripPhoto.get('trip').id;
      });
      console.log(grouped);

      // We have an array here of all the other photos from all the trips in this query
      // Map the photos array into the response object & pull out the tripPhotos needed
      return photos.map(photo => {
        const p = new FeedPhoto(photo);
        // Get the tripPhotos that are for the same Trip as this Photo.
        p.setTripPhotos(grouped[photo.get('trip').id]);
        return new Parse.Object('FeedPhoto', p);
      });
    });
  })
  .then(res => {
    console.log('Got to the end');
    console.log(res);
    _.each(res, r => {
      console.log(r.get('imageUrl'));
    });
    response.success(res);
  })
  .catch(error => {
    console.error(error);
    response.error(error);
  });

});
