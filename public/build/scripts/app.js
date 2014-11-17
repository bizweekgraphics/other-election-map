(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./scripts/map.js')();
},{"./scripts/map.js":4}],2:[function(require,module,exports){
var d3 = require('d3');
var b3 = require('./map-helpers.js');
var _ = require('underscore');

module.exports = function() {
  'use strict';

  var legend = {



    voteTotalScale: d3.scale.linear()
                      .range([0,50]),

    append: function(races) {
      self.setPartyVotes(self.stateRaces(races));
      self.setPartyVotesMax();
      // b3.setPartyScale();

      var width = parseInt(d3.select('#map-container').style('width'));
      var legendLineHeight = 20;
      var legendWidth;
      var legendMarginRight;

      if(width < 960) {
        legendWidth = width/2;
        legendMarginRight = 0;
      } else {
        legendMarginRight = 100;
        legendWidth = width;
      }
      var legendHeight = 200;

      var legendContainer = d3.select('#legend-container')
        .on('mouseleave', function() {
          d3.selectAll('.county')
            .style('fill', b3.setFill)
            .style('opacity', b3.setOpacity);

          d3.select('.alaska')
            .style('fill', function(d) {
              return b3.partyScale('Libertarian');
            })
            .style('opacity', function(d) {
              return b3.voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
            });

        })
        .append('svg')
        .attr('height', legendHeight)
        .attr('width', width);

      legendContainer
        .append("text")
        .attr("x", legendWidth - legendMarginRight)
        .attr("y", (self.partyVotes.length+1)*legendLineHeight - 175)
        .attr("dy", ".95em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("National vote total");


      var legend = legendContainer.selectAll(".legend")
          .data(self.partyVotes)
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + (i * legendLineHeight + (self.partyVotes.length*legendLineHeight - 125)) + ")"; })
          .on('mouseover', function(d) {
            var party = d.name;

            d3.select('.alaska')
              .style('fill', function(data) {
                return d.name === b3.getWinner(data).party ? b3.partyScale('Libertarian') : 'white';
              })
              .style('opacity', function(data) {
                var partyMatch = _.findWhere(data.race.candidates, {party: party});
                return partyMatch ? b3.voteCountyHoverTotalScale(partyMatch.voteCount) : 'white';
              });



            d3.selectAll('.county')
              .style('fill', function(data) {
                return b3.setPartyFill(data, party);
              })
              .style('opacity', function(data) {
                return b3.setPartyOpacity(data, party);
              });
          });

      legend.append("rect")
          .attr("x", legendWidth - legendMarginRight)
          .attr("width", function(d) { return self.voteTotalScale(d.votes); })
          .attr("height", legendLineHeight - 2)
          .style("fill", function(d) { 
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
        return race.fipsCode === undefined;
      });
    },

    setPartyVotes: function(stateRaces) {
      var partyVotes = b3.getPartyVotes(stateRaces);
      self.partyVotes = _.sortBy(partyVotes, function(d) {
        return -d.votes;
      }).slice(0, 8);
    },

    partyVotes: undefined,

    setPartyVotesMax: function() {
      var max = d3.max(self.partyVotes, function(d) {
        return d.votes;
      });

      self.voteTotalScale
        .domain([0, max]);
    }
  };

  var self = legend;

  return legend;
};




},{"./map-helpers.js":3,"d3":"d3","underscore":"underscore"}],3:[function(require,module,exports){
var d3 = require('d3');
var _ = require('underscore');
var topojson = require('topojson');



module.exports = function() {
  'use strict';

  var b3;
  var colors = d3.shuffle(['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600', '#CC9900', '#6666FF']);

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
  };

  var prefixes = [ "p", "n", "µ", "m", "", "k", "m", "b", "t" ].map(bbw_formatPrefix);



  b3 = {

    resize: (function(){
        var windowId = '';
        var resizeCount = 0;
        var useString = false;

        window.addEventListener(
          "message",
          function(event){
            var data = event.data;
            if (data.substring){
              useString = true;
              data = JSON.parse(data);
            }
            if(data.method === "register"){
              windowId = data.windowId;
              resize();
            }
          },
          false);

        function resize(){
          if (windowId === '') return;
          resizeCount++;

          var message = {
            method: "resize",
            windowId: windowId,
            height: document.documentElement.scrollHeight
          }; 

          window.parent.postMessage(useString ? JSON.stringify(message) : message, '*');
        }

        resize.windowId = function(){
          return windowId;
        };

        resize.resizeCount = function(){
          return resizeCount;
        };

        return resize;
      })(),

    voteCountyHoverTotalScale: d3.scale.log().range([0, 1]),

    voteCountyTotalScale: d3.scale.log().range([0.35, 1]),

    partyScale: d3.scale.ordinal()
      .range(colors),
   
    getWinner: function(d) {
      return  _.max(d.race.candidates, function(candidate) {
        return candidate.voteCount;
      });
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
        });

      });

      return partyVotes;
    },

    raceMap: d3.map(),

    addRacesToUs: function(us, races) {

      races.forEach(function(race) {
        var key = race.fipsCode;
        self.raceMap.set(key, race);
      });

      var features = topojson.feature(us, us.objects.counties).features;

      return features.map(function(feature) {
        feature.race = self.raceMap.get(feature.id.toString()); 
        return feature;
      });
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

    setStateData: function(us, races) {
      var features = topojson.feature(us, us.objects.states).features;

      return features.map(function(feature) {
        if(feature.id === 2) {
          feature.race = self.raceMap.get("2000");
        }
        return feature;
      });
    },

    setFill: function(d, i) {
      if(d.race && d.race.candidates) {
        var winner = b3.getWinner(d);
        return winner.party ? b3.partyScale(winner.party) : 'url(#crosshatch)';
      } else {
        return 'white';
      }
    },

    setOpacity: function(d) {
      if(!d.race || !d.race.candidates) return 1;

      var max = _.max(d.race.candidates.map(function(candidate) {
        return candidate.voteCount;
      }));

      return b3.voteCountyTotalScale(max);
    },

    setPartyOpacity: function(d, party) {
      if(!d.race || !d.race.candidates) return 1;

      var partyMatch = _.findWhere(d.race.candidates, {party: party});

      return partyMatch && partyMatch.voteCount ? self.voteCountyHoverTotalScale(partyMatch.voteCount) : 'white';
    },

    setPartyFill: function(d, party) {
      if(d.race && d.race.candidates) {
        var containsParty = _.findWhere(d.race.candidates, {party: party});
        return containsParty ? b3.partyScale(party) : 'white';
      } else {
        return 'white';
      }
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

  };

  var self = b3;

  return b3;
}();









},{"d3":"d3","topojson":"topojson","underscore":"underscore"}],4:[function(require,module,exports){
var d3 = require('d3');
d3.tip = require('./vendor/d3-tip')(d3);
var queue = require('queue-async');
var topojson = require('topojson');
var _ = require('underscore');
var b3 = require('./map-helpers.js');
var legend = require('./legend.js')();


module.exports = function() {
  'use strict';

  var width = parseInt(d3.select('#map-container').style('width'))
  , mapRatio = 0.6
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
      .call(tip);

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height)
      .on("click", clicked);

  var g = svg.append("g");

  queue()
    .defer(d3.json, 'data/us.json')
    .defer(d3.json, 'data/updated_senate_by_county_sc_fix.json')
    .await(ready);

  function ready(error, us, racesArray) {
    var races = racesArray.races;

    b3.voteCountyTotalScale.domain([1,b3.getMaxVoteCount(races)]);
    b3.voteCountyHoverTotalScale.domain(b3.voteCountyTotalScale.domain());

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
        .style('opacity', b3.setOpacity)
        .on('mouseover', function(d) {
          if(d.race) {
            tip.show(d);
          }
        })
        .on('mouseout', tip.hide);

    g.append('g')
      .attr('id', 'states')
      .selectAll('path')
        .data(b3.setStateData(us, races))
      .enter().append('path')
        .attr('d', path)
        .attr('class', function(d) {
          return d.id === 2 ? "state alaska" : "state";
        });

    //Deals with Alaska
    var alaska = d3.select('.alaska')
      .style('fill', function(d) {
        return b3.partyScale('Libertarian');
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .style('opacity', function(d) {
        return b3.voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
      });

    if(!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      d3.selectAll('.county')
        .on('click', clicked);

      d3.select('.alaska')
        .on('click', clicked);
    }

    g.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'state-borders')
        .attr('d', path);

    legend.append(races);
    b3.resize();
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
      return '<span class="winner-name">Vacant Seat</span>';
    }

    return '<span class="winner-name">' + winner.name + '</span>' + 
           '<span style="color:' + b3.partyScale(winner.party) + '">' + winner.party + '</span> ' +
           '<span class="votes">' + d3.format(",")(winner.voteCount) + ' votes</span>';
  }



  d3.select(self.frameElement).style('height', height + 'px');
};

},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3NjcmlwdHMvbWFwLmpzJykoKTsiLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbGVnZW5kID0ge1xuXG5cblxuICAgIHZvdGVUb3RhbFNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAgIC5yYW5nZShbMCw1MF0pLFxuXG4gICAgYXBwZW5kOiBmdW5jdGlvbihyYWNlcykge1xuICAgICAgc2VsZi5zZXRQYXJ0eVZvdGVzKHNlbGYuc3RhdGVSYWNlcyhyYWNlcykpO1xuICAgICAgc2VsZi5zZXRQYXJ0eVZvdGVzTWF4KCk7XG4gICAgICAvLyBiMy5zZXRQYXJ0eVNjYWxlKCk7XG5cbiAgICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSk7XG4gICAgICB2YXIgbGVnZW5kTGluZUhlaWdodCA9IDIwO1xuICAgICAgdmFyIGxlZ2VuZFdpZHRoO1xuICAgICAgdmFyIGxlZ2VuZE1hcmdpblJpZ2h0O1xuXG4gICAgICBpZih3aWR0aCA8IDk2MCkge1xuICAgICAgICBsZWdlbmRXaWR0aCA9IHdpZHRoLzI7XG4gICAgICAgIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxlZ2VuZE1hcmdpblJpZ2h0ID0gMTAwO1xuICAgICAgICBsZWdlbmRXaWR0aCA9IHdpZHRoO1xuICAgICAgfVxuICAgICAgdmFyIGxlZ2VuZEhlaWdodCA9IDIwMDtcblxuICAgICAgdmFyIGxlZ2VuZENvbnRhaW5lciA9IGQzLnNlbGVjdCgnI2xlZ2VuZC1jb250YWluZXInKVxuICAgICAgICAub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgYjMuc2V0RmlsbClcbiAgICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIGIzLnNldE9wYWNpdHkpO1xuXG4gICAgICAgICAgZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoJ0xpYmVydGFyaWFuJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICByZXR1cm4gYjMudm90ZUNvdW50eVRvdGFsU2NhbGUoXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGUpIHtyZXR1cm4gZS52b3RlQ291bnQ7fSkpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pXG4gICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgIC5hdHRyKCdoZWlnaHQnLCBsZWdlbmRIZWlnaHQpXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKTtcblxuICAgICAgbGVnZW5kQ29udGFpbmVyXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0KVxuICAgICAgICAuYXR0cihcInlcIiwgKHNlbGYucGFydHlWb3Rlcy5sZW5ndGgrMSkqbGVnZW5kTGluZUhlaWdodCAtIDE3NSlcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi45NWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgICAudGV4dChcIk5hdGlvbmFsIHZvdGUgdG90YWxcIik7XG5cblxuICAgICAgdmFyIGxlZ2VuZCA9IGxlZ2VuZENvbnRhaW5lci5zZWxlY3RBbGwoXCIubGVnZW5kXCIpXG4gICAgICAgICAgLmRhdGEoc2VsZi5wYXJ0eVZvdGVzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZFwiKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyAoaSAqIGxlZ2VuZExpbmVIZWlnaHQgKyAoc2VsZi5wYXJ0eVZvdGVzLmxlbmd0aCpsZWdlbmRMaW5lSGVpZ2h0IC0gMTI1KSkgKyBcIilcIjsgfSlcbiAgICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBwYXJ0eSA9IGQubmFtZTtcblxuICAgICAgICAgICAgZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLm5hbWUgPT09IGIzLmdldFdpbm5lcihkYXRhKS5wYXJ0eSA/IGIzLnBhcnR5U2NhbGUoJ0xpYmVydGFyaWFuJykgOiAnd2hpdGUnO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnR5TWF0Y2ggPSBfLmZpbmRXaGVyZShkYXRhLnJhY2UuY2FuZGlkYXRlcywge3BhcnR5OiBwYXJ0eX0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0eU1hdGNoID8gYjMudm90ZUNvdW50eUhvdmVyVG90YWxTY2FsZShwYXJ0eU1hdGNoLnZvdGVDb3VudCkgOiAnd2hpdGUnO1xuICAgICAgICAgICAgICB9KTtcblxuXG5cbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLmNvdW50eScpXG4gICAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYjMuc2V0UGFydHlGaWxsKGRhdGEsIHBhcnR5KTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBiMy5zZXRQYXJ0eU9wYWNpdHkoZGF0YSwgcGFydHkpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgbGVnZW5kLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHNlbGYudm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGVnZW5kTGluZUhlaWdodCAtIDIpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IFxuICAgICAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoZC5uYW1lKTsgfSk7XG5cblxuICAgICAgbGVnZW5kLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCAtIDQpXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xuXG4gICAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0ICsgNCArIHNlbGYudm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIDkpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZC12YWx1ZXMnKVxuICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGIzLmJid051bWJlckZvcm1hdChkLnZvdGVzKTsgfSk7XG4gICAgfSxcblxuICAgIHN0YXRlUmFjZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgICByZXR1cm4gcmFjZXMuZmlsdGVyKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgICAgcmV0dXJuIHJhY2UuZmlwc0NvZGUgPT09IHVuZGVmaW5lZDtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXRQYXJ0eVZvdGVzOiBmdW5jdGlvbihzdGF0ZVJhY2VzKSB7XG4gICAgICB2YXIgcGFydHlWb3RlcyA9IGIzLmdldFBhcnR5Vm90ZXMoc3RhdGVSYWNlcyk7XG4gICAgICBzZWxmLnBhcnR5Vm90ZXMgPSBfLnNvcnRCeShwYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiAtZC52b3RlcztcbiAgICAgIH0pLnNsaWNlKDAsIDgpO1xuICAgIH0sXG5cbiAgICBwYXJ0eVZvdGVzOiB1bmRlZmluZWQsXG5cbiAgICBzZXRQYXJ0eVZvdGVzTWF4OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBtYXggPSBkMy5tYXgoc2VsZi5wYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLnZvdGVzO1xuICAgICAgfSk7XG5cbiAgICAgIHNlbGYudm90ZVRvdGFsU2NhbGVcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4XSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBzZWxmID0gbGVnZW5kO1xuXG4gIHJldHVybiBsZWdlbmQ7XG59O1xuXG5cblxuIiwidmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgYjM7XG4gIHZhciBjb2xvcnMgPSBkMy5zaHVmZmxlKFsnI0ZGMDBGRicsICcjQ0MwMEZGJywgJyMwMEZGMDAnLCAnI0ZGRkYwMCcsICcjMDBGRkZGJywgJyNDQ0ZGMDAnLCAnI0ZGQ0MwMCcsICcjMDBGRjk5JywgJyM2NjAwQ0MnLCAnI0ZGMDA5OScsICcjMDA2NjY2JywgJyMwMDY2MDAnLCAnI0NDOTkwMCcsICcjNjY2NkZGJ10pO1xuXG4gIHZhciBiYndfZm9ybWF0UHJlZml4ID0gZnVuY3Rpb24oZCwgaSkge1xuICAgIHZhciBrID0gTWF0aC5wb3coMTAsIE1hdGguYWJzKDQgLSBpKSAqIDMpO1xuICAgIHJldHVybiB7XG4gICAgICBzY2FsZTogaSA+IDQgPyBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkIC8gaztcbiAgICAgIH0gOiBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkICogaztcbiAgICAgIH0sXG4gICAgICBzeW1ib2w6IGRcbiAgICB9O1xuICB9O1xuXG4gIHZhciBwcmVmaXhlcyA9IFsgXCJwXCIsIFwiblwiLCBcIsK1XCIsIFwibVwiLCBcIlwiLCBcImtcIiwgXCJtXCIsIFwiYlwiLCBcInRcIiBdLm1hcChiYndfZm9ybWF0UHJlZml4KTtcblxuXG5cbiAgYjMgPSB7XG5cbiAgICByZXNpemU6IChmdW5jdGlvbigpe1xuICAgICAgICB2YXIgd2luZG93SWQgPSAnJztcbiAgICAgICAgdmFyIHJlc2l6ZUNvdW50ID0gMDtcbiAgICAgICAgdmFyIHVzZVN0cmluZyA9IGZhbHNlO1xuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwibWVzc2FnZVwiLFxuICAgICAgICAgIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGlmIChkYXRhLnN1YnN0cmluZyl7XG4gICAgICAgICAgICAgIHVzZVN0cmluZyA9IHRydWU7XG4gICAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5tZXRob2QgPT09IFwicmVnaXN0ZXJcIil7XG4gICAgICAgICAgICAgIHdpbmRvd0lkID0gZGF0YS53aW5kb3dJZDtcbiAgICAgICAgICAgICAgcmVzaXplKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWxzZSk7XG5cbiAgICAgICAgZnVuY3Rpb24gcmVzaXplKCl7XG4gICAgICAgICAgaWYgKHdpbmRvd0lkID09PSAnJykgcmV0dXJuO1xuICAgICAgICAgIHJlc2l6ZUNvdW50Kys7XG5cbiAgICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJyZXNpemVcIixcbiAgICAgICAgICAgIHdpbmRvd0lkOiB3aW5kb3dJZCxcbiAgICAgICAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodFxuICAgICAgICAgIH07IFxuXG4gICAgICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh1c2VTdHJpbmcgPyBKU09OLnN0cmluZ2lmeShtZXNzYWdlKSA6IG1lc3NhZ2UsICcqJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNpemUud2luZG93SWQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3dJZDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXNpemUucmVzaXplQ291bnQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgIHJldHVybiByZXNpemVDb3VudDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcmVzaXplO1xuICAgICAgfSkoKSxcblxuICAgIHZvdGVDb3VudHlIb3ZlclRvdGFsU2NhbGU6IGQzLnNjYWxlLmxvZygpLnJhbmdlKFswLCAxXSksXG5cbiAgICB2b3RlQ291bnR5VG90YWxTY2FsZTogZDMuc2NhbGUubG9nKCkucmFuZ2UoWzAuMzUsIDFdKSxcblxuICAgIHBhcnR5U2NhbGU6IGQzLnNjYWxlLm9yZGluYWwoKVxuICAgICAgLnJhbmdlKGNvbG9ycyksXG4gICBcbiAgICBnZXRXaW5uZXI6IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAgXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudDtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRQYXJ0aWVzOiBmdW5jdGlvbihyYWNlcykge1xuICAgICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4ocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgICAgcmV0dXJuIHJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5wYXJ0eTtcbiAgICAgICAgfSk7XG4gICAgICB9KSkpO1xuICAgIH0sXG5cbiAgICBnZXRQYXJ0eVZvdGVzOiBmdW5jdGlvbihyYWNlcykge1xuXG4gICAgICB2YXIgcGFydHlWb3RlcyA9IHNlbGYuZ2V0UGFydGllcyhyYWNlcykubWFwKGZ1bmN0aW9uKHBhcnR5LCBpbmRleCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIFwibmFtZVwiOiBwYXJ0eSxcbiAgICAgICAgICBcInZvdGVzXCI6IDBcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICByYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhY2UsIGluZGV4KSB7XG4gICAgICAgIHJhY2UuY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSwgaW5kZXgpIHtcbiAgICAgICAgICBfLmZpbmRXaGVyZShwYXJ0eVZvdGVzLCB7XCJuYW1lXCI6IGNhbmRpZGF0ZS5wYXJ0eX0pLnZvdGVzICs9IGNhbmRpZGF0ZS52b3RlQ291bnQ7XG4gICAgICAgIH0pO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHBhcnR5Vm90ZXM7XG4gICAgfSxcblxuICAgIHJhY2VNYXA6IGQzLm1hcCgpLFxuXG4gICAgYWRkUmFjZXNUb1VzOiBmdW5jdGlvbih1cywgcmFjZXMpIHtcblxuICAgICAgcmFjZXMuZm9yRWFjaChmdW5jdGlvbihyYWNlKSB7XG4gICAgICAgIHZhciBrZXkgPSByYWNlLmZpcHNDb2RlO1xuICAgICAgICBzZWxmLnJhY2VNYXAuc2V0KGtleSwgcmFjZSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXM7XG5cbiAgICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgICBmZWF0dXJlLnJhY2UgPSBzZWxmLnJhY2VNYXAuZ2V0KGZlYXR1cmUuaWQudG9TdHJpbmcoKSk7IFxuICAgICAgICByZXR1cm4gZmVhdHVyZTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRNYXhWb3RlQ291bnQ6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgICByZXR1cm4gXy5tYXgocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgICAgLy8gZXhjZXB0aW9uIGZvciBhbGFza2FcbiAgICAgICAgaWYocmFjZS5maXBzQ29kZSA9PSAyMDAwKSByZXR1cm4gMDtcbiAgICAgICAgLy8gZXhjZXB0aW9uIGZvciBzdGF0ZSBlbnRyaWVzXG4gICAgICAgIGlmKCFyYWNlLmZpcHNDb2RlKSByZXR1cm4gMDtcbiAgICAgICAgLy8gb3RoZXJ3aXNlIHJldHVybiB0b3Agdm90ZSBjb3VudFxuICAgICAgICByZXR1cm4gXy5tYXgocmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgICAgcmV0dXJuIGMudm90ZUNvdW50O1xuICAgICAgICB9KSk7XG4gICAgICB9KSk7XG4gICAgfSxcblxuICAgIHNldFN0YXRlRGF0YTogZnVuY3Rpb24odXMsIHJhY2VzKSB7XG4gICAgICB2YXIgZmVhdHVyZXMgPSB0b3BvanNvbi5mZWF0dXJlKHVzLCB1cy5vYmplY3RzLnN0YXRlcykuZmVhdHVyZXM7XG5cbiAgICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgICBpZihmZWF0dXJlLmlkID09PSAyKSB7XG4gICAgICAgICAgZmVhdHVyZS5yYWNlID0gc2VsZi5yYWNlTWFwLmdldChcIjIwMDBcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZlYXR1cmU7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0RmlsbDogZnVuY3Rpb24oZCwgaSkge1xuICAgICAgaWYoZC5yYWNlICYmIGQucmFjZS5jYW5kaWRhdGVzKSB7XG4gICAgICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG4gICAgICAgIHJldHVybiB3aW5uZXIucGFydHkgPyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgOiAndXJsKCNjcm9zc2hhdGNoKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ3doaXRlJztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0T3BhY2l0eTogZnVuY3Rpb24oZCkge1xuICAgICAgaWYoIWQucmFjZSB8fCAhZC5yYWNlLmNhbmRpZGF0ZXMpIHJldHVybiAxO1xuXG4gICAgICB2YXIgbWF4ID0gXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudDtcbiAgICAgIH0pKTtcblxuICAgICAgcmV0dXJuIGIzLnZvdGVDb3VudHlUb3RhbFNjYWxlKG1heCk7XG4gICAgfSxcblxuICAgIHNldFBhcnR5T3BhY2l0eTogZnVuY3Rpb24oZCwgcGFydHkpIHtcbiAgICAgIGlmKCFkLnJhY2UgfHwgIWQucmFjZS5jYW5kaWRhdGVzKSByZXR1cm4gMTtcblxuICAgICAgdmFyIHBhcnR5TWF0Y2ggPSBfLmZpbmRXaGVyZShkLnJhY2UuY2FuZGlkYXRlcywge3BhcnR5OiBwYXJ0eX0pO1xuXG4gICAgICByZXR1cm4gcGFydHlNYXRjaCAmJiBwYXJ0eU1hdGNoLnZvdGVDb3VudCA/IHNlbGYudm90ZUNvdW50eUhvdmVyVG90YWxTY2FsZShwYXJ0eU1hdGNoLnZvdGVDb3VudCkgOiAnd2hpdGUnO1xuICAgIH0sXG5cbiAgICBzZXRQYXJ0eUZpbGw6IGZ1bmN0aW9uKGQsIHBhcnR5KSB7XG4gICAgICBpZihkLnJhY2UgJiYgZC5yYWNlLmNhbmRpZGF0ZXMpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5zUGFydHkgPSBfLmZpbmRXaGVyZShkLnJhY2UuY2FuZGlkYXRlcywge3BhcnR5OiBwYXJ0eX0pO1xuICAgICAgICByZXR1cm4gY29udGFpbnNQYXJ0eSA/IGIzLnBhcnR5U2NhbGUocGFydHkpIDogJ3doaXRlJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnd2hpdGUnO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBmb3JtYXRQcmVmaXhlczogcHJlZml4ZXMsXG5cbiAgICBiYndOdW1iZXJGb3JtYXQ6IGZ1bmN0aW9uKGRvbGxhKSB7XG4gICAgICB2YXIgYmFzZSA9IE1hdGgubWF4KDEsIE1hdGgubWluKDFlMTIsIGRvbGxhKSk7XG4gICAgICB2YXIgc2NhbGVyID0gc2VsZi5iYndGb3JtYXRQcmVmaXgoYmFzZSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsZXIuc2NhbGUoZG9sbGEpLnRvUHJlY2lzaW9uKDMpKStzY2FsZXIuc3ltYm9sO1xuICAgIH0sXG5cblxuICAgIGJid0Zvcm1hdFByZWZpeDogZnVuY3Rpb24odmFsdWUsIHByZWNpc2lvbikge1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA8IDApIHZhbHVlICo9IC0xO1xuICAgICAgICBpZiAocHJlY2lzaW9uKSB2YWx1ZSA9IGQzLnJvdW5kKHZhbHVlLCBkM19mb3JtYXRfcHJlY2lzaW9uKHZhbHVlLCBwcmVjaXNpb24pKTtcbiAgICAgICAgaSA9IDEgKyBNYXRoLmZsb29yKDFlLTEyICsgTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwKTtcbiAgICAgICAgaSA9IE1hdGgubWF4KC0yNCwgTWF0aC5taW4oMjQsIE1hdGguZmxvb3IoKGkgPD0gMCA/IGkgKyAxIDogaSAtIDEpIC8gMykgKiAzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZi5mb3JtYXRQcmVmaXhlc1s0ICsgaSAvIDNdO1xuICAgIH1cblxuICB9O1xuXG4gIHZhciBzZWxmID0gYjM7XG5cbiAgcmV0dXJuIGIzO1xufSgpO1xuXG5cblxuXG5cblxuXG5cbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIGxlZ2VuZCA9IHJlcXVpcmUoJy4vbGVnZW5kLmpzJykoKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLnN0eWxlKCd3aWR0aCcpKVxuICAsIG1hcFJhdGlvID0gMC42XG4gICwgaGVpZ2h0ID0gd2lkdGggKiBtYXBSYXRpb1xuICAsIHNjYWxlV2lkdGggPSB3aWR0aCAqIDEuMlxuICAsIGNlbnRlcmVkO1xuXG4gIHZhciB0aXAgPSBkMy50aXAoKVxuICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxuICAgIC5odG1sKHRvb2x0aXBIdG1sKTtcblxuICB2YXIgdm90ZVRvdGFsU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbMCw1MF0pO1xuXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAuc2NhbGUoc2NhbGVXaWR0aClcbiAgICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pO1xuXG4gIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAuY2FsbCh0aXApO1xuXG4gIHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgIC5vbihcImNsaWNrXCIsIGNsaWNrZWQpO1xuXG4gIHZhciBnID0gc3ZnLmFwcGVuZChcImdcIik7XG5cbiAgcXVldWUoKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cy5qc29uJylcbiAgICAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXBkYXRlZF9zZW5hdGVfYnlfY291bnR5X3NjX2ZpeC5qc29uJylcbiAgICAuYXdhaXQocmVhZHkpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5KGVycm9yLCB1cywgcmFjZXNBcnJheSkge1xuICAgIHZhciByYWNlcyA9IHJhY2VzQXJyYXkucmFjZXM7XG5cbiAgICBiMy52b3RlQ291bnR5VG90YWxTY2FsZS5kb21haW4oWzEsYjMuZ2V0TWF4Vm90ZUNvdW50KHJhY2VzKV0pO1xuICAgIGIzLnZvdGVDb3VudHlIb3ZlclRvdGFsU2NhbGUuZG9tYWluKGIzLnZvdGVDb3VudHlUb3RhbFNjYWxlLmRvbWFpbigpKTtcblxuICAgIGZ1bmN0aW9uIHpvb21IYW5kbGVyKCkge1xuICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcbiAgICB9XG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudGllcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYjMuYWRkUmFjZXNUb1VzKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnR5JylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBiMy5zZXRGaWxsKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCBiMy5zZXRPcGFjaXR5KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZihkLnJhY2UpIHtcbiAgICAgICAgICAgIHRpcC5zaG93KGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIHRpcC5oaWRlKTtcblxuICAgIGcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdpZCcsICdzdGF0ZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKGIzLnNldFN0YXRlRGF0YSh1cywgcmFjZXMpKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGQuaWQgPT09IDIgPyBcInN0YXRlIGFsYXNrYVwiIDogXCJzdGF0ZVwiO1xuICAgICAgICB9KTtcblxuICAgIC8vRGVhbHMgd2l0aCBBbGFza2FcbiAgICB2YXIgYWxhc2thID0gZDMuc2VsZWN0KCcuYWxhc2thJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoJ0xpYmVydGFyaWFuJyk7XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aXAuc2hvdylcbiAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcbiAgICAgIC5zdHlsZSgnb3BhY2l0eScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGIzLnZvdGVDb3VudHlUb3RhbFNjYWxlKF8ubWF4KGQucmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihlKSB7cmV0dXJuIGUudm90ZUNvdW50O30pKSk7XG4gICAgICB9KTtcblxuICAgIGlmKCEvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgKSB7XG4gICAgICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKTtcbiAgICB9XG5cbiAgICBnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHVzLCB1cy5vYmplY3RzLnN0YXRlcywgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdzdGF0ZS1ib3JkZXJzJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIGxlZ2VuZC5hcHBlbmQocmFjZXMpO1xuICAgIGIzLnJlc2l6ZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tlZChkKSB7XG4gICAgdmFyIHgsIHksIGs7XG5cbiAgICBpZiAoZCAmJiBjZW50ZXJlZCAhPT0gZCkge1xuICAgICAgdmFyIGNlbnRyb2lkID0gcGF0aC5jZW50cm9pZChkKTtcbiAgICAgIHggPSBjZW50cm9pZFswXTtcbiAgICAgIHkgPSBjZW50cm9pZFsxXTtcbiAgICAgIGsgPSA0O1xuICAgICAgY2VudGVyZWQgPSBkO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gd2lkdGggLyAyO1xuICAgICAgeSA9IGhlaWdodCAvIDI7XG4gICAgICBrID0gMTtcbiAgICAgIGNlbnRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmNsYXNzZWQoXCJhY3RpdmVcIiwgY2VudGVyZWQgJiYgZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gY2VudGVyZWQ7IH0pO1xuXG4gICAgZy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDc1MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB3aWR0aCAvIDIgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilzY2FsZShcIiArIGsgKyBcIil0cmFuc2xhdGUoXCIgKyAteCArIFwiLFwiICsgLXkgKyBcIilcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEuNSAvIGsgKyBcInB4XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9vbHRpcEh0bWwoZCkge1xuICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG5cbiAgICBpZih3aW5uZXIubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj5WYWNhbnQgU2VhdDwvc3Bhbj4nO1xuICAgIH1cblxuICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJ3aW5uZXItbmFtZVwiPicgKyB3aW5uZXIubmFtZSArICc8L3NwYW4+JyArIFxuICAgICAgICAgICAnPHNwYW4gc3R5bGU9XCJjb2xvcjonICsgYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpICsgJ1wiPicgKyB3aW5uZXIucGFydHkgKyAnPC9zcGFuPiAnICtcbiAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwidm90ZXNcIj4nICsgZDMuZm9ybWF0KFwiLFwiKSh3aW5uZXIudm90ZUNvdW50KSArICcgdm90ZXM8L3NwYW4+JztcbiAgfVxuXG5cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn07XG4iXX0=
