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
    // var reportingUnit;

    // for(var i = 0; typeof(reportingUnit) === "undefined" && i < races.length; i++) {
    //   var race = races[i]
    //   if(race.fipsCode === fipsCode) {
    //     races.splice(i, 1)
    //     reportingUnit = race;
    //   }
    // }
    return races.get(fipsCode)

    // return {race: race, races: races}
  },

  raceMap: d3.map(),

  addRacesToUs: function(us, races) {

    races.forEach(function(race) {
      var key = race.fipsCode
      self.raceMap.set(key, race)
    })

    var features = topojson.feature(us, us.objects.counties).features

    return features.map(function(feature) {
      feature.race = self.raceMap.get(feature.id.toString())
      return feature
    })
  },

  setStateData: function(us, races) {
    var features = topojson.feature(us, us.objects.states).features

    return features.map(function(feature) {
      if(feature.id === 2) {
        feature.race = self.raceMap.get("2000")
      }
      return feature
    })
  },

  getMaxVoteCount: function(races) {
    return _.max(races.map(function(race) {
      // exception for alaska
      if(race.fipsCode == 2000) return 0;
      // exception for state entries
      if(!race.fipsCode) return 0;
      // otherwise return top vote count
      return _.max(race.candidates.map(function(c) {
        return c.voteCount;
      }));
    }));
  },

  setFill: function(d) {
    if(d.race && d.race.candidates) {
      var winner = b3.getWinner(d);
      return winner.party ? b3.partyScale(winner.party) : 'url(#crosshatch)';
    } else {
      return 'white'
    }
  },

  toolTipHtml: function(d) {
    var winner = self.getWinner(d);

    if(winner.name === undefined) {
      return '<span class="winner-name">Vacant Seat</span>'
    }

    return '<span class="winner-name">' + winner.name + '</span>' + '<span style="color:' + b3.partyScale(winner.party) + '">' + winner.party + '</span>'
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

  var width = parseInt(d3.select('#map-container').style('width'))
  , mapRatio = .6
  , height = width * mapRatio
  , scaleWidth = width * 1.2
  , centered;

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(tooltipHtml);

  var voteTotalScale = d3.scale.linear().range([0,50]),
      voteCountyTotalScale = d3.scale.log().range([0.35,1]);

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

  var message = {
    method: 'resize',
    height: document.documentElement.scrollHeight
  }

  window.parent.postMessage(message, '*');


  queue()
    .defer(d3.json, 'data/us.json')
    .defer(d3.json, 'data/updated_senate_by_county.json')
    .await(ready);

  function ready(error, us, racesArray) {
    races = racesArray.races

    voteCountyTotalScale.domain([1,b3.getMaxVoteCount(races)]);

    var zoomListener = d3.behavior.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", zoomHandler)

    var dragListener = d3.behavior.drag()
      .on('drag', function(d) {
        console.log('drag');
        // if(d.race) {
        //   tip.show(d)
        // }
      })

    function zoomHandler() {
      g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    g.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(b3.addRacesToUs(us, races))
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('fill', b3.setFill)
        .style('opacity', function(d) {
          if(!d.race || !d.race.candidates) return 1;
          return voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
        })
        .on('mouseover', function(d) {
          if(d.race) {
            tip.show(d)
          }
        })
        .on('mouseout', tip.hide);

        // .on('click', clicked)

        // .on('click', clicked);

    // zoomListener(g);

    // dragListener(g)

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
    var alaska = d3.select('.alaska')
      .style('fill', function(d) {
        return b3.partyScale(d);
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)

    if(!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      d3.selectAll('.county')
        .on('click', clicked);

      d3.select('.alaska')
        .on('click', clicked)
    }

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

    return '<span class="winner-name">' + winner.name + '</span>'
      + '<span style="color:' + b3.partyScale(winner.party) + '">' + winner.party + '</span> '
      + '<span class="votes">' + d3.format(",")(winner.voteCount) + '</span>';
  }



  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3NjcmlwdHMvbWFwLmpzJykoKVxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbnZhciBiMyA9IHJlcXVpcmUoJy4vbWFwLWhlbHBlcnMuanMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG52YXIgbGVnZW5kID0ge1xuXG4gIHZvdGVUb3RhbFNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAucmFuZ2UoWzAsNTBdKSxcblxuICBhcHBlbmQ6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgc2VsZi5zZXRQYXJ0eVZvdGVzKHNlbGYuc3RhdGVSYWNlcyhyYWNlcykpO1xuICAgIHNlbGYuc2V0UGFydHlWb3Rlc01heCgpO1xuICAgIC8vIGIzLnNldFBhcnR5U2NhbGUoKTtcblxuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSk7XG4gICAgdmFyIGxlZ2VuZExpbmVIZWlnaHQgPSAyMDtcblxuICAgIGlmKHdpZHRoIDwgOTYwKSB7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aC8yXG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAxMDA7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aFxuICAgIH1cbiAgICB2YXIgbGVnZW5kSGVpZ2h0ID0gMjAwO1xuXG4gICAgdmFyIGxlZ2VuZENvbnRhaW5lciA9IGQzLnNlbGVjdCgnI2xlZ2VuZC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignaGVpZ2h0JywgbGVnZW5kSGVpZ2h0KVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG5cbiAgICBsZWdlbmRDb250YWluZXJcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgIC5hdHRyKFwieVwiLCAoc2VsZi5wYXJ0eVZvdGVzLmxlbmd0aCsxKSpsZWdlbmRMaW5lSGVpZ2h0IC0gMTc1KVxuICAgICAgLmF0dHIoXCJkeVwiLCBcIi45NWVtXCIpXG4gICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgLnN0eWxlKFwiZm9udC13ZWlnaHRcIiwgXCJib2xkXCIpXG4gICAgICAudGV4dChcIk5hdGlvbmFsIHZvdGUgdG90YWxcIilcblxuICAgIHZhciBsZWdlbmQgPSBsZWdlbmRDb250YWluZXIuc2VsZWN0QWxsKFwiLmxlZ2VuZFwiKVxuICAgICAgICAuZGF0YShzZWxmLnBhcnR5Vm90ZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmRcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIChpICogbGVnZW5kTGluZUhlaWdodCArIChzZWxmLnBhcnR5Vm90ZXMubGVuZ3RoKmxlZ2VuZExpbmVIZWlnaHQgLSAxMjUpKSArIFwiKVwiOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNlbGYudm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGxlZ2VuZExpbmVIZWlnaHQgLSAyKVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGIzLnBhcnR5U2NhbGUoZC5uYW1lKTsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCAtIDQpXG4gICAgICAgIC5hdHRyKFwieVwiLCA5KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0ICsgNCArIHNlbGYudm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgIC5hdHRyKFwieVwiLCA5KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZC12YWx1ZXMnKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBiMy5iYndOdW1iZXJGb3JtYXQoZC52b3Rlcyk7IH0pO1xuICB9LFxuXG4gIHN0YXRlUmFjZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgcmV0dXJuIHJhY2VzLmZpbHRlcihmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5maXBzQ29kZSA9PT0gdW5kZWZpbmVkXG4gICAgfSlcbiAgfSxcblxuICBzZXRQYXJ0eVZvdGVzOiBmdW5jdGlvbihzdGF0ZVJhY2VzKSB7XG4gICAgdmFyIHBhcnR5Vm90ZXMgPSBiMy5nZXRQYXJ0eVZvdGVzKHN0YXRlUmFjZXMpXG4gICAgc2VsZi5wYXJ0eVZvdGVzID0gXy5zb3J0QnkocGFydHlWb3RlcywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIC1kLnZvdGVzXG4gICAgfSkuc2xpY2UoMCwgOCk7XG4gIH0sXG5cbiAgcGFydHlWb3RlczogdW5kZWZpbmVkLFxuXG4gIHNldFBhcnR5Vm90ZXNNYXg6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXggPSBkMy5tYXgoc2VsZi5wYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZC52b3Rlc1xuICAgIH0pXG5cbiAgICBzZWxmLnZvdGVUb3RhbFNjYWxlXG4gICAgICAuZG9tYWluKFswLCBtYXhdKVxuICB9XG59XG5cbnZhciBzZWxmID0gbGVnZW5kXG5cbm1vZHVsZS5leHBvcnRzID0gbGVnZW5kXG5cbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciB0b3BvanNvbiA9IHJlcXVpcmUoJ3RvcG9qc29uJyk7XG5cbnZhciBiMztcbnZhciBjb2xvcnMgPSBkMy5zaHVmZmxlKFsnI0ZGMDBGRicsICcjQ0MwMEZGJywgJyMwMEZGMDAnLCAnI0ZGRkYwMCcsICcjMDBGRkZGJywgJyNDQ0ZGMDAnLCAnI0ZGQ0MwMCcsICcjMDBGRjk5JywgJyM2NjAwQ0MnLCAnI0ZGMDA5OScsICcjMDA2NjY2JywgJyMwMDY2MDAnXSlcblxudmFyIGJid19mb3JtYXRQcmVmaXggPSBmdW5jdGlvbihkLCBpKSB7XG4gIHZhciBrID0gTWF0aC5wb3coMTAsIE1hdGguYWJzKDQgLSBpKSAqIDMpO1xuICByZXR1cm4ge1xuICAgIHNjYWxlOiBpID4gNCA/IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkIC8gaztcbiAgICB9IDogZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQgKiBrO1xuICAgIH0sXG4gICAgc3ltYm9sOiBkXG4gIH07XG59XG5cbnZhciBwcmVmaXhlcyA9IFsgXCJwXCIsIFwiblwiLCBcIsK1XCIsIFwibVwiLCBcIlwiLCBcImtcIiwgXCJtXCIsIFwiYlwiLCBcInRcIiBdLm1hcChiYndfZm9ybWF0UHJlZml4KVxuXG5cblxuYjMgPSB7XG5cbiAgcGFydHlTY2FsZTogZDMuc2NhbGUub3JkaW5hbCgpXG4gICAgLnJhbmdlKGNvbG9ycyksXG5cbiAgZ2V0V2lubmVyOiBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuICBfLm1heChkLnJhY2UuY2FuZGlkYXRlcywgZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudFxuICAgIH0pXG4gIH0sXG5cbiAgZ2V0UGFydGllczogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gXy51bmlxKF8uZmxhdHRlbihyYWNlcy5tYXAoZnVuY3Rpb24ocmFjZSkge1xuICAgICAgcmV0dXJuIHJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGUucGFydHk7XG4gICAgICB9KTtcbiAgICB9KSkpO1xuICB9LFxuXG4gIGdldFBhcnR5Vm90ZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG5cbiAgICB2YXIgcGFydHlWb3RlcyA9IHNlbGYuZ2V0UGFydGllcyhyYWNlcykubWFwKGZ1bmN0aW9uKHBhcnR5LCBpbmRleCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgXCJuYW1lXCI6IHBhcnR5LFxuICAgICAgICBcInZvdGVzXCI6IDBcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhY2UsIGluZGV4KSB7XG4gICAgICByYWNlLmNhbmRpZGF0ZXMuZm9yRWFjaChmdW5jdGlvbihjYW5kaWRhdGUsIGluZGV4KSB7XG4gICAgICAgIGlmKGNhbmRpZGF0ZS52b3RlQ291bnQgPT09IDY2KSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmFjZSwgY2FuZGlkYXRlKVxuICAgICAgICB9XG4gICAgICAgIF8uZmluZFdoZXJlKHBhcnR5Vm90ZXMsIHtcIm5hbWVcIjogY2FuZGlkYXRlLnBhcnR5fSkudm90ZXMgKz0gY2FuZGlkYXRlLnZvdGVDb3VudDtcbiAgICAgIH0pXG5cbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJ0eVZvdGVzO1xuICB9LFxuXG5cbiAgZ2V0UmVwb3J0aW5nVW5pdEZyb21GaXBzQ29kZTogZnVuY3Rpb24ocmFjZXMsIGZpcHNDb2RlKSB7XG4gICAgLy8gdmFyIHJlcG9ydGluZ1VuaXQ7XG5cbiAgICAvLyBmb3IodmFyIGkgPSAwOyB0eXBlb2YocmVwb3J0aW5nVW5pdCkgPT09IFwidW5kZWZpbmVkXCIgJiYgaSA8IHJhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gICB2YXIgcmFjZSA9IHJhY2VzW2ldXG4gICAgLy8gICBpZihyYWNlLmZpcHNDb2RlID09PSBmaXBzQ29kZSkge1xuICAgIC8vICAgICByYWNlcy5zcGxpY2UoaSwgMSlcbiAgICAvLyAgICAgcmVwb3J0aW5nVW5pdCA9IHJhY2U7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICAgIHJldHVybiByYWNlcy5nZXQoZmlwc0NvZGUpXG5cbiAgICAvLyByZXR1cm4ge3JhY2U6IHJhY2UsIHJhY2VzOiByYWNlc31cbiAgfSxcblxuICByYWNlTWFwOiBkMy5tYXAoKSxcblxuICBhZGRSYWNlc1RvVXM6IGZ1bmN0aW9uKHVzLCByYWNlcykge1xuXG4gICAgcmFjZXMuZm9yRWFjaChmdW5jdGlvbihyYWNlKSB7XG4gICAgICB2YXIga2V5ID0gcmFjZS5maXBzQ29kZVxuICAgICAgc2VsZi5yYWNlTWFwLnNldChrZXksIHJhY2UpXG4gICAgfSlcblxuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuY291bnRpZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGZlYXR1cmUucmFjZSA9IHNlbGYucmFjZU1hcC5nZXQoZmVhdHVyZS5pZC50b1N0cmluZygpKVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9LFxuXG4gIHNldFN0YXRlRGF0YTogZnVuY3Rpb24odXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5zdGF0ZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGlmKGZlYXR1cmUuaWQgPT09IDIpIHtcbiAgICAgICAgZmVhdHVyZS5yYWNlID0gc2VsZi5yYWNlTWFwLmdldChcIjIwMDBcIilcbiAgICAgIH1cbiAgICAgIHJldHVybiBmZWF0dXJlXG4gICAgfSlcbiAgfSxcblxuICBnZXRNYXhWb3RlQ291bnQ6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgcmV0dXJuIF8ubWF4KHJhY2VzLm1hcChmdW5jdGlvbihyYWNlKSB7XG4gICAgICAvLyBleGNlcHRpb24gZm9yIGFsYXNrYVxuICAgICAgaWYocmFjZS5maXBzQ29kZSA9PSAyMDAwKSByZXR1cm4gMDtcbiAgICAgIC8vIGV4Y2VwdGlvbiBmb3Igc3RhdGUgZW50cmllc1xuICAgICAgaWYoIXJhY2UuZmlwc0NvZGUpIHJldHVybiAwO1xuICAgICAgLy8gb3RoZXJ3aXNlIHJldHVybiB0b3Agdm90ZSBjb3VudFxuICAgICAgcmV0dXJuIF8ubWF4KHJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICByZXR1cm4gYy52b3RlQ291bnQ7XG4gICAgICB9KSk7XG4gICAgfSkpO1xuICB9LFxuXG4gIHNldEZpbGw6IGZ1bmN0aW9uKGQpIHtcbiAgICBpZihkLnJhY2UgJiYgZC5yYWNlLmNhbmRpZGF0ZXMpIHtcbiAgICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG4gICAgICByZXR1cm4gd2lubmVyLnBhcnR5ID8gYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpIDogJ3VybCgjY3Jvc3NoYXRjaCknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3doaXRlJ1xuICAgIH1cbiAgfSxcblxuICB0b29sVGlwSHRtbDogZnVuY3Rpb24oZCkge1xuICAgIHZhciB3aW5uZXIgPSBzZWxmLmdldFdpbm5lcihkKTtcblxuICAgIGlmKHdpbm5lci5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPlZhY2FudCBTZWF0PC9zcGFuPidcbiAgICB9XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyLm5hbWUgKyAnPC9zcGFuPicgKyAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPidcbiAgfSxcblxuICBmb3JtYXRQcmVmaXhlczogcHJlZml4ZXMsXG5cbiAgYmJ3TnVtYmVyRm9ybWF0OiBmdW5jdGlvbihkb2xsYSkge1xuICAgIHZhciBiYXNlID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oMWUxMiwgZG9sbGEpKTtcbiAgICB2YXIgc2NhbGVyID0gc2VsZi5iYndGb3JtYXRQcmVmaXgoYmFzZSk7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQoc2NhbGVyLnNjYWxlKGRvbGxhKS50b1ByZWNpc2lvbigzKSkrc2NhbGVyLnN5bWJvbDtcbiAgfSxcblxuXG4gIGJid0Zvcm1hdFByZWZpeDogZnVuY3Rpb24odmFsdWUsIHByZWNpc2lvbikge1xuICAgIHZhciBpID0gMDtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA8IDApIHZhbHVlICo9IC0xO1xuICAgICAgaWYgKHByZWNpc2lvbikgdmFsdWUgPSBkMy5yb3VuZCh2YWx1ZSwgZDNfZm9ybWF0X3ByZWNpc2lvbih2YWx1ZSwgcHJlY2lzaW9uKSk7XG4gICAgICBpID0gMSArIE1hdGguZmxvb3IoMWUtMTIgKyBNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMTApO1xuICAgICAgaSA9IE1hdGgubWF4KC0yNCwgTWF0aC5taW4oMjQsIE1hdGguZmxvb3IoKGkgPD0gMCA/IGkgKyAxIDogaSAtIDEpIC8gMykgKiAzKSk7XG4gICAgfVxuICAgIHJldHVybiBzZWxmLmZvcm1hdFByZWZpeGVzWzQgKyBpIC8gM107XG4gIH1cblxufVxuXG52YXIgc2VsZiA9IGIzXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGIzO1xuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgYjMgPSByZXF1aXJlKCcuL21hcC1oZWxwZXJzLmpzJyk7XG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi9sZWdlbmQuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSlcbiAgLCBtYXBSYXRpbyA9IC42XG4gICwgaGVpZ2h0ID0gd2lkdGggKiBtYXBSYXRpb1xuICAsIHNjYWxlV2lkdGggPSB3aWR0aCAqIDEuMlxuICAsIGNlbnRlcmVkO1xuXG4gIHZhciB0aXAgPSBkMy50aXAoKVxuICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgIC5odG1sKHRvb2x0aXBIdG1sKTtcblxuICB2YXIgdm90ZVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMCw1MF0pLFxuICAgICAgdm90ZUNvdW50eVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5sb2coKS5yYW5nZShbMC4zNSwxXSk7XG5cbiAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgIC5zY2FsZShzY2FsZVdpZHRoKVxuICAgICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSk7XG5cbiAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodClcbiAgICAgIC5jYWxsKHRpcClcblxuICBzdmcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgICAub24oXCJjbGlja1wiLCBjbGlja2VkKVxuXG4gIHZhciBnID0gc3ZnLmFwcGVuZChcImdcIik7XG5cbiAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgbWV0aG9kOiAncmVzaXplJyxcbiAgICBoZWlnaHQ6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHRcbiAgfVxuXG4gIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UobWVzc2FnZSwgJyonKTtcblxuXG4gIHF1ZXVlKClcbiAgICAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXMuanNvbicpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VwZGF0ZWRfc2VuYXRlX2J5X2NvdW50eS5qc29uJylcbiAgICAuYXdhaXQocmVhZHkpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5KGVycm9yLCB1cywgcmFjZXNBcnJheSkge1xuICAgIHJhY2VzID0gcmFjZXNBcnJheS5yYWNlc1xuXG4gICAgdm90ZUNvdW50eVRvdGFsU2NhbGUuZG9tYWluKFsxLGIzLmdldE1heFZvdGVDb3VudChyYWNlcyldKTtcblxuICAgIHZhciB6b29tTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAgIC5zY2FsZUV4dGVudChbMC4xLCAzXSlcbiAgICAgIC5vbihcInpvb21cIiwgem9vbUhhbmRsZXIpXG5cbiAgICB2YXIgZHJhZ0xpc3RlbmVyID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkcmFnJyk7XG4gICAgICAgIC8vIGlmKGQucmFjZSkge1xuICAgICAgICAvLyAgIHRpcC5zaG93KGQpXG4gICAgICAgIC8vIH1cbiAgICAgIH0pXG5cbiAgICBmdW5jdGlvbiB6b29tSGFuZGxlcigpIHtcbiAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gICAgfVxuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnRpZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKGIzLmFkZFJhY2VzVG9Vcyh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50eScpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgYjMuc2V0RmlsbClcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKCFkLnJhY2UgfHwgIWQucmFjZS5jYW5kaWRhdGVzKSByZXR1cm4gMTtcbiAgICAgICAgICByZXR1cm4gdm90ZUNvdW50eVRvdGFsU2NhbGUoXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGUpIHtyZXR1cm4gZS52b3RlQ291bnQ7fSkpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgaWYoZC5yYWNlKSB7XG4gICAgICAgICAgICB0aXAuc2hvdyhkKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKTtcblxuICAgICAgICAvLyAub24oJ2NsaWNrJywgY2xpY2tlZClcblxuICAgICAgICAvLyAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAvLyB6b29tTGlzdGVuZXIoZyk7XG5cbiAgICAvLyBkcmFnTGlzdGVuZXIoZylcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdpZCcsICdzdGF0ZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKGIzLnNldFN0YXRlRGF0YSh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGQuaWQgPT09IDIgPyBcInN0YXRlIGFsYXNrYVwiIDogXCJzdGF0ZVwiXG4gICAgICAgIH0pO1xuXG4gICAgLy9EZWFscyB3aXRoIEFsYXNrYVxuICAgIHZhciBhbGFza2EgPSBkMy5zZWxlY3QoJy5hbGFza2EnKVxuICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gYjMucGFydHlTY2FsZShkKTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIHRpcC5zaG93KVxuICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKVxuXG4gICAgaWYoIS9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSApIHtcbiAgICAgIGQzLnNlbGVjdEFsbCgnLmNvdW50eScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgICAgZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgICAgLm9uKCdjbGljaycsIGNsaWNrZWQpXG4gICAgfVxuXG4gICAgZy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuZGF0dW0odG9wb2pzb24ubWVzaCh1cywgdXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGUtYm9yZGVycycpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAvLyBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAvLyAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2goc3RhdGVzLCBzdGF0ZXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGVzJylcbiAgICAvLyAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIC8vIExFR0VORFxuXG4gICAgbGVnZW5kLmFwcGVuZChyYWNlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja2VkKGQpIHtcbiAgICB2YXIgeCwgeSwgaztcblxuICAgIGlmIChkICYmIGNlbnRlcmVkICE9PSBkKSB7XG4gICAgICB2YXIgY2VudHJvaWQgPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgeCA9IGNlbnRyb2lkWzBdO1xuICAgICAgeSA9IGNlbnRyb2lkWzFdO1xuICAgICAgayA9IDQ7XG4gICAgICBjZW50ZXJlZCA9IGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSB3aWR0aCAvIDI7XG4gICAgICB5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIGsgPSAxO1xuICAgICAgY2VudGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuY2xhc3NlZChcImFjdGl2ZVwiLCBjZW50ZXJlZCAmJiBmdW5jdGlvbihkKSB7IHJldHVybiBkID09PSBjZW50ZXJlZDsgfSk7XG5cbiAgICBnLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oNzUwKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHdpZHRoIC8gMiArIFwiLFwiICsgaGVpZ2h0IC8gMiArIFwiKXNjYWxlKFwiICsgayArIFwiKXRyYW5zbGF0ZShcIiArIC14ICsgXCIsXCIgKyAteSArIFwiKVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMS41IC8gayArIFwicHhcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGIzLmdldFdpbm5lcihkKTtcblxuICAgIGlmKHdpbm5lci5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPlZhY2FudCBTZWF0PC9zcGFuPidcbiAgICB9XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyLm5hbWUgKyAnPC9zcGFuPidcbiAgICAgICsgJzxzcGFuIHN0eWxlPVwiY29sb3I6JyArIGIzLnBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSArICdcIj4nICsgd2lubmVyLnBhcnR5ICsgJzwvc3Bhbj4gJ1xuICAgICAgKyAnPHNwYW4gY2xhc3M9XCJ2b3Rlc1wiPicgKyBkMy5mb3JtYXQoXCIsXCIpKHdpbm5lci52b3RlQ291bnQpICsgJzwvc3Bhbj4nO1xuICB9XG5cblxuXG4gIGQzLnNlbGVjdChzZWxmLmZyYW1lRWxlbWVudCkuc3R5bGUoJ2hlaWdodCcsIGhlaWdodCArICdweCcpO1xufVxuIl19
