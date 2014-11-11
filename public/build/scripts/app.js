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
      voteCountyTotalScale = d3.scale.log().range([0.25,1]);

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

    return '<span class="winner-name">' + winner.name + '</span>' + '<span style="color:' + b3.partyScale(winner.party) + '">' + winner.party + '</span>'
  }



  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi9zY3JpcHRzL21hcC5qcycpKClcbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG52YXIgYjMgPSByZXF1aXJlKCcuL21hcC1oZWxwZXJzLmpzJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxudmFyIGxlZ2VuZCA9IHtcblxuICB2b3RlVG90YWxTY2FsZTogZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgICAgICAgICAgICAgLnJhbmdlKFswLDUwXSksXG5cbiAgYXBwZW5kOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHNlbGYuc2V0UGFydHlWb3RlcyhzZWxmLnN0YXRlUmFjZXMocmFjZXMpKTtcbiAgICBzZWxmLnNldFBhcnR5Vm90ZXNNYXgoKTtcbiAgICAvLyBiMy5zZXRQYXJ0eVNjYWxlKCk7XG5cbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuc3R5bGUoJ3dpZHRoJykpO1xuICAgIHZhciBsZWdlbmRMaW5lSGVpZ2h0ID0gMjA7XG5cbiAgICBpZih3aWR0aCA8IDk2MCkge1xuICAgICAgdmFyIGxlZ2VuZFdpZHRoID0gd2lkdGgvMlxuICAgICAgdmFyIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMTAwO1xuICAgICAgdmFyIGxlZ2VuZFdpZHRoID0gd2lkdGhcbiAgICB9XG4gICAgdmFyIGxlZ2VuZEhlaWdodCA9IDIwMDtcblxuICAgIHZhciBsZWdlbmRDb250YWluZXIgPSBkMy5zZWxlY3QoJyNsZWdlbmQtY29udGFpbmVyJykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGxlZ2VuZEhlaWdodClcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuXG4gICAgbGVnZW5kQ29udGFpbmVyXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQpXG4gICAgICAuYXR0cihcInlcIiwgKHNlbGYucGFydHlWb3Rlcy5sZW5ndGgrMSkqbGVnZW5kTGluZUhlaWdodCAtIDE3NSlcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIuOTVlbVwiKVxuICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgLnRleHQoXCJOYXRpb25hbCB2b3RlIHRvdGFsXCIpXG5cbiAgICB2YXIgbGVnZW5kID0gbGVnZW5kQ29udGFpbmVyLnNlbGVjdEFsbChcIi5sZWdlbmRcIilcbiAgICAgICAgLmRhdGEoc2VsZi5wYXJ0eVZvdGVzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGVnZW5kXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyAoaSAqIGxlZ2VuZExpbmVIZWlnaHQgKyAoc2VsZi5wYXJ0eVZvdGVzLmxlbmd0aCpsZWdlbmRMaW5lSGVpZ2h0IC0gMTI1KSkgKyBcIilcIjsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzZWxmLnZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsZWdlbmRMaW5lSGVpZ2h0IC0gMilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBiMy5wYXJ0eVNjYWxlKGQubmFtZSk7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgLSA0KVxuICAgICAgICAuYXR0cihcInlcIiwgOSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCArIDQgKyBzZWxmLnZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcInlcIiwgOSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQtdmFsdWVzJylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gYjMuYmJ3TnVtYmVyRm9ybWF0KGQudm90ZXMpOyB9KTtcbiAgfSxcblxuICBzdGF0ZVJhY2VzOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHJldHVybiByYWNlcy5maWx0ZXIoZnVuY3Rpb24ocmFjZSkge1xuICAgICAgcmV0dXJuIHJhY2UuZmlwc0NvZGUgPT09IHVuZGVmaW5lZFxuICAgIH0pXG4gIH0sXG5cbiAgc2V0UGFydHlWb3RlczogZnVuY3Rpb24oc3RhdGVSYWNlcykge1xuICAgIHZhciBwYXJ0eVZvdGVzID0gYjMuZ2V0UGFydHlWb3RlcyhzdGF0ZVJhY2VzKVxuICAgIHNlbGYucGFydHlWb3RlcyA9IF8uc29ydEJ5KHBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAtZC52b3Rlc1xuICAgIH0pLnNsaWNlKDAsIDgpO1xuICB9LFxuXG4gIHBhcnR5Vm90ZXM6IHVuZGVmaW5lZCxcblxuICBzZXRQYXJ0eVZvdGVzTWF4OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF4ID0gZDMubWF4KHNlbGYucGFydHlWb3RlcywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQudm90ZXNcbiAgICB9KVxuXG4gICAgc2VsZi52b3RlVG90YWxTY2FsZVxuICAgICAgLmRvbWFpbihbMCwgbWF4XSlcbiAgfVxufVxuXG52YXIgc2VsZiA9IGxlZ2VuZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGxlZ2VuZFxuXG4iLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xuXG52YXIgYjM7XG52YXIgY29sb3JzID0gZDMuc2h1ZmZsZShbJyNGRjAwRkYnLCAnI0NDMDBGRicsICcjMDBGRjAwJywgJyNGRkZGMDAnLCAnIzAwRkZGRicsICcjQ0NGRjAwJywgJyNGRkNDMDAnLCAnIzAwRkY5OScsICcjNjYwMENDJywgJyNGRjAwOTknLCAnIzAwNjY2NicsICcjMDA2NjAwJ10pXG5cbnZhciBiYndfZm9ybWF0UHJlZml4ID0gZnVuY3Rpb24oZCwgaSkge1xuICB2YXIgayA9IE1hdGgucG93KDEwLCBNYXRoLmFicyg0IC0gaSkgKiAzKTtcbiAgcmV0dXJuIHtcbiAgICBzY2FsZTogaSA+IDQgPyBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZCAvIGs7XG4gICAgfSA6IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkICogaztcbiAgICB9LFxuICAgIHN5bWJvbDogZFxuICB9O1xufVxuXG52YXIgcHJlZml4ZXMgPSBbIFwicFwiLCBcIm5cIiwgXCLCtVwiLCBcIm1cIiwgXCJcIiwgXCJrXCIsIFwibVwiLCBcImJcIiwgXCJ0XCIgXS5tYXAoYmJ3X2Zvcm1hdFByZWZpeClcblxuXG5cbmIzID0ge1xuXG4gIHBhcnR5U2NhbGU6IGQzLnNjYWxlLm9yZGluYWwoKVxuICAgIC5yYW5nZShjb2xvcnMpLFxuXG4gIGdldFdpbm5lcjogZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiAgXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZS52b3RlQ291bnRcbiAgICB9KVxuICB9LFxuXG4gIGdldFBhcnRpZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4ocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnBhcnR5O1xuICAgICAgfSk7XG4gICAgfSkpKTtcbiAgfSxcblxuICBnZXRQYXJ0eVZvdGVzOiBmdW5jdGlvbihyYWNlcykge1xuXG4gICAgdmFyIHBhcnR5Vm90ZXMgPSBzZWxmLmdldFBhcnRpZXMocmFjZXMpLm1hcChmdW5jdGlvbihwYXJ0eSwgaW5kZXgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFwibmFtZVwiOiBwYXJ0eSxcbiAgICAgICAgXCJ2b3Rlc1wiOiAwXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmFjZXMuZm9yRWFjaChmdW5jdGlvbihyYWNlLCBpbmRleCkge1xuICAgICAgcmFjZS5jYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlLCBpbmRleCkge1xuICAgICAgICBpZihjYW5kaWRhdGUudm90ZUNvdW50ID09PSA2Nikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJhY2UsIGNhbmRpZGF0ZSlcbiAgICAgICAgfVxuICAgICAgICBfLmZpbmRXaGVyZShwYXJ0eVZvdGVzLCB7XCJuYW1lXCI6IGNhbmRpZGF0ZS5wYXJ0eX0pLnZvdGVzICs9IGNhbmRpZGF0ZS52b3RlQ291bnQ7XG4gICAgICB9KVxuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFydHlWb3RlcztcbiAgfSxcblxuXG4gIGdldFJlcG9ydGluZ1VuaXRGcm9tRmlwc0NvZGU6IGZ1bmN0aW9uKHJhY2VzLCBmaXBzQ29kZSkge1xuICAgIC8vIHZhciByZXBvcnRpbmdVbml0O1xuXG4gICAgLy8gZm9yKHZhciBpID0gMDsgdHlwZW9mKHJlcG9ydGluZ1VuaXQpID09PSBcInVuZGVmaW5lZFwiICYmIGkgPCByYWNlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vICAgdmFyIHJhY2UgPSByYWNlc1tpXVxuICAgIC8vICAgaWYocmFjZS5maXBzQ29kZSA9PT0gZmlwc0NvZGUpIHtcbiAgICAvLyAgICAgcmFjZXMuc3BsaWNlKGksIDEpXG4gICAgLy8gICAgIHJlcG9ydGluZ1VuaXQgPSByYWNlO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgICByZXR1cm4gcmFjZXMuZ2V0KGZpcHNDb2RlKVxuXG4gICAgLy8gcmV0dXJuIHtyYWNlOiByYWNlLCByYWNlczogcmFjZXN9XG4gIH0sXG5cbiAgcmFjZU1hcDogZDMubWFwKCksXG5cbiAgYWRkUmFjZXNUb1VzOiBmdW5jdGlvbih1cywgcmFjZXMpIHtcblxuICAgIHJhY2VzLmZvckVhY2goZnVuY3Rpb24ocmFjZSkge1xuICAgICAgdmFyIGtleSA9IHJhY2UuZmlwc0NvZGVcbiAgICAgIHNlbGYucmFjZU1hcC5zZXQoa2V5LCByYWNlKVxuICAgIH0pXG5cbiAgICB2YXIgZmVhdHVyZXMgPSB0b3BvanNvbi5mZWF0dXJlKHVzLCB1cy5vYmplY3RzLmNvdW50aWVzKS5mZWF0dXJlc1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICBmZWF0dXJlLnJhY2UgPSBzZWxmLnJhY2VNYXAuZ2V0KGZlYXR1cmUuaWQudG9TdHJpbmcoKSlcbiAgICAgIHJldHVybiBmZWF0dXJlXG4gICAgfSlcbiAgfSxcblxuICBzZXRTdGF0ZURhdGE6IGZ1bmN0aW9uKHVzLCByYWNlcykge1xuICAgIHZhciBmZWF0dXJlcyA9IHRvcG9qc29uLmZlYXR1cmUodXMsIHVzLm9iamVjdHMuc3RhdGVzKS5mZWF0dXJlc1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICBpZihmZWF0dXJlLmlkID09PSAyKSB7XG4gICAgICAgIGZlYXR1cmUucmFjZSA9IHNlbGYucmFjZU1hcC5nZXQoXCIyMDAwXCIpXG4gICAgICB9XG4gICAgICByZXR1cm4gZmVhdHVyZVxuICAgIH0pXG4gIH0sXG5cbiAgZ2V0TWF4Vm90ZUNvdW50OiBmdW5jdGlvbihyYWNlcykge1xuICAgIHJldHVybiBfLm1heChyYWNlcy5tYXAoZnVuY3Rpb24ocmFjZSkge1xuICAgICAgcmV0dXJuIF8ubWF4KHJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICByZXR1cm4gYy52b3RlQ291bnQ7XG4gICAgICB9KSk7XG4gICAgfSkpO1xuICB9LFxuXG4gIHNldEZpbGw6IGZ1bmN0aW9uKGQpIHtcbiAgICBpZihkLnJhY2UgJiYgZC5yYWNlLmNhbmRpZGF0ZXMpIHtcbiAgICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG4gICAgICByZXR1cm4gd2lubmVyLnBhcnR5ID8gYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpIDogJ3VybCgjY3Jvc3NoYXRjaCknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3doaXRlJ1xuICAgIH1cbiAgfSxcblxuICB0b29sVGlwSHRtbDogZnVuY3Rpb24oZCkge1xuICAgIHZhciB3aW5uZXIgPSBzZWxmLmdldFdpbm5lcihkKTtcblxuICAgIGlmKHdpbm5lci5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPlZhY2FudCBTZWF0PC9zcGFuPidcbiAgICB9XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyLm5hbWUgKyAnPC9zcGFuPicgKyAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPidcbiAgfSxcblxuICBmb3JtYXRQcmVmaXhlczogcHJlZml4ZXMsXG5cbiAgYmJ3TnVtYmVyRm9ybWF0OiBmdW5jdGlvbihkb2xsYSkge1xuICAgIHZhciBiYXNlID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oMWUxMiwgZG9sbGEpKTtcbiAgICB2YXIgc2NhbGVyID0gc2VsZi5iYndGb3JtYXRQcmVmaXgoYmFzZSk7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQoc2NhbGVyLnNjYWxlKGRvbGxhKS50b1ByZWNpc2lvbigzKSkrc2NhbGVyLnN5bWJvbDtcbiAgfSxcblxuXG4gIGJid0Zvcm1hdFByZWZpeDogZnVuY3Rpb24odmFsdWUsIHByZWNpc2lvbikge1xuICAgIHZhciBpID0gMDtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA8IDApIHZhbHVlICo9IC0xO1xuICAgICAgaWYgKHByZWNpc2lvbikgdmFsdWUgPSBkMy5yb3VuZCh2YWx1ZSwgZDNfZm9ybWF0X3ByZWNpc2lvbih2YWx1ZSwgcHJlY2lzaW9uKSk7XG4gICAgICBpID0gMSArIE1hdGguZmxvb3IoMWUtMTIgKyBNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMTApO1xuICAgICAgaSA9IE1hdGgubWF4KC0yNCwgTWF0aC5taW4oMjQsIE1hdGguZmxvb3IoKGkgPD0gMCA/IGkgKyAxIDogaSAtIDEpIC8gMykgKiAzKSk7XG4gICAgfVxuICAgIHJldHVybiBzZWxmLmZvcm1hdFByZWZpeGVzWzQgKyBpIC8gM107XG4gIH1cblxufVxuXG52YXIgc2VsZiA9IGIzXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGIzO1xuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgYjMgPSByZXF1aXJlKCcuL21hcC1oZWxwZXJzLmpzJyk7XG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi9sZWdlbmQuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSlcbiAgLCBtYXBSYXRpbyA9IC42XG4gICwgaGVpZ2h0ID0gd2lkdGggKiBtYXBSYXRpb1xuICAsIHNjYWxlV2lkdGggPSB3aWR0aCAqIDEuMlxuICAsIGNlbnRlcmVkO1xuXG4gIHZhciB0aXAgPSBkMy50aXAoKVxuICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgIC5odG1sKHRvb2x0aXBIdG1sKTtcblxuICB2YXIgdm90ZVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMCw1MF0pLFxuICAgICAgdm90ZUNvdW50eVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5sb2coKS5yYW5nZShbMC4yNSwxXSk7XG5cbiAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgIC5zY2FsZShzY2FsZVdpZHRoKVxuICAgICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSk7XG5cbiAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodClcbiAgICAgIC5jYWxsKHRpcClcblxuICBzdmcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgICAub24oXCJjbGlja1wiLCBjbGlja2VkKVxuXG4gIHZhciBnID0gc3ZnLmFwcGVuZChcImdcIik7XG5cbiAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgbWV0aG9kOiAncmVzaXplJyxcbiAgICBoZWlnaHQ6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHRcbiAgfVxuXG4gIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UobWVzc2FnZSwgJyonKTtcblxuXG4gIHF1ZXVlKClcbiAgICAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXMuanNvbicpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VwZGF0ZWRfc2VuYXRlX2J5X2NvdW50eS5qc29uJylcbiAgICAuYXdhaXQocmVhZHkpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5KGVycm9yLCB1cywgcmFjZXNBcnJheSkge1xuICAgIHJhY2VzID0gcmFjZXNBcnJheS5yYWNlc1xuXG4gICAgdm90ZUNvdW50eVRvdGFsU2NhbGUuZG9tYWluKFsxLGIzLmdldE1heFZvdGVDb3VudChyYWNlcyldKTtcblxuICAgIHZhciB6b29tTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAgIC5zY2FsZUV4dGVudChbMC4xLCAzXSlcbiAgICAgIC5vbihcInpvb21cIiwgem9vbUhhbmRsZXIpXG5cbiAgICB2YXIgZHJhZ0xpc3RlbmVyID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkcmFnJyk7XG4gICAgICAgIC8vIGlmKGQucmFjZSkge1xuICAgICAgICAvLyAgIHRpcC5zaG93KGQpXG4gICAgICAgIC8vIH1cbiAgICAgIH0pXG5cbiAgICBmdW5jdGlvbiB6b29tSGFuZGxlcigpIHtcbiAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gICAgfVxuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnRpZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKGIzLmFkZFJhY2VzVG9Vcyh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50eScpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgYjMuc2V0RmlsbClcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKCFkLnJhY2UgfHwgIWQucmFjZS5jYW5kaWRhdGVzKSByZXR1cm4gMTtcbiAgICAgICAgICByZXR1cm4gdm90ZUNvdW50eVRvdGFsU2NhbGUoXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGUpIHtyZXR1cm4gZS52b3RlQ291bnQ7fSkpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgaWYoZC5yYWNlKSB7XG4gICAgICAgICAgICB0aXAuc2hvdyhkKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKTtcblxuICAgICAgICAvLyAub24oJ2NsaWNrJywgY2xpY2tlZClcblxuICAgICAgICAvLyAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAvLyB6b29tTGlzdGVuZXIoZyk7XG5cbiAgICAvLyBkcmFnTGlzdGVuZXIoZylcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdpZCcsICdzdGF0ZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKGIzLnNldFN0YXRlRGF0YSh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGQuaWQgPT09IDIgPyBcInN0YXRlIGFsYXNrYVwiIDogXCJzdGF0ZVwiXG4gICAgICAgIH0pO1xuXG4gICAgLy9EZWFscyB3aXRoIEFsYXNrYVxuICAgIHZhciBhbGFza2EgPSBkMy5zZWxlY3QoJy5hbGFza2EnKVxuICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gYjMucGFydHlTY2FsZShkKTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIHRpcC5zaG93KVxuICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKVxuXG4gICAgaWYoIS9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSApIHtcbiAgICAgIGQzLnNlbGVjdEFsbCgnLmNvdW50eScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgICAgZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgICAgLm9uKCdjbGljaycsIGNsaWNrZWQpXG4gICAgfVxuXG4gICAgZy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuZGF0dW0odG9wb2pzb24ubWVzaCh1cywgdXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGUtYm9yZGVycycpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAvLyBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAvLyAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2goc3RhdGVzLCBzdGF0ZXMub2JqZWN0cy5zdGF0ZXMsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGI7IH0pKVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAnc3RhdGVzJylcbiAgICAvLyAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIC8vIExFR0VORFxuXG4gICAgbGVnZW5kLmFwcGVuZChyYWNlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja2VkKGQpIHtcbiAgICB2YXIgeCwgeSwgaztcblxuICAgIGlmIChkICYmIGNlbnRlcmVkICE9PSBkKSB7XG4gICAgICB2YXIgY2VudHJvaWQgPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgeCA9IGNlbnRyb2lkWzBdO1xuICAgICAgeSA9IGNlbnRyb2lkWzFdO1xuICAgICAgayA9IDQ7XG4gICAgICBjZW50ZXJlZCA9IGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSB3aWR0aCAvIDI7XG4gICAgICB5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIGsgPSAxO1xuICAgICAgY2VudGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuY2xhc3NlZChcImFjdGl2ZVwiLCBjZW50ZXJlZCAmJiBmdW5jdGlvbihkKSB7IHJldHVybiBkID09PSBjZW50ZXJlZDsgfSk7XG5cbiAgICBnLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oNzUwKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHdpZHRoIC8gMiArIFwiLFwiICsgaGVpZ2h0IC8gMiArIFwiKXNjYWxlKFwiICsgayArIFwiKXRyYW5zbGF0ZShcIiArIC14ICsgXCIsXCIgKyAteSArIFwiKVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMS41IC8gayArIFwicHhcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGIzLmdldFdpbm5lcihkKTtcblxuICAgIGlmKHdpbm5lci5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPlZhY2FudCBTZWF0PC9zcGFuPidcbiAgICB9XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyLm5hbWUgKyAnPC9zcGFuPicgKyAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPidcbiAgfVxuXG5cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
