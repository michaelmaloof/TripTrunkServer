const _ = require('underscore');


function sendNotification(request) {
  /*
   * PUSH NOTIFICATIONS
   */

  // Create the query that finds all members of a trip, except the person who just uploaded the photo
  const memberQuery = new Parse.Query('Activity');
  memberQuery.equalTo('trip', request.object.get('trip'));
  memberQuery.equalTo('type', 'addToTrip');
  memberQuery.notEqualTo('toUser', request.user); // creators are members as well, so this line prevents whoever is uploading the photo from getting a push notification for their own photo

  // Find the Installations for all trip members so we know where to send the notification
  const installQuery = new Parse.Query(Parse.Installation);
  installQuery.matchesKeyInQuery('user', 'toUser', memberQuery);

  let pushMessage = request.user.get('username') + ' added';

  if (request.object.get('photoCount') > 1 ) {

    pushMessage = pushMessage + ' ' + request.object.get('photoCount') + ' photos to the trunk: ' + request.object.get('tripName');
  }
  else {
    pushMessage = pushMessage + ' a photo to the trunk: ' + request.object.get('tripName');
  }

  // Clip message if it's longer than the APNs limit
  if (pushMessage.length > 140) {
    pushMessage = message.substring(0, 140);
  }

  const payload = {
    alert: pushMessage, // Set our alert message.
    badge: 'Increment',
    p: 'p', // Payload Type: Photo
    tid: request.object.get('trip').id, // Trip Id
    pid: request.object.id, // Photo Id
  };

  // Send the push notification to ALL the users!!
  Parse.Push.send({
    where: installQuery, // Set our Installation query.
    data: payload,
  }, {
    useMasterKey: true,
  })
  .then(function() {
    // Push was successful
    console.log('Sent push.');
  })
  .catch(err => {
    console.error(err);
  });
}

Parse.Cloud.afterSave('PushNotification', function(request) {
  /* THIS IS A HACK
   * Because of issues grouping photosAdded notifications (Matt added 5 photos, instead of Matt added a photo, 5 times)
   * We are just saving an object that will notifiy the server to send the notification
   * Eventually this should be done properly and the client shouldn't get any say in sending notifications, CloudCode should handle it all.
   *
   * 8/8/2016 - mattschoch
   * This is used to send a notification whenever a PushNotificaiton object is saved to parse. This lets the client create and trigger notifications to other users.
   */
  sendNotification(request);
});


// Build the message for the Push Notification
function alertMessage(activity, user) {
  let message = '';

  const hasUser = user.get('username') && user.get('name');

  switch (activity.get('type')) {
  case 'comment':
    if (hasUser) {
      message = `${user.get('username')} said: ${activity.get('content').trim()}`;
    }
    else {
      message = 'Someone commented on your photo.';
    }
    break;
  case 'mention':

    const mentionType = activity.get('isCaption') ? 'photo caption!' : 'comment!';

    if (hasUser) {
      message = `${user.get('username')} mentioned you in a ${mentionType}`;
    }
    else {
      message = `Someone mentioned you in a ${mentionType}`;
    }
    break;
  case 'like':
    if (hasUser) {
      message = `${user.get('username')} likes your photo.`;
    }
    else {
      message = 'Someone likes your photo.';
    }
    break;
  case 'follow':
    if (hasUser) {
      message = `${user.get('name')} (@${user.get('username')}) started following you.`;
    }
    else {
      message = 'You have a new follower.';
    }
    break;
  case 'addToTrip':
    if (hasUser) {
      if (activity.get('trip').get('isPrivate')) {
        message = `${request.user.get('username')} added you to a private trunk.`;
      }
      else {
        message = `${request.user.get('username')} added you to a trunk.`;
      }
    }
    else {
      message = 'You were added to a trunk.';
    }
    break;
  case 'pending_follow':
    if (hasUser) {
      message = `${request.user.get('name')} (@${request.user.get('username')}) requested to follow you.`;
    }
    else {
      message = 'You have a new follower request.';
    }
    break;
  default:
    return '';
  }

  // Trim our message to 140 characters.
  if (message.length > 140) {
    message = message.substring(0, 140);
  }

  return message;
}

module.exports = {

  // Create the payload for the push notification for an activity
  alertPayload: function(activity, user) {

    if (activity.get('type') === 'comment') {
      return {
        'content-available': 1,
        alert: alertMessage(activity, user), // Set our alert message.
        badge: 'Increment',
        p: 'a', // Payload Type: Activity
        t: 'c', // Activity Type: Comment
        fu: activity.get('fromUser').id, // From User
        pid: activity.get('photo').id, // Photo Id
      };
    }
    else if (activity.get('type') === 'mention') {
      return {
        'content-available': 1,
        alert: alertMessage(activity, user), // Set our alert message.
        badge: 'Increment',
        p: 'a', // Payload Type: Activity
        t: 'm', // Activity Type: Mention
        fu: activity.get('fromUser').id, // From User
        pid: activity.get('photo').id, // Photo Id
      };
    }
    else if (activity.get('type') === 'like') {
      return {
        'content-available': 1,
        alert: alertMessage(activity, user), // Set our alert message.
        badge: 'Increment',
        p: 'a', // Payload Type: Activity
        t: 'l', // Activity Type: Like
        fu: activity.get('fromUser').id, // From User
        pid: activity.get('photo').id, // Photo Id
      };
    }
    else if (activity.get('type') === 'follow') {
      return {
        'content-available': 1,
        alert: alertMessage(activity, user), // Set our alert message.
        badge: 'Increment',
        p: 'a', // Payload Type: Activity
        t: 'f', // Activity Type: Follow
        fu: activity.get('fromUser').id, // From User
      };
    }
    else if (activity.get('type') === 'addToTrip') {
      return {
        'content-available': 1,
        alert: alertMessage(activity, user),
        badge: 'Increment',
        p: 'a', // Payload Type: Activity
        t: 'a', // Activity Type: addToTrip
        tid: activity.get('trip').id, // Trip Id
      };
    }
    else if (activity.get('type') === 'pending_follow') {
      return {
        'content-available': 1,
        alert: alertMessage(activity, user), // Set our alert message.
        badge: 'Increment',
        p: 'a', // Payload Type: Activity
        t: 'f', // Activity Type: Pending_Follow
        fu: activity.get('fromUser').id, // From User
      };
    }

    return {};
  },
};
