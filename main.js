const config = require('./config.js');
const alert = require('./alert.js');
const monitorTmax = require('./monitorTmax.js');
const lightning = require('./lightning.js');
const fire = require('./fire.js');
const server = require('./server.js');

config.autosave(60*1000);
alert.start();
monitorTmax.start();
lightning.start();
fire.start();
server.start();



