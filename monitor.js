const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const moment = require('moment');

const querystring = require('querystring');
const http = require('http');
const fs = require('fs');
const config = require('./config.js');
const configJSON = config.get();
const alert = require('./alert.js');

const iconv = require('iconv-lite');

const adjustRequestInterval = (ysType, requestTimeStr, res)=>{
	let requestTime = moment(requestTimeStr, 'YYYY-MM-DD HH:mm');
	let diff = moment().diff(requestTime, 'minutes');
	
	let typeConfig = configJSON.ysType[ysType];
	let span = typeConfig.requestInterval ;
	let intervalSpan = typeConfig.intervalSpan;
	let dataInterval = typeConfig.dataInterval;
	
	let result = false;
	
	if( res.statusCode === 200 ){
		let length = res.headers['content-length'];
		console.log(`content-length: ${length}`);
		if(length < 5000){//no enough data
			
			if(diff > dataInterval*2){
			//skip this time as if success
				typeConfig.lastDownTime = requestTimeStr; 
			}
			return false;
		}else{// success
			if(	(diff > dataInterval*2 && span > 1/6)
				|| (diff < dataInterval*2 && span > intervalSpan[0]) ) span /= 2;
				
			if(	diff < dataInterval*2 && span < intervalSpan[0]) span *= 2; //from 1/6 to intervalSpan[0]
			
			typeConfig.lastDownTime = requestTimeStr;
			
			result = true;
		}
	}else{//500, 503 etc. 
		if(span < intervalSpan[1]) span *= 2; //
		result = false;
	}
	typeConfig.requestInterval = span;

	return result;
}

exports.runMonitor = (ysType, postData, elements, monitorHandles)=>{
	let postDataString = querystring.stringify(postData);
	var options = {
	  hostname: '172.18.152.216',
	  //port: 80,
	  path: '/biao2013.php',
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': Buffer.byteLength(postDataString)
	  }
	};

	var req = http.request(options, (res) => {
		console.log(`
		
------- request time: ${postData.sOccTime5} -------`);

	  console.log(`STATUS: ${res.statusCode}`);
	  //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
		
		let result = adjustRequestInterval(ysType, postData.sOccTime5, res);
		
		if(!result) return;
	  
	  
	  //res.setEncoding('utf8');
	  const chunks = [];
	  let size = 0;
	  res.on('data', (chunk) => {
		//console.log(`BODY: ${chunk}`);
		chunks.push(chunk);
		size += chunk.length;
	  });
	  res.on('end', () => {
		const content = Buffer.concat(chunks, size);
		let str = iconv.decode( content, 'GB2312');
		
		str = str.replace('onload=cal()', ''); //fixed jsdom body onload bug https://github.com/tmpvar/jsdom/issues/1848
		
		//console.log(str);
		//console.log('No more data in response.');
		
		//console.log(`type: ${type} typeof monitorHandle: ${typeof monitorHandle}`);
		for(let element of elements){
			monitorHandles[element](element, str);
		}
		
	  });
	});

	req.on('error', (e) => {
	  console.log(`problem with request: ${e.message}`);
	});

	// write data to request body
	req.write(postDataString);
	req.end();

}

