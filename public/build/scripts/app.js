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
        .style("fill", function(d) { 
          console.log(b3.partyScale.range());
          console.log(d.name);
          console.log(b3.partyScale(d.name))
          return b3.partyScale(d.name); });

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
// var colors = d3.shuffle(['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600'])

var colors = ['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600']


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
        _.findWhere(partyVotes, {"name": candidate.party}).votes += candidate.voteCount;
      })

    });

    return partyVotes;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3NjcmlwdHMvbWFwLmpzJykoKVxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbnZhciBiMyA9IHJlcXVpcmUoJy4vbWFwLWhlbHBlcnMuanMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG52YXIgbGVnZW5kID0ge1xuXG4gIHZvdGVUb3RhbFNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAucmFuZ2UoWzAsNTBdKSxcblxuICBhcHBlbmQ6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgc2VsZi5zZXRQYXJ0eVZvdGVzKHNlbGYuc3RhdGVSYWNlcyhyYWNlcykpO1xuICAgIHNlbGYuc2V0UGFydHlWb3Rlc01heCgpO1xuICAgIC8vIGIzLnNldFBhcnR5U2NhbGUoKTtcblxuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSk7XG4gICAgdmFyIGxlZ2VuZExpbmVIZWlnaHQgPSAyMDtcblxuICAgIGlmKHdpZHRoIDwgOTYwKSB7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aC8yXG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAxMDA7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aFxuICAgIH1cbiAgICB2YXIgbGVnZW5kSGVpZ2h0ID0gMjAwO1xuXG4gICAgdmFyIGxlZ2VuZENvbnRhaW5lciA9IGQzLnNlbGVjdCgnI2xlZ2VuZC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignaGVpZ2h0JywgbGVnZW5kSGVpZ2h0KVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG5cbiAgICBsZWdlbmRDb250YWluZXJcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgIC5hdHRyKFwieVwiLCAoc2VsZi5wYXJ0eVZvdGVzLmxlbmd0aCsxKSpsZWdlbmRMaW5lSGVpZ2h0IC0gMTc1KVxuICAgICAgLmF0dHIoXCJkeVwiLCBcIi45NWVtXCIpXG4gICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgLnN0eWxlKFwiZm9udC13ZWlnaHRcIiwgXCJib2xkXCIpXG4gICAgICAudGV4dChcIk5hdGlvbmFsIHZvdGUgdG90YWxcIilcblxuICAgIHZhciBsZWdlbmQgPSBsZWdlbmRDb250YWluZXIuc2VsZWN0QWxsKFwiLmxlZ2VuZFwiKVxuICAgICAgICAuZGF0YShzZWxmLnBhcnR5Vm90ZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmRcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIChpICogbGVnZW5kTGluZUhlaWdodCArIChzZWxmLnBhcnR5Vm90ZXMubGVuZ3RoKmxlZ2VuZExpbmVIZWlnaHQgLSAxMjUpKSArIFwiKVwiOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNlbGYudm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGxlZ2VuZExpbmVIZWlnaHQgLSAyKVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgXG4gICAgICAgICAgY29uc29sZS5sb2coYjMucGFydHlTY2FsZS5yYW5nZSgpKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkLm5hbWUpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGIzLnBhcnR5U2NhbGUoZC5uYW1lKSlcbiAgICAgICAgICByZXR1cm4gYjMucGFydHlTY2FsZShkLm5hbWUpOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0IC0gNClcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgKyA0ICsgc2VsZi52b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kLXZhbHVlcycpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGIzLmJid051bWJlckZvcm1hdChkLnZvdGVzKTsgfSk7XG4gIH0sXG5cbiAgc3RhdGVSYWNlczogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLmZpcHNDb2RlID09PSB1bmRlZmluZWRcbiAgICB9KVxuICB9LFxuXG4gIHNldFBhcnR5Vm90ZXM6IGZ1bmN0aW9uKHN0YXRlUmFjZXMpIHtcbiAgICB2YXIgcGFydHlWb3RlcyA9IGIzLmdldFBhcnR5Vm90ZXMoc3RhdGVSYWNlcylcbiAgICBzZWxmLnBhcnR5Vm90ZXMgPSBfLnNvcnRCeShwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gLWQudm90ZXNcbiAgICB9KS5zbGljZSgwLCA4KTtcbiAgfSxcblxuICBwYXJ0eVZvdGVzOiB1bmRlZmluZWQsXG5cbiAgc2V0UGFydHlWb3Rlc01heDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heCA9IGQzLm1heChzZWxmLnBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkLnZvdGVzXG4gICAgfSlcblxuICAgIHNlbGYudm90ZVRvdGFsU2NhbGVcbiAgICAgIC5kb21haW4oWzAsIG1heF0pXG4gIH1cbn1cblxudmFyIHNlbGYgPSBsZWdlbmRcblxubW9kdWxlLmV4cG9ydHMgPSBsZWdlbmRcblxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcblxudmFyIGIzO1xuLy8gdmFyIGNvbG9ycyA9IGQzLnNodWZmbGUoWycjRkYwMEZGJywgJyNDQzAwRkYnLCAnIzAwRkYwMCcsICcjRkZGRjAwJywgJyMwMEZGRkYnLCAnI0NDRkYwMCcsICcjRkZDQzAwJywgJyMwMEZGOTknLCAnIzY2MDBDQycsICcjRkYwMDk5JywgJyMwMDY2NjYnLCAnIzAwNjYwMCddKVxuXG52YXIgY29sb3JzID0gWycjRkYwMEZGJywgJyNDQzAwRkYnLCAnIzAwRkYwMCcsICcjRkZGRjAwJywgJyMwMEZGRkYnLCAnI0NDRkYwMCcsICcjRkZDQzAwJywgJyMwMEZGOTknLCAnIzY2MDBDQycsICcjRkYwMDk5JywgJyMwMDY2NjYnLCAnIzAwNjYwMCddXG5cblxudmFyIGJid19mb3JtYXRQcmVmaXggPSBmdW5jdGlvbihkLCBpKSB7XG4gIHZhciBrID0gTWF0aC5wb3coMTAsIE1hdGguYWJzKDQgLSBpKSAqIDMpO1xuICByZXR1cm4ge1xuICAgIHNjYWxlOiBpID4gNCA/IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkIC8gaztcbiAgICB9IDogZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQgKiBrO1xuICAgIH0sXG4gICAgc3ltYm9sOiBkXG4gIH07XG59XG5cbnZhciBwcmVmaXhlcyA9IFsgXCJwXCIsIFwiblwiLCBcIsK1XCIsIFwibVwiLCBcIlwiLCBcImtcIiwgXCJtXCIsIFwiYlwiLCBcInRcIiBdLm1hcChiYndfZm9ybWF0UHJlZml4KVxuXG5cblxuYjMgPSB7XG5cbiAgcGFydHlTY2FsZTogZDMuc2NhbGUub3JkaW5hbCgpXG4gICAgLnJhbmdlKGNvbG9ycyksXG4gXG4gIGdldFdpbm5lcjogZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiAgXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZS52b3RlQ291bnRcbiAgICB9KVxuICB9LFxuXG4gIGdldFBhcnRpZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4ocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnBhcnR5O1xuICAgICAgfSk7XG4gICAgfSkpKTtcbiAgfSxcblxuICBnZXRQYXJ0eVZvdGVzOiBmdW5jdGlvbihyYWNlcykge1xuXG4gICAgdmFyIHBhcnR5Vm90ZXMgPSBzZWxmLmdldFBhcnRpZXMocmFjZXMpLm1hcChmdW5jdGlvbihwYXJ0eSwgaW5kZXgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFwibmFtZVwiOiBwYXJ0eSxcbiAgICAgICAgXCJ2b3Rlc1wiOiAwXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmFjZXMuZm9yRWFjaChmdW5jdGlvbihyYWNlLCBpbmRleCkge1xuICAgICAgcmFjZS5jYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlLCBpbmRleCkge1xuICAgICAgICBfLmZpbmRXaGVyZShwYXJ0eVZvdGVzLCB7XCJuYW1lXCI6IGNhbmRpZGF0ZS5wYXJ0eX0pLnZvdGVzICs9IGNhbmRpZGF0ZS52b3RlQ291bnQ7XG4gICAgICB9KVxuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFydHlWb3RlcztcbiAgfSxcblxuICByYWNlTWFwOiBkMy5tYXAoKSxcblxuICBhZGRSYWNlc1RvVXM6IGZ1bmN0aW9uKHVzLCByYWNlcykge1xuXG4gICAgcmFjZXMuZm9yRWFjaChmdW5jdGlvbihyYWNlKSB7XG4gICAgICB2YXIga2V5ID0gcmFjZS5maXBzQ29kZVxuICAgICAgc2VsZi5yYWNlTWFwLnNldChrZXksIHJhY2UpXG4gICAgfSlcblxuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuY291bnRpZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGZlYXR1cmUucmFjZSA9IHNlbGYucmFjZU1hcC5nZXQoZmVhdHVyZS5pZC50b1N0cmluZygpKSBcbiAgICAgIHJldHVybiBmZWF0dXJlXG4gICAgfSlcbiAgfSxcblxuICBzZXRTdGF0ZURhdGE6IGZ1bmN0aW9uKHVzLCByYWNlcykge1xuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuc3RhdGVzKS5mZWF0dXJlc1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICBpZihmZWF0dXJlLmlkID09PSAyKSB7XG4gICAgICAgIGZlYXR1cmUucmFjZSA9IHNlbGYucmFjZU1hcC5nZXQoXCIyMDAwXCIpXG4gICAgICB9XG4gICAgICByZXR1cm4gZmVhdHVyZVxuICAgIH0pXG4gIH0sXG5cbiAgc2V0RmlsbDogZnVuY3Rpb24oZCkge1xuICAgIGlmKGQucmFjZSAmJiBkLnJhY2UuY2FuZGlkYXRlcykge1xuICAgICAgdmFyIHdpbm5lciA9IGIzLmdldFdpbm5lcihkKTtcbiAgICAgIHJldHVybiB3aW5uZXIucGFydHkgPyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgOiAndXJsKCNjcm9zc2hhdGNoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnd2hpdGUnXG4gICAgfVxuICB9LFxuXG4gIHRvb2xUaXBIdG1sOiBmdW5jdGlvbihkKSB7XG4gICAgdmFyIHdpbm5lciA9IHNlbGYuZ2V0V2lubmVyKGQpO1xuXG4gICAgaWYod2lubmVyLm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+VmFjYW50IFNlYXQ8L3NwYW4+J1xuICAgIH1cblxuICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPicgKyB3aW5uZXIubmFtZSArICc8L3NwYW4+JyArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+J1xuICB9LFxuXG4gIGZvcm1hdFByZWZpeGVzOiBwcmVmaXhlcyxcblxuICBiYndOdW1iZXJGb3JtYXQ6IGZ1bmN0aW9uKGRvbGxhKSB7XG4gICAgdmFyIGJhc2UgPSBNYXRoLm1heCgxLCBNYXRoLm1pbigxZTEyLCBkb2xsYSkpO1xuICAgIHZhciBzY2FsZXIgPSBzZWxmLmJid0Zvcm1hdFByZWZpeChiYXNlKTtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsZXIuc2NhbGUoZG9sbGEpLnRvUHJlY2lzaW9uKDMpKStzY2FsZXIuc3ltYm9sO1xuICB9LFxuXG5cbiAgYmJ3Rm9ybWF0UHJlZml4OiBmdW5jdGlvbih2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgKj0gLTE7XG4gICAgICBpZiAocHJlY2lzaW9uKSB2YWx1ZSA9IGQzLnJvdW5kKHZhbHVlLCBkM19mb3JtYXRfcHJlY2lzaW9uKHZhbHVlLCBwcmVjaXNpb24pKTtcbiAgICAgIGkgPSAxICsgTWF0aC5mbG9vcigxZS0xMiArIE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4xMCk7XG4gICAgICBpID0gTWF0aC5tYXgoLTI0LCBNYXRoLm1pbigyNCwgTWF0aC5mbG9vcigoaSA8PSAwID8gaSArIDEgOiBpIC0gMSkgLyAzKSAqIDMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbGYuZm9ybWF0UHJlZml4ZXNbNCArIGkgLyAzXTtcbiAgfVxuXG59XG5cbnZhciBzZWxmID0gYjNcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gYjM7XG5cblxuXG5cbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIGxlZ2VuZCA9IHJlcXVpcmUoJy4vbGVnZW5kLmpzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICB2YXIgd2lkdGggPSBwYXJzZUludChkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuc3R5bGUoJ3dpZHRoJykpXG4gICwgbWFwUmF0aW8gPSAuNlxuICAsIGhlaWdodCA9IHdpZHRoICogbWFwUmF0aW9cbiAgLCBzY2FsZVdpZHRoID0gd2lkdGggKiAxLjJcbiAgLCBjZW50ZXJlZDtcblxuICB2YXIgdGlwID0gZDMudGlwKClcbiAgICAuYXR0cignY2xhc3MnLCAnZDMtdGlwJylcbiAgICAuaHRtbCh0b29sdGlwSHRtbCk7XG5cbiAgdmFyIHZvdGVUb3RhbFNjYWxlID0gZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzAsNTBdKSxcbiAgICAgIHZvdGVDb3VudHlUb3RhbFNjYWxlID0gZDMuc2NhbGUubG9nKCkucmFuZ2UoWzAuMzUsMV0pO1xuXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAuc2NhbGUoc2NhbGVXaWR0aClcbiAgICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pO1xuXG4gIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAuY2FsbCh0aXApXG5cbiAgc3ZnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgICAgLm9uKFwiY2xpY2tcIiwgY2xpY2tlZClcblxuICB2YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gIHZhciBtZXNzYWdlID0ge1xuICAgIG1ldGhvZDogJ3Jlc2l6ZScsXG4gICAgaGVpZ2h0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0XG4gIH1cblxuICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKG1lc3NhZ2UsICcqJyk7XG5cblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuICBmdW5jdGlvbiByZWFkeShlcnJvciwgdXMsIHJhY2VzQXJyYXkpIHtcbiAgICByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXNcblxuICAgIHZvdGVDb3VudHlUb3RhbFNjYWxlLmRvbWFpbihbMSxiMy5nZXRNYXhWb3RlQ291bnQocmFjZXMpXSk7XG5cbiAgICB2YXIgem9vbUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpXG4gICAgICAuc2NhbGVFeHRlbnQoWzAuMSwgM10pXG4gICAgICAub24oXCJ6b29tXCIsIHpvb21IYW5kbGVyKVxuXG4gICAgdmFyIGRyYWdMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgLm9uKCdkcmFnJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZHJhZycpO1xuICAgICAgICAvLyBpZihkLnJhY2UpIHtcbiAgICAgICAgLy8gICB0aXAuc2hvdyhkKVxuICAgICAgICAvLyB9XG4gICAgICB9KVxuXG4gICAgZnVuY3Rpb24gem9vbUhhbmRsZXIoKSB7XG4gICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xuICAgIH1cblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50aWVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShiMy5hZGRSYWNlc1RvVXModXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHknKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIGIzLnNldEZpbGwpXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZighZC5yYWNlIHx8ICFkLnJhY2UuY2FuZGlkYXRlcykgcmV0dXJuIDE7XG4gICAgICAgICAgcmV0dXJuIHZvdGVDb3VudHlUb3RhbFNjYWxlKF8ubWF4KGQucmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihlKSB7cmV0dXJuIGUudm90ZUNvdW50O30pKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQucmFjZSkge1xuICAgICAgICAgICAgdGlwLnNob3coZClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSk7XG5cbiAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrZWQpXG5cbiAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrZWQpO1xuXG4gICAgLy8gem9vbUxpc3RlbmVyKGcpO1xuXG4gICAgLy8gZHJhZ0xpc3RlbmVyKGcpXG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignaWQnLCAnc3RhdGVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShiMy5zZXRTdGF0ZURhdGEodXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkLmlkID09PSAyID8gXCJzdGF0ZSBhbGFza2FcIiA6IFwic3RhdGVcIlxuICAgICAgICB9KTtcblxuICAgIC8vRGVhbHMgd2l0aCBBbGFza2FcbiAgICB2YXIgYWxhc2thID0gZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoZCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aXAuc2hvdylcbiAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcblxuICAgIGlmKCEvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgKSB7XG4gICAgICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKVxuICAgIH1cblxuICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlLWJvcmRlcnMnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgLy8gc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgLy8gICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHN0YXRlcywgc3RhdGVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAvLyAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlcycpXG4gICAgLy8gICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBMRUdFTkRcblxuICAgIGxlZ2VuZC5hcHBlbmQocmFjZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tlZChkKSB7XG4gICAgdmFyIHgsIHksIGs7XG5cbiAgICBpZiAoZCAmJiBjZW50ZXJlZCAhPT0gZCkge1xuICAgICAgdmFyIGNlbnRyb2lkID0gcGF0aC5jZW50cm9pZChkKTtcbiAgICAgIHggPSBjZW50cm9pZFswXTtcbiAgICAgIHkgPSBjZW50cm9pZFsxXTtcbiAgICAgIGsgPSA0O1xuICAgICAgY2VudGVyZWQgPSBkO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gd2lkdGggLyAyO1xuICAgICAgeSA9IGhlaWdodCAvIDI7XG4gICAgICBrID0gMTtcbiAgICAgIGNlbnRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmNsYXNzZWQoXCJhY3RpdmVcIiwgY2VudGVyZWQgJiYgZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gY2VudGVyZWQ7IH0pO1xuXG4gICAgZy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDc1MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB3aWR0aCAvIDIgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilzY2FsZShcIiArIGsgKyBcIil0cmFuc2xhdGUoXCIgKyAteCArIFwiLFwiICsgLXkgKyBcIilcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEuNSAvIGsgKyBcInB4XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9vbHRpcEh0bWwoZCkge1xuICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG5cbiAgICBpZih3aW5uZXIubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj5WYWNhbnQgU2VhdDwvc3Bhbj4nXG4gICAgfVxuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lci5uYW1lICsgJzwvc3Bhbj4nXG4gICAgICArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+ICdcbiAgICAgICsgJzxzcGFuIGNsYXNzPVwidm90ZXNcIj4nICsgZDMuZm9ybWF0KFwiLFwiKSh3aW5uZXIudm90ZUNvdW50KSArICc8L3NwYW4+JztcbiAgfVxuXG5cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
