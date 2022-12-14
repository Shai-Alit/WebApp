/**
*
*	Author:   Matthew Perry (matthew.perry@sas.com)
*	Company:  SAS Institute
*	Dev Date: 3/17/2021
*
**/

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
	$("#user_info").empty().append("user " + logged_user + " on dev env " + viyahost);
    return session;
}

/**
*
*	Loads the initial data
*
**/
function initDataEditor(){
	appInit().then ( session => {
		currentSession = session;
		getCaslibs();
	}).catch( err => handleError(err));
}

/**
*
*	Loads the initial data
*
**/
function initLogbook(){

	appInit().then ( session => {
		currentSession = session;
		getCaslibs();
	}).catch( err => handleError(err));

}

function getCaslibs(){

	caslib_details={'mdType': 'CASLIBS'};
	let caslibPayload = {
		action: 'accessControl.listMetadata',
		data  : caslib_details
	}

	store.runAction(currentSession, caslibPayload).then ( r => {
		caslibs = r.items("results", "Metadata").toJS().rows;
		for(var i=0; i < caslibs.length; i++) {
			var caslib = caslibs[i][0];
			if(caslib.indexOf('(') != -1)
				caslib = caslib.substr(caslib, caslib.indexOf('('));

			$('#caslib_select').append('<option value="' + caslib + '">' + caslibs[i][0] + '</option>');
		}

	}).catch(err => handleError(err))
	
}

function loadCaslibTables(){
	
	caslib_tables={'caslib':getSelectedCaslib()};
	let caslibPayload = {
		action: 'table.tableInfo',
		data  : caslib_tables
	}

	store.runAction(currentSession, caslibPayload).then ( r => {
		tableInfo = r.items("results", "TableInfo");
		cleanupSelector('table_select');
		if(tableInfo){
			castables = tableInfo.toJS().rows;

			for(var i=0; i < castables.length; i++) {
				$('#table_select').append('<option value="' + castables[i][0] + '">' + castables[i][0] + '</option>');
			}
		}
	}).catch(err => handleError(err))
	
}

async function initNewTable(){
	
	//reset the row and filter for a new table selection
	if(getSelectedCaslib() && getSelectedTable()){
		current_row = 1;
		
		table_schema = await getColumnDetails();
		total_rows = await getTotalRows();
		loadTableData(current_row, page_rows);
		$('#button_bar_div').show();
	}
	
}

async function f_initNewTable(){
	
	//reset the row and filter for a new table selection

		current_row = 1;
		f_loadTableData("active_mod",current_row);
		$('#button_bar_div').show();
	
	
}

function loadPreviousPage(){
	current_row = current_row - page_rows;
	last_row = (current_row + page_rows) - 1;
	loadTableData(current_row, last_row);

}

function loadNextPage(){
	current_row = current_row + page_rows;
	last_row = (current_row + page_rows) - 1;
	loadTableData(current_row, last_row);
}

async function refreshCurrentPage(){
	last_row = (current_row + page_rows) - 1;
	total_rows = await getTotalRows();
	loadTableData(current_row, last_row);
}

function jumpToRow(rownumber){
	current_row = eval(rownumber);
	last_row = (current_row + page_rows) - 1;
	loadTableData(current_row, last_row);
}

async function filterTable(filter){
	table_filter = filter;
	total_rows = await getTotalRows();
	
	//Could have an error
	if(total_rows){
		current_row = 1;
		loadTableData(current_row, page_rows);
	}
}

function setPageNavigationInfo(start, end){
	if(end > total_rows)
		end = total_rows;
	//TODO: Determine what buttons might need to be disabled
	$('#page_navigation_info').empty().append('Showing ' + start + ' to ' + end + ' of ' + total_rows + '	entries');
	
}

function addTableRow(){
	drawTableUpdateDialog();
}

function editTableRow(index){
	drawTableUpdateDialog(index);
}

function deleteTableRow(index){
	$('#delete_index').val(index);
	$('#delete_data_modal').modal('show');
}

$("#confirmDeleteDataForm").submit(function( event ) {

	event.preventDefault();
	
	var filter = getTableRowFilter(getTableRow(eval($('#delete_index').val())));
	delete_rows={'table': { 'name': getSelectedTable(), 'caslib': getSelectedCaslib(), 'where': filter}};
	let deletePayload = {
		action: 'table.deleteRows',
		data  : delete_rows
	}

	store.runAction(currentSession, deletePayload).then ( r => {
		refreshCurrentPage();
		$('#delete_data_modal').modal('hide');
	}).catch(err => handleError(err))

});

function getTableRowFilter(table_row){
	
	var filter = '';
	for(var i=0; i < table_schema.length; i++){
	
		var logicalop = '';
		if(i > 0)
			logicalop = ' AND ';
		
		if(table_schema[i][3] === 'varchar' || table_schema[i][3] === 'char')
			filter += logicalop + table_schema[i][0] + '="' + table_row[i+1] + '"';
		else
			filter += logicalop + table_schema[i][0] + '=' + table_row[i+1];
		
	}
	
	return filter;
}

function drawTableUpdateDialog(index){
	
	var selectedRow;
	if(index){
		selectedRow = getTableRow(index);
		$('#updateTableHeader').empty().append('Edit Table Data');
		$('#submitUpdateTableButton').empty().append('Submit Edit');
		$('#updateTableIndex').val(index);
	}else{
		$('#updateTableHeader').empty().append('Add Table Data');
		$('#submitUpdateTableButton').empty().append('Submit New Data');
		$('#updateTableIndex').val('');
	}
	
	var inputHtml = '<div class="form-row">';
	for(var i=1; i < column_data.length; i++){
		inputHtml += '<div class="col-md-6">';
		var editValue = '';
		if(selectedRow)
			editValue = selectedRow[i];
		
		inputHtml += '<label for="' + column_data[i].title + '">' + column_data[i].title + '</label>';
		if(column_data[i].type === 'double')
			inputHtml += '<input type="number" step="any" class="form-control" id="' + column_data[i].title + '" name="' + column_data[i].title + '" value="' + editValue + '"/>';
		else
			inputHtml += '<input type="text" class="form-control" id="' + column_data[i].title + '" name="' + column_data[i].title + '" value="' + editValue + '"/>';
		
		inputHtml += '</div>';
	}
	inputHtml += '</div>';
	
	$('#updateTableBody').empty().append(inputHtml);
	$('#update_data_modal').modal('show');
	
}

$("#updateTableDataForm").submit(function( event ) {
	
	event.preventDefault();
	processSubmission($(this).serializeArray());
	
});

async function processSubmission(entries){

	var updateColumns = [];
	var updateTableIndex = 0;
	
	for(var i=0; i < entries.length; i++){
		
		if(entries[i].name === 'updateTableIndex'){
			updateTableIndex = entries[i].value;
		}else{
			updateColumns.push(entries[i]);
		}
	
	}
	
	if(updateTableIndex){
		await updateTableRecord(updateTableIndex, updateColumns);
	}else{
		await insertTableRecord(updateColumns);
	}
	
	refreshCurrentPage();
	$('#update_data_modal').modal('hide');
}

async function insertTableRecord(updateColumns){
	
	var code = 'data ' + getSelectedCaslib() + '.' + getSelectedTable() + '(append=yes);';
	
	//Construct length statements to enforce data structure
	for(var i=0; i < table_schema.length; i++){
		var column = table_schema[i];
		var columnName = column[0];
		var columnType = column[3];
		var columnLength = column[4];
		
		if(columnType === 'char'){
			code += 'LENGTH ' + columnName + ' $ ' + columnLength + ';';
		}else if(columnType === 'varchar'){
			code += 'LENGTH ' + columnName + ' varchar(*);';
		}else if(columnType === 'double'){
			code += 'LENGTH ' + columnName + ' ' + columnLength + ';';
		}
		
	}
	
	//Construct assignment statements
	for(var i=0; i < table_schema.length; i++){
		var column = table_schema[i];
		for(var j=0; j < updateColumns.length; j++){
			
			var columnName = column[0];
			var columnType = column[3];
			
			if(columnName === updateColumns[j].name){
				if(columnType === 'varchar' || columnType === 'char'){
					code += columnName + '="' + updateColumns[j].value  + '";';
				}else{
					if(updateColumns[j].value)
						code += columnName + '=' + updateColumns[j].value  + ';';
					else
						code += columnName + '=.;';
				}
	
			}
		}
	}
	
	code += 'run;';
	
	let payload = {
		action: 'datastep.runCode',
		data  : {'code': code, 'single': 'yes'}
	}
	
	try{
		var response = await store.runAction(currentSession, payload);
		return response;
	}catch(err){
		handleError(err);
		return null;
	}
}

async function updateTableRecord(index, updateColumns){

	var filter = getTableRowFilter(getTableRow(eval(index)));
	var set = [];
	
	for(var i=0; i < table_schema.length; i++){
		var column = table_schema[i];
		
		for(var j=0; j < updateColumns.length; j++){

			var columnName = column[0];
			var columnType = column[3];
			
			if(columnName === updateColumns[j].name){
				if(columnType === 'varchar' || columnType === 'char'){
					set.push({'var':updateColumns[j].name, 'value':JSON.stringify(updateColumns[j].value)});
				}else{
					set.push({'var':updateColumns[j].name, 'value':updateColumns[j].value});
				}
	
			}			
			
		}
	}
	
	update_row={'table': { 'name': getSelectedTable(), 'caslib': getSelectedCaslib(), 'where': filter}, set};
	
	let payload = {
		action: 'table.update',
		data  : update_row
	}
	
	try{
		var response = await store.runAction(currentSession, payload);
		return response;
	}catch(err){
		handleError(err);
		return null;
	}
}

function drawTable(){
		
	var html = '';
	
	var columnData = getColumnData();
	html += '<thead><tr>';
	for(var i=0; i < columnData.length; i++){

			html += '<th scope="col">' + columnData[i].title + '</th>';
	}
	html += '</tr></thead>';
	
	html += '<tbody>';
	var rowData = getTableRows();
	for(var i=0; i < rowData.length; i++){
		
		html += '<tr>';
		var row = rowData[i];
		for(var j=0; j < row.length; j++){
				html += '<td scope="row">' + row[j] + '</td>';
			
		}
		html += '</tr>';
	}
	
	html += '</tbody>';
	$('#cas_table').empty().append(html);
}

function f_drawTable(table){
		
	var html = '';
	
	var columnData = f_getColumnData(table);
	html += '<thead><tr>';
	for(var i=0; i < columnData.length; i++){
		if(i === 0)
			html += '<th scope="col" width="1%"></th>';
		else
			html += '<th scope="col">' + columnData[i].title + '</th>';
	}
	html += '</tr></thead>';
	
	html += '<tbody>';
	var rowData = f_getTableRows(table);
	for(var i=0; i < rowData.length; i++){
		
		html += '<tr>';
		var row = rowData[i];
		for(var j=0; j < row.length; j++){
			if(j === 0){
				html += '<td nowrap scope="row">';
				html += '</td>';
			}else
				html += '<td scope="row">' + row[j] + '</td>';
			
		}
		html += '</tr>';
	}
	
	html += '</tbody>';
	$('#cas_table').empty().append(html);
}



function loadTableData(startRow, endRow){
	
	let payload = {
		action: 'table.fetch',
		data  : {'table': { 'name': getSelectedTable(), 'caslib': getSelectedCaslib()}, 'from':startRow, 'to': endRow}
	}

	store.runAction(currentSession, payload).then ( r => {
		setColumnData(r.items('results', 'Fetch').toJS().schema);
		setTableRows(r.items('results', 'Fetch').toJS().rows);
		drawTable();
		setPageNavigationInfo(startRow, endRow);
	}).catch(err => handleError(err))
	
}

async function f_loadTableData(table,startRow){
	
	query={'query': 'select PROCESS, BATCH, put(STOP,datetime.) as date_time,TYPE,LOT from ' + getSelectedCaslib() + '.' + 'ACTIVE_MOD where PROCESS=\'' + getSelectedProcess() +'\''};
	let payload = {
		action: 'fedSql.execDirect',
		data  : query
	}

	let records = await store.runAction(currentSession, payload);
	let z = records.items('results', 'Result Set').toJS().rows;
	total_rows = z.length;

	entries_textbox.value = total_rows;
	table_schema = records.items('results','Result Set','schema').toJS();
	getBeginEnd(table);

	setColumnData(table_schema);
	setTableRows(z);
	drawTable();
	setPageNavigationInfo(startRow,total_rows);

}

async function getBeginEnd(table){
	query={'query': 'select put(MIN(STARTDATETIME),datetime.) as begin_time, put(MAX(STOP),datetime.) as end_time from ' + getSelectedCaslib() + '.' + table + ' where PROCESS=\'' + getSelectedProcess() +'\''};
	let payload = {
		action: 'fedSql.execDirect',
		data  : query
	}

	let records = await store.runAction(currentSession, payload);
	let z = records.items('results', 'Result Set').toJS().rows;

	begin_time_textbox.value = z[0][0];
	end_time_textbox.value = z[0][1];
}

function drowdown1Function() {

}

function drowdown2Function() {
	
}

async function getTotalRows(){

	var whereClause = '';
	if(table_filter)
		whereClause = "WHERE " + table_filter;

	count_query={'query': 'select count(*) from ' + getSelectedCaslib() + '.' + getSelectedTable() + ' ' + whereClause};
	let payload = {
		action: 'fedSql.execDirect',
		data  : count_query
	}
	
	try{
		let records = await store.runAction(currentSession, payload);
		return records.items('results', 'Result Set').toJS().rows[0][0];
	}catch(err){
		handleError(err);
		return null;
	}
	
}

async function f_getTotalRows(caslib, table){


	count_query={'query': 'select count(*) from ' + caslib + '.' + table};
	let payload = {
		action: 'fedSql.execDirect',
		data  : count_query
	}
	
	try{
		let records = await store.runAction(currentSession, payload);
		return records.items('results', 'Result Set').toJS().rows[0][0];
	}catch(err){
		handleError(err);
		return null;
	}
	
}

async function getAvailableProcess(){

	

	query={'query': 'select distinct PROCESS from ' + getSelectedCaslib() + '.' + 'PROCESS'};
	let p = {
		action: 'fedSql.execDirect',
		data  : query
	}
	
	try{
		let records = await store.runAction(currentSession, p);
		let z = records.items('results', 'Result Set').toJS().rows;
		for(var i=0; i < z.length; i++) {
			$('#process_select').append('<option value="' + z[i][0] + '">' + z[i][0] + '</option>');
		}
	}catch(err){
		handleError(err);
		return null;
	}
	
}

async function getColumnDetails(){

	let payload = {
		action: 'table.columnInfo',
		data  : {'table': { 'name': getSelectedTable(), 'caslib': getSelectedCaslib(), 'computedOnDemand':true}}
	}

	try{
		let tableDetail = await store.runAction(currentSession, payload);
		return tableDetail.items('results', 'ColumnInfo').toJS().rows;
	}catch(err){
		handleError(err);
		return null;
	}
	
}


async function f_getColumnDetails(table,filtervars){

	let payload = {
		action: 'table.columnInfo',
		data  : {'table': { 'name': table, 'caslib': getSelectedCaslib(), 'computedOnDemand':true}}
	}

	try{
		let tableDetail = await store.runAction(currentSession, payload);
		let rows = tableDetail.items('results', 'ColumnInfo').toJS().rows;
		let fiter_rows = [];
		for(var i=0; i<rows.length; i++){
			if (filtervars.includes(rows[i][0] ))
			{
				filter_rows.push(rows[i])
			};
		}
		return filter_rows;
	}catch(err){
		handleError(err);
		return null;
	}
	
}

function getTableRow(index){
	
	for(var i=0; i < table_rows.length; i++){
		if(table_rows[i][0] === index)
			return table_rows[i];
	}
	
	return null;
}

function setTableRows(rows){
	table_rows = rows;
}

function getTableRows(){
	return table_rows;
}

function setColumnData(schema){

	column_data = [];
	for(var i=0; i < schema.length; i++){
		column_data.push(new SASColumn(schema[i].name, schema[i].label, schema[i].width, schema[i].type, true, true));
	}
	
}

function getColumnData(){
	return column_data;
}

function getSelectedCaslib(){
	return $('#caslib_select').val();
}

function getSelectedProcess(){
	return $('#process_select').val();
}

function getSelectedTable(){
	return $('#table_select').val();
}

function SASColumn(name, label, width, type, orderable, visible){
	
	this.title=name;
	this.label=label;
	this.width=width;
	this.type=type;
	this.orderable=orderable;
	this.visible=visible;
	
}

/**
*
*	Cleanup a selector
*
**/
function cleanupSelector(selectorid){

	$("#" + selectorid + " option").each(function(){
		if(this.value != '') this.remove();
	});

}

/**
*
*	Global function to handle any errors tha occur
*
**/
function handleError(err){

	var errorList = JSON.parse(err).logEntries;

	var errMessage = '';
	for(var i=0; i < errorList.length; i++){
		errMessage += errorList[i].message + '<br>';
	}

	$("#status_message").empty().append('<div class="alert alert-danger alert-dismissible col-sm-12" role="alert"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + errMessage + '</div>');
	console.error(err);

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

async function runSASCode_basic(){
	var code = 'filename mdlfldr filesrvc folderpath= "/Public/Shared/Sean Ford";';
	macros={'make':'Acura'}
	code += '%include mdlfldr("sql_macro.sas");';
	code += '%carmake(make = ' + "Acura" + ');';

	runCode(code);
}

async function runSASCode(){
	let code = gen_init_code(code_fpath, 'compute_process_data.sas');
	code += '%compute_process_data(process=' + getSelectedProcess() + ');';

	runCode(code);
}