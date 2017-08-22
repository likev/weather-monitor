
const moment = require('moment');

const fs = require('fs');
const config = require('./config.js');
const configJSON = config.get();
const alert = require('./alert.js');
const iconv = require('iconv-lite');
const ftpClient = require('ftp');

let checkContent = function(filename, content, time){
	  
	  content = content.trim();
	  
	  const lines = content.split('\r\n');
	  
	  //console.log(lines.length);
	  
	  let type = 'fire', level = 0, rlevel = 1;
	  
	  let fireConfig = configJSON.ysType[type];
	  let citys = fireConfig.citys;
	  
	  let typeName = configJSON.typesName[type],
	  typeUnit = configJSON.typesUnit[type];
	  
	  let alerted = configJSON[type].alerted;
	  
	  
	  //let time = moment().format('YYYY-MM-DD HH:mm');

	  let FILTER = /^\d+(\s+\S+){8}$/;	  

	  for(let line of lines){
		line = line.trim();
		
		if(!FILTER.test(line)) continue;
		
		
		let infoArray = line.split(/\s+/);

		let lon = infoArray[3], 
		lat = infoArray[4], 

		area = infoArray[5],
		city = infoArray[7],
		surfaceType = infoArray[8];


		let isAlert = ! citys.every( (item) => {return city.indexOf(item) === -1} ) ;
		if(isAlert){
		  alerted[level].push({id:city, time});
		  
		  let message = `[${typeName}] ${city}: ${surfaceType} ${area}${typeUnit} 经度 ${lon} 纬度 ${lat} at ${time} ${filename}`;
		  
		  //console.log(message);
		  alert.add({type, level, rlevel, message, time});
		  
		  
		}
	  }
	  
	
}

let checkFile = function(ftp, filename, time){
	ftp.get(filename, function(err, stream) {
		if (err){
			  console.log(err);
			  return;
		}

		const chunks = [];
		let size = 0;
		stream.on('data', (chunk) => {
			//console.log(`BODY: ${chunk}`);
			chunks.push(chunk);
			size += chunk.length;
		});
		stream.on('end', () => {
			const content = Buffer.concat(chunks, size);
			let str = iconv.decode( content, 'GB2312');

			//console.log(str);
			//console.log('No more data in response.');
			checkContent(filename, str, time);

		});
	});
}

let checkList = function({host='172.18.152.243', path='yaogan/遥感火点监测'}={}){

	var ftp = new ftpClient();
	ftp.on('ready', function() {
		
		let newpathBuf = iconv.encode( path, 'GB2312');//农业气象
		/**/

		ftp.cwd(newpathBuf, (err, cpath)=>{
			if (err){
			  console.log(err);
			  return;
			}
			ftp.list((err, list)=> {
				if (err){
				  console.log(err);
				  return;
				}
				//console.dir(list);
				let datestr = moment().format('YYYYMM');//DD
				let fireConfig = configJSON.ysType.fire;
				
				let FILTER = new RegExp(`^${datestr}.+\\.txt$`,'i');
				for(item of list){
					if(FILTER.test(item.name)) {
						let fileTime = moment(item.date), fileTimeStr;
						fileTime.subtract(8, 'hours');
						
						fileTimeStr = fileTime.format('YYYY-MM-DD HH:mm');
						//console.log(`${fileTimeStr} ${fireConfig.lastDownTime}`);
						
						if(fileTimeStr <= fireConfig.lastDownTime) continue;
												
						checkFile(ftp, item.name, fileTimeStr);
						
						fireConfig.lastDownTime = fileTimeStr;
						
					}
					
				}
		 
				ftp.end();
			});	

		});
			
		
	});
	ftp.on('error',(err)=>{
		console.log(err);
		return;
	});
	  // connect to localhost:21 as anonymous
	ftp.connect({host});

}

let loop = function( {ysType='fire'}={} ){

	checkList();
	
	let span = configJSON.ysType[ysType].requestInterval;
	if(!span) span = configJSON.ysType[ysType].requestInterval = 1;	
	
	setTimeout( ()=>{
		loop();
	}, span*60*1000 );//10*1000
}

//--------test begin---------------------
/*
	loop({
			
		});
*/
//---------test end----------------------

exports.start = function(){
	
	loop({
			ysType: 'fire'
		});
}

