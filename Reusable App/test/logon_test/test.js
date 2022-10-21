var viyahost = window.location.origin;


/*
Entry point for test
*/

function run_test(){
    
    let logged_user = 'Not Logged In';
	logonServer(window.location.origin).then ( msg => {
		getUserIdentity().then(rv => {
			if (rv === 'None') {
				logged_user = 'Error logging in';
			}
			else{
				logged_user = rv;
			}
			setStatusMessage(msg + ' - user ID=' + logged_user,'info');
			});
	}).catch( err => handleError(err));
    
}



