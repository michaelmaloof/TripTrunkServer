'use strict';

const _ = require('underscore');

class TTUser extends Parse.User {
  constructor(id) {
    super(id);
    this.id = id;
  }

  friends() {
    const query = new Parse.Query('Activity');
    query.equalTo('type', 'follow');
    query.equalTo('fromUser', this);
    query.exists('fromUser');
    query.exists('toUser');
    // TODO: Do we need a limit()?
    console.log('getting following for %s', this.id);
    // Get the Activities
    return query.find()
    .then(activities => {

      // Return just the ids for the users they follow
      this.following = activities.map(activity => {
        return activity.get('user');
      });
      console.log(this.following);
      return this.following;
    });
  }

}

module.exports = TTUser;
