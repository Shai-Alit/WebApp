let store = restaf.initStore({casProxy: true});
console.log(store);
var currentSession;
var viyahost = window.location.origin;
var logged_user;

var session = null ;

/**
*
*	Initialize the connection to the Viya backend. Leverages the authentication from the browser.
*
**/
async function appInit(){

	let p = {
	  authType: 'server',
	  host: viyahost
	}

    try {
        let msg = await store.logon(p);
        let {compute} = await store.addServices( 'compute' );
        let contexts = await store.apiCall( compute.links( 'contexts' ) );
        let context0 = contexts.itemsList( 0 );
        session      = await store.apiCall( contexts.itemsCmd( context0, 'createSession') )
        document.getElementById( 'results' ).style.visibility = 'hidden';
        editor();

        let { identities } = await store.addServices('identities');
        let c = await store.apiCall(identities.links('currentUser'));
        logged_user = c.items('id');
        currentSession = session;
    }
    catch (err) {
        handleError(err);
    }
		
    return session;
}

/**
*
*	Global function to handle any errors tha occur
*
**/
function handleError(err){

	var errorList = JSON.parse(err).logEntries;

	console.error(err);

}

 console.log(appInit());
 console.log(logged_user)