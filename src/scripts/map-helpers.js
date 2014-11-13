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








