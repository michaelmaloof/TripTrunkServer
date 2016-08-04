const _ = require('underscore');


function sendNotification(request) {
  Parse.Cloud.useMasterKey();

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
    // badge: 'Increment',
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
  sendNotification(request);
});

