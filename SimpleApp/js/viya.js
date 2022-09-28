let store = restaf.initStore({casProxy: true});
var currentSession;
var viyahost = window.location.origin;
var logged_user;

var session = null ;

let onClickLog     = null;
let onClickListing = null;
let onClickODS     = null;
let currentJob     = null;

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

	console.error(err);

}

async function mainLoop (store, compute, code) {

    // Define the payload
    // This is your SAS program
    let payload = {
            data: {code: code}
    };

    // Execute the data step and wait for completion
    // All calls to the server are managed by the store you created in step 1
    let job    = await store.apiCall(session.links('execute'), payload);
    let status = await store.jobState(job, null, 5, 2);

    // Check the final status of job and view the logs
    if (status.data === 'running') {
        throw `ERROR: Job did not complete in allotted time`;
    } else {
        let logLines = await store.apiCall(status.job.links('log'));
        // print the log
        logViewer(logLines);
    }
    return 'restAF is cool or what';
}
let code =  [`data _null_; do i = 1 to 100; x=1; end; run; `];
appInit()
    .then(mainLoop(store,null,code))
    .catch(err => handleError(err));