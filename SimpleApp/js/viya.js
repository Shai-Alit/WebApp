
var currentSession;
var servers;
var server_session;
var serverName;
var viyahost = window.location.origin;
var logged_user;
var computeSetup;
var computeRun;

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
        let { computeSetup, computeRun } = restaflib;
        let msg = await store.logon(p);

        let computeContext = null; 

        let computeSession = await computeSetup(store, computeContext);
        
        
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

async function runCode() {

    var code = 'filename mdlfldr filesrvc folderpath= "/Public/Shared/Sean Ford";';
    macros={'make':'Acura'}
    code += '%include mdlfldr("sql_macro.sas");';
    code += '%carmake(make = ' + "Acura" + ');';

    let computeSummary = await computeRun(
        store,
        computeSession,
        code,
        macros
    );
    console.log(computeSummary.SASJobStatus);
    loadTableData();
}

function loadTableData(){
	
	let payload = {
		action: 'table.fetch',
		data  : {'table': { 'name': "active", 'caslib': "seford_s"}, 'from':0, 'to': 1}
	}

	store.runAction(server_session, payload).then ( r => {
        console.log(r);
	}).catch(err => handleError(err))

    console.log("pause");
	
}

async function runSASCode(){

	//let computeSession = await computeSetup(store, null);
    let macros={"make": 'Acura'};
    var code = 'filename mdlfldr filesrvc folderpath= "/Public/Shared/Sean Ford";';
    code += '%include mdlfldr("sql_macro.sas");';
    code += '%carmake(make = ' + '\'Acura\'' + ');';

    let computeSummary = await computeRun(
        store,
        computeSession,
        code,
        macros
    );

    let z = computSummary.items('results').toJS();
    let foo = 0;
	
}