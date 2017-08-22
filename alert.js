
const moment = require('moment');

const querystring = require('querystring');
const https = require('https');
const fs = require('fs');
const config = require('./config.js');
const configJSON = config.get();

const alertJSON = require('./alert.log.json');

let saveAlertJson = (newConfig=alertJSON)=>{
	fs.writeFile('alert.log.json', 
		JSON.stringify(newConfig, null, 2), 
		(err) => {
			if (err) throw err;
			//console.log('The file has been saved!');
			//config = newConfig; //no need
	});
}

let iftttMaker = function(event='rain', {value1='', value2='', value3='', key='KFch2RBFgoAEiCmE-m6ts'}){
	var iftttMakerUrl = `https://maker.ifttt.com/trigger/${event}/with/key/${key}`;

	iftttMakerUrl += '?'+ querystring.stringify({value1:value1, value2:value2, value3:value3});

	https.get( iftttMakerUrl , (res) => {
		console.log('statusCode:', res.statusCode);
		//console.log('headers:', res.headers);
		res.setEncoding('utf8');
		res.on('data', (d) => {
			console.log(d);
	  });

	}).on('error', (e) => {
	  console.error(e);
	});

}

let phoneNotify = function(message){
	const iftttKeys = ['bUqC5-s6aSyaa0VhU502Qc', 'KFch2RBFgoAEiCmE-m6ts'];
	
	for(let key of iftttKeys){
		iftttMaker('phone_notify', {value1:message, key});
	}
}

let phoneCall = function(phone_number, message){
	iftttMaker('phone_call',  {value1:`+86${phone_number}`, value2:message});
}

const Console = console.Console;
const output = fs.createWriteStream('./alert.log', {flags: 'a'});
const errorOutput = fs.createWriteStream('./error.log', {flags: 'a'});
// custom simple logger
const logger = new Console(output, errorOutput);

let warnLog = function(message){
	console.info(message);
	logger.info(message);
}

let checkStationAlertPeriod = ()=>{

	for(let type of configJSON.types){
		let alerted = configJSON[type].alerted;
		for(let j in alerted){
			let alertedJArray = alerted[j];
			let stationAlertPeriod = configJSON[type].stationAlertPeriod;
			alerted[j] = alertedJArray.filter((item)=>{
				let alertedTime = moment(item.time, 'YYYY-MM-DD HH:mm');
				return moment().diff(alertedTime, 'minutes')<stationAlertPeriod;
			})
		}
	}
}

//--------test begin---------------------
//phoneCall(13698835392, 'hello');

//phoneNotify('test wind 伊川');
//---------test end----------------------

const pendingList = [];// {type:Tmax, message:'市区高温', time:'2017-05-16 18:20'}

exports.add = function(item){
	pendingList.push(item);
	
	alertJSON.record.push(item);
	++alertJSON.idmax;
	
	if(alertJSON.record.length > 2000) alertJSON.record.splice(0,1000);
	
	alertJSON.count = alertJSON.record.length;
}

let loop = function(){
	checkStationAlertPeriod();
	saveAlertJson();
	
	let item = pendingList.shift();
	if(item !== undefined) {
		warnLog(item.message);
		
		let phoneAlertRecord = configJSON[item.type].phoneAlertRecord;
		let alertedTime = moment(phoneAlertRecord[item.level], 'YYYY-MM-DD HH:mm');
		
		if( moment().diff(alertedTime, 'minutes') > configJSON[item.type].phoneAlertPeriod ){
			phoneNotify(item.message);
			if(item.rlevel && item.rlevel <= 2) phoneCall(13698835392, item.message);
			
			phoneAlertRecord[item.level] = moment().format('YYYY-MM-DD HH:mm');
		}
			
	}
	
	setTimeout(loop, 5000);
}

exports.getJson = ()=>{
	return alertJSON;
}

exports.start = function(){
	loop();
}



