const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const moment = require('moment');

const querystring = require('querystring');
const http = require('http');
const fs = require('fs');
const config = require('./config.js');
const configJSON = config.get();
const alert = require('./alert.js');

const { runMonitor } = require('./monitor.js');

let checkElement = function({type='Tmax', compare='geq', id, name, value, recordTime}){

	if(value === '') return;
	value = +value;
	if( isNaN(value) ) return; //not a number
	let threshold = configJSON[type].alertThreshold;
	
	//console.log(`threshold.length: ${threshold.length}`);
	for(let i = threshold.length-1, rlevel=1; i>=0; i--, rlevel++){
		let isAlerted = false;
		
		//console.log(`Tmax: ${Tmax} threshold: ${threshold[i]}`);
		let check = value >= threshold[i];
		if(compare === 'geq') check = value >= threshold[i];
		else if(compare === 'leq') check = value <= threshold[i];
		
		if( check ){
			//console.log(`Tmax: ${Tmax} threshold: ${threshold[i]}`);
			let alerted = configJSON[type].alerted;
			
			for(let j = alerted.length-1; j>=i; j--){
				let alertedJArray = alerted[j];
				
				isAlerted = !alertedJArray.every( (item) => {return item.id !== id} );
				if(isAlerted) break;
			}
			if(isAlerted) break;
			
			alerted[i].push({id, time:recordTime});
			
			//config.set(configJSON);
			let typeName = configJSON.typesName[type],
				typeUnit = configJSON.typesUnit[type];
			alert.add({type, level:i, rlevel, message:`[${typeName}] ${name}: ${value} ${typeUnit} at ${recordTime}`, time:recordTime});// {type:Tmax, message:'市区高温', time:'2017-05-16 18:20'}
			
		}
		
	}
}

let monitorElement = {};

let getInfo = function(type, content){
	let dom208 = new JSDOM(content);

	let $ = require("jquery")(dom208.window);

	//console.log('table size: ' + $('table').length );
	
	let thisDownTimeStr = $('body>table td.title').text().slice(-16);
	
	console.log(`
		
------- data time: ${thisDownTimeStr} -------`);
	
	configJSON[type].lastDownTime = thisDownTimeStr;
	//config.set(configJSON);
	
	let stationList = $('body>table').eq(1).find('tr');
	//console.log('tr size: ' + stationList.length );
	
	let typeName = configJSON.typesName[type],
		threshold = configJSON[type].alertThreshold;
	console.log(`${typeName} 阈值: ${threshold}`);
	
	return {thisDownTimeStr, stationList, $};
}

monitorElement.Tmax = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index < 2) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(1).text(), 
		name = tdList.eq(2).text(),
		value = tdList.eq(5).text(),
		
		occurTime = tdList.eq(6).text();
		
		if(value > 50) return;//error data
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.visibility = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index < 2) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(1).text(), 
		name = tdList.eq(2).text(),
		
		/* 
		visibilityArray = tdList.eq(8).text().split(' '),
		value = visibilityArray[0],
		occurTime = visibilityArray[1];
		*/
		value = tdList.eq(12).text();
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, compare:'leq', id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.Tmax6 = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index === 0) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(2).text(), 
		name = tdList.eq(3).text() + tdList.eq(1).text(),
		
		value = tdList.eq(6).text(),
		occurTime = tdList.eq(7).text();
		
		if(value > 50) return;//error data
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.hourRain = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index < 2) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(1).text(), 
		name = tdList.eq(2).text(),
		//TmaxArray = tdList.eq(5).text().split(' '),
		value = tdList.eq(4).text().trim() ;
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.hourRain6 = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index === 0) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(2).text(), 
		name = tdList.eq(3).text() + tdList.eq(1).text(),
		//TmaxArray = tdList.eq(5).text().split(' '),
		value = tdList.eq(4).text().trim() ;
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.windMax = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index < 2) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(1).text(), 
		name = tdList.eq(2).text(),

		value = tdList.eq(32).text(),
		direction = tdList.eq(31).text();
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.windMaxPeak = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index < 2) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(1).text(), 
		name = tdList.eq(2).text(),
		
		value = tdList.eq(35).text(),
		direction = tdList.eq(34).text();
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.windMax6 = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index === 0) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(2).text(), 
		name = tdList.eq(3).text() + tdList.eq(1).text(),
		
		value = tdList.eq(16).text(),
		direction = tdList.eq(17).text(),
		occurTime = tdList.eq(18).text();
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

monitorElement.windMaxPeak6 = function(type, content){
	const {thisDownTimeStr, stationList, $} = getInfo(type, content);
	
	stationList.each((index, item)=>{
		if(index === 0) return;
		let tdList = $('td', item);
		//console.log(tdList.length); //temph, pressure, wind
		
		let id = tdList.eq(2).text(), 
		name = tdList.eq(3).text() + tdList.eq(1).text(),
		
		value = tdList.eq(19).text(),
		direction = tdList.eq(20).text(),
		occurTime = tdList.eq(21).text();
		
		console.log( `${id} ${name} ${value}` );

		checkElement({type, id,name,value,recordTime:thisDownTimeStr});
	})
}

let loop = function( {ysType='lyBasic',city='ly', citydown='all', sOccTime5='',ys='2',xiansa='11', elements=[]}={} ){
	var postData = {
	  city,
	  citydown,
	  sOccTime5,
	  ys,
	  xiansa
	};

	let typeConfig = configJSON.ysType[ysType];
	let dataInterval = typeConfig.dataInterval;
	let lastDownTime = moment(typeConfig.lastDownTime, 'YYYY-MM-DD HH:mm');
	
	let diff = moment().diff(lastDownTime, 'minutes');
	

	
	if(diff>dataInterval){
		lastDownTime.add(dataInterval, 'minutes');
	}else{
		postData.sOccTime5 = moment().format('YYYY-MM-DD HH:mm');
		runMonitor(ysType, postData, elements, monitorElement);
	}
	
	//next period or retry last
	postData.sOccTime5 = lastDownTime.format('YYYY-MM-DD HH:mm');
	
	//if(!callback) callback = monitorElement[ysType];
	runMonitor(ysType, postData, elements, monitorElement);
	
	let span = typeConfig.requestInterval;
	if(!span) span = typeConfig.requestInterval = 1;	
	
	setTimeout( ()=>{
		loop({ysType,city, citydown, sOccTime5, ys, xiansa, elements})
	}, span*60*1000 );
}

exports.start = function(){

	loop({
			ysType: 'lyBasicHour', 
			ys: '2',
			xiansa: '21',
			elements:['Tmax','hourRain','windMax','windMaxPeak','visibility']
		});
		
	loop({
			ysType: 'lyNew6', 
			ys: '9', //cimiss all
			xiansa: '2',
			elements:['Tmax6','hourRain6','windMax6', 'windMaxPeak6']
		});
		

}

