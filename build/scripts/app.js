(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./scripts/map.js')()

},{"./scripts/map.js":2}],2:[function(require,module,exports){
var d3 = require('d3');
d3.tip = require('./vendor/d3-tip')(d3);
var queue = require('queue-async');
var topojson = require('topojson');
var _ = require('underscore');

module.exports = function() {
  console.time('toph')
  // var width = 960,
  //     height = 650,
  //     centered;

  var width = parseInt(d3.select('#map-container').style('width'))
  , mapRatio = .6
  , height = width * mapRatio
  , scaleWidth = width * 1.2
  , centered;

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(tooltipHtml);

  var colors = ['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600']

  // var colors = ['purple', 'magenta', 'navy', 'maroon', 'teal', 'aqua', 'green', 'lime', 'olive', 'yellow']

  var partyScale = d3.scale.ordinal()
    .range(d3.shuffle(colors))

  var voteTotalScale = d3.scale.linear().range([0,50]);

  var projection = d3.geo.albersUsa()
      .scale(scaleWidth)
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select('#map-container').append('svg')
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
    .await(ready);

  // d3.select(window).on('resize', resize);



  function ready(error, us, racesArray) {
    races = racesArray.races

    g.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(addRacesToUs(us, races))
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('fill', setFill)
        .on('dragstart', tip.show)
        .on('mouseover', function(d) {
          if(d.race) {
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

    //Deals with Alaska
    d3.select('.alaska')
      .style('fill', function(d) {
        return partyScale(d);
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .on('click', clicked);

    g.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'state-borders')
        .attr('d', path)
    // svg.append('path')
    //     .datum(topojson.mesh(states, states.objects.states, function(a, b) { return a !== b; }))
    //     .attr('class', 'states')
    //     .attr('d', path);

    // LEGEND

    // var parties = getParties(races);
    var stateRaces = races.filter(function(race) {
      return race.fipsCode === undefined
    })

    var partyVotes = getPartyVotes(stateRaces);
    partyVotes = _.sortBy(partyVotes, function(d) { return -d.votes; }).slice(0,8);
    voteTotalScale.domain([0, d3.max(partyVotes, function(d) { return d.votes; })])
    var legendLineHeight = 20;

    if(width < 960) {
      var legendWidth = width/2
      var legendMarginRight = 0;
    } else {
      var legendMarginRight = 100;
      var legendWidth = width
    }
    var legendHeight = 200;

    var legendContainer = d3.select('#legend-container').append('svg')
      .attr('height', legendHeight)
      .attr('width', width)

    legendContainer
      .append("text")
      .attr("x", legendWidth - legendMarginRight)
      .attr("y", (partyVotes.length+1)*legendLineHeight - 175)
      .attr("dy", ".95em")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("National vote total")

    var legend = legendContainer.selectAll(".legend")
        .data(partyVotes)
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + (i * legendLineHeight + (partyVotes.length*legendLineHeight - 125)) + ")"; });

    legend.append("rect")
        .attr("x", legendWidth - legendMarginRight)
        .attr("width", function(d) { return voteTotalScale(d.votes); })
        .attr("height", legendLineHeight - 2)
        .style("fill", function(d) { return partyScale(d.name); });

    legend.append("text")
        .attr("x", legendWidth - legendMarginRight - 4)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d.name; });

    legend.append("text")
        .attr("x", function(d) { return legendWidth - legendMarginRight + 4 + voteTotalScale(d.votes); })
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("fill", "#ccc")
        .text(function(d) { return bbwNumberFormat(d.votes); });

    console.timeEnd('toph')
  }

  function setFill(d) {
    if(d.race && d.race.candidates) {
      var winner = getWinner(d);
      return winner.party ? partyScale(winner.party) : 'url(#crosshatch)';
    } else {
      return 'white'
    }
  }

  function getWinner(d) {
    return  _.max(d.race.candidates, function(candidate) {
      return candidate.voteCount
    })
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

  function resize() {
      // adjust things when the window size changes
      width = parseInt(d3.select('#map-container').style('width'));
      height = width * mapRatio;

      // update projection
      projection
          .translate([width / 2, height / 2])
          .scale(scaleWidth);

      // resize the map container
      svg
          .style('width', width + 'px')
          .style('height', height + 'px');

      // resize the map
      svg.select('.state-borders').attr('d', path);
      svg.selectAll('.county').attr('d', path);
      svg.selectAll('.state').attr('d', path);
  }

  function tooltipHtml(d) {
    var winner = getWinner(d);

    if(winner.name === undefined) {
      return '<span class="winner-name">Vacant Seat</span>'
    }

    return '<span class="winner-name">' + winner.name + '</span>' + '<span style="color:' + partyScale(winner.party) + '">' + winner.party + '</span>'
  }

  function getReportingUnitFromFipsCode(races, fipsCode) {
    var reportingUnit;

    for(var i = 0; typeof(reportingUnit) === "undefined" && i < races.length; i++) {
      var race = races[i]
      if(race.fipsCode === fipsCode) {
        // races.splice(i, 1)
        reportingUnit = race;
      }
    }

    return {race: reportingUnit, races: races}


  }

  function addRacesToUs(us, races) {
    var features = topojson.feature(us, us.objects.counties).features

    return features.map(function(feature) {
      var reportingUnit = getReportingUnitFromFipsCode(races, feature.id.toString())
      feature.race = reportingUnit.race
      races = reportingUnit.races

      return feature
    })

  }

  function setStateData(us, races) {
    var features = topojson.feature(us, us.objects.states).features

    return features.map(function(feature) {
      if(feature.id === 2) {
        var reportingUnit = getReportingUnitFromFipsCode(races, "2000")
        feature.race = reportingUnit.race
        races = reportingUnit.races
      }
      return feature
    })
  }

  function getParties(races) {
    return _.uniq(_.flatten(races.map(function(race) {
      return race.candidates.map(function(candidate) {
        return candidate.party;
      });
    })));
  }

  function getPartyVotes(races) {

    partyVotes = getParties(races).map(function(party, index) {
      return {
        "name": party,
        "votes": 0
      };
    });



    races.forEach(function(race, index) {
      race.candidates.forEach(function(candidate, index) {
        if(candidate.voteCount === 66) {
          console.log(race, candidate)
        }
        _.findWhere(partyVotes, {"name": candidate.party}).votes += candidate.voteCount;
      })

    });

    console.log(partyVotes);

    return partyVotes;

  }

  // adapted from d3.formatPrefix
  function bbwNumberFormat(dolla) {
    var base = Math.max(1, Math.min(1e12, dolla));
    var scaler = bbwFormatPrefix(base);
    return parseFloat(scaler.scale(dolla).toPrecision(3))+scaler.symbol;
  }

  var bbw_formatPrefixes = [ "p", "n", "µ", "m", "", "k", "m", "b", "t" ].map(bbw_formatPrefix);
  function bbwFormatPrefix(value, precision) {
  	var i = 0;
  	if (value) {
  		if (value < 0) value *= -1;
  		if (precision) value = d3.round(value, d3_format_precision(value, precision));
  		i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
  		i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
  	}
  	return bbw_formatPrefixes[4 + i / 3];
  };
  function bbw_formatPrefix(d, i) {
  	var k = Math.pow(10, Math.abs(4 - i) * 3);
  	return {
  		scale: i > 4 ? function(d) {
  			return d / k;
  		} : function(d) {
  			return d * k;
  		},
  		symbol: d
  	};
  }

  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3NjcmlwdHMvbWFwLmpzJykoKVxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUudGltZSgndG9waCcpXG4gIC8vIHZhciB3aWR0aCA9IDk2MCxcbiAgLy8gICAgIGhlaWdodCA9IDY1MCxcbiAgLy8gICAgIGNlbnRlcmVkO1xuXG4gIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSlcbiAgLCBtYXBSYXRpbyA9IC42XG4gICwgaGVpZ2h0ID0gd2lkdGggKiBtYXBSYXRpb1xuICAsIHNjYWxlV2lkdGggPSB3aWR0aCAqIDEuMlxuICAsIGNlbnRlcmVkO1xuXG4gIHZhciB0aXAgPSBkMy50aXAoKVxuICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgIC5odG1sKHRvb2x0aXBIdG1sKTtcblxuICB2YXIgY29sb3JzID0gWycjRkYwMEZGJywgJyNDQzAwRkYnLCAnIzAwRkYwMCcsICcjRkZGRjAwJywgJyMwMEZGRkYnLCAnI0NDRkYwMCcsICcjRkZDQzAwJywgJyMwMEZGOTknLCAnIzY2MDBDQycsICcjRkYwMDk5JywgJyMwMDY2NjYnLCAnIzAwNjYwMCddXG5cbiAgLy8gdmFyIGNvbG9ycyA9IFsncHVycGxlJywgJ21hZ2VudGEnLCAnbmF2eScsICdtYXJvb24nLCAndGVhbCcsICdhcXVhJywgJ2dyZWVuJywgJ2xpbWUnLCAnb2xpdmUnLCAneWVsbG93J11cblxuICB2YXIgcGFydHlTY2FsZSA9IGQzLnNjYWxlLm9yZGluYWwoKVxuICAgIC5yYW5nZShkMy5zaHVmZmxlKGNvbG9ycykpXG5cbiAgdmFyIHZvdGVUb3RhbFNjYWxlID0gZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzAsNTBdKTtcblxuICB2YXIgcHJvamVjdGlvbiA9IGQzLmdlby5hbGJlcnNVc2EoKVxuICAgICAgLnNjYWxlKHNjYWxlV2lkdGgpXG4gICAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKTtcblxuICB2YXIgcGF0aCA9IGQzLmdlby5wYXRoKClcbiAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgLmNhbGwodGlwKVxuXG4gIHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgIC5vbihcImNsaWNrXCIsIGNsaWNrZWQpXG5cbiAgdmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuICAvLyBkMy5zZWxlY3Qod2luZG93KS5vbigncmVzaXplJywgcmVzaXplKTtcblxuXG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHVzLCByYWNlc0FycmF5KSB7XG4gICAgcmFjZXMgPSByYWNlc0FycmF5LnJhY2VzXG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudGllcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYWRkUmFjZXNUb1VzKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnR5JylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBzZXRGaWxsKVxuICAgICAgICAub24oJ2RyYWdzdGFydCcsIHRpcC5zaG93KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZihkLnJhY2UpIHtcbiAgICAgICAgICAgIHRpcC5zaG93KGQpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdpZCcsICdzdGF0ZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKHNldFN0YXRlRGF0YSh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGQuaWQgPT09IDIgPyBcInN0YXRlIGFsYXNrYVwiIDogXCJzdGF0ZVwiXG4gICAgICAgIH0pO1xuXG4gICAgLy9EZWFscyB3aXRoIEFsYXNrYVxuICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBwYXJ0eVNjYWxlKGQpO1xuICAgICAgfSlcbiAgICAgIC5vbignbW91c2VvdmVyJywgdGlwLnNob3cpXG4gICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICBnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHVzLCB1cy5vYmplY3RzLnN0YXRlcywgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdzdGF0ZS1ib3JkZXJzJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgIC8vIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgIC8vICAgICAuZGF0dW0odG9wb2pzb24ubWVzaChzdGF0ZXMsIHN0YXRlcy5vYmplY3RzLnN0YXRlcywgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSkpXG4gICAgLy8gICAgIC5hdHRyKCdjbGFzcycsICdzdGF0ZXMnKVxuICAgIC8vICAgICAuYXR0cignZCcsIHBhdGgpO1xuXG4gICAgLy8gTEVHRU5EXG5cbiAgICAvLyB2YXIgcGFydGllcyA9IGdldFBhcnRpZXMocmFjZXMpO1xuICAgIHZhciBzdGF0ZVJhY2VzID0gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLmZpcHNDb2RlID09PSB1bmRlZmluZWRcbiAgICB9KVxuXG4gICAgdmFyIHBhcnR5Vm90ZXMgPSBnZXRQYXJ0eVZvdGVzKHN0YXRlUmFjZXMpO1xuICAgIHBhcnR5Vm90ZXMgPSBfLnNvcnRCeShwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiAtZC52b3RlczsgfSkuc2xpY2UoMCw4KTtcbiAgICB2b3RlVG90YWxTY2FsZS5kb21haW4oWzAsIGQzLm1heChwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZvdGVzOyB9KV0pXG4gICAgdmFyIGxlZ2VuZExpbmVIZWlnaHQgPSAyMDtcblxuICAgIGlmKHdpZHRoIDwgOTYwKSB7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aC8yXG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAxMDA7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aFxuICAgIH1cbiAgICB2YXIgbGVnZW5kSGVpZ2h0ID0gMjAwO1xuXG4gICAgdmFyIGxlZ2VuZENvbnRhaW5lciA9IGQzLnNlbGVjdCgnI2xlZ2VuZC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignaGVpZ2h0JywgbGVnZW5kSGVpZ2h0KVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG5cbiAgICBsZWdlbmRDb250YWluZXJcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgIC5hdHRyKFwieVwiLCAocGFydHlWb3Rlcy5sZW5ndGgrMSkqbGVnZW5kTGluZUhlaWdodCAtIDE3NSlcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIuOTVlbVwiKVxuICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgLnRleHQoXCJOYXRpb25hbCB2b3RlIHRvdGFsXCIpXG5cbiAgICB2YXIgbGVnZW5kID0gbGVnZW5kQ29udGFpbmVyLnNlbGVjdEFsbChcIi5sZWdlbmRcIilcbiAgICAgICAgLmRhdGEocGFydHlWb3RlcylcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgKGkgKiBsZWdlbmRMaW5lSGVpZ2h0ICsgKHBhcnR5Vm90ZXMubGVuZ3RoKmxlZ2VuZExpbmVIZWlnaHQgLSAxMjUpKSArIFwiKVwiOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsZWdlbmRMaW5lSGVpZ2h0IC0gMilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwYXJ0eVNjYWxlKGQubmFtZSk7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgLSA0KVxuICAgICAgICAuYXR0cihcInlcIiwgOSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCArIDQgKyB2b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIFwiI2NjY1wiKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBiYndOdW1iZXJGb3JtYXQoZC52b3Rlcyk7IH0pO1xuXG4gICAgY29uc29sZS50aW1lRW5kKCd0b3BoJylcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEZpbGwoZCkge1xuICAgIGlmKGQucmFjZSAmJiBkLnJhY2UuY2FuZGlkYXRlcykge1xuICAgICAgdmFyIHdpbm5lciA9IGdldFdpbm5lcihkKTtcbiAgICAgIHJldHVybiB3aW5uZXIucGFydHkgPyBwYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgOiAndXJsKCNjcm9zc2hhdGNoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnd2hpdGUnXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0V2lubmVyKGQpIHtcbiAgICByZXR1cm4gIF8ubWF4KGQucmFjZS5jYW5kaWRhdGVzLCBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgIHJldHVybiBjYW5kaWRhdGUudm90ZUNvdW50XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrZWQoZCkge1xuICAgIHZhciB4LCB5LCBrO1xuXG4gICAgaWYgKGQgJiYgY2VudGVyZWQgIT09IGQpIHtcbiAgICAgIHZhciBjZW50cm9pZCA9IHBhdGguY2VudHJvaWQoZCk7XG4gICAgICB4ID0gY2VudHJvaWRbMF07XG4gICAgICB5ID0gY2VudHJvaWRbMV07XG4gICAgICBrID0gNDtcbiAgICAgIGNlbnRlcmVkID0gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IHdpZHRoIC8gMjtcbiAgICAgIHkgPSBoZWlnaHQgLyAyO1xuICAgICAgayA9IDE7XG4gICAgICBjZW50ZXJlZCA9IG51bGw7XG4gICAgfVxuXG4gICAgZy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5jbGFzc2VkKFwiYWN0aXZlXCIsIGNlbnRlcmVkICYmIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQgPT09IGNlbnRlcmVkOyB9KTtcblxuICAgIGcudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbig3NTApXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgd2lkdGggLyAyICsgXCIsXCIgKyBoZWlnaHQgLyAyICsgXCIpc2NhbGUoXCIgKyBrICsgXCIpdHJhbnNsYXRlKFwiICsgLXggKyBcIixcIiArIC15ICsgXCIpXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxLjUgLyBrICsgXCJweFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgICAgIC8vIGFkanVzdCB0aGluZ3Mgd2hlbiB0aGUgd2luZG93IHNpemUgY2hhbmdlc1xuICAgICAgd2lkdGggPSBwYXJzZUludChkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuc3R5bGUoJ3dpZHRoJykpO1xuICAgICAgaGVpZ2h0ID0gd2lkdGggKiBtYXBSYXRpbztcblxuICAgICAgLy8gdXBkYXRlIHByb2plY3Rpb25cbiAgICAgIHByb2plY3Rpb25cbiAgICAgICAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKVxuICAgICAgICAgIC5zY2FsZShzY2FsZVdpZHRoKTtcblxuICAgICAgLy8gcmVzaXplIHRoZSBtYXAgY29udGFpbmVyXG4gICAgICBzdmdcbiAgICAgICAgICAuc3R5bGUoJ3dpZHRoJywgd2lkdGggKyAncHgnKVxuICAgICAgICAgIC5zdHlsZSgnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XG5cbiAgICAgIC8vIHJlc2l6ZSB0aGUgbWFwXG4gICAgICBzdmcuc2VsZWN0KCcuc3RhdGUtYm9yZGVycycpLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICAgIHN2Zy5zZWxlY3RBbGwoJy5jb3VudHknKS5hdHRyKCdkJywgcGF0aCk7XG4gICAgICBzdmcuc2VsZWN0QWxsKCcuc3RhdGUnKS5hdHRyKCdkJywgcGF0aCk7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGdldFdpbm5lcihkKTtcblxuICAgIGlmKHdpbm5lci5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPlZhY2FudCBTZWF0PC9zcGFuPidcbiAgICB9XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyLm5hbWUgKyAnPC9zcGFuPicgKyAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgcGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPidcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlcG9ydGluZ1VuaXRGcm9tRmlwc0NvZGUocmFjZXMsIGZpcHNDb2RlKSB7XG4gICAgdmFyIHJlcG9ydGluZ1VuaXQ7XG5cbiAgICBmb3IodmFyIGkgPSAwOyB0eXBlb2YocmVwb3J0aW5nVW5pdCkgPT09IFwidW5kZWZpbmVkXCIgJiYgaSA8IHJhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFjZSA9IHJhY2VzW2ldXG4gICAgICBpZihyYWNlLmZpcHNDb2RlID09PSBmaXBzQ29kZSkge1xuICAgICAgICAvLyByYWNlcy5zcGxpY2UoaSwgMSlcbiAgICAgICAgcmVwb3J0aW5nVW5pdCA9IHJhY2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtyYWNlOiByZXBvcnRpbmdVbml0LCByYWNlczogcmFjZXN9XG5cblxuICB9XG5cbiAgZnVuY3Rpb24gYWRkUmFjZXNUb1VzKHVzLCByYWNlcykge1xuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuY291bnRpZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIHZhciByZXBvcnRpbmdVbml0ID0gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmVhdHVyZS5pZC50b1N0cmluZygpKVxuICAgICAgZmVhdHVyZS5yYWNlID0gcmVwb3J0aW5nVW5pdC5yYWNlXG4gICAgICByYWNlcyA9IHJlcG9ydGluZ1VuaXQucmFjZXNcblxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuXG4gIH1cblxuICBmdW5jdGlvbiBzZXRTdGF0ZURhdGEodXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5zdGF0ZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGlmKGZlYXR1cmUuaWQgPT09IDIpIHtcbiAgICAgICAgdmFyIHJlcG9ydGluZ1VuaXQgPSBnZXRSZXBvcnRpbmdVbml0RnJvbUZpcHNDb2RlKHJhY2VzLCBcIjIwMDBcIilcbiAgICAgICAgZmVhdHVyZS5yYWNlID0gcmVwb3J0aW5nVW5pdC5yYWNlXG4gICAgICAgIHJhY2VzID0gcmVwb3J0aW5nVW5pdC5yYWNlc1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UGFydGllcyhyYWNlcykge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKHJhY2VzLm1hcChmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5wYXJ0eTtcbiAgICAgIH0pO1xuICAgIH0pKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRQYXJ0eVZvdGVzKHJhY2VzKSB7XG5cbiAgICBwYXJ0eVZvdGVzID0gZ2V0UGFydGllcyhyYWNlcykubWFwKGZ1bmN0aW9uKHBhcnR5LCBpbmRleCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgXCJuYW1lXCI6IHBhcnR5LFxuICAgICAgICBcInZvdGVzXCI6IDBcbiAgICAgIH07XG4gICAgfSk7XG5cblxuXG4gICAgcmFjZXMuZm9yRWFjaChmdW5jdGlvbihyYWNlLCBpbmRleCkge1xuICAgICAgcmFjZS5jYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlLCBpbmRleCkge1xuICAgICAgICBpZihjYW5kaWRhdGUudm90ZUNvdW50ID09PSA2Nikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJhY2UsIGNhbmRpZGF0ZSlcbiAgICAgICAgfVxuICAgICAgICBfLmZpbmRXaGVyZShwYXJ0eVZvdGVzLCB7XCJuYW1lXCI6IGNhbmRpZGF0ZS5wYXJ0eX0pLnZvdGVzICs9IGNhbmRpZGF0ZS52b3RlQ291bnQ7XG4gICAgICB9KVxuXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhwYXJ0eVZvdGVzKTtcblxuICAgIHJldHVybiBwYXJ0eVZvdGVzO1xuXG4gIH1cblxuICAvLyBhZGFwdGVkIGZyb20gZDMuZm9ybWF0UHJlZml4XG4gIGZ1bmN0aW9uIGJid051bWJlckZvcm1hdChkb2xsYSkge1xuICAgIHZhciBiYXNlID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oMWUxMiwgZG9sbGEpKTtcbiAgICB2YXIgc2NhbGVyID0gYmJ3Rm9ybWF0UHJlZml4KGJhc2UpO1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHNjYWxlci5zY2FsZShkb2xsYSkudG9QcmVjaXNpb24oMykpK3NjYWxlci5zeW1ib2w7XG4gIH1cblxuICB2YXIgYmJ3X2Zvcm1hdFByZWZpeGVzID0gWyBcInBcIiwgXCJuXCIsIFwiwrVcIiwgXCJtXCIsIFwiXCIsIFwia1wiLCBcIm1cIiwgXCJiXCIsIFwidFwiIF0ubWFwKGJid19mb3JtYXRQcmVmaXgpO1xuICBmdW5jdGlvbiBiYndGb3JtYXRQcmVmaXgodmFsdWUsIHByZWNpc2lvbikge1xuICBcdHZhciBpID0gMDtcbiAgXHRpZiAodmFsdWUpIHtcbiAgXHRcdGlmICh2YWx1ZSA8IDApIHZhbHVlICo9IC0xO1xuICBcdFx0aWYgKHByZWNpc2lvbikgdmFsdWUgPSBkMy5yb3VuZCh2YWx1ZSwgZDNfZm9ybWF0X3ByZWNpc2lvbih2YWx1ZSwgcHJlY2lzaW9uKSk7XG4gIFx0XHRpID0gMSArIE1hdGguZmxvb3IoMWUtMTIgKyBNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMTApO1xuICBcdFx0aSA9IE1hdGgubWF4KC0yNCwgTWF0aC5taW4oMjQsIE1hdGguZmxvb3IoKGkgPD0gMCA/IGkgKyAxIDogaSAtIDEpIC8gMykgKiAzKSk7XG4gIFx0fVxuICBcdHJldHVybiBiYndfZm9ybWF0UHJlZml4ZXNbNCArIGkgLyAzXTtcbiAgfTtcbiAgZnVuY3Rpb24gYmJ3X2Zvcm1hdFByZWZpeChkLCBpKSB7XG4gIFx0dmFyIGsgPSBNYXRoLnBvdygxMCwgTWF0aC5hYnMoNCAtIGkpICogMyk7XG4gIFx0cmV0dXJuIHtcbiAgXHRcdHNjYWxlOiBpID4gNCA/IGZ1bmN0aW9uKGQpIHtcbiAgXHRcdFx0cmV0dXJuIGQgLyBrO1xuICBcdFx0fSA6IGZ1bmN0aW9uKGQpIHtcbiAgXHRcdFx0cmV0dXJuIGQgKiBrO1xuICBcdFx0fSxcbiAgXHRcdHN5bWJvbDogZFxuICBcdH07XG4gIH1cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
