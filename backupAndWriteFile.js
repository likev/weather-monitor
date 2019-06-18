
const fs = require('fs');


exports.backupAndWrite = function(path, backupPath, content){
	fs.rename(path, backupPath, (err) => {
		if (err) throw err;
	  
		console.log(path + ' backup complete!');
		
		fs.writeFile(path, content, 
			(err) => {
				if (err) throw err;
				
				console.log(path + ' write complete!');
				//config = newConfig; //no need
		});
	});
	
	
}