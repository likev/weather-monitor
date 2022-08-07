"use strict";

const fs = require('fs');
const http = require('http');
const url = require('url');
const alert = require('./alert.js');

const alertJson = alert.getJson();

let writeAlertJsonInfo = function(req, res){
	
	res.write('alertJson = '+ JSON.stringify(alertJson)+ ';' );
	res.write('alertApp.onready();');
	res.write('</script></body></html>');
	res.end();
}

let homepage = function(req, res){
	res.writeHead(200, {'Content-Type':'text/html'});

	//console.log(__dirname);
	let rs = fs.createReadStream("./alert.html");

	rs.pipe(res, {end:false});
	rs.on('end', ()=>{

		writeAlertJsonInfo(req, res);

	});
}

let newItem = function(req, res, from){
	res.writeHead(200, {'Content-Type':'application/json'});

	let newAlertJson = {count:0, record:[]};

	newAlertJson.idmax = alertJson.idmax;
	
	let count = alertJson.idmax - from;
	if( count > 0 ){
		newAlertJson.count = count;
		newAlertJson.record = alertJson.record.slice(-newAlertJson.count);
	}
	
	res.end(JSON.stringify(newAlertJson));
}

let startHttpServer = function(){
	http.createServer(function(req, res) {
		const host = req.headers.host;
		const hostname = url.parse('http://'+host).hostname;

		let pathname = url.parse(req.url).pathname;
		console.log(pathname);
		if( pathname === '/' ){
			homepage(req, res);
		}else if( pathname.slice(0,5) === '/from' ){
		  var from = +pathname.slice(6);
		  console.log(from);
		  newItem(req, res, from);
		}else{
			res.writeHead(404, {'Content-Type':'text/html'});
			res.end('Not Found!')
		}
		
	}).listen(8080,()=>{
	   console.log('listen on port 8080...');
	 });
}

//--------test begin---------------------
/*
startHttpServer();
*/
//---------test end----------------------

exports.start = function(){
	startHttpServer();
}