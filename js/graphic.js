var circleSize = 70;

var colors = {
    'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
    'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
    'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
    'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
    'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
};

/*
 * Render the graphic
 */
//check for svg
function draw_graphic(){
    if (Modernizr.svg){
        $('#map').empty();
        var width = $('#map').width();
        render(width);
        //window.onresize = draw_graphic; /
        //very important! the key to responsiveness
    }
}

function render(width) {

 //leaflet stuff

    //make a map                        
    var map = new L.Map("map", {
        center: [38, -121.607], //lat, long, not long, lat
        zoom: 9,
        scrollWheelZoom: false}) 
        .addLayer(new L.TileLayer("http://api.tiles.mapbox.com/v4/nbclocal.dea06b45/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibmJjbG9jYWwiLCJhIjoiS3RIUzNQOCJ9.le_LAljPneLpb7tBcYbQXQ", {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    }));

    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    // var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");


    //get topojson
    var collection = topojson.feature(levees, levees.objects.levees);

    //convert geojson to svg
    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

    //reset paths on zoom 
    map.on("viewreset", reset);

    //leaflet implements the geometric transformation
    function projectPoint(x,y){
        var point = map.latLngToLayerPoint(new L.LatLng(y,x));
        this.stream.point(point.x, point.y);
    }

    //this is called on reset
    function reset(){
        console.log("reset fired")
        bounds = path.bounds(collection);

        var topLeft = bounds[0],
            bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");
        
        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        // //rebuild path
        d3.selectAll(".levees").remove();
        buildLevees();


    }

    /////colors/////

    colors.low = colors.ld;
    colors.moderate = colors.ld;
    colors.high = "#BF0800";
    colors.ld = "#08965D";

    //add color to levee data
    collection.features.forEach(function(d){
        switch (d.properties.OVERALL){
            case "A":
                d.properties.COLOR = colors.low;
                break;
            case "B":
                d.properties.COLOR = colors.moderate;
                break;
            case "C":
                d.properties.COLOR = colors.high;
                break;
            default:
                d.properties.COLOR = colors.ld;
        }
    });

    //collection > features > properties
    console.log(collection.features);


    function buildLevees(){

        //data join to path.levees
        var leveeFeatures = g.selectAll("path")
            .data(collection.features)
            .enter().append("path").attr("class", "levees");

        //build lines with no fill
        leveeFeatures.attr("d", path).style("fill", "none")
            .transition()
            .delay( function(d,i){ return i * 1.1; })
            .duration(300)
            .style("stroke", function(d) { return d.properties.COLOR; })
            .style("stroke-width", 2.0);

        leveeFeatures
            .on("click", clickForFeatures);
    }

    reset();


    //////////////end tooltip//////////////

    //helper function sends properties to the console
    function clickForFeatures(d){ console.log(d.properties);}
   
    //my helper function
    map.on("click", showLocation);

    function showLocation(e){
        console.log(e.latlng);
    }

    

    

    /////////////key//////////////

    //set up second svg for legend
    var legend = d3.select("#map").append("svg")
        .attr("class", "legendSVG")
        .attr("width", 350)
        .attr("height", 115);

    //is the legend full or not
    var indicator = "full";
    //function that toggles disappearing legend
    var toggleSize = (function(){ 

        if (indicator != "full") {
            console.log("Evaluates true");
            $(".legendSVG").empty();
            buildLegend();
            indicator = "full";
        }
        else { 
            console.log("evaluates false");
            console.log("indicator")
            collapse();
            indicator = "" }



        function collapse(){
            $(".legendSVG").empty();

            legend.append("rect")
                .style("fill", "white")
                .attr("width", 50)
                .attr("height", 50)
                .attr("x", "50")
                .attr("y", "2")
                .style("opacity", 0.9);

            var newGroup = legend.append("g")
                .attr("transform", "translate(60, 13)");

            newGroup.append("svg:foreignObject")
                .attr("width", 20)
                .attr("height", 20)
                .append("xhtml:span")
                .attr("class", "glyphicon glyphicon-resize-full")
                .style("font-size", 50)
                .on("click", toggleSize);
        }//end function collapse

    });

    
    //attach toggle to legend
    legend
        .on("click", toggleSize);



    //build out legend
    function buildLegend(){
        legend.append("rect")
            .attr("class", "legendRect")
            .style("fill", "white")
            .attr("width", 260)
            .attr("height", 100)
            .attr("x", "50")
            .attr("y", "2")
            .style("opacity", 0.98);

        legend.append("g")
                .attr("class", "legendKey")
            .selectAll("g")
                .data([{"color": colors.high, "text": "Hazard Rating: High"}, {"color": colors.ld, "text": "Hazard Rating: Moderate or Lower"}])
                .enter().append("g")
                .attr("class", "colorsGroup")
                .attr("transform", "translate(75, 30)");

        //some key values that i'll repeat
        var keyRadius = 15;
        //make the circles
        legend.selectAll(".colorsGroup").append("line")
            .attr("x1", -15)
            .attr("y1", 15)
            .attr("x2", 20)
            .attr("y2", -20)
            .style("stroke-width", 10.0)
            .attr("transform", function(d,i) { return "translate(0," + 45 * i + ")"; })
            .style("stroke", function(d){ return d.color; });

        //add annotations
        legend.selectAll(".colorsGroup").append("text")
            .style("font-size", 13)
            .attr("x", keyRadius*1.5)
            .attr("y", function(d,i){ return keyRadius*3 * i + 5;})
            .text(function(d){return d.text;});

    }//end of build legend

    buildLegend();

} //end render

/*
 * NB: Use window.load instead of document.ready
 * to ensure all images have loaded
 */
$(window).load(function() {
    draw_graphic();
});






