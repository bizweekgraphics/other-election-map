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
    var winnerName = [winner.first, winner.last].join(' ');

    return '<span class="winner-name">' + winnerName + '</span>' + '<span style="color:' + partyScale(winner.party) + '">' + winner.party + '</span>'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3NjcmlwdHMvbWFwLmpzJykoKVxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3aWR0aCA9IDk2MCxcbiAgICAgIGhlaWdodCA9IDY1MCxcbiAgICAgIGNlbnRlcmVkO1xuXG4gIHZhciB0aXAgPSBkMy50aXAoKVxuICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgIC5odG1sKHRvb2x0aXBIdG1sKTtcblxuICB2YXIgcGFydHlTY2FsZSA9IGQzLnNjYWxlLmNhdGVnb3J5MjAoKTtcblxuICB2YXIgcHJvamVjdGlvbiA9IGQzLmdlby5hbGJlcnNVc2EoKVxuICAgICAgLnNjYWxlKDEyODApXG4gICAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKTtcblxuICB2YXIgcGF0aCA9IGQzLmdlby5wYXRoKClcbiAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJ2JvZHknKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAuY2FsbCh0aXApXG5cbiAgc3ZnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgICAgLm9uKFwiY2xpY2tcIiwgY2xpY2tlZClcblxuICB2YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gIHF1ZXVlKClcbiAgICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cy5qc29uJylcbiAgICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgICAvLyAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXNfYW5kX3JhY2VzLmpzb24nKVxuICAgICAgLmF3YWl0KHJlYWR5KTtcblxuICBmdW5jdGlvbiByZWFkeShlcnJvciwgdXMsIHJhY2VzQXJyYXkpIHtcbiAgICByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXNcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50aWVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShhZGRSYWNlc1RvVXModXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHknKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkLnJhY2UgJiYgZC5yYWNlLmxlbmd0aCA+IDAgPyAnI0ZFRicgOiAnI0ZFRidcbiAgICAgICAgfSlcbiAgICAgICAgLy8gLnN0eWxlKCdmaWxsJywgJ3VybCgjY3Jvc3NoYXRjaCknKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBzZXRGaWxsKVxuICAgICAgICAvLyAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhkKVxuICAgICAgICAvLyB9KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIHRpcC5zaG93KVxuICAgICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgIC8vIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgIC8vICAgICAuZGF0dW0odG9wb2pzb24ubWVzaChzdGF0ZXMsIHN0YXRlcy5vYmplY3RzLnN0YXRlcywgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSkpXG4gICAgLy8gICAgIC5hdHRyKCdjbGFzcycsICdzdGF0ZXMnKVxuICAgIC8vICAgICAuYXR0cignZCcsIHBhdGgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0RmlsbChkKSB7XG4gICAgaWYoZC5yYWNlWzBdICYmIGQucmFjZVswXS5yZXBvcnRpbmdVbml0cykge1xuICAgICAgdmFyIHdpbm5lciA9IGdldFdpbm5lcihkKTtcbiAgICAgIHJldHVybiB3aW5uZXIucGFydHkgPyBwYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgOiAndXJsKCNjcm9zc2hhdGNoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnd2hpdGUnXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0V2lubmVyKGQpIHtcbiAgICBpZihkLnJhY2VbMF0gJiYgZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzKSB7XG4gICAgICByZXR1cm4gIF8ubWF4KGQucmFjZVswXS5yZXBvcnRpbmdVbml0c1swXS5jYW5kaWRhdGVzLCBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS52b3RlQ291bnRcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tlZChkKSB7XG4gICAgdmFyIHgsIHksIGs7XG5cbiAgICBpZiAoZCAmJiBjZW50ZXJlZCAhPT0gZCkge1xuICAgICAgdmFyIGNlbnRyb2lkID0gcGF0aC5jZW50cm9pZChkKTtcbiAgICAgIHggPSBjZW50cm9pZFswXTtcbiAgICAgIHkgPSBjZW50cm9pZFsxXTtcbiAgICAgIGsgPSA0O1xuICAgICAgY2VudGVyZWQgPSBkO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gd2lkdGggLyAyO1xuICAgICAgeSA9IGhlaWdodCAvIDI7XG4gICAgICBrID0gMTtcbiAgICAgIGNlbnRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmNsYXNzZWQoXCJhY3RpdmVcIiwgY2VudGVyZWQgJiYgZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gY2VudGVyZWQ7IH0pO1xuXG4gICAgZy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDc1MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB3aWR0aCAvIDIgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilzY2FsZShcIiArIGsgKyBcIil0cmFuc2xhdGUoXCIgKyAteCArIFwiLFwiICsgLXkgKyBcIilcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEuNSAvIGsgKyBcInB4XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9vbHRpcEh0bWwoZCkge1xuICAgIHZhciB3aW5uZXIgPSBnZXRXaW5uZXIoZCk7XG4gICAgdmFyIHdpbm5lck5hbWUgPSBbd2lubmVyLmZpcnN0LCB3aW5uZXIubGFzdF0uam9pbignICcpO1xuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lck5hbWUgKyAnPC9zcGFuPicgKyAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgcGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPidcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlcG9ydGluZ1VuaXRGcm9tRmlwc0NvZGUocmFjZXMsIGZpcHNDb2RlKSB7XG4gICAgcmV0dXJuIHJhY2VzLmZpbHRlcihmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5yZXBvcnRpbmdVbml0c1swXS5maXBzQ29kZSA9PT0gZmlwc0NvZGVcbiAgICB9KVxuICB9IFxuXG4gIGZ1bmN0aW9uIGFkZFJhY2VzVG9Vcyh1cywgcmFjZXMpIHtcbiAgICB2YXIgZmVhdHVyZXMgPSB0b3BvanNvbi5mZWF0dXJlKHVzLCB1cy5vYmplY3RzLmNvdW50aWVzKS5mZWF0dXJlc1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICBmZWF0dXJlLnJhY2UgPSBnZXRSZXBvcnRpbmdVbml0RnJvbUZpcHNDb2RlKHJhY2VzLCBmZWF0dXJlLmlkLnRvU3RyaW5nKCkpXG4gICAgICByZXR1cm4gZmVhdHVyZVxuICAgIH0pXG5cbiAgfVxuXG4gIGQzLnNlbGVjdChzZWxmLmZyYW1lRWxlbWVudCkuc3R5bGUoJ2hlaWdodCcsIGhlaWdodCArICdweCcpO1xufVxuIl19
