const env         = process.env.NODE_ENV || 'production';

const config = {

  development: {
    port: process.env.PORT || 3000,
    databaseURI: 'mongodb://TTAdmin:Bucks4136@ds023684.mlab.com:23684/triptrunk-dev',
  },


  production: {
    port: process.env.PORT || 3000,
    databaseURI: 'mongodb://ttserver:TripTrunk33@ds153365-a0.mlab.com:53365,ds153365-a1.mlab.com:53365/triptrunk?replicaSet=rs-ds153365',
  },

};

module.exports = config[env];
