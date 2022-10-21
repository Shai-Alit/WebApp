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
	}
	catch(err) {
		handleError(err);
	}
	return logged_user;
}