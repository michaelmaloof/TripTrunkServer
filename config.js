const env         = process.env.NODE_ENV || 'development';

const config = {

  development: {
    port: process.env.PORT || 3000,
    databaseURI: 'mongodb://TTAdmin:Bucks4136@ds023684.mlab.com:23684/triptrunk-dev',
    appId: 'hgAFtnU5haxHqyFnupsASx6MwZmEQs0wY0E43uwI',
    masterKey: 'YEZtCiL9kSs1rvrAQBSaULl5JyXM4M5HhHTF24LZ',
  },


  production: {
    port: process.env.PORT || 3000,
    databaseURI: 'mongodb://ttserver:TripTrunk33@ds153365-a0.mlab.com:53365,ds153365-a1.mlab.com:53365/triptrunk?replicaSet=rs-ds153365',
    appId: 'hgAFtnU5haxHqyFnupsASx6MwZmEQs0wY0E43uwI',
    masterKey: 'YEZtCiL9kSs1rvrAQBSaULl5JyXM4M5HhHTF24LZ',
    serverUrl: 'https://api.triptrunkapp.com/parse',
  },

};

module.exports = config[env];
