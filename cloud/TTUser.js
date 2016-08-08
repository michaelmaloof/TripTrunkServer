'use strict';

const _ = require('underscore');

class TTUser extends Parse.User {
  constructor(id) {
    super(id);
  }

  friends() {
    const query = new Parse.Query('Activity');
    query.equalTo('type', 'follow');
    query.equalTo('fromUser', this.id);
    query.exists('fromUser');
    query.exists('toUser');
    // TODO: Do we need a limit()?

    // Get the Activities
    return query.find()
    .then(activities => {

      // Return just the ids for the users they follow
      this.following = _.pluck(activities, 'id');
      return this.following;
    });
  }

}

module.exports = TTUser;
