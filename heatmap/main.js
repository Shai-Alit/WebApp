var currentSession = null;
var computeSession = null;
var viyahost = window.location.origin;
var logged_user;
var caslibName = 'seford_s'
var casTableName = 'SILICONWAFER_26x26';

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

function init(){

	appInit().then ( session => {
		currentSession = session;
		setFailureTypeDropdown('-all-');
        setLotDropdown('-all-');
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

async function setFailureTypeDropdown(lot_selection) {

    let caslib= caslibName;
    let castable= casTableName;
    let query = createQuery(caslib, castable, 'failureType',use_distinct=true, where_clause=undefined, order_by='ASC');
    /**let query={'query': 'select distinct failureType from ' + caslib + '.' + castable + " ORDER BY failureType"};**/

    if (lot_selection != "-all-"){
        query = createQuery(caslib, castable, 'failureType',use_distinct=true, where_clause='lotName=\'' + lot_selection + "\'", order_by='ASC');
        /**query={'query': 'select distinct failureType from ' + caslib + '.' + castable + " WHERE lotName=" + lot_selection};**/
    }
    
	let p = {
		action: 'fedSql.execDirect',
		data  : query
	}
	
	try{
		let records = await store.runAction(currentSession, p);
		let z = records.items('results', 'Result Set').toJS().rows;
        $('#failureTypeDropdown').empty();
        $('#failureTypeDropdown').append('<option value="-all-">-all-</option>');
		for(var i=0; i < z.length; i++) {
			$('#failureTypeDropdown').append('<option value="' + z[i][0] + '">' + z[i][0] + '</option>');
		}
	}catch(err){
		console.log(err);
		return null;
	}

}

function failureTypeDropdownFunction() {
    let failure_selection=$('#failureTypeDropdown').val();
    let lot_selection=$('#lotDropdown').val();
    if (lot_selection == '-all-'){
        setLotDropdown(failure_selection);
    }
    
    setWaferDropdown(lot_selection,failure_selection);
}

async function setLotDropdown(failure_selection) {

    let caslib= caslibName;
    let castable= casTableName;
    let query = createQuery(caslib, castable, 'lotName',use_distinct=true, where_clause=undefined, order_by='ASC');
    if (failure_selection != "-all-"){
        query = createQuery(caslib, castable, 'lotName',use_distinct=true, where_clause='failureType=\'' + failure_selection + '\'', order_by='ASC');
    }
    
	let p = {
		action: 'fedSql.execDirect',
		data  : query
	}
	
	try{
		let records = await store.runAction(currentSession, p);
		let z = records.items('results', 'Result Set').toJS().rows;
        $('#lotDropdown').empty();
        $('#lotDropdown').append('<option value="-all-">-all-</option>');
		for(var i=0; i < z.length; i++) {
			$('#lotDropdown').append('<option value="' + z[i][0] + '">' + z[i][0] + '</option>');
		}
	}catch(err){
		console.log(err);
		return null;
	}

}

function lotDropdownFunction() {
    let lot_selection=$('#lotDropdown').val();
    let failure_selection=$('#failureTypeDropdown').val();
    if (failure_selection == '-all-'){
        setFailureTypeDropdown(lot_selection);
    }
    
    setWaferDropdown(lot_selection,failure_selection);
}


async function setWaferDropdown(lot_selection,failure_selection) {

    let caslib = caslibName;
    let castable = casTableName;
    let whereclause = undefined;
    let query = undefined;

    if (failure_selection == "-all-" && lot_selection == "-all"){
        $('#waferDropdown').empty();
        $( "#display_wafer_heatmap" ).prop( "disabled", true );
    }
    else{
        if (failure_selection != "-all-"){
            whereclause = where_clause='failureType=\'' + failure_selection + '\'';
        }
        if (lot_selection != '-all'){
            if (failure_selection != "-all-"){ 
                whereclause += ' AND ';
            }
            whereclause += 'lotName=\'' + lot_selection + "\'";
        }

        query = createQuery(caslib, castable, 'index', use_distinct=true, where_clause=whereclause, order_by='ASC');
        
        let p = {
            action: 'fedSql.execDirect',
            data  : query
        }
        
        try{
            let records = await store.runAction(currentSession, p);
            let z = records.items('results', 'Result Set').toJS().rows;
            $('#waferDropdown').empty();
            $('#waferDropdown').append('<option value="select_one">Select One</option>');
            for(var i=0; i < z.length; i++) {
                $('#waferDropdown').append('<option value="' + z[i][0] + '">' + z[i][0] + '</option>');
            }
        }catch(err){
            console.log(err);
            return null;
        }
    }

}

function waferDropdownFunction() {
    

    let wafer_selection=$('#waferDropdown').val();
    if (wafer_selection == "Select One"){
        $( "#display_wafer_heatmap" ).prop( "disabled", true );
    }
    else {
        $( "#display_wafer_heatmap" ).prop( "disabled", false );
    }
    
}


async function displayWaferHeatmap(){
    let wafer_selection=$('#waferDropdown').val();
    let caslib = caslibName;
    let castable = casTableName;
    let whereclause = 'index=' + wafer_selection;

    /* TODO - dynamically get indices by column name so that data element doesn't get screwed up if table changes
    let col_query = {'query' : ' SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ' + caslib + '.' + castable};

    let p1 = {
      action: 'fedSql.execDirect',
      data  : col_query
    }

    let records1 = await store.runAction(currentSession, p1);
    let z1 = records1.items('results', 'Result Set').toJS().rows;

    console.log(z1);
    
    console.log(z1[0].indexOf('waferMapstring'));
    */

    let query = {'query' : 'SELECT * FROM ' + caslib + '.' + castable + ' WHERE ' + whereclause};

    let p = {
        action: 'fedSql.execDirect',
        data  : query
    }

    let records = await store.runAction(currentSession, p);
    let z = records.items('results', 'Result Set').toJS().rows;

    let jsondata={
      "data_index": z[0][0],
        "dieSize": z[0][1],
        "lotName": z[0][2],
        "waferIndex": z[0][3],
        "trainTestLabel": z[0][4],
        "failureType": z[0][5],
        "waferMap": JSON.parse(z[0][8])
    }

      d3heatmap(jsondata);
}

function d3heatmap(jsondata){

  let options={
    container: "#my_dataviz",
    startColor: "#21A38B",
    endColor: "#FC7C89",
  }


// set the dimensions and margins of the graph
const margin = {top: 80, right: 25, bottom: 30, left: 40},
  width = 550 - margin.left - margin.right,
  height = 550 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select(options.container)
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);


  let dieSize = jsondata['dieSize'];
  let lotName = jsondata['lotName'];
  let waferIndex = jsondata['waferIndex'];

  var rowstart=1;
 var colstart=1;

 const numrows = jsondata['waferMap'].length;
 // assume all subarrays have same length
 const numcols = jsondata['waferMap'][0].length;

 let data = [];

 for (let i = 0; i < numrows; i++) {
   for (let j = 0; j < numcols; j++){
       data.push({group:rowstart + i, variable: colstart+j,value:jsondata['waferMap'][i][j]});
   }
 }

 // Find our max and min values
 const maxValue = d3.max(jsondata['waferMap'], (layer) => {
  return d3.max(layer, (d) => {
    return d;
  });
});
const minValue = d3.min(jsondata['waferMap'], (layer) => {
  return d3.min(layer, (d) => {
    return d;
  });
});






const myGroups = Array.from(new Set(data.map(d => d.group)))
const myVars = Array.from(new Set(data.map(d => d.variable)))

// Build X scales and axis:
const x = d3.scaleBand()
.range([ 0, width ])
.domain(myGroups)
.padding(0.05);
svg.append("g")
.style("font-size", 15)
.attr("transform", `translate(0, ${height})`)
.call(d3.axisBottom(x).tickSize(0))
.select(".domain").remove()

// Build Y scales and axis:
const y = d3.scaleBand()
.range([ height, 0 ])
.domain(myVars)
.padding(0.05);
svg.append("g")
.style("font-size", 15)
.call(d3.axisLeft(y).tickSize(0))
.select(".domain").remove()

// Build color scale
const myColor = d3.scaleLinear()
.domain([minValue, maxValue])
.range([options.startColor, options.endColor]);

// create a tooltip
var tooltip = d3.select(options.container)
.append("div")
.style("opacity", 0)
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")
.style("position", "absolute")

// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function(event,d) {
tooltip
.style("opacity", 1)
d3.select(this)
.style("stroke", "black")
.style("opacity", 1)
}

const mousemove = function(event,d) {
tooltip
.html("The exact value of<br>this cell is: " + d.value)
.style("left", (event.x) + "px")
.style("top", (event.y) + "px")
}

const mouseleave = function(event,d) {
tooltip
.style("opacity", 0)
d3.select(this)
.style("stroke", "none")
.style("opacity", 0.8)
}

// add the squares
svg.selectAll()
.data(data, function(d) {return d.group+':'+d.variable;})
.join("rect")
.attr("x", function(d) { return x(d.group) })
.attr("y", function(d) { return y(d.variable) })
.attr("rx", 4)
.attr("ry", 4)
.attr("width", x.bandwidth() )
.attr("height", y.bandwidth() )
.style("fill", function(d) { return myColor(d.value)} )
.style("stroke-width", 4)
.style("stroke", "none")
.style("opacity", 0.8)
.on("mouseover", mouseover)
.on("mousemove", mousemove)
.on("mouseleave", mouseleave)


// Add title to graph
svg.append("text")
  .attr("x", 0)
  .attr("y", -50)
  .attr("text-anchor", "left")
  .style("font-size", "22px")
  .text("Wafer Heatmap");

// Add subtitle to graph
svg.append("text")
  .attr("x", 0)
  .attr("y", -20)
  .attr("text-anchor", "left")
  .style("font-size", "14px")
  .style("fill", "grey")
  .style("max-width", 400)
  .text("Wafer Details: die size = " + dieSize + ", lot name = " + lotName + ', wafer index = ' + waferIndex);
}
