
const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const S3Adapter = require('parse-server').S3Adapter;
const path = require('path');

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

// let logger = require('parse-server/lib/Adapters/Logger/FileLoggerAdapter').FileLoggerAdapter;
const api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://TTAdmin:Bucks4136@ds023684.mlab.com:23684/triptrunk-dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'hgAFtnU5haxHqyFnupsASx6MwZmEQs0wY0E43uwI',
  masterKey: process.env.MASTER_KEY || 'YEZtCiL9kSs1rvrAQBSaULl5JyXM4M5HhHTF24LZ', // Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:3000/parse/',  // Don't forget to change to https if needed
  verbose: 0,
  filesAdapter: new S3Adapter(
    'AKIAJCTGNVYPDOHIEYNQ',
    'lEebcq4gEjMPw8kYmH4lnOCBzi5PTRfS5Zpn9Oig',
    'triptrunk',
    {directAccess: true}
  ),
  push: {
    ios: [
      {
        pfx: './certs/TT-APNS-Dev.p12', // Dev PFX or P12
        bundleId: 'com.triptrunk.TripTrunk',
        passphrase: 'TripTrunk33',
        production: false, // Dev
      },
      {
        pfx: './certs/TT-APNS-Production.p12', // Prod PFX or P12
        bundleId: 'com.triptrunk.TripTrunk',
        passphrase: 'TripTrunk33',
        production: true, // Prod
      },
    ],
  },
});

// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

const app = express();

// Serve the Parse API on the /parse URL prefix
const mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('TripTrunk Parse Server');
});

const port = process.env.PORT || 3000;
const httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
  console.log('TripTrunk-Server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);


