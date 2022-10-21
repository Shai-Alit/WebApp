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


async function addCASService(){
	let {casManagement} = await store.addServices ('casManagement');
    let servers = await store.apiCall(casManagement.links('servers'));
    let serverName = servers.itemsList(0);
    let session = await store.apiCall(servers.itemsCmd(serverName, 'createSession'));
	return session;
}

async function addComputeService(){
	let {compute} = await store.addServices( 'compute' );
	let contexts = await store.apiCall( compute.links( 'contexts' ) );
	let context0 = contexts.itemsList( 0 );
	let session      = await store.apiCall( contexts.itemsCmd( context0, 'createSession') )
	return session;
}