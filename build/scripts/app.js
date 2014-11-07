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

  var voteTotalScale = d3.scale.linear().range([0,50]);

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

    // LEGEND

    // var parties = getParties(races);
    var partyVotes = getPartyVotes(races);
    partyVotes = _.sortBy(partyVotes, function(d) { return -d.votes; }).slice(0,8);
    voteTotalScale.domain([0, d3.max(partyVotes, function(d) { return d.votes; })])
    var legendMarginRight = 100;
    var legendLineHeight = 20;

    svg.append("text")
      .attr("x", width - legendMarginRight)
      .attr("y", height - (partyVotes.length+1)*legendLineHeight)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("National vote total")

    var legend = svg.selectAll(".legend")
        .data(partyVotes)
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + (i * legendLineHeight + (height - partyVotes.length*legendLineHeight)) + ")"; });

    legend.append("rect")
        .attr("x", width - legendMarginRight)
        .attr("width", function(d) { return voteTotalScale(d.votes); })
        .attr("height", legendLineHeight - 2)
        .style("fill", function(d) { return partyScale(d.name); });

    legend.append("text")
        .attr("x", width - legendMarginRight - 4)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d.name; });

    legend.append("text")
        .attr("x", function(d) { return width - legendMarginRight + 4 + voteTotalScale(d.votes); })
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("fill", "#ccc")
        .text(function(d) { return bbwNumberFormat(d.votes); });

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

  function getParties(races) {
    return _.uniq(_.flatten(races.map(function(race) {
      return race.reportingUnits[0].candidates.map(function(candidate) {
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
      race.reportingUnits[0].candidates.forEach(function(candidate, index) {
        _.findWhere(partyVotes, {"name": candidate.party}).votes += candidate.voteCount;
      })
    });

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi9zY3JpcHRzL21hcC5qcycpKClcbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkdGggPSA5NjAsXG4gICAgICBoZWlnaHQgPSA2NTAsXG4gICAgICBjZW50ZXJlZDtcblxuICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAuaHRtbCh0b29sdGlwSHRtbCk7XG5cbiAgdmFyIHBhcnR5U2NhbGUgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgdmFyIHZvdGVUb3RhbFNjYWxlID0gZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzAsNTBdKTtcblxuICB2YXIgcHJvamVjdGlvbiA9IGQzLmdlby5hbGJlcnNVc2EoKVxuICAgICAgLnNjYWxlKDEyODApXG4gICAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKTtcblxuICB2YXIgcGF0aCA9IGQzLmdlby5wYXRoKClcbiAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJ2JvZHknKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAuY2FsbCh0aXApXG5cbiAgc3ZnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgICAgLm9uKFwiY2xpY2tcIiwgY2xpY2tlZClcblxuICB2YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gIHF1ZXVlKClcbiAgICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cy5qc29uJylcbiAgICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgICAvLyAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXNfYW5kX3JhY2VzLmpzb24nKVxuICAgICAgLmF3YWl0KHJlYWR5KTtcblxuICBmdW5jdGlvbiByZWFkeShlcnJvciwgdXMsIHJhY2VzQXJyYXkpIHtcbiAgICByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXNcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50aWVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShhZGRSYWNlc1RvVXModXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHknKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkLnJhY2UgJiYgZC5yYWNlLmxlbmd0aCA+IDAgPyAnI0ZFRicgOiAnI0ZFRidcbiAgICAgICAgfSlcbiAgICAgICAgLy8gLnN0eWxlKCdmaWxsJywgJ3VybCgjY3Jvc3NoYXRjaCknKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBzZXRGaWxsKVxuICAgICAgICAvLyAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhkKVxuICAgICAgICAvLyB9KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIHRpcC5zaG93KVxuICAgICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgIC8vIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgIC8vICAgICAuZGF0dW0odG9wb2pzb24ubWVzaChzdGF0ZXMsIHN0YXRlcy5vYmplY3RzLnN0YXRlcywgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSkpXG4gICAgLy8gICAgIC5hdHRyKCdjbGFzcycsICdzdGF0ZXMnKVxuICAgIC8vICAgICAuYXR0cignZCcsIHBhdGgpO1xuXG4gICAgLy8gTEVHRU5EXG5cbiAgICAvLyB2YXIgcGFydGllcyA9IGdldFBhcnRpZXMocmFjZXMpO1xuICAgIHZhciBwYXJ0eVZvdGVzID0gZ2V0UGFydHlWb3RlcyhyYWNlcyk7XG4gICAgcGFydHlWb3RlcyA9IF8uc29ydEJ5KHBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIC1kLnZvdGVzOyB9KS5zbGljZSgwLDgpO1xuICAgIHZvdGVUb3RhbFNjYWxlLmRvbWFpbihbMCwgZDMubWF4KHBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudm90ZXM7IH0pXSlcbiAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAxMDA7XG4gICAgdmFyIGxlZ2VuZExpbmVIZWlnaHQgPSAyMDtcblxuICAgIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAuYXR0cihcInhcIiwgd2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgIC5hdHRyKFwieVwiLCBoZWlnaHQgLSAocGFydHlWb3Rlcy5sZW5ndGgrMSkqbGVnZW5kTGluZUhlaWdodClcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgLnRleHQoXCJOYXRpb25hbCB2b3RlIHRvdGFsXCIpXG5cbiAgICB2YXIgbGVnZW5kID0gc3ZnLnNlbGVjdEFsbChcIi5sZWdlbmRcIilcbiAgICAgICAgLmRhdGEocGFydHlWb3RlcylcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgKGkgKiBsZWdlbmRMaW5lSGVpZ2h0ICsgKGhlaWdodCAtIHBhcnR5Vm90ZXMubGVuZ3RoKmxlZ2VuZExpbmVIZWlnaHQpKSArIFwiKVwiOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB3aWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsZWdlbmRMaW5lSGVpZ2h0IC0gMilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwYXJ0eVNjYWxlKGQubmFtZSk7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgLSA0KVxuICAgICAgICAuYXR0cihcInlcIiwgOSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gd2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCArIDQgKyB2b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIFwiI2NjY1wiKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBiYndOdW1iZXJGb3JtYXQoZC52b3Rlcyk7IH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiBzZXRGaWxsKGQpIHtcbiAgICBpZihkLnJhY2VbMF0gJiYgZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzKSB7XG4gICAgICB2YXIgd2lubmVyID0gZ2V0V2lubmVyKGQpO1xuICAgICAgcmV0dXJuIHdpbm5lci5wYXJ0eSA/IHBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSA6ICd1cmwoI2Nyb3NzaGF0Y2gpJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICd3aGl0ZSdcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRXaW5uZXIoZCkge1xuICAgIGlmKGQucmFjZVswXSAmJiBkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHMpIHtcbiAgICAgIHJldHVybiAgXy5tYXgoZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzWzBdLmNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja2VkKGQpIHtcbiAgICB2YXIgeCwgeSwgaztcblxuICAgIGlmIChkICYmIGNlbnRlcmVkICE9PSBkKSB7XG4gICAgICB2YXIgY2VudHJvaWQgPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgeCA9IGNlbnRyb2lkWzBdO1xuICAgICAgeSA9IGNlbnRyb2lkWzFdO1xuICAgICAgayA9IDQ7XG4gICAgICBjZW50ZXJlZCA9IGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSB3aWR0aCAvIDI7XG4gICAgICB5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIGsgPSAxO1xuICAgICAgY2VudGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuY2xhc3NlZChcImFjdGl2ZVwiLCBjZW50ZXJlZCAmJiBmdW5jdGlvbihkKSB7IHJldHVybiBkID09PSBjZW50ZXJlZDsgfSk7XG5cbiAgICBnLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oNzUwKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHdpZHRoIC8gMiArIFwiLFwiICsgaGVpZ2h0IC8gMiArIFwiKXNjYWxlKFwiICsgayArIFwiKXRyYW5zbGF0ZShcIiArIC14ICsgXCIsXCIgKyAteSArIFwiKVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMS41IC8gayArIFwicHhcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGdldFdpbm5lcihkKTtcblxuICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPicgKyB3aW5uZXIubmFtZSArICc8L3NwYW4+JyArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBwYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+J1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmlwc0NvZGUpIHtcbiAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLnJlcG9ydGluZ1VuaXRzWzBdLmZpcHNDb2RlID09PSBmaXBzQ29kZVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBhZGRSYWNlc1RvVXModXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5yYWNlID0gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmVhdHVyZS5pZC50b1N0cmluZygpKVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuXG4gIH1cblxuICBmdW5jdGlvbiBnZXRQYXJ0aWVzKHJhY2VzKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4ocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLnJlcG9ydGluZ1VuaXRzWzBdLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnBhcnR5O1xuICAgICAgfSk7XG4gICAgfSkpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFBhcnR5Vm90ZXMocmFjZXMpIHtcblxuICAgIHBhcnR5Vm90ZXMgPSBnZXRQYXJ0aWVzKHJhY2VzKS5tYXAoZnVuY3Rpb24ocGFydHksIGluZGV4KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBcIm5hbWVcIjogcGFydHksXG4gICAgICAgIFwidm90ZXNcIjogMFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJhY2VzLmZvckVhY2goZnVuY3Rpb24ocmFjZSwgaW5kZXgpIHtcbiAgICAgIHJhY2UucmVwb3J0aW5nVW5pdHNbMF0uY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSwgaW5kZXgpIHtcbiAgICAgICAgXy5maW5kV2hlcmUocGFydHlWb3Rlcywge1wibmFtZVwiOiBjYW5kaWRhdGUucGFydHl9KS52b3RlcyArPSBjYW5kaWRhdGUudm90ZUNvdW50O1xuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJ0eVZvdGVzO1xuXG4gIH1cblxuICAvLyBhZGFwdGVkIGZyb20gZDMuZm9ybWF0UHJlZml4XG4gIGZ1bmN0aW9uIGJid051bWJlckZvcm1hdChkb2xsYSkge1xuICAgIHZhciBiYXNlID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oMWUxMiwgZG9sbGEpKTtcbiAgICB2YXIgc2NhbGVyID0gYmJ3Rm9ybWF0UHJlZml4KGJhc2UpO1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHNjYWxlci5zY2FsZShkb2xsYSkudG9QcmVjaXNpb24oMykpK3NjYWxlci5zeW1ib2w7XG4gIH1cbiAgdmFyIGJid19mb3JtYXRQcmVmaXhlcyA9IFsgXCJwXCIsIFwiblwiLCBcIsK1XCIsIFwibVwiLCBcIlwiLCBcImtcIiwgXCJtXCIsIFwiYlwiLCBcInRcIiBdLm1hcChiYndfZm9ybWF0UHJlZml4KTtcbiAgZnVuY3Rpb24gYmJ3Rm9ybWF0UHJlZml4KHZhbHVlLCBwcmVjaXNpb24pIHtcbiAgXHR2YXIgaSA9IDA7XG4gIFx0aWYgKHZhbHVlKSB7XG4gIFx0XHRpZiAodmFsdWUgPCAwKSB2YWx1ZSAqPSAtMTtcbiAgXHRcdGlmIChwcmVjaXNpb24pIHZhbHVlID0gZDMucm91bmQodmFsdWUsIGQzX2Zvcm1hdF9wcmVjaXNpb24odmFsdWUsIHByZWNpc2lvbikpO1xuICBcdFx0aSA9IDEgKyBNYXRoLmZsb29yKDFlLTEyICsgTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwKTtcbiAgXHRcdGkgPSBNYXRoLm1heCgtMjQsIE1hdGgubWluKDI0LCBNYXRoLmZsb29yKChpIDw9IDAgPyBpICsgMSA6IGkgLSAxKSAvIDMpICogMykpO1xuICBcdH1cbiAgXHRyZXR1cm4gYmJ3X2Zvcm1hdFByZWZpeGVzWzQgKyBpIC8gM107XG4gIH07XG4gIGZ1bmN0aW9uIGJid19mb3JtYXRQcmVmaXgoZCwgaSkge1xuICBcdHZhciBrID0gTWF0aC5wb3coMTAsIE1hdGguYWJzKDQgLSBpKSAqIDMpO1xuICBcdHJldHVybiB7XG4gIFx0XHRzY2FsZTogaSA+IDQgPyBmdW5jdGlvbihkKSB7XG4gIFx0XHRcdHJldHVybiBkIC8gaztcbiAgXHRcdH0gOiBmdW5jdGlvbihkKSB7XG4gIFx0XHRcdHJldHVybiBkICogaztcbiAgXHRcdH0sXG4gIFx0XHRzeW1ib2w6IGRcbiAgXHR9O1xuICB9XG5cbiAgZDMuc2VsZWN0KHNlbGYuZnJhbWVFbGVtZW50KS5zdHlsZSgnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XG59XG4iXX0=
