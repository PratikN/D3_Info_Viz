var w = 1100, h = 400;
var margin = {top: 30, right: 100, bottom: 10, left: 10},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

 var color_hash = {  "USA" : "#84B1ED",
            "United Kingdom" : "#67D5B5",
            "Switzerland" : "#C89EC4",
            "Canada" : "#EE7785"
          }

var svg = d3.select("#parallelGraph").append("svg")
    .attr("width", w)
    .attr("height", h)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Create tooltip
var parTooltip = d3.select("#parallelGraph").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("timesDataPar.csv", function(error, rankings) {

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(rankings[0]).filter(function(d) {
    if (d == "Rank" || d == "Year") {
      return d != "name" && (y[d] = d3.scale.linear()
        .domain(d3.extent(rankings, function(p) { return +p[d]; }))
        .range([0, height]));
    }
    else if (d =="Country" || d == "University") {
      return;
    }
    else return d != "name" && (y[d] = d3.scale.linear()
        .domain(d3.extent(rankings, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(rankings)
    .enter().append("path")
      .attr("d", path);

  // Add foreground lines for focus.
  foreground = svg.append("g")
    .selectAll("path")
    .data(rankings)
    .enter().append("path")
    .attr("d", path).attr("stroke",function (d) {
      return color_hash[d.Country];
    })
    .attr("stroke-width",1.5)
    .attr("fill","none")
    .attr("opacity", 0.8)
    .on("mouseover", function(d) {
          parTooltip.transition()
              .duration(200)
              .style("opacity", .9);
          parTooltip.html("<strong>Name</strong>: "+d.University + "<br/><strong>Country</strong>: "+ d.Country + "<br/><strong>Rank</strong>: "+ d.Rank)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY) + "px");
          })
      .on("mouseout", function(d) {
          parTooltip.transition()
              .duration(500)
              .style("opacity", 0);
      });

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return {x: x(d)}; })
        .on("dragstart", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { return position(a) - position(b); });
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("dragend", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
        }));

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d]).ticks(6).tickFormat(d3.format("d"))); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

});



// add legend
var legend = svg.append("g")
  .attr("class", "legend")
  .attr("height", 200)
  .attr("width", 100)
  .attr("transform", "translate("+(w-150)+",50)")
  .style("font-size","12px");

svg.selectAll("text")
  .data(["Click legend squares to", "hide/show countries:"])
  .enter()
  .append("text")
  .attr("x",w-150)
  .attr("y",function(d, i){return i * 20 + 50;})
  .text(function (d) {return d;})
  .style("font-size","12px");

  var countries = ["USA", "United Kingdom", "Switzerland", "Canada"];
  var hide = [false, false, false, false];
  legend.selectAll('rect')
    .data(countries)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d, i){ return i *  25 + 35;})
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", function(d) {
      return color_hash[d];
    })
    .on("click", function(d, i) {

      hide[i] = !hide[i];
      if (hide[i]) {
        d3.select(this)
          .transition()
          .style("opacity", 0.1)
          .duration(800);
        foreground.transition()
            .filter(function(d) { console.log(d); return d.Country == countries[i]; })
            .duration(800)
            .attr("opacity", 0.1);
      }
      else {
        d3.select(this)
          .transition()
          .style("opacity", 1)
          .duration(800);
        foreground.transition()
            .filter(function(d) { console.log(d); return d.Country == countries[i]; })
            .duration(800)
            .attr("opacity", 0.8);
      }
    });

  legend.selectAll("text")
    .data(countries)
    .enter()
    .append("text")
    .attr("x", 25)
    .attr("y", function(d, i) { return i *  25 + 48;})
    .text(function(d) {
      return d;
    });

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}
