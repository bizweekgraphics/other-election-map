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

    var legendContainer = d3.select('#legend-container')
      .on('mouseleave', function() {
        d3.selectAll('.county')
          .style('fill', b3.setFill)
          .style('opacity', function(d) {
            if(!d.race || !d.race.candidates) return 1;
            return b3.voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
          })

        d3.select('.alaska')
          .style('fill', function(d) {
            return b3.partyScale('Libertarian')
          })
          .style('opacity', function(d) {
            return b3.voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
          })

      })
      .append('svg')
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
        .attr("transform", function(d, i) { return "translate(0," + (i * legendLineHeight + (self.partyVotes.length*legendLineHeight - 125)) + ")"; })
        .on('mouseover', function(d) {
          var party = d.name

          d3.select('.alaska')
            .style('fill', function(data) {
              return d.name === b3.getWinner(data).party ? b3.partyScale('Libertarian') : 'white'
            })
            .style('opacity', function(data) {
              var partyMatch = _.findWhere(data.race.candidates, {party: party})
              return partyMatch ? b3.voteCountyHoverTotalScale(partyMatch.voteCount) : 'white'
            })



          d3.selectAll('.county')
            // .style('fill', function(data) {
            //   return data.race && data.race.candidates && d.name === b3.getWinner(data).party ? b3.partyScale(d.name) : 'white'
            // })
            .style('fill', function(data) {
              return b3.setPartyFill(data, party)
            })
            .style('opacity', function(data) {
              if(!data.race || !data.race.candidates) return 1;
              var partyMatch = _.findWhere(data.race.candidates, {party: party})
              return partyMatch ? b3.voteCountyHoverTotalScale(partyMatch.voteCount) : 'white'
            })
        })
        // .on('mouseout', function(d) {
        //   d3.selectAll('.county')
        //     .style('fill', b3.setFill);
        // })

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
var colors = d3.shuffle(['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600', '#CC9900', '#6666FF'])

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

  voteCountyHoverTotalScale: d3.scale.log().range([0, 1]),

  voteCountyTotalScale: d3.scale.log().range([.35, 1]),

  partyScale: d3.scale.ordinal()
    .range(colors),
 
  getWinner: function(d) {
    return  _.max(d.race.candidates, function(candidate) {
      return candidate.voteCount
    })
  },

  // getParty: function(d, party) {
  //   return _.findWhere(d.race.candidates, )
  // }

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

      if(self.raceMap.get(key)) {
        
      }



      self.raceMap.set(key, race)

    })

    var features = topojson.feature(us, us.objects.counties).features

    return features.map(function(feature) {
      feature.race = self.raceMap.get(feature.id.toString()) 
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

  setPartyFill: function(d, party) {
    if(d.race && d.race.candidates) {
      var containsParty = _.findWhere(d.race.candidates, {party: party})
      return containsParty ? b3.partyScale(party) : 'white'
    } else {
      return 'white'
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

  var resize = (function(){
      console.log('TEST');
      var windowId = '';
      var resizeCount = 0;
      var useString = false;

      window.addEventListener(
        "message",
        function(event){
          var data = event.data
          if (data.substring){
            useString = true;
            data = JSON.parse(data)
          }
          if(data.method === "register"){
            windowId = data.windowId;
            resize();
          }
        },
        false);

      function resize(){
        if (windowId === '') return
        resizeCount++;

        var message = {
          method: "resize",
          windowId: windowId,
          height: document.documentElement.scrollHeight
        } 

        window.parent.postMessage(useString ? JSON.stringify(message) : message, '*')
      }

      resize.windowId = function(){
        return windowId;
      }

      resize.resizeCount = function(){
        return resizeCount;
      }

      return resize;
    })();

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

  queue()
    .defer(d3.json, 'data/us.json')
    .defer(d3.json, 'data/updated_senate_by_county.json')
    .await(ready);

  function ready(error, us, racesArray) {
    races = racesArray.races

    b3.voteCountyTotalScale.domain([1,b3.getMaxVoteCount(races)]);
    b3.voteCountyHoverTotalScale.domain(b3.voteCountyTotalScale.domain())

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
          return b3.voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
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
        return b3.partyScale('Libertarian');
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .style('opacity', function(d) {
        return b3.voteCountyTotalScale(_.max(d.race.candidates.map(function(e) {return e.voteCount;})));
      })

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
    resize();
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
      + '<span class="votes">' + d3.format(",")(winner.voteCount) + ' votes</span>';
  }



  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbGVnZW5kLmpzIiwic3JjL3NjcmlwdHMvbWFwLWhlbHBlcnMuanMiLCJzcmMvc2NyaXB0cy9tYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcblxuXG5cbnJlcXVpcmUoJy4vc2NyaXB0cy9tYXAuanMnKSgpXG4iLCJ2YXIgZDMgPSByZXF1aXJlKCdkMycpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbnZhciBsZWdlbmQgPSB7XG5cblxuXG4gIHZvdGVUb3RhbFNjYWxlOiBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAucmFuZ2UoWzAsNTBdKSxcblxuICBhcHBlbmQ6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgc2VsZi5zZXRQYXJ0eVZvdGVzKHNlbGYuc3RhdGVSYWNlcyhyYWNlcykpO1xuICAgIHNlbGYuc2V0UGFydHlWb3Rlc01heCgpO1xuICAgIC8vIGIzLnNldFBhcnR5U2NhbGUoKTtcblxuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGQzLnNlbGVjdCgnI21hcC1jb250YWluZXInKS5zdHlsZSgnd2lkdGgnKSk7XG4gICAgdmFyIGxlZ2VuZExpbmVIZWlnaHQgPSAyMDtcblxuICAgIGlmKHdpZHRoIDwgOTYwKSB7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aC8yXG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGVnZW5kTWFyZ2luUmlnaHQgPSAxMDA7XG4gICAgICB2YXIgbGVnZW5kV2lkdGggPSB3aWR0aFxuICAgIH1cbiAgICB2YXIgbGVnZW5kSGVpZ2h0ID0gMjAwO1xuXG4gICAgdmFyIGxlZ2VuZENvbnRhaW5lciA9IGQzLnNlbGVjdCgnI2xlZ2VuZC1jb250YWluZXInKVxuICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGQzLnNlbGVjdEFsbCgnLmNvdW50eScpXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgYjMuc2V0RmlsbClcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpZighZC5yYWNlIHx8ICFkLnJhY2UuY2FuZGlkYXRlcykgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gYjMudm90ZUNvdW50eVRvdGFsU2NhbGUoXy5tYXgoZC5yYWNlLmNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGUpIHtyZXR1cm4gZS52b3RlQ291bnQ7fSkpKTtcbiAgICAgICAgICB9KVxuXG4gICAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGIzLnBhcnR5U2NhbGUoJ0xpYmVydGFyaWFuJylcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBiMy52b3RlQ291bnR5VG90YWxTY2FsZShfLm1heChkLnJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oZSkge3JldHVybiBlLnZvdGVDb3VudDt9KSkpO1xuICAgICAgICAgIH0pXG5cbiAgICAgIH0pXG4gICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGxlZ2VuZEhlaWdodClcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuXG4gICAgbGVnZW5kQ29udGFpbmVyXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIGxlZ2VuZFdpZHRoIC0gbGVnZW5kTWFyZ2luUmlnaHQpXG4gICAgICAuYXR0cihcInlcIiwgKHNlbGYucGFydHlWb3Rlcy5sZW5ndGgrMSkqbGVnZW5kTGluZUhlaWdodCAtIDE3NSlcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIuOTVlbVwiKVxuICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgLnRleHQoXCJOYXRpb25hbCB2b3RlIHRvdGFsXCIpXG5cblxuICAgIHZhciBsZWdlbmQgPSBsZWdlbmRDb250YWluZXIuc2VsZWN0QWxsKFwiLmxlZ2VuZFwiKVxuICAgICAgICAuZGF0YShzZWxmLnBhcnR5Vm90ZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmRcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIChpICogbGVnZW5kTGluZUhlaWdodCArIChzZWxmLnBhcnR5Vm90ZXMubGVuZ3RoKmxlZ2VuZExpbmVIZWlnaHQgLSAxMjUpKSArIFwiKVwiOyB9KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgcGFydHkgPSBkLm5hbWVcblxuICAgICAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHJldHVybiBkLm5hbWUgPT09IGIzLmdldFdpbm5lcihkYXRhKS5wYXJ0eSA/IGIzLnBhcnR5U2NhbGUoJ0xpYmVydGFyaWFuJykgOiAnd2hpdGUnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgcGFydHlNYXRjaCA9IF8uZmluZFdoZXJlKGRhdGEucmFjZS5jYW5kaWRhdGVzLCB7cGFydHk6IHBhcnR5fSlcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnR5TWF0Y2ggPyBiMy52b3RlQ291bnR5SG92ZXJUb3RhbFNjYWxlKHBhcnR5TWF0Y2gudm90ZUNvdW50KSA6ICd3aGl0ZSdcbiAgICAgICAgICAgIH0pXG5cblxuXG4gICAgICAgICAgZDMuc2VsZWN0QWxsKCcuY291bnR5JylcbiAgICAgICAgICAgIC8vIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgcmV0dXJuIGRhdGEucmFjZSAmJiBkYXRhLnJhY2UuY2FuZGlkYXRlcyAmJiBkLm5hbWUgPT09IGIzLmdldFdpbm5lcihkYXRhKS5wYXJ0eSA/IGIzLnBhcnR5U2NhbGUoZC5uYW1lKSA6ICd3aGl0ZSdcbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHJldHVybiBiMy5zZXRQYXJ0eUZpbGwoZGF0YSwgcGFydHkpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICBpZighZGF0YS5yYWNlIHx8ICFkYXRhLnJhY2UuY2FuZGlkYXRlcykgcmV0dXJuIDE7XG4gICAgICAgICAgICAgIHZhciBwYXJ0eU1hdGNoID0gXy5maW5kV2hlcmUoZGF0YS5yYWNlLmNhbmRpZGF0ZXMsIHtwYXJ0eTogcGFydHl9KVxuICAgICAgICAgICAgICByZXR1cm4gcGFydHlNYXRjaCA/IGIzLnZvdGVDb3VudHlIb3ZlclRvdGFsU2NhbGUocGFydHlNYXRjaC52b3RlQ291bnQpIDogJ3doaXRlJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLy8gLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAvLyAgICAgLnN0eWxlKCdmaWxsJywgYjMuc2V0RmlsbCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBzZWxmLnZvdGVUb3RhbFNjYWxlKGQudm90ZXMpOyB9KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsZWdlbmRMaW5lSGVpZ2h0IC0gMilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IFxuICAgICAgICAgIHJldHVybiBiMy5wYXJ0eVNjYWxlKGQubmFtZSk7IH0pO1xuXG5cbiAgICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgbGVnZW5kV2lkdGggLSBsZWdlbmRNYXJnaW5SaWdodCAtIDQpXG4gICAgICAgIC5hdHRyKFwieVwiLCA5KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lOyB9KTtcblxuICAgIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBsZWdlbmRXaWR0aCAtIGxlZ2VuZE1hcmdpblJpZ2h0ICsgNCArIHNlbGYudm90ZVRvdGFsU2NhbGUoZC52b3Rlcyk7IH0pXG4gICAgICAgIC5hdHRyKFwieVwiLCA5KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZC12YWx1ZXMnKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBiMy5iYndOdW1iZXJGb3JtYXQoZC52b3Rlcyk7IH0pO1xuICB9LFxuXG4gIHN0YXRlUmFjZXM6IGZ1bmN0aW9uKHJhY2VzKSB7XG4gICAgcmV0dXJuIHJhY2VzLmZpbHRlcihmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5maXBzQ29kZSA9PT0gdW5kZWZpbmVkXG4gICAgfSlcbiAgfSxcblxuICBzZXRQYXJ0eVZvdGVzOiBmdW5jdGlvbihzdGF0ZVJhY2VzKSB7XG4gICAgdmFyIHBhcnR5Vm90ZXMgPSBiMy5nZXRQYXJ0eVZvdGVzKHN0YXRlUmFjZXMpXG4gICAgc2VsZi5wYXJ0eVZvdGVzID0gXy5zb3J0QnkocGFydHlWb3RlcywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIC1kLnZvdGVzXG4gICAgfSkuc2xpY2UoMCwgOCk7XG4gIH0sXG5cbiAgcGFydHlWb3RlczogdW5kZWZpbmVkLFxuXG4gIHNldFBhcnR5Vm90ZXNNYXg6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXggPSBkMy5tYXgoc2VsZi5wYXJ0eVZvdGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZC52b3Rlc1xuICAgIH0pXG5cbiAgICBzZWxmLnZvdGVUb3RhbFNjYWxlXG4gICAgICAuZG9tYWluKFswLCBtYXhdKVxuICB9XG59XG5cbnZhciBzZWxmID0gbGVnZW5kXG5cbm1vZHVsZS5leHBvcnRzID0gbGVnZW5kXG5cbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciB0b3BvanNvbiA9IHJlcXVpcmUoJ3RvcG9qc29uJyk7XG5cbnZhciBiMztcbnZhciBjb2xvcnMgPSBkMy5zaHVmZmxlKFsnI0ZGMDBGRicsICcjQ0MwMEZGJywgJyMwMEZGMDAnLCAnI0ZGRkYwMCcsICcjMDBGRkZGJywgJyNDQ0ZGMDAnLCAnI0ZGQ0MwMCcsICcjMDBGRjk5JywgJyM2NjAwQ0MnLCAnI0ZGMDA5OScsICcjMDA2NjY2JywgJyMwMDY2MDAnLCAnI0NDOTkwMCcsICcjNjY2NkZGJ10pXG5cbnZhciBiYndfZm9ybWF0UHJlZml4ID0gZnVuY3Rpb24oZCwgaSkge1xuICB2YXIgayA9IE1hdGgucG93KDEwLCBNYXRoLmFicyg0IC0gaSkgKiAzKTtcbiAgcmV0dXJuIHtcbiAgICBzY2FsZTogaSA+IDQgPyBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZCAvIGs7XG4gICAgfSA6IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkICogaztcbiAgICB9LFxuICAgIHN5bWJvbDogZFxuICB9O1xufVxuXG52YXIgcHJlZml4ZXMgPSBbIFwicFwiLCBcIm5cIiwgXCLCtVwiLCBcIm1cIiwgXCJcIiwgXCJrXCIsIFwibVwiLCBcImJcIiwgXCJ0XCIgXS5tYXAoYmJ3X2Zvcm1hdFByZWZpeClcblxuXG5cbmIzID0ge1xuXG4gIHZvdGVDb3VudHlIb3ZlclRvdGFsU2NhbGU6IGQzLnNjYWxlLmxvZygpLnJhbmdlKFswLCAxXSksXG5cbiAgdm90ZUNvdW50eVRvdGFsU2NhbGU6IGQzLnNjYWxlLmxvZygpLnJhbmdlKFsuMzUsIDFdKSxcblxuICBwYXJ0eVNjYWxlOiBkMy5zY2FsZS5vcmRpbmFsKClcbiAgICAucmFuZ2UoY29sb3JzKSxcbiBcbiAgZ2V0V2lubmVyOiBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuICBfLm1heChkLnJhY2UuY2FuZGlkYXRlcywgZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudFxuICAgIH0pXG4gIH0sXG5cbiAgLy8gZ2V0UGFydHk6IGZ1bmN0aW9uKGQsIHBhcnR5KSB7XG4gIC8vICAgcmV0dXJuIF8uZmluZFdoZXJlKGQucmFjZS5jYW5kaWRhdGVzLCApXG4gIC8vIH1cblxuICBnZXRQYXJ0aWVzOiBmdW5jdGlvbihyYWNlcykge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKHJhY2VzLm1hcChmdW5jdGlvbihyYWNlKSB7XG4gICAgICByZXR1cm4gcmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5wYXJ0eTtcbiAgICAgIH0pO1xuICAgIH0pKSk7XG4gIH0sXG5cbiAgZ2V0UGFydHlWb3RlczogZnVuY3Rpb24ocmFjZXMpIHtcblxuICAgIHZhciBwYXJ0eVZvdGVzID0gc2VsZi5nZXRQYXJ0aWVzKHJhY2VzKS5tYXAoZnVuY3Rpb24ocGFydHksIGluZGV4KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBcIm5hbWVcIjogcGFydHksXG4gICAgICAgIFwidm90ZXNcIjogMFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJhY2VzLmZvckVhY2goZnVuY3Rpb24ocmFjZSwgaW5kZXgpIHtcbiAgICAgIHJhY2UuY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSwgaW5kZXgpIHtcbiAgICAgICAgXy5maW5kV2hlcmUocGFydHlWb3Rlcywge1wibmFtZVwiOiBjYW5kaWRhdGUucGFydHl9KS52b3RlcyArPSBjYW5kaWRhdGUudm90ZUNvdW50O1xuICAgICAgfSlcblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBhcnR5Vm90ZXM7XG4gIH0sXG5cbiAgcmFjZU1hcDogZDMubWFwKCksXG5cbiAgYWRkUmFjZXNUb1VzOiBmdW5jdGlvbih1cywgcmFjZXMpIHtcblxuICAgIHJhY2VzLmZvckVhY2goZnVuY3Rpb24ocmFjZSkge1xuICAgICAgdmFyIGtleSA9IHJhY2UuZmlwc0NvZGVcblxuICAgICAgaWYoc2VsZi5yYWNlTWFwLmdldChrZXkpKSB7XG4gICAgICAgIFxuICAgICAgfVxuXG5cblxuICAgICAgc2VsZi5yYWNlTWFwLnNldChrZXksIHJhY2UpXG5cbiAgICB9KVxuXG4gICAgdmFyIGZlYXR1cmVzID0gdG9wb2pzb24uZmVhdHVyZSh1cywgdXMub2JqZWN0cy5jb3VudGllcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5yYWNlID0gc2VsZi5yYWNlTWFwLmdldChmZWF0dXJlLmlkLnRvU3RyaW5nKCkpIFxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9LFxuXG4gIGdldE1heFZvdGVDb3VudDogZnVuY3Rpb24ocmFjZXMpIHtcbiAgICByZXR1cm4gXy5tYXgocmFjZXMubWFwKGZ1bmN0aW9uKHJhY2UpIHtcbiAgICAgIC8vIGV4Y2VwdGlvbiBmb3IgYWxhc2thXG4gICAgICBpZihyYWNlLmZpcHNDb2RlID09IDIwMDApIHJldHVybiAwO1xuICAgICAgLy8gZXhjZXB0aW9uIGZvciBzdGF0ZSBlbnRyaWVzXG4gICAgICBpZighcmFjZS5maXBzQ29kZSkgcmV0dXJuIDA7XG4gICAgICAvLyBvdGhlcndpc2UgcmV0dXJuIHRvcCB2b3RlIGNvdW50XG4gICAgICByZXR1cm4gXy5tYXgocmFjZS5jYW5kaWRhdGVzLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgIHJldHVybiBjLnZvdGVDb3VudDtcbiAgICAgIH0pKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgc2V0U3RhdGVEYXRhOiBmdW5jdGlvbih1cywgcmFjZXMpIHtcbiAgICB2YXIgZmVhdHVyZXMgPSB0b3BvanNvbi5mZWF0dXJlKHVzLCB1cy5vYmplY3RzLnN0YXRlcykuZmVhdHVyZXNcblxuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZnVuY3Rpb24oZmVhdHVyZSkge1xuICAgICAgaWYoZmVhdHVyZS5pZCA9PT0gMikge1xuICAgICAgICBmZWF0dXJlLnJhY2UgPSBzZWxmLnJhY2VNYXAuZ2V0KFwiMjAwMFwiKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9KVxuICB9LFxuXG4gIHNldEZpbGw6IGZ1bmN0aW9uKGQpIHtcbiAgICBpZihkLnJhY2UgJiYgZC5yYWNlLmNhbmRpZGF0ZXMpIHtcbiAgICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG4gICAgICByZXR1cm4gd2lubmVyLnBhcnR5ID8gYjMucGFydHlTY2FsZSh3aW5uZXIucGFydHkpIDogJ3VybCgjY3Jvc3NoYXRjaCknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3doaXRlJ1xuICAgIH1cbiAgfSxcblxuICBzZXRQYXJ0eUZpbGw6IGZ1bmN0aW9uKGQsIHBhcnR5KSB7XG4gICAgaWYoZC5yYWNlICYmIGQucmFjZS5jYW5kaWRhdGVzKSB7XG4gICAgICB2YXIgY29udGFpbnNQYXJ0eSA9IF8uZmluZFdoZXJlKGQucmFjZS5jYW5kaWRhdGVzLCB7cGFydHk6IHBhcnR5fSlcbiAgICAgIHJldHVybiBjb250YWluc1BhcnR5ID8gYjMucGFydHlTY2FsZShwYXJ0eSkgOiAnd2hpdGUnXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnd2hpdGUnXG4gICAgfVxuICB9LFxuXG4gIGZvcm1hdFByZWZpeGVzOiBwcmVmaXhlcyxcblxuICBiYndOdW1iZXJGb3JtYXQ6IGZ1bmN0aW9uKGRvbGxhKSB7XG4gICAgdmFyIGJhc2UgPSBNYXRoLm1heCgxLCBNYXRoLm1pbigxZTEyLCBkb2xsYSkpO1xuICAgIHZhciBzY2FsZXIgPSBzZWxmLmJid0Zvcm1hdFByZWZpeChiYXNlKTtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsZXIuc2NhbGUoZG9sbGEpLnRvUHJlY2lzaW9uKDMpKStzY2FsZXIuc3ltYm9sO1xuICB9LFxuXG5cbiAgYmJ3Rm9ybWF0UHJlZml4OiBmdW5jdGlvbih2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgKj0gLTE7XG4gICAgICBpZiAocHJlY2lzaW9uKSB2YWx1ZSA9IGQzLnJvdW5kKHZhbHVlLCBkM19mb3JtYXRfcHJlY2lzaW9uKHZhbHVlLCBwcmVjaXNpb24pKTtcbiAgICAgIGkgPSAxICsgTWF0aC5mbG9vcigxZS0xMiArIE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4xMCk7XG4gICAgICBpID0gTWF0aC5tYXgoLTI0LCBNYXRoLm1pbigyNCwgTWF0aC5mbG9vcigoaSA8PSAwID8gaSArIDEgOiBpIC0gMSkgLyAzKSAqIDMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbGYuZm9ybWF0UHJlZml4ZXNbNCArIGkgLyAzXTtcbiAgfVxuXG59XG5cbnZhciBzZWxmID0gYjNcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gYjM7XG5cblxuXG5cbiIsInZhciBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5kMy50aXAgPSByZXF1aXJlKCcuL3ZlbmRvci9kMy10aXAnKShkMyk7XG52YXIgcXVldWUgPSByZXF1aXJlKCdxdWV1ZS1hc3luYycpO1xudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIGIzID0gcmVxdWlyZSgnLi9tYXAtaGVscGVycy5qcycpO1xudmFyIGxlZ2VuZCA9IHJlcXVpcmUoJy4vbGVnZW5kLmpzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICB2YXIgcmVzaXplID0gKGZ1bmN0aW9uKCl7XG4gICAgICBjb25zb2xlLmxvZygnVEVTVCcpO1xuICAgICAgdmFyIHdpbmRvd0lkID0gJyc7XG4gICAgICB2YXIgcmVzaXplQ291bnQgPSAwO1xuICAgICAgdmFyIHVzZVN0cmluZyA9IGZhbHNlO1xuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJtZXNzYWdlXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICB2YXIgZGF0YSA9IGV2ZW50LmRhdGFcbiAgICAgICAgICBpZiAoZGF0YS5zdWJzdHJpbmcpe1xuICAgICAgICAgICAgdXNlU3RyaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKGRhdGEubWV0aG9kID09PSBcInJlZ2lzdGVyXCIpe1xuICAgICAgICAgICAgd2luZG93SWQgPSBkYXRhLndpbmRvd0lkO1xuICAgICAgICAgICAgcmVzaXplKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBmYWxzZSk7XG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZSgpe1xuICAgICAgICBpZiAod2luZG93SWQgPT09ICcnKSByZXR1cm5cbiAgICAgICAgcmVzaXplQ291bnQrKztcblxuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICBtZXRob2Q6IFwicmVzaXplXCIsXG4gICAgICAgICAgd2luZG93SWQ6IHdpbmRvd0lkLFxuICAgICAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodFxuICAgICAgICB9IFxuXG4gICAgICAgIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UodXNlU3RyaW5nID8gSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkgOiBtZXNzYWdlLCAnKicpXG4gICAgICB9XG5cbiAgICAgIHJlc2l6ZS53aW5kb3dJZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB3aW5kb3dJZDtcbiAgICAgIH1cblxuICAgICAgcmVzaXplLnJlc2l6ZUNvdW50ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHJlc2l6ZUNvdW50O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzaXplO1xuICAgIH0pKCk7XG5cbiAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLnN0eWxlKCd3aWR0aCcpKVxuICAsIG1hcFJhdGlvID0gLjZcbiAgLCBoZWlnaHQgPSB3aWR0aCAqIG1hcFJhdGlvXG4gICwgc2NhbGVXaWR0aCA9IHdpZHRoICogMS4yXG4gICwgY2VudGVyZWQ7XG5cbiAgdmFyIHRpcCA9IGQzLnRpcCgpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2QzLXRpcCcpXG4gICAgLmh0bWwodG9vbHRpcEh0bWwpO1xuXG4gIHZhciB2b3RlVG90YWxTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFswLDUwXSk7XG5cbiAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgIC5zY2FsZShzY2FsZVdpZHRoKVxuICAgICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSk7XG5cbiAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjbWFwLWNvbnRhaW5lcicpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodClcbiAgICAgIC5jYWxsKHRpcClcblxuICBzdmcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgICAub24oXCJjbGlja1wiLCBjbGlja2VkKVxuXG4gIHZhciBnID0gc3ZnLmFwcGVuZChcImdcIik7XG5cbiAgcXVldWUoKVxuICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91cy5qc29uJylcbiAgICAuZGVmZXIoZDMuanNvbiwgJ2RhdGEvdXBkYXRlZF9zZW5hdGVfYnlfY291bnR5Lmpzb24nKVxuICAgIC5hd2FpdChyZWFkeSk7XG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHVzLCByYWNlc0FycmF5KSB7XG4gICAgcmFjZXMgPSByYWNlc0FycmF5LnJhY2VzXG5cbiAgICBiMy52b3RlQ291bnR5VG90YWxTY2FsZS5kb21haW4oWzEsYjMuZ2V0TWF4Vm90ZUNvdW50KHJhY2VzKV0pO1xuICAgIGIzLnZvdGVDb3VudHlIb3ZlclRvdGFsU2NhbGUuZG9tYWluKGIzLnZvdGVDb3VudHlUb3RhbFNjYWxlLmRvbWFpbigpKVxuXG4gICAgdmFyIHpvb21MaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKVxuICAgICAgLnNjYWxlRXh0ZW50KFswLjEsIDNdKVxuICAgICAgLm9uKFwiem9vbVwiLCB6b29tSGFuZGxlcilcblxuICAgIHZhciBkcmFnTGlzdGVuZXIgPSBkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgIC5vbignZHJhZycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RyYWcnKTtcbiAgICAgICAgLy8gaWYoZC5yYWNlKSB7XG4gICAgICAgIC8vICAgdGlwLnNob3coZClcbiAgICAgICAgLy8gfVxuICAgICAgfSlcblxuICAgIGZ1bmN0aW9uIHpvb21IYW5kbGVyKCkge1xuICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcbiAgICB9XG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudGllcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYjMuYWRkUmFjZXNUb1VzKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnR5JylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBiMy5zZXRGaWxsKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgaWYoIWQucmFjZSB8fCAhZC5yYWNlLmNhbmRpZGF0ZXMpIHJldHVybiAxO1xuICAgICAgICAgIHJldHVybiBiMy52b3RlQ291bnR5VG90YWxTY2FsZShfLm1heChkLnJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oZSkge3JldHVybiBlLnZvdGVDb3VudDt9KSkpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBpZihkLnJhY2UpIHtcbiAgICAgICAgICAgIHRpcC5zaG93KGQpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpO1xuXG4gICAgICAgIC8vIC5vbignY2xpY2snLCBjbGlja2VkKVxuXG4gICAgICAgIC8vIC5vbignY2xpY2snLCBjbGlja2VkKTtcblxuICAgIC8vIHpvb21MaXN0ZW5lcihnKTtcblxuICAgIC8vIGRyYWdMaXN0ZW5lcihnKVxuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2lkJywgJ3N0YXRlcycpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoYjMuc2V0U3RhdGVEYXRhKHVzLCByYWNlcykpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZC5pZCA9PT0gMiA/IFwic3RhdGUgYWxhc2thXCIgOiBcInN0YXRlXCJcbiAgICAgICAgfSk7XG5cbiAgICAvL0RlYWxzIHdpdGggQWxhc2thXG4gICAgdmFyIGFsYXNrYSA9IGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBiMy5wYXJ0eVNjYWxlKCdMaWJlcnRhcmlhbicpO1xuICAgICAgfSlcbiAgICAgIC5vbignbW91c2VvdmVyJywgdGlwLnNob3cpXG4gICAgICAub24oJ21vdXNlb3V0JywgdGlwLmhpZGUpXG4gICAgICAuc3R5bGUoJ29wYWNpdHknLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBiMy52b3RlQ291bnR5VG90YWxTY2FsZShfLm1heChkLnJhY2UuY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oZSkge3JldHVybiBlLnZvdGVDb3VudDt9KSkpO1xuICAgICAgfSlcblxuICAgIGlmKCEvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgKSB7XG4gICAgICBkMy5zZWxlY3RBbGwoJy5jb3VudHknKVxuICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tlZCk7XG5cbiAgICAgIGQzLnNlbGVjdCgnLmFsYXNrYScpXG4gICAgICAgIC5vbignY2xpY2snLCBjbGlja2VkKVxuICAgIH1cblxuICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlLWJvcmRlcnMnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgLy8gc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgLy8gICAgIC5kYXR1bSh0b3BvanNvbi5tZXNoKHN0YXRlcywgc3RhdGVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAvLyAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlcycpXG4gICAgLy8gICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBMRUdFTkRcblxuICAgIGxlZ2VuZC5hcHBlbmQocmFjZXMpO1xuICAgIHJlc2l6ZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tlZChkKSB7XG4gICAgdmFyIHgsIHksIGs7XG5cbiAgICBpZiAoZCAmJiBjZW50ZXJlZCAhPT0gZCkge1xuICAgICAgdmFyIGNlbnRyb2lkID0gcGF0aC5jZW50cm9pZChkKTtcbiAgICAgIHggPSBjZW50cm9pZFswXTtcbiAgICAgIHkgPSBjZW50cm9pZFsxXTtcbiAgICAgIGsgPSA0O1xuICAgICAgY2VudGVyZWQgPSBkO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gd2lkdGggLyAyO1xuICAgICAgeSA9IGhlaWdodCAvIDI7XG4gICAgICBrID0gMTtcbiAgICAgIGNlbnRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmNsYXNzZWQoXCJhY3RpdmVcIiwgY2VudGVyZWQgJiYgZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gY2VudGVyZWQ7IH0pO1xuXG4gICAgZy50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDc1MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB3aWR0aCAvIDIgKyBcIixcIiArIGhlaWdodCAvIDIgKyBcIilzY2FsZShcIiArIGsgKyBcIil0cmFuc2xhdGUoXCIgKyAteCArIFwiLFwiICsgLXkgKyBcIilcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEuNSAvIGsgKyBcInB4XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9vbHRpcEh0bWwoZCkge1xuICAgIHZhciB3aW5uZXIgPSBiMy5nZXRXaW5uZXIoZCk7XG5cbiAgICBpZih3aW5uZXIubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj5WYWNhbnQgU2VhdDwvc3Bhbj4nXG4gICAgfVxuXG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIndpbm5lci1uYW1lXCI+JyArIHdpbm5lci5uYW1lICsgJzwvc3Bhbj4nXG4gICAgICArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBiMy5wYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+ICdcbiAgICAgICsgJzxzcGFuIGNsYXNzPVwidm90ZXNcIj4nICsgZDMuZm9ybWF0KFwiLFwiKSh3aW5uZXIudm90ZUNvdW50KSArICcgdm90ZXM8L3NwYW4+JztcbiAgfVxuXG5cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
