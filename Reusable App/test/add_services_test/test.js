var viyahost = window.location.origin;


/*
Entry point for test
*/
var casSession = null;
var computeSession = null;

function run_test(){
    
    startServices().then(success =>{
		if (success === true)
		{
			let caslibs = getCaslibs(casSession);
			console.log(caslibs);
		}
	});


}


async function startServices(){
	let success = true;
	try 
	{
		addCASService().then ( session => {
			casSession = session;
		}).catch( err => handleError(err));
		
		addComputeService().then ( session => {
			computeSession = session;
		}).catch( err => handleError(err));
	}
	catch(err){
		success = false;
		console.log(err);
	}
	return success;
	
}



