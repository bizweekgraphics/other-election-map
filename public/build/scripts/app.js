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
      voteCountyTotalScale = d3.scale.log().range([0.5,1]);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vc2NyaXB0cy9tYXAuanMnKSgpXG4iLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbnZhciBsZWdlbmQgPSB7XG5cbiAgdm90ZVRvdGFsU2NhbGU6IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAgICAgICAgIC5yYW5nZShbMCw1MF0pLFxuXG4gIGFwcGVuZDogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICBzZWxmLnNldFBhcnR5Vm90ZXMoc2VsZi5zdGF0ZVJhY2VzKHJhY2VzKSk7XG4gICAgc2VsZi5zZXRQYXJ0eVZvdGVzTWF4KCk7XG4gICAgLy8gYjMuc2V0UGFydHlTY2FsZSgpO1xuXG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLnN0eWxlKCd3aWR0aCcpKTtcbiAgICB2YXIgbGVnZW5kTGluZUhlaWdodCA9IDIwO1xuXG4gICAgaWYod2lkdGggPCA5NjApIHtcbiAgICAgIHZhciBsZWdlbmRXaWR0aCA9IHdpZHRoLzJcbiAgICAgIHZhciBsZWdlbmRNYXJnaW5SaWdodCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsZWdlbmRNYXJnaW5SaWdodCA9IDEwMDtcbiAgICAgIHZhciBsZWdlbmRXaWR0aCA9IHdpZHRoXG4gICAgfVxuICAgIHZhciBsZWdlbmRIZWlnaHQgPSAyMDA7XG5cbiAgICB2YXIgbGVnZW5kQ29udGFpbmVyID0gZDMuc2VsZWN0KCcjbGVnZW5kLWNvbnRhaW5lcicpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBsZWdlbmRIZWlnaHQpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcblxuICAgIGxlZ2VuZENvbnRhaW5lclxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgLmF0dHIoXCJ5XCIsIChzZWxmLnBhcnR5Vm90ZXMubGVuZ3RoKzEpKmxlZ2VuZExpbmVIZWlnaHQgLSAxNzUpXG4gICAgICAuYXR0cihcImR5XCIsIFwiLjk1ZW1cIilcbiAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAuc3R5bGUoXCJmb250LXdlaWdodFwiLCBcImJvbGRcIilcbiAgICAgIC50ZXh0KFwiTmF0aW9uYWwgdm90ZSB0b3RhbFwiKVxuXG4gICAgdmFyIGxlZ2VuZCA9IGxlZ2VuZENvbnRhaW5lci5zZWxlY3RBbGwoXCIubGVnZW5kXCIpXG4gICAgICAgIC5kYXRhKHNlbGYucGFydHlWb3RlcylcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgKGkgKiBsZWdlbmRMaW5lSGVpZ2h0ICsgKHNlbGYucGFydHlWb3Rlcy5sZW5ndGgqbGVnZW5kTGluZUhlaWdodCAtIDEyNSkpICsgXCIpXCI7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gc2VsZi52b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGVnZW5kTGluZUhlaWdodCAtIDIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gYjMucGFydHlTY2FsZShkLm5hbWUpOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0IC0gNClcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgKyA0ICsgc2VsZi52b3RlVG90YWxTY2FsZShkLnZvdGVzKTsgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kLXZhbHVlcycpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGIzLmJid051bWJlckZvcm1hdChkLnZvdGVzKTsgfSk7XG4gIH0sXG5cbiAgc3RhdGVSYWNlczogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHJldHVybiByYWNlLmZpcHNDb2RlID09PSB1bmRlZmluZWRcbiAgICB9KVxuICB9LFxuXG4gIHNldFBhcnR5Vm90ZXM6IGZ1bmN0aW9uKHN0YXRlUmFjZXMpIHtcbiAgICB2YXIgcGFydHlWb3RlcyA9IGIzLmdldFBhcnR5Vm90ZXMoc3RhdGVSYWNlcylcbiAgICBzZWxmLnBhcnR5Vm90ZXMgPSBfLnNvcnRCeShwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gLWQudm90ZXNcbiAgICB9KS5zbGljZSgwLCA4KTtcbiAgfSxcblxuICBwYXJ0eVZvdGVzOiB1bmRlZmluZWQsXG5cbiAgc2V0UGFydHlWb3Rlc01heDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heCA9IGQzLm1heChzZWxmLnBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkLnZvdGVzXG4gICAgfSlcblxuICAgIHNlbGYudm90ZVRvdGFsU2NhbGVcbiAgICAgIC5kb21haW4oWzAsIG1heF0pXG4gIH1cbn1cblxudmFyIHNlbGYgPSBsZWdlbmRcblxubW9kdWxlLmV4cG9ydHMgPSBsZWdlbmRcblxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcblxudmFyIGIzO1xudmFyIGNvbG9ycyA9IGQzLnNodWZmbGUoWycjRkYwMEZGJywgJyNDQzAwRkYnLCAnIzAwRkYwMCcsICcjRkZGRjAwJywgJyMwMEZGRkYnLCAnI0NDRkYwMCcsICcjRkZDQzAwJywgJyMwMEZGOTknLCAnIzY2MDBDQycsICcjRkYwMDk5JywgJyMwMDY2NjYnLCAnIzAwNjYwMCddKVxuXG52YXIgYmJ3X2Zvcm1hdFByZWZpeCA9IGZ1bmN0aW9uKGQsIGkpIHtcbiAgdmFyIGsgPSBNYXRoLnBvdygxMCwgTWF0aC5hYnMoNCAtIGkpICogMyk7XG4gIHJldHVybiB7XG4gICAgc2NhbGU6IGkgPiA0ID8gZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQgLyBrO1xuICAgIH0gOiBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZCAqIGs7XG4gICAgfSxcbiAgICBzeW1ib2w6IGRcbiAgfTtcbn1cblxudmFyIHByZWZpeGVzID0gWyBcInBcIiwgXCJuXCIsIFwiwrVcIiwgXCJtXCIsIFwiXCIsIFwia1wiLCBcIm1cIiwgXCJiXCIsIFwidFwiIF0ubWFwKGJid19mb3JtYXRQcmVmaXgpXG5cblxuXG5iMyA9IHtcblxuICBwYXJ0eVNjYWxlOiBkMy5zY2FsZS5vcmRpbmFsKClcbiAgICAucmFuZ2UoY29sb3JzKSxcblxuICBnZXRXaW5uZXI6IGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gIF8ubWF4KGQucmFjZS5jYW5kaWRhdGVzLCBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgIHJldHVybiBjYW5kaWRhdGUudm90ZUNvdW50XG4gICAgfSlcbiAgfSxcblxuICBnZXRQYXJ0aWVzOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKHJhY2VzLm1hcChmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5wYXJ0eTtcbiAgICAgIH0pO1xuICAgIH0pKSk7XG4gIH0sXG5cbiAgZ2V0UGFydHlWb3RlczogZnVuY3Rpb24ocmFjZXMpIHtcblxuICAgIHZhciBwYXJ0eVZvdGVzID0gc2VsZi5nZXRQYXJ0aWVzKHJhY2VzKS5tYXAoZnVuY3Rpb24ocGFydHksIGluZGV4KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBcIm5hbWVcIjogcGFydHksXG4gICAgICAgIFwidm90ZXNcIjogMFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJhY2VzLmZvckVhY2goZnVuY3Rpb24ocmFjZSwgaW5kZXgpIHtcbiAgICAgIHJhY2UuY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSwgaW5kZXgpIHtcbiAgICAgICAgaWYoY2FuZGlkYXRlLnZvdGVDb3VudCA9PT0gNjYpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyYWNlLCBjYW5kaWRhdGUpXG4gICAgICAgIH1cbiAgICAgICAgXy5maW5kV2hlcmUocGFydHlWb3Rlcywge1wibmFtZVwiOiBjYW5kaWRhdGUucGFydHl9KS52b3RlcyArPSBjYW5kaWRhdGUudm90ZUNvdW50O1xuICAgICAgfSlcblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBhcnR5Vm90ZXM7XG4gIH0sXG5cblxuICBnZXRSZXBvcnRpbmdVbml0RnJvbUZpcHNDb2RlOiBmdW5jdGlvbihyYWNlcywgZmlwc0NvZGUpIHtcbiAgICAvLyB2YXIgcmVwb3J0aW5nVW5pdDtcblxuICAgIC8vIGZvcih2YXIgaSA9IDA7IHR5cGVvZihyZXBvcnRpbmdVbml0KSA9PT0gXCJ1bmRlZmluZWRcIiAmJiBpIDwgcmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgIHZhciByYWNlID0gcmFjZXNbaV1cbiAgICAvLyAgIGlmKHJhY2UuZmlwc0NvZGUgPT09IGZpcHNDb2RlKSB7XG4gICAgLy8gICAgIHJhY2VzLnNwbGljZShpLCAxKVxuICAgIC8vICAgICByZXBvcnRpbmdVbml0ID0gcmFjZTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gICAgcmV0dXJuIHJhY2VzLmdldChmaXBzQ29kZSlcblxuICAgIC8vIHJldHVybiB7cmFjZTogcmFjZSwgcmFjZXM6IHJhY2VzfVxuICB9LFxuXG4gIHJhY2VNYXA6IGQzLm1hcCgpLFxuXG4gIGFkZFJhY2VzVG9VczogZnVuY3Rpb24odXMsIHJhY2VzKSB7XG5cbiAgICByYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHZhciBrZXkgPSByYWNlLmZpcHNDb2RlXG4gICAgICBzZWxmLnJhY2VNYXAuc2V0KGtleSwgcmFjZSlcbiAgICB9KVxuXG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5yYWNlID0gc2VsZi5yYWNlTWFwLmdldChmZWF0dXJlLmlkLnRvU3RyaW5nKCkpXG4gICAgICByZXR1cm4gZmVhdHVyZVxuICAgIH0pXG4gIH0sXG5cbiAgc2V0U3RhdGVEYXRhOiBmdW5jdGlvbih1cywgcmFjZXMpIHtcbiAgICB2YXIgZmVhdHVyZXMgPSB0b3BvanNvbi5mZWF0dXJlKHVzLCB1cy5vYmplY3RzLnN0YXRlcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgaWYoZmVhdHVyZS5pZCA9PT0gMikge1xuICAgICAgICBmZWF0dXJlLnJhY2UgPSBzZWxmLnJhY2VNYXAuZ2V0KFwiMjAwMFwiKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9LFxuXG4gIGdldE1heFZvdGVDb3VudDogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gXy5tYXgocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIC8vIGV4Y2VwdGlvbiBmb3IgYWxhc2thXG4gICAgICBpZihyYWNlLmZpcHNDb2RlID09IDIwMDApIHJldHVybiAwO1xuICAgICAgLy8gZXhjZXB0aW9uIGZvciBzdGF0ZSBlbnRyaWVzXG4gICAgICBpZighcmFjZS5maXBzQ29kZSkgcmV0dXJuIDA7XG4gICAgICAvLyBvdGhlcndpc2UgcmV0dXJuIHRvcCB2b3RlIGNvdW50XG4gICAgICByZXR1cm4gXy5tYXgocmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgIHJldHVybiBjLnZvdGVDb3VudDtcbiAgICAgIH0pKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgc2V0RmlsbDogZnVuY3Rpb24oZCkge1xuICAgIGlmKGQucmFjZSAmJiBkLnJhY2UuY2FuZGlkYXRlcykge1xuICAgICAgdmFyIHdpbm5lciA9IGIzLmdldFdpbm5lcihkKTtcbiAgICAgIHJldHVybiB3aW5uZXIucGFydHkgPyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgOiAndXJsKCNjcm9zc2hhdGNoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnd2hpdGUnXG4gICAgfVxuICB9LFxuXG4gIHRvb2xUaXBIdG1sOiBmdW5jdGlvbihkKSB7XG4gICAgdmFyIHdpbm5lciA9IHNlbGYuZ2V0V2lubmVyKGQpO1xuXG4gICAgaWYod2lubmVyLm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+VmFjYW50IFNlYXQ8L3NwYW4+J1xuICAgIH1cblxuICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPicgKyB3aW5uZXIubmFtZSArICc8L3NwYW4+JyArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+J1xuICB9LFxuXG4gIGZvcm1hdFByZWZpeGVzOiBwcmVmaXhlcyxcblxuICBiYndOdW1iZXJGb3JtYXQ6IGZ1bmN0aW9uKGRvbGxhKSB7XG4gICAgdmFyIGJhc2UgPSBNYXRoLm1heCgxLCBNYXRoLm1pbigxZTEyLCBkb2xsYSkpO1xuICAgIHZhciBzY2FsZXIgPSBzZWxmLmJid0Zvcm1hdFByZWZpeChiYXNlKTtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsZXIuc2NhbGUoZG9sbGEpLnRvUHJlY2lzaW9uKDMpKStzY2FsZXIuc3ltYm9sO1xuICB9LFxuXG5cbiAgYmJ3Rm9ybWF0UHJlZml4OiBmdW5jdGlvbih2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgKj0gLTE7XG4gICAgICBpZiAocHJlY2lzaW9uKSB2YWx1ZSA9IGQzLnJvdW5kKHZhbHVlLCBkM19mb3JtYXRfcHJlY2lzaW9uKHZhbHVlLCBwcmVjaXNpb24pKTtcbiAgICAgIGkgPSAxICsgTWF0aC5mbG9vcigxZS0xMiArIE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4xMCk7XG4gICAgICBpID0gTWF0aC5tYXgoLTI0LCBNYXRoLm1pbigyNCwgTWF0aC5mbG9vcigoaSA8PSAwID8gaSArIDEgOiBpIC0gMSkgLyAzKSAqIDMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbGYuZm9ybWF0UHJlZml4ZXNbNCArIGkgLyAzXTtcbiAgfVxuXG59XG5cbnZhciBzZWxmID0gYjNcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gYjM7XG4iLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xuZDMudGlwID0gcmVxdWlyZSgnLi92ZW5kb3IvZDMtdGlwJykoZDMpO1xudmFyIHF1ZXVlID0gcmVxdWlyZSgncXVldWUtYXN5bmMnKTtcbnZhciB0b3BvanNvbiA9IHJlcXVpcmUoJ3RvcG9qc29uJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBiMyA9IHJlcXVpcmUoJy4vbWFwLWhlbHBlcnMuanMnKTtcbnZhciBsZWdlbmQgPSByZXF1aXJlKCcuL2xlZ2VuZC5qcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLnN0eWxlKCd3aWR0aCcpKVxuICAsIG1hcFJhdGlvID0gLjZcbiAgLCBoZWlnaHQgPSB3aWR0aCAqIG1hcFJhdGlvXG4gICwgc2NhbGVXaWR0aCA9IHdpZHRoICogMS4yXG4gICwgY2VudGVyZWQ7XG5cbiAgdmFyIHRpcCA9IGQzLnRpcCgpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2QzLXRpcCcpXG4gICAgLmh0bWwodG9vbHRpcEh0bWwpO1xuXG4gIHZhciB2b3RlVG90YWxTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFswLDUwXSksXG4gICAgICB2b3RlQ291bnR5VG90YWxTY2FsZSA9IGQzLnNjYWxlLmxvZygpLnJhbmdlKFswLjUsMV0pO1xuXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAuc2NhbGUoc2NhbGVXaWR0aClcbiAgICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pO1xuXG4gIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAuY2FsbCh0aXApXG5cbiAgc3ZnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgICAgLm9uKFwiY2xpY2tcIiwgY2xpY2tlZClcblxuICB2YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gIHZhciBtZXNzYWdlID0ge1xuICAgIG1ldGhvZDogJ3Jlc2l6ZScsXG4gICAgaGVpZ2h0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0XG4gIH1cblxuICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKG1lc3NhZ2UsICcqJyk7XG5cblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuICBmdW5jdGlvbiByZWFkeShlcnJvciwgdXMsIHJhY2VzQXJyYXkpIHtcbiAgICByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXNcblxuICAgIHZvdGVDb3VudHlUb3RhbFNjYWxlLmRvbWFpbihbMSxiMy5nZXRNYXhWb3RlQ291bnQocmFjZXMpXSk7XG5cbiAgICB2YXIgem9vbUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpXG4gICAgICAuc2NhbGVFeHRlbnQoWzAuMSwgM10pXG4gICAgICAub24oXCJ6b29tXCIsIHpvb21IYW5kbGVyKVxuXG4gICAgdmFyIGRyYWdMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgLm9uKCdkcmFnJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZHJhZycpO1xuICAgICAgICAvLyBpZihkLnJhY2UpIHtcbiAgICAgICAgLy8gICB0aXAuc2hvdyhkKVxuICAgICAgICAvLyB9XG4gICAgICB9KVxuXG4gICAgZnVuY3Rpb24gem9vbUhhbmRsZXIoKSB7XG4gICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xuICAgIH1cblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50aWVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShiMy5hZGRSYWNlc1RvVXModXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHknKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIGIzLnNldEZpbGwpXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZighZC5yYWNlIHx8ICFkLnJhY2UuY2FuZGlkYXRlcykgcmV0dXJuIDE7XG4gICAgICAgICAgcmV0dXJuIHZvdGVDb3VudHlUb3RhbFNjYWxlKF8ubWF4KGQucmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihlKSB7cmV0dXJuIGUudm90ZUNvdW50O30pKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQucmFjZSkge1xuICAgICAgICAgICAgdGlwLnNob3coZClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSk7XG5cbiAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrZWQpXG5cbiAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrZWQpO1xuXG4gICAgLy8gem9vbUxpc3RlbmVyKGcpO1xuXG4gICAgLy8gZHJhZ0xpc3RlbmVyKGcpXG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignaWQnLCAnc3RhdGVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShiMy5zZXRTdGF0ZURhdGEodXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkLmlkID09PSAyID8gXCJzdGF0ZSBhbGFza2FcIiA6IFwic3RhdGVcIlxuICAgICAgICB9KTtcblxuICAgIC8vRGVhbHMgd2l0aCBBbGFza2FcbiAgICB2YXIgYWxhc2thID0gZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoZCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aXAuc2hvdylcbiAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcblxuICAgIGlmKCEvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgKSB7XG4gICAgICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKVxuICAgIH1cblxuICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlLWJvcmRlcnMnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgLy8gc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgLy8gICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHN0YXRlcywgc3RhdGVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAvLyAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlcycpXG4gICAgLy8gICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBMRUdFTkRcblxuICAgIGxlZ2VuZC5hcHBlbmQocmFjZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tlZChkKSB7XG4gICAgdmFyIHgsIHksIGs7XG5cbiAgICBpZiAoZCAmJiBjZW50ZXJlZCAhPT0gZCkge1xuICAgICAgdmFyIGNlbnRyb2lkID0gcGF0aC5jZW50cm9pZChkKTtcbiAgICAgIHggPSBjZW50cm9pZFswXTtcbiAgICAgIHkgPSBjZW50cm9pZFsxXTtcbiAgICAgIGsgPSA0O1xuICAgICAgY2VudGVyZWQgPSBkO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gd2lkdGggLyAyO1xuICAgICAgeSA9IGhlaWdodCAvIDI7XG4gICAgICBrID0gMTtcbiAgICAgIGNlbnRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmNsYXNzZWQoXCJhY3RpdmVcIiwgY2VudGVyZWQgJiYgZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gY2VudGVyZWQ7IH0pO1xuXG4gICAgZy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDc1MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB3aWR0aCAvIDIgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilzY2FsZShcIiArIGsgKyBcIil0cmFuc2xhdGUoXCIgKyAteCArIFwiLFwiICsgLXkgKyBcIilcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEuNSAvIGsgKyBcInB4XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9vbHRpcEh0bWwoZCkge1xuICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG5cbiAgICBpZih3aW5uZXIubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj5WYWNhbnQgU2VhdDwvc3Bhbj4nXG4gICAgfVxuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lci5uYW1lICsgJzwvc3Bhbj4nICsgJzxzcGFuIHN0eWxlPVwiY29sb3I6JyArIGIzLnBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSArICdcIj4nICsgd2lubmVyLnBhcnR5ICsgJzwvc3Bhbj4nXG4gIH1cblxuXG5cbiAgZDMuc2VsZWN0KHNlbGYuZnJhbWVFbGVtZW50KS5zdHlsZSgnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XG59XG4iXX0=
