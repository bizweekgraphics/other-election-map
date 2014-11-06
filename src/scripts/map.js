var $ = require('jquery');
var d3 = require('d3');
var queue = require('queue-async');
var topojson = require('topojson');
var _ = require('underscore');

module.exports = function() {
  var width = 960,
      height = 600;


  var projection = d3.geo.albersUsa()
      .scale(1280)
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select('body').append('svg')
      .attr('width', width)
      .attr('height', height);

  queue()
      .defer(d3.json, '/data/us_and_races.json')
      .await(ready);

  function ready(error, us) {

    svg.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(us)
      .enter().append('path')
        .attr('d', path)
        .style('stroke', function(d) {
          console.log(d)
          return d.race && d.race.length > 0 ? '#0f0' : 'magenta'
        });

    // svg.append('path')
    //     .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    //     .attr('class', 'states')
    //     .attr('d', path);
  }

  d3.select(self.frameElement).style('height', height + 'px');
}
