
const gs = require('./getset.js');

exports.start = ()=>{
	setInterval( ()=>{
		gs.set( gs.get()+1 );
	}, 5000);
}	


