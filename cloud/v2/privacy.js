const _ = require('underscore');


/**
 * 8/23/2016
 * mattschoch
 *
 * This is a Temporary one-time function.
 * It will query ALL private trunks and ensure they have the trunkMembers Role set,
 * and then query all of the photos for the trunks and the addedPhoto activities and set the same role,
 * and make sure they do not have Public Read on them.
 *
 * It is a major update, so make sure it works before doing it! It has been tested on "mattschoch" and "applejacks" and appears to
 */

function updatePrivacy(trunk) {
  const trunkACL = trunk.getACL();

  // Make sure we have the TrunkMembers Role read/write
  const trunkRole = `trunkMembersOf_${trunk.id}`;
  trunkACL.setRoleReadAccess(trunkRole, true);
  trunkACL.setRoleWriteAccess(trunkRole, true);

  // TODO: Do we need to add every user to the ACL also? I don't think so.

  return trunk.save(null, {useMasterKey: true})
  .then(trunk => {
    const photoQuery = new Parse.Query('Photo');
    photoQuery.equalTo('trip', trunk);
    return photoQuery.find({useMasterKey: true});
  })
  .then(photos => {
    // Got all the Private Photos.
    return Promise.all(photos.map(photo => {
      // Give read/write to the photo owner and trunk creator
      const photoACL = new Parse.ACL(photo.get('user'));
      photoACL.setReadAccess(trunk.get('creator'), true);
      photoACL.setWriteAccess(trunk.get('creator'), true);

      // Turn off public read on the photo
      photoACL.setPublicReadAccess(false);

      // Add read for the trunk members
      photoACL.setRoleReadAccess(trunkRole, true);

      photo.setACL(photoACL);
      return photo.save(null, {useMasterKey: true})
      .then(photo => {
        const aQuery = new Parse.Query('Activity');
        aQuery.equalTo('type', 'addedPhoto');
        aQuery.equalTo('photo', photo);
        aQuery.find({useMasterKey: true});
      })
      .then(photo => {
        //Set the Video ACL the same as the photo
        console.log("Setting ACL for video");
        const video = photo.get('video');
        if(video){
            video.setACL(photo.getACL());
            console.log("Video ACL set successfully");
        }else{
            console.log("Video ACL not set, Must be a photo.");
        }
      })
      .then(activities => {
        if (!activities) {
          console.error('NO ACTIVITIES FOUND');
          return Promise.resolve();
        }
        else if (activities.length !== 1) {
          console.error('OH NO! We have multiple addedPhoto activities for photo');
          throw new Error('Too Many Activites Found');
        }
        const activity = activities[0];

        // The activity and photo get the same ACL
        activity.setACL(photoACL);
        return activity.save(null, {useMasterKey: true});
      });
    }));
  })
  .catch(error => {
    console.error(error);
  });

}

// setTimeout(function() {
//   const tripQuery = new Parse.Query('Trip');
//   tripQuery.equalTo('isPrivate', true);
//   tripQuery.equalTo('creator', {
//     __type: 'Pointer',
//     className: '_User',
//     objectId: 'r7WkrlEERY',
//   });
//   tripQuery.find({useMasterKey: true})
//   .then(trips => {
//     console.log('Found %d Private Trips', trips.length);

//     return Promise.all(trips.map(updatePrivacy));
//   });
// }, 1000);


