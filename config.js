const env         = process.env.NODE_ENV || 'development';

const config = {

  development: {
    port: process.env.PORT || 3000,
    databaseURI: 'mongodb://TTAdmin:Bucks4136@ds023684.mlab.com:23684/triptrunk-dev',
  },


  production: {
    port: process.env.PORT || 3000,
    databaseURI: 'mongodb://ttserver:TripTrunk33@ds145405.mlab.com:45405/triptrunk',
  },

};

module.exports = config[env];
