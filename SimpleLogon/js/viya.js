
var currentSession;
var servers;
var server_session;
var serverName;
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

    let  payload = {
        authType    : 'token',
        host        : 'http://eeclxvm067.exnet.sas.com',
        token : 'eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vbG9jYWxob3N0L1NBU0xvZ29uL3Rva2VuX2tleXMiLCJraWQiOiJsZWdhY3ktdG9rZW4ta2V5IiwidHlwIjoiSldUIn0.eyJqdGkiOiIyNzY2NDlhMzMzNWE0YWM5YTdjODY3MzY3MWM1ZmU2YSIsImV4dF9pZCI6InVpZD1zZWZvcmQsb3U9dXNlcnMsZGM9YnVkcyxkYz1jb20iLCJyZW1vdGVfaXAiOiIxNzIuMTYuNDcuMiIsInN1YiI6IjU1YmE0OTU0LWE1NzYtNGM2NS1hMTBmLTJhYzYwOTc2ZDlmNSIsInNjb3BlIjpbIm9wZW5pZCJdLCJjbGllbnRfaWQiOiJteWNsaWVudGlkIiwiY2lkIjoibXljbGllbnRpZCIsImF6cCI6Im15Y2xpZW50aWQiLCJncmFudF90eXBlIjoiYXV0aG9yaXphdGlvbl9jb2RlIiwidXNlcl9pZCI6IjU1YmE0OTU0LWE1NzYtNGM2NS1hMTBmLTJhYzYwOTc2ZDlmNSIsIm9yaWdpbiI6ImxkYXAiLCJ1c2VyX25hbWUiOiJzZWZvcmQiLCJlbWFpbCI6InNlZm9yZEBlZWNseHZtMDY4LmV4bmV0LnNhcy5jb20iLCJhdXRoX3RpbWUiOjE2NTQyODQ1MjMsInJldl9zaWciOiI1M2UzNTVhOSIsImlhdCI6MTY1NDI4NDUyMywiZXhwIjoxOTY5NjQ0NTIzLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0L1NBU0xvZ29uL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbIm15Y2xpZW50aWQiLCJvcGVuaWQiXX0.JIan6E9P5YSoKXg7uTMvGbrifYmZ5330KSsKu7MV2aQIJDvu4dnCMS1ycxUmMx2KtCVjZGIDb5eJDeEqpo6rHiHr5o309zRjToGPOgrpH5sKEFpNMx5x88WWtZmfgdvAwQsSf-h6RHzYwJdp3JPEGU9_COis25GKyXdZvoc58emmj3K7ep8UidxpGCLeOvZK7IKrcIpYDfU9qdxcUJPZq_25fl18dy_aErSEfvgUv7DUiBItHz-Z9Oe3OrRA8pEEheZtQZhj-5_2u6_l3YjI-gDdim5AhsVSPJ8BlrHh0mEJKDtlQ-WOAc_x-ZVv2M40wIibMaRBEGeLxTbenVddfg'
        };

        let msg = await store.logon(payload);
        let c = store.connection();
        console.log(c);
		
    return c;
}

async function appInit2() {
    let  payload = {
        authType    : 'password',
        host        : 'https://eeclxvm067.exnet.sas.com',
        user        : 'seford',
        password    : 'Demopw123',
        clientID    : 'myclientid',  /* get this from your admin */
        clientSecret: 'myclientsecret' /* get this from your admin */
        };
    store.logon  ( payload )
        .then ( c => {
            let d = store.connection();
            let foo = 0;
        })
        .catch( err => console.log('logon failed'))

}

function uiInit(){

    appInit2().then ( c => {
        console.log(c);
    }).catch( err => handleError(err));

    console.log("pause");
}