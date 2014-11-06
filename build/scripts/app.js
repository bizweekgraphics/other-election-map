(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./scripts/map.js')()

},{"./scripts/map.js":2}],2:[function(require,module,exports){
var d3 = require('d3');
d3.tip = require('./vendor/d3-tip')(d3);
var queue = require('queue-async');
var topojson = require('topojson');
var _ = require('underscore');

module.exports = function() {
  var width = 960,
      height = 650,
      centered;

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(tooltipHtml);

  var partyScale = d3.scale.category20();

  var projection = d3.geo.albersUsa()
      .scale(1280)
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select('body').append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(tip)

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height)
      .on("click", clicked)

  var g = svg.append("g");

  queue()
      .defer(d3.json, 'data/us.json')
      .defer(d3.json, 'data/updated_senate_by_county.json')
      // .defer(d3.json, 'data/us_and_races.json')
      .await(ready);

  function ready(error, us, racesArray) {
    races = racesArray.races

    g.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(addRacesToUs(us, races))
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('stroke', function(d) {
          return d.race && d.race.length > 0 ? '#FEF' : '#FEF'
        })
        // .style('fill', 'url(#crosshatch)')
        .style('fill', setFill)
        // .on('mouseover', function(d) {
        //   console.log(d)
        // })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('click', clicked);

    // svg.append('path')
    //     .datum(topojson.mesh(states, states.objects.states, function(a, b) { return a !== b; }))
    //     .attr('class', 'states')
    //     .attr('d', path);
  }

  function setFill(d) {
    if(d.race[0] && d.race[0].reportingUnits) {
      var winner = getWinner(d);
      return winner.party ? partyScale(winner.party) : 'url(#crosshatch)';
    } else {
      return 'white'
    }
  }

  function getWinner(d) {
    if(d.race[0] && d.race[0].reportingUnits) {
      return  _.max(d.race[0].reportingUnits[0].candidates, function(candidate) {
        return candidate.voteCount
      })
    }
  }

  function clicked(d) {
    var x, y, k;

    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    g.selectAll("path")
        .classed("active", centered && function(d) { return d === centered; });

    g.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");
  }

  function tooltipHtml(d) {
    var winner = getWinner(d);

    return '<span class="winner-name">' + winner.name + '</span>' + '<span style="color:' + partyScale(winner.party) + '">' + winner.party + '</span>'
  }

  function getReportingUnitFromFipsCode(races, fipsCode) {
    return races.filter(function(race) {
      return race.reportingUnits[0].fipsCode === fipsCode
    })
  } 

  function addRacesToUs(us, races) {
    var features = topojson.feature(us, us.objects.counties).features

    return features.map(function(feature) {
      feature.race = getReportingUnitFromFipsCode(races, feature.id.toString())
      return feature
    })

  }

  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi9zY3JpcHRzL21hcC5qcycpKClcbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkdGggPSA5NjAsXG4gICAgICBoZWlnaHQgPSA2NTAsXG4gICAgICBjZW50ZXJlZDtcblxuICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAuaHRtbCh0b29sdGlwSHRtbCk7XG5cbiAgdmFyIHBhcnR5U2NhbGUgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgIC5zY2FsZSgxMjgwKVxuICAgICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSk7XG5cbiAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCdib2R5JykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgLmNhbGwodGlwKVxuXG4gIHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgIC5vbihcImNsaWNrXCIsIGNsaWNrZWQpXG5cbiAgdmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcblxuICBxdWV1ZSgpXG4gICAgICAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXMuanNvbicpXG4gICAgICAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXBkYXRlZF9zZW5hdGVfYnlfY291bnR5Lmpzb24nKVxuICAgICAgLy8gLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzX2FuZF9yYWNlcy5qc29uJylcbiAgICAgIC5hd2FpdChyZWFkeSk7XG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHVzLCByYWNlc0FycmF5KSB7XG4gICAgcmFjZXMgPSByYWNlc0FycmF5LnJhY2VzXG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudGllcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYWRkUmFjZXNUb1VzKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnR5JylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZC5yYWNlICYmIGQucmFjZS5sZW5ndGggPiAwID8gJyNGRUYnIDogJyNGRUYnXG4gICAgICAgIH0pXG4gICAgICAgIC8vIC5zdHlsZSgnZmlsbCcsICd1cmwoI2Nyb3NzaGF0Y2gpJylcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgc2V0RmlsbClcbiAgICAgICAgLy8gLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIC8vICAgY29uc29sZS5sb2coZClcbiAgICAgICAgLy8gfSlcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aXAuc2hvdylcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKVxuICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAvLyBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAvLyAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2goc3RhdGVzLCBzdGF0ZXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGVzJylcbiAgICAvLyAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEZpbGwoZCkge1xuICAgIGlmKGQucmFjZVswXSAmJiBkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHMpIHtcbiAgICAgIHZhciB3aW5uZXIgPSBnZXRXaW5uZXIoZCk7XG4gICAgICByZXR1cm4gd2lubmVyLnBhcnR5ID8gcGFydHlTY2FsZSh3aW5uZXIucGFydHkpIDogJ3VybCgjY3Jvc3NoYXRjaCknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3doaXRlJ1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFdpbm5lcihkKSB7XG4gICAgaWYoZC5yYWNlWzBdICYmIGQucmFjZVswXS5yZXBvcnRpbmdVbml0cykge1xuICAgICAgcmV0dXJuICBfLm1heChkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHNbMF0uY2FuZGlkYXRlcywgZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGUudm90ZUNvdW50XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrZWQoZCkge1xuICAgIHZhciB4LCB5LCBrO1xuXG4gICAgaWYgKGQgJiYgY2VudGVyZWQgIT09IGQpIHtcbiAgICAgIHZhciBjZW50cm9pZCA9IHBhdGguY2VudHJvaWQoZCk7XG4gICAgICB4ID0gY2VudHJvaWRbMF07XG4gICAgICB5ID0gY2VudHJvaWRbMV07XG4gICAgICBrID0gNDtcbiAgICAgIGNlbnRlcmVkID0gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IHdpZHRoIC8gMjtcbiAgICAgIHkgPSBoZWlnaHQgLyAyO1xuICAgICAgayA9IDE7XG4gICAgICBjZW50ZXJlZCA9IG51bGw7XG4gICAgfVxuXG4gICAgZy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5jbGFzc2VkKFwiYWN0aXZlXCIsIGNlbnRlcmVkICYmIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQgPT09IGNlbnRlcmVkOyB9KTtcblxuICAgIGcudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbig3NTApXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgd2lkdGggLyAyICsgXCIsXCIgKyBoZWlnaHQgLyAyICsgXCIpc2NhbGUoXCIgKyBrICsgXCIpdHJhbnNsYXRlKFwiICsgLXggKyBcIixcIiArIC15ICsgXCIpXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxLjUgLyBrICsgXCJweFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvb2x0aXBIdG1sKGQpIHtcbiAgICB2YXIgd2lubmVyID0gZ2V0V2lubmVyKGQpO1xuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lci5uYW1lICsgJzwvc3Bhbj4nICsgJzxzcGFuIHN0eWxlPVwiY29sb3I6JyArIHBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSArICdcIj4nICsgd2lubmVyLnBhcnR5ICsgJzwvc3Bhbj4nXG4gIH1cblxuICBmdW5jdGlvbiBnZXRSZXBvcnRpbmdVbml0RnJvbUZpcHNDb2RlKHJhY2VzLCBmaXBzQ29kZSkge1xuICAgIHJldHVybiByYWNlcy5maWx0ZXIoZnVuY3Rpb24ocmFjZSkge1xuICAgICAgcmV0dXJuIHJhY2UucmVwb3J0aW5nVW5pdHNbMF0uZmlwc0NvZGUgPT09IGZpcHNDb2RlXG4gICAgfSlcbiAgfSBcblxuICBmdW5jdGlvbiBhZGRSYWNlc1RvVXModXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5yYWNlID0gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmVhdHVyZS5pZC50b1N0cmluZygpKVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuXG4gIH1cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
