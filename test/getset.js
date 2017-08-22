let n = {a:2};

a1 = {a:2};
var a2 = {a:2};
let a3 = {a:2};

exports.get = function(){
	return n;
}

exports.set = function(){
	++n.a;
}


