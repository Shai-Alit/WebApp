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
        document.getElementById( 'results' ).style.visibility = 'hidden';
        editor();

        let { identities } = await store.addServices('identities');
        let c = await store.apiCall(identities.links('currentUser'));
        logged_user = c.items('id');
    }
    catch (err) {
        showAlert(err);
    }
		
    return session;
}

function editor ( ) {
    ;
    let props = {
        onRun: runCode,
        text  : ' ',
        mode  : 'text',
        msg   : 'You are now at the Famous 1? -- Enter your SAS code below',
        upload: false,
        button: 'RUN'
    };
    document.getElementById( 'SASContent' ).textContent = 'ready';
    rafuip.TextEditor( props, "#sourcediv" );

}

function runCode ( text, uploadF, cb ) {
    ;
    let code    = text.split(/\r?\n/);
    let payload = { data: { code: code } };

    // Get the folder to execute
    let executeCmd = session.links( 'execute' );

    // Submit the program to SAS
    document.getElementById( 'results' ).style.visibility = 'hidden';
    ;
    store.apiCall( executeCmd, payload )
       .then( job => store.jobState( job , { qs: { timeout: 2 } }, 10 ) )
         .then ( status  => {
             if (status.data !== 'running') {
                 document.getElementById( 'results' ).style.visibility = 'visible';
                 showAllContent( status.job );
                 cb( true );
             } else {
                 throw { Error: `job did not complete:  ${status.jobState.data}` };
             }
         } )
       // catch errors
       .catch( err => {
           console.log( err );
           showAlert( err );
           cb( false )
       } )
}

 function showAllContent( job ) {
     onClickLog     = logViewer.bind(null, store, job, 'log');
     onClickListing = logViewer.bind(null, store, job, 'listing');
     onClickODS     = odsViewer.bind(null, store, job, 'ods');
     onClickLog();
 }

 appInit();