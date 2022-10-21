var viyahost = window.location.origin;


/*
Entry point for test
*/

function run_test(){
    
    let logged_user = 'Not Logged In';
	addCASService().then ( session => {
		console.log(session);
	}).catch( err => handleError(err));
    
}



