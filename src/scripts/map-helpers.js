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
