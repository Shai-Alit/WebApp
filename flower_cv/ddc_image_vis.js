var currentSession = null;
var computeSession = null;
var viyahost = window.location.origin;
var logged_user;
var caslibName = 'seford_s'
var casTableName = 'cv_image_images';

var _resultData = null;
var _path_ = null;
var _id_ = null;
var _resultName = null;
var _selections = null;
var _axisFormatter = null;
var _data = null;
var _chart = null;
var maxRows = 2;
var tableID = '#selectionTable';

/*handle message from VA DDC object */
va.messagingUtil.setOnDataReceivedCallback(onDataReceived);

function onDataReceived(messageFromVA)
        {
            console.log(messageFromVA);
			_resultData = messageFromVA;
			_resultName = messageFromVA.resultName;
			_selections = va.contentUtil.initializeSelections(messageFromVA);
			_data = messageFromVA.data;
			// Numeric values can be assigned to the tooltip, so we should format the data
			_axisFormatter = va.d3Helper.configureAxisFormatter(messageFromVA);
      if (messageFromVA.rowCount == 1){
        updateTable(_resultData);
      }
            
        }
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
	$("#user_info").empty().append("Server READY: user " + logged_user + " on dev env " + viyahost);
    return session;
}

function init(){

	appInit().then ( session => {
		currentSession = session;
		
	}).catch( err => console.log(err));

}

function createQuery(caslib, castable, select_col, use_distinct=false, where_clause=undefined, order_by=undefined){
    let query = '';
    if (where_clause == undefined){
        query = 'SELECT ' 
        + (use_distinct ? 'distinct ' : '' )
        + select_col 
        + ' FROM ' + caslib + '.' + castable
        + (order_by == undefined ? '' : (' ORDER BY ' + select_col + ' ' + order_by));
    }else{
        query = 'SELECT ' 
        + (use_distinct ? 'distinct ' : '' )
        + 'a.' + select_col 
        + ' FROM '
        + '(SELECT *'
        + ' FROM ' + caslib + '.' + castable
        + ' WHERE ' + where_clause
        + ') as a'
        + (order_by == undefined ? '' : (' ORDER BY ' + select_col + ' ' + order_by));
    }

    let query_formatted= {'query' : query};
    return query_formatted;
}

function disableDisplayButton(prop){
  if (prop == true || prop == false){
    $( "#display_image" ).prop( "disabled", prop );
  }
}

function clearTable(){
  $(tableID + ' tbody tr').remove();
  disableDisplayButton(true);
}

function removerow(rowidx){
  var count = $(tableID + ' tbody').children().length;
  if (rowidx >= 0 && rowidx < count){
      $(tableID + ' tbody tr').eq(rowidx).remove();
  }
  
}

function updateTable(messagedata) {
  
  var count = $(tableID + ' tbody').children().length;
  if (count == maxRows){
      /*remove first row */
      removerow(0);
  }
  let rowData = {};
  for (let i = 0; i < messagedata.columns.length; i++)
  {
    rowData[messagedata.columns[i].label] = messagedata.data[0][i];
  }

  let rows = '<td>' + rowData['_id_'] + '</td>';
      rows += '<td>' + rowData['_path_'] + '</td>';
  
  _path_ = rowData['_path_']
  _id_ = rowData['_id_']
  
  $(tableID + ' > tbody:last-child').append('<tr>' + rows + '</tr>');
  disableDisplayButton(false);
}

async function displayImage(){

  let caslib = caslibName;
  let castable = casTableName;
  console.log(_path_)
  
  var img_selection = _id_;    
  
      let whereclause = '_id_=' + img_selection;

      let query = {'query' : 'SELECT * FROM ' + caslib + '.' + castable + ' WHERE ' + whereclause};
    console.log(query);
      let p = {
          action: 'fedSql.execDirect',
          data  : query
      }

      let records = await store.runAction(currentSession, p);
      let z = records.items('results', 'Result Set').toJS().rows;
      let bin = z[0][0]['data'];

  displayImage1(bin,500,375);
}

function hexToBase64(str) {
  return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function displayImage1(src, width, height) {
  var img = document.createElement("img");
  img.src = 'data:image/jpg;base64,' + hexToBase64(src);
  img.width = width;
  img.height = height;
  document.body.appendChild(img);
 }





