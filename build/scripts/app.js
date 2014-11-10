(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./scripts/map.js')()

},{"./scripts/map.js":4}],2:[function(require,module,exports){
var d3 = require('d3');
var b3 = require('./map-helpers.js');
var _ = require('underscore');

var legend = {

  voteTotalScale: d3.scale.linear()
                    .range([0,50]),

  append: function(races) {
    self.setPartyVotes(self.stateRaces(races));
    self.setPartyVotesMax();
    // b3.setPartyScale();

    var width = parseInt(d3.select('#map-container').style('width'));
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
      .attr("y", (self.partyVotes.length+1)*legendLineHeight - 175)
      .attr("dy", ".95em")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("National vote total")

    var legend = legendContainer.selectAll(".legend")
        .data(self.partyVotes)
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + (i * legendLineHeight + (self.partyVotes.length*legendLineHeight - 125)) + ")"; });

    legend.append("rect")
        .attr("x", legendWidth - legendMarginRight)
        .attr("width", function(d) { return self.voteTotalScale(d.votes); })
        .attr("height", legendLineHeight - 2)
        .style("fill", function(d) { return b3.partyScale(d.name); });

    legend.append("text")
        .attr("x", legendWidth - legendMarginRight - 4)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d.name; });

    legend.append("text")
        .attr("x", function(d) { return legendWidth - legendMarginRight + 4 + self.voteTotalScale(d.votes); })
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr('class', 'legend-values')
        .text(function(d) { return b3.bbwNumberFormat(d.votes); });
  },

  stateRaces: function(races) {
    return races.filter(function(race) {
      return race.fipsCode === undefined
    })
  },

  setPartyVotes: function(stateRaces) {
    var partyVotes = b3.getPartyVotes(stateRaces)
    self.partyVotes = _.sortBy(partyVotes, function(d) {
      return -d.votes
    }).slice(0, 8);
  },

  partyVotes: undefined,

  setPartyVotesMax: function() {
    var max = d3.max(self.partyVotes, function(d) {
      return d.votes
    })

    self.voteTotalScale
      .domain([0, max])
  }
}

var self = legend

module.exports = legend


},{"./map-helpers.js":3,"d3":"d3","underscore":"underscore"}],3:[function(require,module,exports){
var d3 = require('d3');
var _ = require('underscore');
var topojson = require('topojson');

var b3;
var colors = d3.shuffle(['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600'])

var bbw_formatPrefix = function(d, i) {
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

var prefixes = [ "p", "n", "µ", "m", "", "k", "m", "b", "t" ].map(bbw_formatPrefix)



b3 = {

  partyScale: d3.scale.ordinal()
    .range(colors),
 
  getWinner: function(d) {
    return  _.max(d.race.candidates, function(candidate) {
      return candidate.voteCount
    })
  },

  getParties: function(races) {
    return _.uniq(_.flatten(races.map(function(race) {
      return race.candidates.map(function(candidate) {
        return candidate.party;
      });
    })));
  },

  getPartyVotes: function(races) {

    var partyVotes = self.getParties(races).map(function(party, index) {
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

    return partyVotes;
  },


  getReportingUnitFromFipsCode: function(races, fipsCode) {
    var reportingUnit;

    for(var i = 0; typeof(reportingUnit) === "undefined" && i < races.length; i++) {
      var race = races[i]
      if(race.fipsCode === fipsCode) {
        races.splice(i, 1)
        reportingUnit = race;
      }
    }

    return {race: reportingUnit, races: races}
  },

  addRacesToUs: function(us, races) {
    var features = topojson.feature(us, us.objects.counties).features

    return features.map(function(feature) {
      var reportingUnit = self.getReportingUnitFromFipsCode(races, feature.id.toString())
      feature.race = reportingUnit.race
      races = reportingUnit.races

      return feature
    })
  },

  setStateData: function(us, races) {
    var features = topojson.feature(us, us.objects.states).features

    return features.map(function(feature) {
      if(feature.id === 2) {
        var reportingUnit = self.getReportingUnitFromFipsCode(races, "2000")
        feature.race = reportingUnit.race
        races = reportingUnit.races
      }
      return feature
    })
  },

  formatPrefixes: prefixes,

  bbwNumberFormat: function(dolla) {
    var base = Math.max(1, Math.min(1e12, dolla));
    var scaler = self.bbwFormatPrefix(base);
    return parseFloat(scaler.scale(dolla).toPrecision(3))+scaler.symbol;
  },


  bbwFormatPrefix: function(value, precision) {
    var i = 0;
    if (value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
    }
    return self.formatPrefixes[4 + i / 3];
  }

}

var self = b3



module.exports = b3;





},{"d3":"d3","topojson":"topojson","underscore":"underscore"}],4:[function(require,module,exports){
var d3 = require('d3');
d3.tip = require('./vendor/d3-tip')(d3);
var queue = require('queue-async');
var topojson = require('topojson');
var _ = require('underscore');
var b3 = require('./map-helpers.js');
var legend = require('./legend.js');


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


  var voteTotalScale = d3.scale.linear().range([0,50]);

  var projection = d3.geo.albersUsa()
      .scale(scaleWidth)
      .translate([width / 2, height / 2]);

      var zoomListener = d3.behavior.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", zoomHandler)

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
        .data(b3.addRacesToUs(us, races))
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('fill', setFill)
        // .on('dragstart', function(d) {
        //   d3.event.sourceEvent.stopPropagation();
        //   console.log('drag start');
        //   tip.show(d)
        // })
        .on('mouseover', function(d) {
          if(d.race) {
            tip.show(d)
          }
        })
        .on('mouseout', tip.hide)
        .on('click', clicked);

    // zoomListener(g);

    g.append('g')
      .attr('id', 'states')
      .selectAll('path')
        .data(b3.setStateData(us, races))
      .enter().append('path')
        .attr('d', path)
        .attr('class', function(d) {
          return d.id === 2 ? "state alaska" : "state"
        });

    //Deals with Alaska
    d3.select('.alaska')
      .style('fill', function(d) {
        return b3.partyScale(d);
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

    legend.append(races);
    console.timeEnd('toph')
  }

  function setFill(d) {
    if(d.race && d.race.candidates) {
      var winner = b3.getWinner(d);
      return winner.party ? b3.partyScale(winner.party) : 'url(#crosshatch)';
    } else {
      return 'white'
    }
  }

  function zoomHandler() {
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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
    var winner = b3.getWinner(d);

    if(winner.name === undefined) {
      return '<span class="winner-name">Vacant Seat</span>'
    }

    return '<span class="winner-name">' + winner.name + '</span>' + '<span style="color:' + b3.partyScale(winner.party) + '">' + winner.party + '</span>'
  }



  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vc2NyaXB0cy9tYXAuanMnKSgpXG4iLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbnZhciBsZWdlbmQgPSB7XG5cbiAgdm90ZVRvdGFsU2NhbGU6IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAgICAgICAgIC5yYW5nZShbMCw1MF0pLFxuXG4gIGFwcGVuZDogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICBzZWxmLnNldFBhcnR5Vm90ZXMoc2VsZi5zdGF0ZVJhY2VzKHJhY2VzKSk7XG4gICAgc2VsZi5zZXRQYXJ0eVZvdGVzTWF4KCk7XG4gICAgLy8gYjMuc2V0UGFydHlTY2FsZSgpO1xuXG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLnN0eWxlKCd3aWR0aCcpKTtcbiAgICB2YXIgbGVnZW5kTGluZUhlaWdodCA9IDIwO1xuXG4gICAgaWYod2lkdGggPCA5NjApIHtcbiAgICAgIHZhciBsZWdlbmRXaWR0aCA9IHdpZHRoLzJcbiAgICAgIHZhciBsZWdlbmRNYXJnaW5SaWdodCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsZWdlbmRNYXJnaW5SaWdodCA9IDEwMDtcbiAgICAgIHZhciBsZWdlbmRXaWR0aCA9IHdpZHRoXG4gICAgfVxuICAgIHZhciBsZWdlbmRIZWlnaHQgPSAyMDA7XG5cbiAgICB2YXIgbGVnZW5kQ29udGFpbmVyID0gZDMuc2VsZWN0KCcjbGVnZW5kLWNvbnRhaW5lcicpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBsZWdlbmRIZWlnaHQpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcblxuICAgIGxlZ2VuZENvbnRhaW5lclxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgLmF0dHIoXCJ5XCIsIChzZWxmLnBhcnR5Vm90ZXMubGVuZ3RoKzEpKmxlZ2VuZExpbmVIZWlnaHQgLSAxNzUpXG4gICAgICAuYXR0cihcImR5XCIsIFwiLjk1ZW1cIilcbiAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAuc3R5bGUoXCJmb250LXdlaWdodFwiLCBcImJvbGRcIilcbiAgICAgIC50ZXh0KFwiTmF0aW9uYWwgdm90ZSB0b3RhbFwiKVxuXG4gICAgdmFyIGxlZ2VuZCA9IGxlZ2VuZENvbnRhaW5lci5zZWxlY3RBbGwoXCIubGVnZW5kXCIpXG4gICAgICAgIC5kYXRhKHNlbGYucGFydHlWb3RlcylcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgKGkgKiBsZWdlbmRMaW5lSGVpZ2h0ICsgKHNlbGYucGFydHlWb3Rlcy5sZW5ndGgqbGVnZW5kTGluZUhlaWdodCAtIDEyNSkpICsgXCIpXCI7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2VsZi52b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGVnZW5kTGluZUhlaWdodCAtIDIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gYjMucGFydHlTY2FsZShkLm5hbWUpOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0IC0gNClcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgKyA0ICsgc2VsZi52b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kLXZhbHVlcycpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGIzLmJid051bWJlckZvcm1hdChkLnZvdGVzKTsgfSk7XG4gIH0sXG5cbiAgc3RhdGVSYWNlczogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLmZpcHNDb2RlID09PSB1bmRlZmluZWRcbiAgICB9KVxuICB9LFxuXG4gIHNldFBhcnR5Vm90ZXM6IGZ1bmN0aW9uKHN0YXRlUmFjZXMpIHtcbiAgICB2YXIgcGFydHlWb3RlcyA9IGIzLmdldFBhcnR5Vm90ZXMoc3RhdGVSYWNlcylcbiAgICBzZWxmLnBhcnR5Vm90ZXMgPSBfLnNvcnRCeShwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gLWQudm90ZXNcbiAgICB9KS5zbGljZSgwLCA4KTtcbiAgfSxcblxuICBwYXJ0eVZvdGVzOiB1bmRlZmluZWQsXG5cbiAgc2V0UGFydHlWb3Rlc01heDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heCA9IGQzLm1heChzZWxmLnBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkLnZvdGVzXG4gICAgfSlcblxuICAgIHNlbGYudm90ZVRvdGFsU2NhbGVcbiAgICAgIC5kb21haW4oWzAsIG1heF0pXG4gIH1cbn1cblxudmFyIHNlbGYgPSBsZWdlbmRcblxubW9kdWxlLmV4cG9ydHMgPSBsZWdlbmRcblxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcblxudmFyIGIzO1xudmFyIGNvbG9ycyA9IGQzLnNodWZmbGUoWycjRkYwMEZGJywgJyNDQzAwRkYnLCAnIzAwRkYwMCcsICcjRkZGRjAwJywgJyMwMEZGRkYnLCAnI0NDRkYwMCcsICcjRkZDQzAwJywgJyMwMEZGOTknLCAnIzY2MDBDQycsICcjRkYwMDk5JywgJyMwMDY2NjYnLCAnIzAwNjYwMCddKVxuXG52YXIgYmJ3X2Zvcm1hdFByZWZpeCA9IGZ1bmN0aW9uKGQsIGkpIHtcbiAgdmFyIGsgPSBNYXRoLnBvdygxMCwgTWF0aC5hYnMoNCAtIGkpICogMyk7XG4gIHJldHVybiB7XG4gICAgc2NhbGU6IGkgPiA0ID8gZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQgLyBrO1xuICAgIH0gOiBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZCAqIGs7XG4gICAgfSxcbiAgICBzeW1ib2w6IGRcbiAgfTtcbn1cblxudmFyIHByZWZpeGVzID0gWyBcInBcIiwgXCJuXCIsIFwiwrVcIiwgXCJtXCIsIFwiXCIsIFwia1wiLCBcIm1cIiwgXCJiXCIsIFwidFwiIF0ubWFwKGJid19mb3JtYXRQcmVmaXgpXG5cblxuXG5iMyA9IHtcblxuICBwYXJ0eVNjYWxlOiBkMy5zY2FsZS5vcmRpbmFsKClcbiAgICAucmFuZ2UoY29sb3JzKSxcbiBcbiAgZ2V0V2lubmVyOiBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuICBfLm1heChkLnJhY2UuY2FuZGlkYXRlcywgZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudFxuICAgIH0pXG4gIH0sXG5cbiAgZ2V0UGFydGllczogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gXy51bmlxKF8uZmxhdHRlbihyYWNlcy5tYXAoZnVuY3Rpb24ocmFjZSkge1xuICAgICAgcmV0dXJuIHJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGUucGFydHk7XG4gICAgICB9KTtcbiAgICB9KSkpO1xuICB9LFxuXG4gIGdldFBhcnR5Vm90ZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG5cbiAgICB2YXIgcGFydHlWb3RlcyA9IHNlbGYuZ2V0UGFydGllcyhyYWNlcykubWFwKGZ1bmN0aW9uKHBhcnR5LCBpbmRleCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgXCJuYW1lXCI6IHBhcnR5LFxuICAgICAgICBcInZvdGVzXCI6IDBcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhY2UsIGluZGV4KSB7XG4gICAgICByYWNlLmNhbmRpZGF0ZXMuZm9yRWFjaChmdW5jdGlvbihjYW5kaWRhdGUsIGluZGV4KSB7XG4gICAgICAgIGlmKGNhbmRpZGF0ZS52b3RlQ291bnQgPT09IDY2KSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmFjZSwgY2FuZGlkYXRlKVxuICAgICAgICB9XG4gICAgICAgIF8uZmluZFdoZXJlKHBhcnR5Vm90ZXMsIHtcIm5hbWVcIjogY2FuZGlkYXRlLnBhcnR5fSkudm90ZXMgKz0gY2FuZGlkYXRlLnZvdGVDb3VudDtcbiAgICAgIH0pXG5cbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJ0eVZvdGVzO1xuICB9LFxuXG5cbiAgZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZTogZnVuY3Rpb24ocmFjZXMsIGZpcHNDb2RlKSB7XG4gICAgdmFyIHJlcG9ydGluZ1VuaXQ7XG5cbiAgICBmb3IodmFyIGkgPSAwOyB0eXBlb2YocmVwb3J0aW5nVW5pdCkgPT09IFwidW5kZWZpbmVkXCIgJiYgaSA8IHJhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFjZSA9IHJhY2VzW2ldXG4gICAgICBpZihyYWNlLmZpcHNDb2RlID09PSBmaXBzQ29kZSkge1xuICAgICAgICByYWNlcy5zcGxpY2UoaSwgMSlcbiAgICAgICAgcmVwb3J0aW5nVW5pdCA9IHJhY2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtyYWNlOiByZXBvcnRpbmdVbml0LCByYWNlczogcmFjZXN9XG4gIH0sXG5cbiAgYWRkUmFjZXNUb1VzOiBmdW5jdGlvbih1cywgcmFjZXMpIHtcbiAgICB2YXIgZmVhdHVyZXMgPSB0b3BvanNvbi5mZWF0dXJlKHVzLCB1cy5vYmplY3RzLmNvdW50aWVzKS5mZWF0dXJlc1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICB2YXIgcmVwb3J0aW5nVW5pdCA9IHNlbGYuZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZShyYWNlcywgZmVhdHVyZS5pZC50b1N0cmluZygpKVxuICAgICAgZmVhdHVyZS5yYWNlID0gcmVwb3J0aW5nVW5pdC5yYWNlXG4gICAgICByYWNlcyA9IHJlcG9ydGluZ1VuaXQucmFjZXNcblxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9LFxuXG4gIHNldFN0YXRlRGF0YTogZnVuY3Rpb24odXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5zdGF0ZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGlmKGZlYXR1cmUuaWQgPT09IDIpIHtcbiAgICAgICAgdmFyIHJlcG9ydGluZ1VuaXQgPSBzZWxmLmdldFJlcG9ydGluZ1VuaXRGcm9tRmlwc0NvZGUocmFjZXMsIFwiMjAwMFwiKVxuICAgICAgICBmZWF0dXJlLnJhY2UgPSByZXBvcnRpbmdVbml0LnJhY2VcbiAgICAgICAgcmFjZXMgPSByZXBvcnRpbmdVbml0LnJhY2VzXG4gICAgICB9XG4gICAgICByZXR1cm4gZmVhdHVyZVxuICAgIH0pXG4gIH0sXG5cbiAgZm9ybWF0UHJlZml4ZXM6IHByZWZpeGVzLFxuXG4gIGJid051bWJlckZvcm1hdDogZnVuY3Rpb24oZG9sbGEpIHtcbiAgICB2YXIgYmFzZSA9IE1hdGgubWF4KDEsIE1hdGgubWluKDFlMTIsIGRvbGxhKSk7XG4gICAgdmFyIHNjYWxlciA9IHNlbGYuYmJ3Rm9ybWF0UHJlZml4KGJhc2UpO1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHNjYWxlci5zY2FsZShkb2xsYSkudG9QcmVjaXNpb24oMykpK3NjYWxlci5zeW1ib2w7XG4gIH0sXG5cblxuICBiYndGb3JtYXRQcmVmaXg6IGZ1bmN0aW9uKHZhbHVlLCBwcmVjaXNpb24pIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSAqPSAtMTtcbiAgICAgIGlmIChwcmVjaXNpb24pIHZhbHVlID0gZDMucm91bmQodmFsdWUsIGQzX2Zvcm1hdF9wcmVjaXNpb24odmFsdWUsIHByZWNpc2lvbikpO1xuICAgICAgaSA9IDEgKyBNYXRoLmZsb29yKDFlLTEyICsgTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwKTtcbiAgICAgIGkgPSBNYXRoLm1heCgtMjQsIE1hdGgubWluKDI0LCBNYXRoLmZsb29yKChpIDw9IDAgPyBpICsgMSA6IGkgLSAxKSAvIDMpICogMykpO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZi5mb3JtYXRQcmVmaXhlc1s0ICsgaSAvIDNdO1xuICB9XG5cbn1cblxudmFyIHNlbGYgPSBiM1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBiMztcblxuXG5cblxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgYjMgPSByZXF1aXJlKCcuL21hcC1oZWxwZXJzLmpzJyk7XG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi9sZWdlbmQuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLnRpbWUoJ3RvcGgnKVxuICAvLyB2YXIgd2lkdGggPSA5NjAsXG4gIC8vICAgICBoZWlnaHQgPSA2NTAsXG4gIC8vICAgICBjZW50ZXJlZDtcblxuICB2YXIgd2lkdGggPSBwYXJzZUludChkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuc3R5bGUoJ3dpZHRoJykpXG4gICwgbWFwUmF0aW8gPSAuNlxuICAsIGhlaWdodCA9IHdpZHRoICogbWFwUmF0aW9cbiAgLCBzY2FsZVdpZHRoID0gd2lkdGggKiAxLjJcbiAgLCBjZW50ZXJlZDtcblxuICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAuaHRtbCh0b29sdGlwSHRtbCk7XG5cbiAgdmFyIGNvbG9ycyA9IFsnI0ZGMDBGRicsICcjQ0MwMEZGJywgJyMwMEZGMDAnLCAnI0ZGRkYwMCcsICcjMDBGRkZGJywgJyNDQ0ZGMDAnLCAnI0ZGQ0MwMCcsICcjMDBGRjk5JywgJyM2NjAwQ0MnLCAnI0ZGMDA5OScsICcjMDA2NjY2JywgJyMwMDY2MDAnXVxuXG4gIC8vIHZhciBjb2xvcnMgPSBbJ3B1cnBsZScsICdtYWdlbnRhJywgJ25hdnknLCAnbWFyb29uJywgJ3RlYWwnLCAnYXF1YScsICdncmVlbicsICdsaW1lJywgJ29saXZlJywgJ3llbGxvdyddXG5cblxuICB2YXIgdm90ZVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMCw1MF0pO1xuXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAuc2NhbGUoc2NhbGVXaWR0aClcbiAgICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pO1xuXG4gICAgICB2YXIgem9vbUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpXG4gICAgICAgIC5zY2FsZUV4dGVudChbMC4xLCAzXSlcbiAgICAgICAgLm9uKFwiem9vbVwiLCB6b29tSGFuZGxlcilcblxuICB2YXIgcGF0aCA9IGQzLmdlby5wYXRoKClcbiAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgLmNhbGwodGlwKVxuXG4gIHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgIC5vbihcImNsaWNrXCIsIGNsaWNrZWQpXG5cbiAgdmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuICAvLyBkMy5zZWxlY3Qod2luZG93KS5vbigncmVzaXplJywgcmVzaXplKTtcblxuXG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHVzLCByYWNlc0FycmF5KSB7XG4gICAgcmFjZXMgPSByYWNlc0FycmF5LnJhY2VzXG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudGllcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYjMuYWRkUmFjZXNUb1VzKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnR5JylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBzZXRGaWxsKVxuICAgICAgICAvLyAub24oJ2RyYWdzdGFydCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICBkMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZygnZHJhZyBzdGFydCcpO1xuICAgICAgICAvLyAgIHRpcC5zaG93KGQpXG4gICAgICAgIC8vIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQucmFjZSkge1xuICAgICAgICAgICAgdGlwLnNob3coZClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcbiAgICAgICAgLm9uKCdjbGljaycsIGNsaWNrZWQpO1xuXG4gICAgLy8gem9vbUxpc3RlbmVyKGcpO1xuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2lkJywgJ3N0YXRlcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYjMuc2V0U3RhdGVEYXRhKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZC5pZCA9PT0gMiA/IFwic3RhdGUgYWxhc2thXCIgOiBcInN0YXRlXCJcbiAgICAgICAgfSk7XG5cbiAgICAvL0RlYWxzIHdpdGggQWxhc2thXG4gICAgZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoZCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aXAuc2hvdylcbiAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcbiAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlLWJvcmRlcnMnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgLy8gc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgLy8gICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHN0YXRlcywgc3RhdGVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAvLyAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlcycpXG4gICAgLy8gICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBMRUdFTkRcblxuICAgIGxlZ2VuZC5hcHBlbmQocmFjZXMpO1xuICAgIGNvbnNvbGUudGltZUVuZCgndG9waCcpXG4gIH1cblxuICBmdW5jdGlvbiBzZXRGaWxsKGQpIHtcbiAgICBpZihkLnJhY2UgJiYgZC5yYWNlLmNhbmRpZGF0ZXMpIHtcbiAgICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG4gICAgICByZXR1cm4gd2lubmVyLnBhcnR5ID8gYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpIDogJ3VybCgjY3Jvc3NoYXRjaCknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3doaXRlJ1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21IYW5kbGVyKCkge1xuICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja2VkKGQpIHtcbiAgICB2YXIgeCwgeSwgaztcblxuICAgIGlmIChkICYmIGNlbnRlcmVkICE9PSBkKSB7XG4gICAgICB2YXIgY2VudHJvaWQgPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgeCA9IGNlbnRyb2lkWzBdO1xuICAgICAgeSA9IGNlbnRyb2lkWzFdO1xuICAgICAgayA9IDQ7XG4gICAgICBjZW50ZXJlZCA9IGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSB3aWR0aCAvIDI7XG4gICAgICB5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIGsgPSAxO1xuICAgICAgY2VudGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuY2xhc3NlZChcImFjdGl2ZVwiLCBjZW50ZXJlZCAmJiBmdW5jdGlvbihkKSB7IHJldHVybiBkID09PSBjZW50ZXJlZDsgfSk7XG5cbiAgICBnLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oNzUwKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHdpZHRoIC8gMiArIFwiLFwiICsgaGVpZ2h0IC8gMiArIFwiKXNjYWxlKFwiICsgayArIFwiKXRyYW5zbGF0ZShcIiArIC14ICsgXCIsXCIgKyAteSArIFwiKVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMS41IC8gayArIFwicHhcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGIzLmdldFdpbm5lcihkKTtcblxuICAgIGlmKHdpbm5lci5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPlZhY2FudCBTZWF0PC9zcGFuPidcbiAgICB9XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyLm5hbWUgKyAnPC9zcGFuPicgKyAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPidcbiAgfVxuXG5cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
