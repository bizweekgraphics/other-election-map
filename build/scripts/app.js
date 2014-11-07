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
        .attr('d', function(d) {
          if(d.id < 2013 || d.id > 2291) {
            return path(d)
          }
        })
        .style('fill', setFill)
        .on('mouseover', function(d) {
          if(d.race[0].reportingUnits[0].candidates.length > 0) {
            tip.show(d)          
          }
        })
        .on('mouseout', tip.hide)
        .on('click', clicked);

    g.append('g')
      .attr('id', 'states')
      .selectAll('path')
        .data(setStateData(us, races))
      .enter().append('path')
        .attr('d', path)
        .attr('class', function(d) {
          return d.id === 2 ? "state alaska" : "state"
        });

    d3.select('.alaska')
      .style('fill', function(d) {
        return partyScale(d);
      })
      .style('fill', setFill)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .on('click', clicked);

    g.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'state-borders')
        .attr('d', path)

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
    // fipsCode = dealWithAlaska(fipsCode);
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

  function setStateData(us, races) {
    var features = topojson.feature(us, us.objects.states).features

    return features.map(function(feature) {
      if(feature.id === 2) {
        feature.race = getReportingUnitFromFipsCode(races, "2000")
      }
      return feature
    })
  }

  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi9zY3JpcHRzL21hcC5qcycpKClcbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkdGggPSA5NjAsXG4gICAgICBoZWlnaHQgPSA2NTAsXG4gICAgICBjZW50ZXJlZDtcblxuICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAuaHRtbCh0b29sdGlwSHRtbCk7XG5cbiAgdmFyIHBhcnR5U2NhbGUgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgIC5zY2FsZSgxMjgwKVxuICAgICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSk7XG5cbiAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCdib2R5JykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgLmNhbGwodGlwKVxuXG4gIHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgIC5vbihcImNsaWNrXCIsIGNsaWNrZWQpXG5cbiAgdmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLy8gLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzX2FuZF9yYWNlcy5qc29uJylcbiAgICAuYXdhaXQocmVhZHkpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5KGVycm9yLCB1cywgcmFjZXNBcnJheSkge1xuICAgIHJhY2VzID0gcmFjZXNBcnJheS5yYWNlc1xuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnRpZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKGFkZFJhY2VzVG9Vcyh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50eScpXG4gICAgICAgIC5hdHRyKCdkJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQuaWQgPCAyMDEzIHx8IGQuaWQgPiAyMjkxKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aChkKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgc2V0RmlsbClcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgaWYoZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzWzBdLmNhbmRpZGF0ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGlwLnNob3coZCkgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdpZCcsICdzdGF0ZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKHNldFN0YXRlRGF0YSh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGQuaWQgPT09IDIgPyBcInN0YXRlIGFsYXNrYVwiIDogXCJzdGF0ZVwiXG4gICAgICAgIH0pO1xuXG4gICAgZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIHBhcnR5U2NhbGUoZCk7XG4gICAgICB9KVxuICAgICAgLnN0eWxlKCdmaWxsJywgc2V0RmlsbClcbiAgICAgIC5vbignbW91c2VvdmVyJywgdGlwLnNob3cpXG4gICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICBnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHVzLCB1cy5vYmplY3RzLnN0YXRlcywgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdzdGF0ZS1ib3JkZXJzJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuXG4gIH1cblxuICBmdW5jdGlvbiBzZXRGaWxsKGQpIHtcbiAgICBpZihkLnJhY2VbMF0gJiYgZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzKSB7XG4gICAgICB2YXIgd2lubmVyID0gZ2V0V2lubmVyKGQpO1xuICAgICAgcmV0dXJuIHdpbm5lci5wYXJ0eSA/IHBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSA6ICd1cmwoI2Nyb3NzaGF0Y2gpJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICd3aGl0ZSdcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRXaW5uZXIoZCkge1xuICAgIGlmKGQucmFjZVswXSAmJiBkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHMpIHtcbiAgICAgIHJldHVybiAgXy5tYXgoZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzWzBdLmNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja2VkKGQpIHtcbiAgICB2YXIgeCwgeSwgaztcblxuICAgIGlmIChkICYmIGNlbnRlcmVkICE9PSBkKSB7XG4gICAgICB2YXIgY2VudHJvaWQgPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgeCA9IGNlbnRyb2lkWzBdO1xuICAgICAgeSA9IGNlbnRyb2lkWzFdO1xuICAgICAgayA9IDQ7XG4gICAgICBjZW50ZXJlZCA9IGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSB3aWR0aCAvIDI7XG4gICAgICB5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIGsgPSAxO1xuICAgICAgY2VudGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuY2xhc3NlZChcImFjdGl2ZVwiLCBjZW50ZXJlZCAmJiBmdW5jdGlvbihkKSB7IHJldHVybiBkID09PSBjZW50ZXJlZDsgfSk7XG5cbiAgICBnLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oNzUwKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHdpZHRoIC8gMiArIFwiLFwiICsgaGVpZ2h0IC8gMiArIFwiKXNjYWxlKFwiICsgayArIFwiKXRyYW5zbGF0ZShcIiArIC14ICsgXCIsXCIgKyAteSArIFwiKVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMS41IC8gayArIFwicHhcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGdldFdpbm5lcihkKTtcblxuICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPicgKyB3aW5uZXIubmFtZSArICc8L3NwYW4+JyArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBwYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+J1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmlwc0NvZGUpIHtcbiAgICAvLyBmaXBzQ29kZSA9IGRlYWxXaXRoQWxhc2thKGZpcHNDb2RlKTtcbiAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLnJlcG9ydGluZ1VuaXRzWzBdLmZpcHNDb2RlID09PSBmaXBzQ29kZVxuICAgIH0pXG4gIH0gXG5cbiAgZnVuY3Rpb24gYWRkUmFjZXNUb1VzKHVzLCByYWNlcykge1xuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuY291bnRpZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGZlYXR1cmUucmFjZSA9IGdldFJlcG9ydGluZ1VuaXRGcm9tRmlwc0NvZGUocmFjZXMsIGZlYXR1cmUuaWQudG9TdHJpbmcoKSlcbiAgICAgIHJldHVybiBmZWF0dXJlXG4gICAgfSlcblxuICB9XG5cbiAgZnVuY3Rpb24gc2V0U3RhdGVEYXRhKHVzLCByYWNlcykge1xuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuc3RhdGVzKS5mZWF0dXJlc1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICBpZihmZWF0dXJlLmlkID09PSAyKSB7XG4gICAgICAgIGZlYXR1cmUucmFjZSA9IGdldFJlcG9ydGluZ1VuaXRGcm9tRmlwc0NvZGUocmFjZXMsIFwiMjAwMFwiKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9XG5cbiAgZDMuc2VsZWN0KHNlbGYuZnJhbWVFbGVtZW50KS5zdHlsZSgnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XG59XG4iXX0=
