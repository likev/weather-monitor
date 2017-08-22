
const gs = require('./getset.js');
let n = gs.get();

console.log(`global.a1: ${global.a1}`);
console.log(`global.a2: ${global.a2}`);
console.log(`global.a3: ${global.a3}`);

exports.start = ()=>{
	setInterval( ()=>{
		console.log( n );
		n.a--;
	}, 3000);
}	


