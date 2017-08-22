
const moment = require('moment');

const querystring = require('querystring');
const https = require('https');
const fs = require('fs');
const config = require('./config.json');

let save = (newConfig=config)=>{
	fs.writeFile('config.json', 
		JSON.stringify(newConfig, null, 2), 
		(err) => {
			if (err) throw err;
			//console.log('The file has been saved!');
			//config = newConfig; //no need
	});
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
	
	