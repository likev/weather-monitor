
const moment = require('moment');

const querystring = require('querystring');
const https = require('https');
const fs = require('fs');
const config = require('./config.json');

const BAWF = require('./backupAndWriteFile.js');

let save = (newConfig=config)=>{
	BAWF.backupAndWrite('config.json', 'config.json.0',
		JSON.stringify(newConfig, null, 2) );
}

exports.set = (newConfig)=>{
	save(newConfig);
}

exports.get = ()=>{
	return config;
}

let saveloop = function(t){
	save();
	setTimeout(()=>saveloop(t), t)
}

exports.autosave = function(t=5000){
	saveloop(t);
}
	
	