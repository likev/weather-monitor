
const moment = require('moment');

const fs = require('fs');
const config = require('./config.js');
const configJSON = config.get();
const alert = require('./alert.js');
const iconv = require('iconv-lite');


let checkFile = function(filename, findcity){
	fs.readFile(filename, (err, data) => {
	  if (err){
		console.error(err);
		return;
	  }
	  
	  
	  
	  data = iconv.decode( data, 'GB2312');
	  
	  data = data.trim();
	  
	  const lines = data.split('\r\n');
	  
	  console.log(lines.length);
	  
	  let type = 'lightning', level = 0, rlevel = 3;
	  let alerted = configJSON[type].alerted;	  

	  for(let line of lines){
		  let infoArray = line.split(/\s+/);
		  
		  let n = infoArray[0], 
		  date = infoArray[1], 
		  time = infoArray[2].slice(0, 5),
		  
		  id = `${n}-${date}`,
		  value = infoArray[5],
		  city = infoArray[10],
		  county = infoArray[11];
		  
		  //console.log(city);
		  
		  if(city.indexOf(findcity) !== -1){
		  
			  let recordTime = date +' '+ time;
			  let isAlerted = ! alerted[level].every( (item) => {return item.id !== id} ) ;

			  //console.log(alerted[level]);
			  //console.log(`${isAlerted} ${id} ${city}`);
			  if(isAlerted) continue;

			  alerted[level].push({id, time:recordTime});
			  
			  let typeName = configJSON.typesName[type],
				  typeUnit = configJSON.typesUnit[type];
			  alert.add({type, level, rlevel, message:`[${typeName}] ${city+' '+county}: ${value} ${typeUnit} at ${recordTime}`, time:recordTime});
		  }
	  }
	  
	});
}

let loop = function( {city='洛阳', ysType='lightning'}={} ){

	
	let filename = moment().format('YYYY_MM_DD')+'.txt';
	let path = 'U:/';
	checkFile(path+filename, city);
	
	let span = configJSON.ysType[ysType].requestInterval;
	if(!span) span = configJSON.ysType[ysType].requestInterval = 1;	
	
	setTimeout( ()=>{
		loop({city});
	}, span*60*1000 );
}

//--------test begin---------------------
/*
	loop({
			ysType: 'lightning', 
			city: '洛阳'
		});
*/
//---------test end----------------------

exports.start = function(){
	
	loop({
			ysType: 'lightning', 
			city: '洛阳'
		});
}

