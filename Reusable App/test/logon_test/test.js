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
				console.log(rv);
			}
			setStatusMessage(msg + ' - user ID=' + logged_user,'info');
			});
	}).catch( err => handleError(err));
    
}

async function logonServer(viyahost){
	let p = {
		authType: 'server',
		host: viyahost
	  }
	  let msg = await store.logon(p);
	  return msg;
}

async function getUserIdentity(){
	let logged_user = 'None';
	try {
	let { identities } = await store.addServices('identities');
    let c = await store.apiCall(identities.links('currentUser'));
	logged_user = c.items('id');
	console.log(logged_user);
	}
	catch(err) {
		handleError(err);
	}
	return logged_user;
}



