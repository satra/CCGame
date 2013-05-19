// production.js
var deployd = require('deployd');

var server = deployd({
  port: process.env.PORT || 2403,
  env: 'production',
  db: {
    host: 'ec2-54-235-46-128.compute-1.amazonaws.com',
    port: 27017,
    name: 'deployd',
    credentials: {
      username: 'deployd',
      password: 'deployd'
    }
  }
});

server.listen();

server.on('listening', function() {
  console.log("Server is listening");
});

server.on('error', function(err) {
  console.error(err);
  process.nextTick(function() { // Give the server a chance to return an error
    process.exit();
  });
});
