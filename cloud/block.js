// TODO: 8/8/2016 - mattschoch
// Blocking users is rudimentary, and it uses masterkey which may cause issues now.
// Now that we don't have to be limited by parse timeouts, we should actually 1) unfollow users if necessary, 2) add to blocked list


/**
 * BEFORE SAVE
 * Handles a lot of the actual logic of blocking a user - using the masterKey to force them to unfollow, etc.
 */
// TODO: 8/23/2016 - ms - update this beforeSave for self-hosted server
Parse.Cloud.beforeSave('Block', (request, response) => {
  Parse.Cloud.useMasterKey(); // User master key because we want to update the Trip's mostRecentPhoto regardless of the ACL.
  const currentUser = request.user;
  const blockedockedUser = request.object.get('blockedUser');

  if (!currentUser || !blockedUser) {
    return response.error('Not a valid user when trying to Block');
  }
  else if (currentUser.id === blockedUser.id) {
    return response.error('Cannot block yourself.');
  }

  // Make sure the user wasn't already blocked.

  const q = new Parse.Query('Block');
  q.equalTo('fromUser', currentUser);
  q.equalTo('blockedUser', blockedUser);

  q.count({
    success: function(count) {
      if (count > 0) {
        return response.success();
      }
      // there's no existing blocked user, so move forward.

      /*
       * Force the Blocked user to unfollow.
       */
      // If the blocked user is following our user, we want to force the unfollow
      const followQuery = new Parse.Query('Activity');
      followQuery.equalTo('fromUser', blockedUser);
      followQuery.equalTo('toUser', currentUser);
      followQuery.equalTo('type', 'follow');

      // If the user is following the user they want to block, we should unfollow that person
      const followingQuery = new Parse.Query('Activity');
      followingQuery.equalTo('fromUser', currentUser);
      followingQuery.equalTo('toUser', blockedUser);
      followingQuery.equalTo('type', 'follow');

      const query = Parse.Query.or(followQuery, followingQuery);
      query.find({
        success: function(results) {
          Parse.Object.destroyAll(results);
          return response.success();
        },
        error: function(error) {
          // ERROR unfollowing
          return response.error('Failed to unfollow');
        },
      });

      return true;
    },
    error: function(error) {
      return response.error('Failed to see if Blocked User already exists. User not blocked.');
    },
  });

});


module.exports = {

  /**
   * Tells if the User has blocked another User
   * @param  {String} user         User who may have done the blocking
   * @param  {String} blockedUser  User to check if they are blocked
   * @param  {token} sessionToken  Session Token for permissions
   * @return {BOOL}                Is the user blocked?
   */
  allowed: function(user, blockedUser, sessionToken) {
    const blockQuery = new Parse.Query('Block');
    blockQuery.equalTo('blockedUser', blockedUser);
    blockQuery.equalTo('fromUser', user);

    return blockQuery.find({sessionToken: sessionToken})
    .then(blocked => {
      if (blocked.length > 0) {
        return Parse.Promise.error('User is blocked from performing this action');
      }
      return true;
    });
  },
};
