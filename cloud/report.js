
const mailgun = require('mailgun-js')({
  apiKey: 'key-612b759d61c51fcb92c4cdbe10b36d2e',
  domain: 'sandbox259dcac5ce094ffcbce8542ba22fda37.mailgun.org'});

/**
 * After a ReportPhoto object is saved,
 * Send an email to Austin to let him know there's a photo waiting for review.
 */
Parse.Cloud.afterSave('ReportPhoto', (request) => {

  const data = {
    to: 'austinbarnard@triptrunkapp.com',
    from: 'support@triptrunkapp.com',
    subject: 'A TripTrunk Photo Was Flagged',
    text: 'A photo was reported for: ' + request.object.get('reason'),
  };

  mailgun.messages().send(data, (error, body) => {
    if (error) {
      console.log(error);
    }
  });

});

