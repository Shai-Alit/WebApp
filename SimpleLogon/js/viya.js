
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
        host        : 'http://budsprod.viyamtes.com',
        token : 'eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vbG9jYWxob3N0L1NBU0xvZ29uL3Rva2VuX2tleXMiLCJraWQiOiJsZWdhY3ktdG9rZW4ta2V5IiwidHlwIjoiSldUIn0.eyJqdGkiOiJkZmFkYjMxOGE3MGQ0YmRjOWRmZjVjNzFmYzAzYjc5YyIsImV4dF9pZCI6InVpZD1zZWZvcmQsb3U9cGVvcGxlLGRjPWV4YW1wbGUsZGM9Y29tIiwicmVtb3RlX2lwIjoiMTQ5LjE3My44LjExMyIsInNlc3Npb25fc2lnIjoiMGUzMjlmNWMtYmYzZi00ZDMxLTlmNDctOTA3ZDBmM2M2MGJjIiwic3ViIjoiYTliMTM5MzYtZWZkZS00OWU4LWE4M2MtN2ZlMzI2MmU3OWRlIiwic2NvcGUiOlsib3BlbmlkIl0sImNsaWVudF9pZCI6ImJ1ZHNwcm9kY2xpZW50aWQiLCJjaWQiOiJidWRzcHJvZGNsaWVudGlkIiwiYXpwIjoiYnVkc3Byb2RjbGllbnRpZCIsImdyYW50X3R5cGUiOiJhdXRob3JpemF0aW9uX2NvZGUiLCJ1c2VyX2lkIjoiYTliMTM5MzYtZWZkZS00OWU4LWE4M2MtN2ZlMzI2MmU3OWRlIiwib3JpZ2luIjoibGRhcCIsInVzZXJfbmFtZSI6InNlZm9yZCIsImVtYWlsIjoiU2Vhbi5Gb3JkQHNhcy5jb20iLCJhdXRoX3RpbWUiOjE2NzU3ODQwNTYsInJldl9zaWciOiJlM2YzYmQ4MiIsImlhdCI6MTY3NTc4NDA1NiwiZXhwIjoyMTQ4ODI0MDU2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0L1NBU0xvZ29uL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbIm9wZW5pZCIsImJ1ZHNwcm9kY2xpZW50aWQiXX0.cuZDLcioah7YNjIyff9JG6KX0IEXHOIcqlIBX3CdZYtdFQfzrqF7Et_INt46uRwEOwb57WrlfFoGSP0cImzKm8gV0BSKdnwqbbmkZF4OjEey8n8hy9dYOJQLXoavZWrwXUiqD3_o1F9C99lS2ixkleg_zW9ZGHmYTCAKuh1GUV9wE8HaBuKRIU299_rqui3gB8Pl5xQWm_i1VAAJaU7XwQl2gA0B_U1G2sC8YiiA9WduGkAf4zp36n00t2cf_f8CdPVyu1PeHUj_4i1JNED1wiN89vr8wowC5Zq9YprPO5sbIYpeAZlAOyAnxir_kcde-sAWMUKseYr6B_9eoFKX3g'
        };

        let msg = await store.logon(payload);
        let c = store.connection();
        console.log(c);
		
    return c;
}

async function appInit2() {
    let  payload = {
        authType    : 'password',
        host        : 'https://budsprod.viyamtes.com',
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

async function appInit3() {
    let p = {
        authType: 'server',
        host: viyahost
      }
      let msg = await store.logon(p);
      let { identities } = await store.addServices('identities');
    let c = await store.apiCall(identities.links('currentUser'));
	logged_user = c.items('id');
    console.log(logged_user);
}

function uiInit(){

    appInit3().then ( c => {
        console.log(c);
    }).catch( err => console.log(err));

    console.log("pause");
}