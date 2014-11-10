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

    console.time('add races');
    g.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(b3.addRacesToUs(us, races))
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('fill', b3.setFill)
        .on('mouseover', function(d) {
          if(d.race) {
            tip.show(d)
          }
        })
        .on('mouseout', tip.hide);

    console.timeEnd('add races');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicmVxdWlyZSgnLi9zY3JpcHRzL21hcC5qcycpKClcbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG52YXIgYjMgPSByZXF1aXJlKCcuL21hcC1oZWxwZXJzLmpzJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxudmFyIGxlZ2VuZCA9IHtcblxuICB2b3RlVG90YWxTY2FsZTogZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgICAgICAgICAgICAgLnJhbmdlKFswLDUwXSksXG5cbiAgYXBwZW5kOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHNlbGYuc2V0UGFydHlWb3RlcyhzZWxmLnN0YXRlUmFjZXMocmFjZXMpKTtcbiAgICBzZWxmLnNldFBhcnR5Vm90ZXNNYXgoKTtcbiAgICAvLyBiMy5zZXRQYXJ0eVNjYWxlKCk7XG5cbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChkMy5zZWxlY3QoJyNtYXAtY29udGFpbmVyJykuc3R5bGUoJ3dpZHRoJykpO1xuICAgIHZhciBsZWdlbmRMaW5lSGVpZ2h0ID0gMjA7XG5cbiAgICBpZih3aWR0aCA8IDk2MCkge1xuICAgICAgdmFyIGxlZ2VuZFdpZHRoID0gd2lkdGgvMlxuICAgICAgdmFyIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMTAwO1xuICAgICAgdmFyIGxlZ2VuZFdpZHRoID0gd2lkdGhcbiAgICB9XG4gICAgdmFyIGxlZ2VuZEhlaWdodCA9IDIwMDtcblxuICAgIHZhciBsZWdlbmRDb250YWluZXIgPSBkMy5zZWxlY3QoJyNsZWdlbmQtY29udGFpbmVyJykuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGxlZ2VuZEhlaWdodClcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuXG4gICAgbGVnZW5kQ29udGFpbmVyXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQpXG4gICAgICAuYXR0cihcInlcIiwgKHNlbGYucGFydHlWb3Rlcy5sZW5ndGgrMSkqbGVnZW5kTGluZUhlaWdodCAtIDE3NSlcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIuOTVlbVwiKVxuICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgLnRleHQoXCJOYXRpb25hbCB2b3RlIHRvdGFsXCIpXG5cbiAgICB2YXIgbGVnZW5kID0gbGVnZW5kQ29udGFpbmVyLnNlbGVjdEFsbChcIi5sZWdlbmRcIilcbiAgICAgICAgLmRhdGEoc2VsZi5wYXJ0eVZvdGVzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGVnZW5kXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyAoaSAqIGxlZ2VuZExpbmVIZWlnaHQgKyAoc2VsZi5wYXJ0eVZvdGVzLmxlbmd0aCpsZWdlbmRMaW5lSGVpZ2h0IC0gMTI1KSkgKyBcIilcIjsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzZWxmLnZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsZWdlbmRMaW5lSGVpZ2h0IC0gMilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBiMy5wYXJ0eVNjYWxlKGQubmFtZSk7IH0pO1xuXG4gICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQgLSA0KVxuICAgICAgICAuYXR0cihcInlcIiwgOSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZTsgfSk7XG5cbiAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCArIDQgKyBzZWxmLnZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcInlcIiwgOSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQtdmFsdWVzJylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gYjMuYmJ3TnVtYmVyRm9ybWF0KGQudm90ZXMpOyB9KTtcbiAgfSxcblxuICBzdGF0ZVJhY2VzOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHJldHVybiByYWNlcy5maWx0ZXIoZnVuY3Rpb24ocmFjZSkge1xuICAgICAgcmV0dXJuIHJhY2UuZmlwc0NvZGUgPT09IHVuZGVmaW5lZFxuICAgIH0pXG4gIH0sXG5cbiAgc2V0UGFydHlWb3RlczogZnVuY3Rpb24oc3RhdGVSYWNlcykge1xuICAgIHZhciBwYXJ0eVZvdGVzID0gYjMuZ2V0UGFydHlWb3RlcyhzdGF0ZVJhY2VzKVxuICAgIHNlbGYucGFydHlWb3RlcyA9IF8uc29ydEJ5KHBhcnR5Vm90ZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAtZC52b3Rlc1xuICAgIH0pLnNsaWNlKDAsIDgpO1xuICB9LFxuXG4gIHBhcnR5Vm90ZXM6IHVuZGVmaW5lZCxcblxuICBzZXRQYXJ0eVZvdGVzTWF4OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF4ID0gZDMubWF4KHNlbGYucGFydHlWb3RlcywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQudm90ZXNcbiAgICB9KVxuXG4gICAgc2VsZi52b3RlVG90YWxTY2FsZVxuICAgICAgLmRvbWFpbihbMCwgbWF4XSlcbiAgfVxufVxuXG52YXIgc2VsZiA9IGxlZ2VuZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGxlZ2VuZFxuXG4iLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xuXG52YXIgYjM7XG52YXIgY29sb3JzID0gZDMuc2h1ZmZsZShbJyNGRjAwRkYnLCAnI0NDMDBGRicsICcjMDBGRjAwJywgJyNGRkZGMDAnLCAnIzAwRkZGRicsICcjQ0NGRjAwJywgJyNGRkNDMDAnLCAnIzAwRkY5OScsICcjNjYwMENDJywgJyNGRjAwOTknLCAnIzAwNjY2NicsICcjMDA2NjAwJ10pXG5cbnZhciBiYndfZm9ybWF0UHJlZml4ID0gZnVuY3Rpb24oZCwgaSkge1xuICB2YXIgayA9IE1hdGgucG93KDEwLCBNYXRoLmFicyg0IC0gaSkgKiAzKTtcbiAgcmV0dXJuIHtcbiAgICBzY2FsZTogaSA+IDQgPyBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZCAvIGs7XG4gICAgfSA6IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkICogaztcbiAgICB9LFxuICAgIHN5bWJvbDogZFxuICB9O1xufVxuXG52YXIgcHJlZml4ZXMgPSBbIFwicFwiLCBcIm5cIiwgXCLCtVwiLCBcIm1cIiwgXCJcIiwgXCJrXCIsIFwibVwiLCBcImJcIiwgXCJ0XCIgXS5tYXAoYmJ3X2Zvcm1hdFByZWZpeClcblxuXG5cbmIzID0ge1xuXG4gIHBhcnR5U2NhbGU6IGQzLnNjYWxlLm9yZGluYWwoKVxuICAgIC5yYW5nZShjb2xvcnMpLFxuIFxuICBnZXRXaW5uZXI6IGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gIF8ubWF4KGQucmFjZS5jYW5kaWRhdGVzLCBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgIHJldHVybiBjYW5kaWRhdGUudm90ZUNvdW50XG4gICAgfSlcbiAgfSxcblxuICBnZXRQYXJ0aWVzOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKHJhY2VzLm1hcChmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5wYXJ0eTtcbiAgICAgIH0pO1xuICAgIH0pKSk7XG4gIH0sXG5cbiAgZ2V0UGFydHlWb3RlczogZnVuY3Rpb24ocmFjZXMpIHtcblxuICAgIHZhciBwYXJ0eVZvdGVzID0gc2VsZi5nZXRQYXJ0aWVzKHJhY2VzKS5tYXAoZnVuY3Rpb24ocGFydHksIGluZGV4KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBcIm5hbWVcIjogcGFydHksXG4gICAgICAgIFwidm90ZXNcIjogMFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJhY2VzLmZvckVhY2goZnVuY3Rpb24ocmFjZSwgaW5kZXgpIHtcbiAgICAgIHJhY2UuY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSwgaW5kZXgpIHtcbiAgICAgICAgaWYoY2FuZGlkYXRlLnZvdGVDb3VudCA9PT0gNjYpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyYWNlLCBjYW5kaWRhdGUpXG4gICAgICAgIH1cbiAgICAgICAgXy5maW5kV2hlcmUocGFydHlWb3Rlcywge1wibmFtZVwiOiBjYW5kaWRhdGUucGFydHl9KS52b3RlcyArPSBjYW5kaWRhdGUudm90ZUNvdW50O1xuICAgICAgfSlcblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBhcnR5Vm90ZXM7XG4gIH0sXG5cblxuICBnZXRSZXBvcnRpbmdVbml0RnJvbUZpcHNDb2RlOiBmdW5jdGlvbihyYWNlcywgZmlwc0NvZGUpIHtcbiAgICAvLyB2YXIgcmVwb3J0aW5nVW5pdDtcblxuICAgIC8vIGZvcih2YXIgaSA9IDA7IHR5cGVvZihyZXBvcnRpbmdVbml0KSA9PT0gXCJ1bmRlZmluZWRcIiAmJiBpIDwgcmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgIHZhciByYWNlID0gcmFjZXNbaV1cbiAgICAvLyAgIGlmKHJhY2UuZmlwc0NvZGUgPT09IGZpcHNDb2RlKSB7XG4gICAgLy8gICAgIHJhY2VzLnNwbGljZShpLCAxKVxuICAgIC8vICAgICByZXBvcnRpbmdVbml0ID0gcmFjZTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gICAgcmV0dXJuIHJhY2VzLmdldChmaXBzQ29kZSlcblxuICAgIC8vIHJldHVybiB7cmFjZTogcmFjZSwgcmFjZXM6IHJhY2VzfVxuICB9LFxuXG4gIHJhY2VNYXA6IGQzLm1hcCgpLFxuXG4gIGFkZFJhY2VzVG9VczogZnVuY3Rpb24odXMsIHJhY2VzKSB7XG5cbiAgICByYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIHZhciBrZXkgPSByYWNlLmZpcHNDb2RlXG4gICAgICBzZWxmLnJhY2VNYXAuc2V0KGtleSwgcmFjZSlcbiAgICB9KVxuXG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5yYWNlID0gc2VsZi5yYWNlTWFwLmdldChmZWF0dXJlLmlkLnRvU3RyaW5nKCkpIFxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9LFxuXG4gIHNldFN0YXRlRGF0YTogZnVuY3Rpb24odXMsIHJhY2VzKSB7XG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5zdGF0ZXMpLmZlYXR1cmVzXG5cbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIGlmKGZlYXR1cmUuaWQgPT09IDIpIHtcbiAgICAgICAgZmVhdHVyZS5yYWNlID0gc2VsZi5yYWNlTWFwLmdldChcIjIwMDBcIilcbiAgICAgIH1cbiAgICAgIHJldHVybiBmZWF0dXJlXG4gICAgfSlcbiAgfSxcblxuICBzZXRGaWxsOiBmdW5jdGlvbihkKSB7XG4gICAgaWYoZC5yYWNlICYmIGQucmFjZS5jYW5kaWRhdGVzKSB7XG4gICAgICB2YXIgd2lubmVyID0gYjMuZ2V0V2lubmVyKGQpO1xuICAgICAgcmV0dXJuIHdpbm5lci5wYXJ0eSA/IGIzLnBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSA6ICd1cmwoI2Nyb3NzaGF0Y2gpJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICd3aGl0ZSdcbiAgICB9XG4gIH0sXG5cbiAgdG9vbFRpcEh0bWw6IGZ1bmN0aW9uKGQpIHtcbiAgICB2YXIgd2lubmVyID0gc2VsZi5nZXRXaW5uZXIoZCk7XG5cbiAgICBpZih3aW5uZXIubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj5WYWNhbnQgU2VhdDwvc3Bhbj4nXG4gICAgfVxuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lci5uYW1lICsgJzwvc3Bhbj4nICsgJzxzcGFuIHN0eWxlPVwiY29sb3I6JyArIGIzLnBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSArICdcIj4nICsgd2lubmVyLnBhcnR5ICsgJzwvc3Bhbj4nXG4gIH0sXG5cbiAgZm9ybWF0UHJlZml4ZXM6IHByZWZpeGVzLFxuXG4gIGJid051bWJlckZvcm1hdDogZnVuY3Rpb24oZG9sbGEpIHtcbiAgICB2YXIgYmFzZSA9IE1hdGgubWF4KDEsIE1hdGgubWluKDFlMTIsIGRvbGxhKSk7XG4gICAgdmFyIHNjYWxlciA9IHNlbGYuYmJ3Rm9ybWF0UHJlZml4KGJhc2UpO1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHNjYWxlci5zY2FsZShkb2xsYSkudG9QcmVjaXNpb24oMykpK3NjYWxlci5zeW1ib2w7XG4gIH0sXG5cblxuICBiYndGb3JtYXRQcmVmaXg6IGZ1bmN0aW9uKHZhbHVlLCBwcmVjaXNpb24pIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSAqPSAtMTtcbiAgICAgIGlmIChwcmVjaXNpb24pIHZhbHVlID0gZDMucm91bmQodmFsdWUsIGQzX2Zvcm1hdF9wcmVjaXNpb24odmFsdWUsIHByZWNpc2lvbikpO1xuICAgICAgaSA9IDEgKyBNYXRoLmZsb29yKDFlLTEyICsgTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwKTtcbiAgICAgIGkgPSBNYXRoLm1heCgtMjQsIE1hdGgubWluKDI0LCBNYXRoLmZsb29yKChpIDw9IDAgPyBpICsgMSA6IGkgLSAxKSAvIDMpICogMykpO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZi5mb3JtYXRQcmVmaXhlc1s0ICsgaSAvIDNdO1xuICB9XG5cbn1cblxudmFyIHNlbGYgPSBiM1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBiMztcblxuXG5cblxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgYjMgPSByZXF1aXJlKCcuL21hcC1oZWxwZXJzLmpzJyk7XG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi9sZWdlbmQuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSlcbiAgLCBtYXBSYXRpbyA9IC42XG4gICwgaGVpZ2h0ID0gd2lkdGggKiBtYXBSYXRpb1xuICAsIHNjYWxlV2lkdGggPSB3aWR0aCAqIDEuMlxuICAsIGNlbnRlcmVkO1xuXG4gIHZhciB0aXAgPSBkMy50aXAoKVxuICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgIC5odG1sKHRvb2x0aXBIdG1sKTtcblxuICB2YXIgdm90ZVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMCw1MF0pO1xuXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAuc2NhbGUoc2NhbGVXaWR0aClcbiAgICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pO1xuXG4gIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAuY2FsbCh0aXApXG5cbiAgc3ZnLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgICAgLm9uKFwiY2xpY2tcIiwgY2xpY2tlZClcblxuICB2YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gIHZhciBtZXNzYWdlID0ge1xuICAgIG1ldGhvZDogJ3Jlc2l6ZScsXG4gICAgaGVpZ2h0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0XG4gIH1cblxuICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKG1lc3NhZ2UsICcqJyk7XG5cblxuICBxdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sICdkYXRhL3VzLmpzb24nKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cGRhdGVkX3NlbmF0ZV9ieV9jb3VudHkuanNvbicpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuICBmdW5jdGlvbiByZWFkeShlcnJvciwgdXMsIHJhY2VzQXJyYXkpIHtcbiAgICByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXNcblxuICAgIHZhciB6b29tTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAgIC5zY2FsZUV4dGVudChbMC4xLCAzXSlcbiAgICAgIC5vbihcInpvb21cIiwgem9vbUhhbmRsZXIpXG5cbiAgICB2YXIgZHJhZ0xpc3RlbmVyID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkcmFnJyk7XG4gICAgICAgIC8vIGlmKGQucmFjZSkge1xuICAgICAgICAvLyAgIHRpcC5zaG93KGQpXG4gICAgICAgIC8vIH1cbiAgICAgIH0pXG5cbiAgICBmdW5jdGlvbiB6b29tSGFuZGxlcigpIHtcbiAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gICAgfVxuXG4gICAgY29uc29sZS50aW1lKCdhZGQgcmFjZXMnKTtcbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudGllcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYjMuYWRkUmFjZXNUb1VzKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnR5JylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBiMy5zZXRGaWxsKVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZihkLnJhY2UpIHtcbiAgICAgICAgICAgIHRpcC5zaG93KGQpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpO1xuXG4gICAgY29uc29sZS50aW1lRW5kKCdhZGQgcmFjZXMnKTtcbiAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrZWQpXG5cbiAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrZWQpO1xuXG4gICAgLy8gem9vbUxpc3RlbmVyKGcpO1xuXG4gICAgLy8gZHJhZ0xpc3RlbmVyKGcpXG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignaWQnLCAnc3RhdGVzJylcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShiMy5zZXRTdGF0ZURhdGEodXMsIHJhY2VzKSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkLmlkID09PSAyID8gXCJzdGF0ZSBhbGFza2FcIiA6IFwic3RhdGVcIlxuICAgICAgICB9KTtcblxuICAgIC8vRGVhbHMgd2l0aCBBbGFza2FcbiAgICB2YXIgYWxhc2thID0gZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoZCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aXAuc2hvdylcbiAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcblxuICAgIGlmKCEvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgKSB7XG4gICAgICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKVxuICAgIH1cblxuICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlLWJvcmRlcnMnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgLy8gc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgLy8gICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHN0YXRlcywgc3RhdGVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAvLyAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlcycpXG4gICAgLy8gICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBMRUdFTkRcblxuICAgIGxlZ2VuZC5hcHBlbmQocmFjZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tlZChkKSB7XG4gICAgdmFyIHgsIHksIGs7XG5cbiAgICBpZiAoZCAmJiBjZW50ZXJlZCAhPT0gZCkge1xuICAgICAgdmFyIGNlbnRyb2lkID0gcGF0aC5jZW50cm9pZChkKTtcbiAgICAgIHggPSBjZW50cm9pZFswXTtcbiAgICAgIHkgPSBjZW50cm9pZFsxXTtcbiAgICAgIGsgPSA0O1xuICAgICAgY2VudGVyZWQgPSBkO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gd2lkdGggLyAyO1xuICAgICAgeSA9IGhlaWdodCAvIDI7XG4gICAgICBrID0gMTtcbiAgICAgIGNlbnRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmNsYXNzZWQoXCJhY3RpdmVcIiwgY2VudGVyZWQgJiYgZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gY2VudGVyZWQ7IH0pO1xuXG4gICAgZy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDc1MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB3aWR0aCAvIDIgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilzY2FsZShcIiArIGsgKyBcIil0cmFuc2xhdGUoXCIgKyAteCArIFwiLFwiICsgLXkgKyBcIilcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEuNSAvIGsgKyBcInB4XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9vbHRpcEh0bWwoZCkge1xuICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG5cbiAgICBpZih3aW5uZXIubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj5WYWNhbnQgU2VhdDwvc3Bhbj4nXG4gICAgfVxuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lci5uYW1lICsgJzwvc3Bhbj4nICsgJzxzcGFuIHN0eWxlPVwiY29sb3I6JyArIGIzLnBhcnR5U2NhbGUod2lubmVyLnBhcnR5KSArICdcIj4nICsgd2lubmVyLnBhcnR5ICsgJzwvc3Bhbj4nXG4gIH1cblxuXG5cbiAgZDMuc2VsZWN0KHNlbGYuZnJhbWVFbGVtZW50KS5zdHlsZSgnaGVpZ2h0JywgaGVpZ2h0ICsgJ3B4Jyk7XG59XG4iXX0=
