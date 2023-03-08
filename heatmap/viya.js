
var currentSession = null;
var computeSession = null;
var viyahost = window.location.origin;
var logged_user;

var total_rows = 0;
var current_row = 0;
var page_rows = 10;

var table_schema = [];
var column_data = [];
var table_rows = [];
var table_filter = '';

var code_fpath = '/Public/Shared/Sean Ford';

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

        let msg = await store.logon(p);
        let {casManagement} = await store.addServices ('casManagement');
        let servers = await store.apiCall(casManagement.links('servers'));
        let serverName = servers.itemsList(0);
        let session = await store.apiCall(servers.itemsCmd(serverName, 'createSession'));
    
        let {compute} = await store.addServices( 'compute' );
        let contexts = await store.apiCall( compute.links( 'contexts' ) );
        let context0 = contexts.itemsList( 0 );
        computeSession      = await store.apiCall( contexts.itemsCmd( context0, 'createSession') )
        
        let { identities } = await store.addServices('identities');
        let c = await store.apiCall(identities.links('currentUser'));
        logged_user = c.items('id');
        
		
    return session;
}

/**
*
*	Global function to handle any errors tha occur
*
**/
function handleError(err){

	console.log(err);

}

async function mainLoop (store, code) {
    
    // get the list of contexts for compute server
    // This of contexts as your SAS configs
    let contexts = await store.apiCall(compute.links('contexts'));

    // lookup the name of the context and create a SAS session with that information
    // In the example we pick the first context that is returned.
    // the itemList function returns the list of contexts
    let context       = contexts.itemsList(0);
    let createSession = contexts.itemsCmd(context, 'createSession');
    let session       = await store.apiCall(createSession);

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

function uiInit(){

    appInit().then ( session => {
        currentSession = session;
        loadTableData();
    }).catch( err => handleError(err));

    console.log("pause");
}
function runCode ( text) {
	;
	//let code    = text.split(/\r?\n/);
	let code = text;
	let payload = { data: { code: code } };

	// Get the folder to execute
	let executeCmd = computeSession.links( 'execute' );
	;
	store.apiCall( executeCmd, payload )
	   .then( job => store.jobState( job , { qs: { timeout: 2 } }, 10 ) )
		 .then ( status  => {
			 if (status.data !== 'running') {
				 showAllContent( status.job );
			 } else {
				 throw { Error: `job did not complete:  ${status.jobState.data}` };
			 }
		 } )
	   // catch errors
	   .catch( err => {
		   console.log( err );
		   showAlert( err );
	   } )
}

/*
* code_fpath - path where code resides on server. ex /Public/Shared/Sean Ford
* code_fname - filename of sas code. ex sql_macro.sas
*/
function gen_init_code(code_fpath,code_fname){
	let code = 'filename mdlfldr filesrvc folderpath= "' + code_fpath + '";';
	code += '%include mdlfldr("' + code_fname + '");';
	return code;
}

async function runSASCode(){
	let code = 'filename mdlfldr filesrvc folderpath= "/Public/Shared/Sean Ford";';
    code += '%include mdlfldr("macro_SalesforceAutoUpdate.sas");';
    code += '%run_auto_update();';

	runCode(code);
}