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

  var colors = ['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600']

  // var colors = ['purple', 'magenta', 'navy', 'maroon', 'teal', 'aqua', 'green', 'lime', 'olive', 'yellow']

  var partyScale = d3.scale.ordinal()
    .range(d3.shuffle(colors))

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
        .style('fill', setFill)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('click', clicked);

    g.append('g')
      .attr('id', 'states')
      .selectAll('path')
        .data(setStateData(us, races))
      .enter().append('path')
        .attr('d', path)
        .attr('class', function(d) {
          if(d.id === 35) {
            return "state new-mexico"
          }
          return d.id === 2 ? "state alaska" : "state"
        })
        .on('mouseover', function(d) {
          console.log(d)
        })

    //Deals with Alaska
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

    if(winner.name === undefined) {
      return '<span class="winner-name">Vacant Seat</span>'
    }

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

  function setStateData(us, races) {
    var features = topojson.feature(us, us.objects.states).features

    return features.map(function(feature) {
      if(feature.id === 2) {
        feature.race = getReportingUnitFromFipsCode(races, "2000")
      } 
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi9zY3JpcHRzL21hcC5qcycpKClcbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkdGggPSA5NjAsXG4gICAgICBoZWlnaHQgPSA2NTAsXG4gICAgICBjZW50ZXJlZDtcblxuICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAuaHRtbCh0b29sdGlwSHRtbCk7XG5cbiAgdmFyIGNvbG9ycyA9IFsnI0ZGMDBGRicsICcjQ0MwMEZGJywgJyMwMEZGMDAnLCAnI0ZGRkYwMCcsICcjMDBGRkZGJywgJyNDQ0ZGMDAnLCAnI0ZGQ0MwMCcsICcjMDBGRjk5JywgJyM2NjAwQ0MnLCAnI0ZGMDA5OScsICcjMDA2NjY2JywgJyMwMDY2MDAnXVxuXG4gIC8vIHZhciBjb2xvcnMgPSBbJ3B1cnBsZScsICdtYWdlbnRhJywgJ25hdnknLCAnbWFyb29uJywgJ3RlYWwnLCAnYXF1YScsICdncmVlbicsICdsaW1lJywgJ29saXZlJywgJ3llbGxvdyddXG5cbiAgdmFyIHBhcnR5U2NhbGUgPSBkMy5zY2FsZS5vcmRpbmFsKClcbiAgICAucmFuZ2UoZDMuc2h1ZmZsZShjb2xvcnMpKVxuXG4gIHZhciB2b3RlVG90YWxTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFswLDUwXSk7XG5cbiAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgIC5zY2FsZSgxMjgwKVxuICAgICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSk7XG5cbiAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCdib2R5JykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgLmNhbGwodGlwKVxuXG4gIHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgIC5vbihcImNsaWNrXCIsIGNsaWNrZWQpXG5cbiAgdmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuICBmdW5jdGlvbiByZWFkeShlcnJvciwgdXMsIHJhY2VzQXJyYXkpIHtcbiAgICByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXNcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50aWVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShhZGRSYWNlc1RvVXModXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHknKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIHNldEZpbGwpXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgdGlwLnNob3cpXG4gICAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcbiAgICAgICAgLm9uKCdjbGljaycsIGNsaWNrZWQpO1xuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2lkJywgJ3N0YXRlcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoc2V0U3RhdGVEYXRhKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZihkLmlkID09PSAzNSkge1xuICAgICAgICAgICAgcmV0dXJuIFwic3RhdGUgbmV3LW1leGljb1wiXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkLmlkID09PSAyID8gXCJzdGF0ZSBhbGFza2FcIiA6IFwic3RhdGVcIlxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkKVxuICAgICAgICB9KVxuXG4gICAgLy9EZWFscyB3aXRoIEFsYXNrYVxuICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBwYXJ0eVNjYWxlKGQpO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnZmlsbCcsIHNldEZpbGwpXG4gICAgICAub24oJ21vdXNlb3ZlcicsIHRpcC5zaG93KVxuICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKVxuICAgICAgLm9uKCdjbGljaycsIGNsaWNrZWQpO1xuXG4gICAgZy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuZGF0dW0odG9wb2pzb24ubWVzaCh1cywgdXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGUtYm9yZGVycycpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAvLyBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAvLyAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2goc3RhdGVzLCBzdGF0ZXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGVzJylcbiAgICAvLyAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIC8vIExFR0VORFxuXG4gICAgLy8gdmFyIHBhcnRpZXMgPSBnZXRQYXJ0aWVzKHJhY2VzKTtcbiAgICB2YXIgcGFydHlWb3RlcyA9IGdldFBhcnR5Vm90ZXMocmFjZXMpO1xuICAgIHBhcnR5Vm90ZXMgPSBfLnNvcnRCeShwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiAtZC52b3RlczsgfSkuc2xpY2UoMCw4KTtcbiAgICB2b3RlVG90YWxTY2FsZS5kb21haW4oWzAsIGQzLm1heChwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZvdGVzOyB9KV0pXG4gICAgdmFyIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMTAwO1xuICAgIHZhciBsZWdlbmRMaW5lSGVpZ2h0ID0gMjA7XG5cbiAgICBzdmcuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQpXG4gICAgICAuYXR0cihcInlcIiwgaGVpZ2h0IC0gKHBhcnR5Vm90ZXMubGVuZ3RoKzEpKmxlZ2VuZExpbmVIZWlnaHQpXG4gICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAuc3R5bGUoXCJmb250LXdlaWdodFwiLCBcImJvbGRcIilcbiAgICAgIC50ZXh0KFwiTmF0aW9uYWwgdm90ZSB0b3RhbFwiKVxuXG4gICAgdmFyIGxlZ2VuZCA9IHN2Zy5zZWxlY3RBbGwoXCIubGVnZW5kXCIpXG4gICAgICAgIC5kYXRhKHBhcnR5Vm90ZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmRcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIChpICogbGVnZW5kTGluZUhlaWdodCArIChoZWlnaHQgLSBwYXJ0eVZvdGVzLmxlbmd0aCpsZWdlbmRMaW5lSGVpZ2h0KSkgKyBcIilcIjsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgd2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB2b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGVnZW5kTGluZUhlaWdodCAtIDIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcGFydHlTY2FsZShkLm5hbWUpOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB3aWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0IC0gNClcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgKyA0ICsgdm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgIC5hdHRyKFwieVwiLCA5KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNjY2NcIilcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gYmJ3TnVtYmVyRm9ybWF0KGQudm90ZXMpOyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEZpbGwoZCkge1xuICAgIGlmKGQucmFjZVswXSAmJiBkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHMpIHtcbiAgICAgIHZhciB3aW5uZXIgPSBnZXRXaW5uZXIoZCk7XG4gICAgICByZXR1cm4gd2lubmVyLnBhcnR5ID8gcGFydHlTY2FsZSh3aW5uZXIucGFydHkpIDogJ3VybCgjY3Jvc3NoYXRjaCknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3doaXRlJ1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFdpbm5lcihkKSB7XG4gICAgaWYoZC5yYWNlWzBdICYmIGQucmFjZVswXS5yZXBvcnRpbmdVbml0cykge1xuICAgICAgcmV0dXJuICBfLm1heChkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHNbMF0uY2FuZGlkYXRlcywgZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGUudm90ZUNvdW50XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrZWQoZCkge1xuICAgIHZhciB4LCB5LCBrO1xuXG4gICAgaWYgKGQgJiYgY2VudGVyZWQgIT09IGQpIHtcbiAgICAgIHZhciBjZW50cm9pZCA9IHBhdGguY2VudHJvaWQoZCk7XG4gICAgICB4ID0gY2VudHJvaWRbMF07XG4gICAgICB5ID0gY2VudHJvaWRbMV07XG4gICAgICBrID0gNDtcbiAgICAgIGNlbnRlcmVkID0gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IHdpZHRoIC8gMjtcbiAgICAgIHkgPSBoZWlnaHQgLyAyO1xuICAgICAgayA9IDE7XG4gICAgICBjZW50ZXJlZCA9IG51bGw7XG4gICAgfVxuXG4gICAgZy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5jbGFzc2VkKFwiYWN0aXZlXCIsIGNlbnRlcmVkICYmIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQgPT09IGNlbnRlcmVkOyB9KTtcblxuICAgIGcudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbig3NTApXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgd2lkdGggLyAyICsgXCIsXCIgKyBoZWlnaHQgLyAyICsgXCIpc2NhbGUoXCIgKyBrICsgXCIpdHJhbnNsYXRlKFwiICsgLXggKyBcIixcIiArIC15ICsgXCIpXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxLjUgLyBrICsgXCJweFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvb2x0aXBIdG1sKGQpIHtcbiAgICB2YXIgd2lubmVyID0gZ2V0V2lubmVyKGQpO1xuXG4gICAgaWYod2lubmVyLm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+VmFjYW50IFNlYXQ8L3NwYW4+J1xuICAgIH1cblxuICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPicgKyB3aW5uZXIubmFtZSArICc8L3NwYW4+JyArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBwYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+J1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmlwc0NvZGUpIHtcbiAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLnJlcG9ydGluZ1VuaXRzWzBdLmZpcHNDb2RlID09PSBmaXBzQ29kZVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBhZGRSYWNlc1RvVXModXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5yYWNlID0gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmVhdHVyZS5pZC50b1N0cmluZygpKVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuXG4gIH1cblxuICBmdW5jdGlvbiBzZXRTdGF0ZURhdGEodXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5zdGF0ZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGlmKGZlYXR1cmUuaWQgPT09IDIpIHtcbiAgICAgICAgZmVhdHVyZS5yYWNlID0gZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgXCIyMDAwXCIpXG4gICAgICB9IFxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UGFydGllcyhyYWNlcykge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKHJhY2VzLm1hcChmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5yZXBvcnRpbmdVbml0c1swXS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5wYXJ0eTtcbiAgICAgIH0pO1xuICAgIH0pKSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRQYXJ0eVZvdGVzKHJhY2VzKSB7XG5cbiAgICBwYXJ0eVZvdGVzID0gZ2V0UGFydGllcyhyYWNlcykubWFwKGZ1bmN0aW9uKHBhcnR5LCBpbmRleCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgXCJuYW1lXCI6IHBhcnR5LFxuICAgICAgICBcInZvdGVzXCI6IDBcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhY2UsIGluZGV4KSB7XG4gICAgICByYWNlLnJlcG9ydGluZ1VuaXRzWzBdLmNhbmRpZGF0ZXMuZm9yRWFjaChmdW5jdGlvbihjYW5kaWRhdGUsIGluZGV4KSB7XG4gICAgICAgIF8uZmluZFdoZXJlKHBhcnR5Vm90ZXMsIHtcIm5hbWVcIjogY2FuZGlkYXRlLnBhcnR5fSkudm90ZXMgKz0gY2FuZGlkYXRlLnZvdGVDb3VudDtcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFydHlWb3RlcztcblxuICB9XG5cbiAgLy8gYWRhcHRlZCBmcm9tIGQzLmZvcm1hdFByZWZpeFxuICBmdW5jdGlvbiBiYndOdW1iZXJGb3JtYXQoZG9sbGEpIHtcbiAgICB2YXIgYmFzZSA9IE1hdGgubWF4KDEsIE1hdGgubWluKDFlMTIsIGRvbGxhKSk7XG4gICAgdmFyIHNjYWxlciA9IGJid0Zvcm1hdFByZWZpeChiYXNlKTtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsZXIuc2NhbGUoZG9sbGEpLnRvUHJlY2lzaW9uKDMpKStzY2FsZXIuc3ltYm9sO1xuICB9XG5cbiAgdmFyIGJid19mb3JtYXRQcmVmaXhlcyA9IFsgXCJwXCIsIFwiblwiLCBcIsK1XCIsIFwibVwiLCBcIlwiLCBcImtcIiwgXCJtXCIsIFwiYlwiLCBcInRcIiBdLm1hcChiYndfZm9ybWF0UHJlZml4KTtcbiAgZnVuY3Rpb24gYmJ3Rm9ybWF0UHJlZml4KHZhbHVlLCBwcmVjaXNpb24pIHtcbiAgXHR2YXIgaSA9IDA7XG4gIFx0aWYgKHZhbHVlKSB7XG4gIFx0XHRpZiAodmFsdWUgPCAwKSB2YWx1ZSAqPSAtMTtcbiAgXHRcdGlmIChwcmVjaXNpb24pIHZhbHVlID0gZDMucm91bmQodmFsdWUsIGQzX2Zvcm1hdF9wcmVjaXNpb24odmFsdWUsIHByZWNpc2lvbikpO1xuICBcdFx0aSA9IDEgKyBNYXRoLmZsb29yKDFlLTEyICsgTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwKTtcbiAgXHRcdGkgPSBNYXRoLm1heCgtMjQsIE1hdGgubWluKDI0LCBNYXRoLmZsb29yKChpIDw9IDAgPyBpICsgMSA6IGkgLSAxKSAvIDMpICogMykpO1xuICBcdH1cbiAgXHRyZXR1cm4gYmJ3X2Zvcm1hdFByZWZpeGVzWzQgKyBpIC8gM107XG4gIH07XG4gIGZ1bmN0aW9uIGJid19mb3JtYXRQcmVmaXgoZCwgaSkge1xuICBcdHZhciBrID0gTWF0aC5wb3coMTAsIE1hdGguYWJzKDQgLSBpKSAqIDMpO1xuICBcdHJldHVybiB7XG4gIFx0XHRzY2FsZTogaSA+IDQgPyBmdW5jdGlvbihkKSB7XG4gIFx0XHRcdHJldHVybiBkIC8gaztcbiAgXHRcdH0gOiBmdW5jdGlvbihkKSB7XG4gIFx0XHRcdHJldHVybiBkICogaztcbiAgXHRcdH0sXG4gIFx0XHRzeW1ib2w6IGRcbiAgXHR9O1xuICB9XG5cbiAgZDMuc2VsZWN0KHNlbGYuZnJhbWVFbGVtZW50KS5zdHlsZSgnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XG59XG4iXX0=
