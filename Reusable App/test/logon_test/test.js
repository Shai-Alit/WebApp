var viyahost = window.location.origin;


/*
Entry point for test
*/

function run_test(){
    
    
	logonServer(window.location.origin).then ( msg => {
		let logged_user = getUserIdentity();
		setStatusMessage(msg + ' - user ID=' + logged_user,'info');
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
	logged_user = 'None';
	try {
	let { identities } = await store.addServices('identities');
    let c = await store.apiCall(identities.links('currentUser'));
	logged_user = c.items('id');
	}
	catch(err) {
		handleError(err);
	}
	return logged_user;
}



