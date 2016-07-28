// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}
//var logger = require('parse-server/lib/Adapters/Logger/FileLoggerAdapter').FileLoggerAdapter;
var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://TTAdmin:Bucks4136@ds023684.mlab.com:23684/triptrunk-dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'hgAFtnU5haxHqyFnupsASx6MwZmEQs0wY0E43uwI',
  masterKey: process.env.MASTER_KEY || 'YEZtCiL9kSs1rvrAQBSaULl5JyXM4M5HhHTF24LZ', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://triptrunk-app-dev.us-east-1.elasticbeanstalk.com/parse/',  // Don't forget to change to https if needed
  verbose: 0
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 3000;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
