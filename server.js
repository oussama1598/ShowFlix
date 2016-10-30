const Server = require("upnpserver")
 
var server = new Server({log: true,logLevel: "TRACE" }, [
  '/home/oussama/Desktop/TVShows'
]);
 
server.start();