var currentSession = null;
var computeSession = null;
var viyahost = window.location.origin;
var logged_user;
var caslibName = 'seford_p'
var casTableName = 'SILICONWAFER';

var _resultData = null;
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

function disableExamineButton(prop){
  if (prop == true || prop == false){
    $( "#display_wafer_heatmap" ).prop( "disabled", prop );
  }
}

function clearTable(){
  $(tableID + ' tbody tr').remove();
  disableExamineButton(true);
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

  let rows = '<td>' + rowData['lotName'] + '</td>';
      rows += '<td>' + rowData['waferIndex'] + '</td>';
      rows += '<td>' + rowData['index'] + '</td>';

  $(tableID + ' > tbody:last-child').append('<tr>' + rows + '</tr>');
  disableExamineButton(false);
}

async function displayWaferHeatmap(){
    d3.select("#my_dataviz1").selectAll("div").remove();
    d3.select("#my_dataviz2").selectAll("div").remove();

    let caslib = caslibName;
    let castable = casTableName;
    
    let dataviz = 0;

    /*get wafer indices */
    $(tableID + ' tbody tr').each(async function() {
      
      dataviz++;

      var wafer_selection = $(this).find("td").eq(2).html();    
  
      let whereclause = 'index=' + wafer_selection;

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
          "waferMap": JSON.parse(z[0][7])
      }
      let options={
        container: "#my_dataviz" + dataviz,
        startColor: "#21A38B",
        endColor: "#FC7C89",
      }

       d3heatmap(jsondata,options);

    }); //end async function for each
}

function handleZoom(e){
  d3.select('svg g')
    .attr('transform',e.transform);
}

let zoom1 = d3.zoom()
  .on('zoom',handleZoom);

  let zoom2 = d3.zoom()
  .on('zoom',handleZoom);


function d3heatmap(jsondata, options){



   //CREATE SVG AND A G PLACED IN THE CENTRE OF THE SVG
   const div = d3.select(options.container).append("div");


// set the dimensions and margins of the graph
const margin = {top: 80, right: 25, bottom: 30, left: 40},
  width = 550 - margin.left - margin.right,
  height = 550 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = div
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

  if (options.container == '#my_dataviz1'){
    d3.select('svg') 
    .call(zoom1);
  }
  else{
    d3.select('svg') 
    .call(zoom2);
  }


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
/*const mouseover = function(event,d) {
tooltip
.style("opacity", 1)
d3.select(this)
.style("stroke", "black")
.style("opacity", 1)
}*/

const mouseover = function(event,d) {
  tooltip
  .style("opacity", 1)
  .html("The exact value of<br>this cell is: " + d.value)
  .style("left", (window.pageXOffset  + event.x -25) + "px")
  .style("top", (window.pageYOffset  + event.y + 10) + "px")
  d3.select(this)
  .style("stroke", "black")
  .style("opacity", 1)
  
  }



const mousemove = function(event,d) {
  /*const[x,y] = d3.pointer(event);
tooltip
.html("The exact value of<br>this cell is: " + d.value)
.style("left", (event.x - 25) + "px")
.style("top", (event.y + 10) + "px")
*/
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
