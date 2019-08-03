const config = require('./config.js');
const alert = require('./alert.js');
const monitorCimiss = require('./monitorCimiss.js');
const lightning = require('./lightning.js');
const fire = require('./fire.js');
const server = require('./server.js');

config.autosave(60*1000);
alert.start();
monitorCimiss.start();
lightning.start();
fire.start();
server.start();



