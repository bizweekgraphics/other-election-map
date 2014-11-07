var d3 = require('d3');
d3.tip = require('./vendor/d3-tip')(d3);
var queue = require('queue-async');
var topojson = require('topojson');
var _ = require('underscore');

module.exports = function() {
  var width = 960,
      height = 650,
      centered;

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(tooltipHtml);

  var colors = ['#FF00FF', '#CC00FF', '#00FF00', '#FFFF00', '#00FFFF', '#CCFF00', '#FFCC00', '#00FF99', '#6600CC', '#FF0099', '#006666', '#006600']

  // var colors = ['purple', 'magenta', 'navy', 'maroon', 'teal', 'aqua', 'green', 'lime', 'olive', 'yellow']

  var partyScale = d3.scale.ordinal()
    .range(d3.shuffle(colors))

  var voteTotalScale = d3.scale.linear().range([0,50]);

  var projection = d3.geo.albersUsa()
      .scale(1280)
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select('body').append('svg')
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

    g.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(addRacesToUs(us, races))
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('fill', setFill)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('click', clicked);

    g.append('g')
      .attr('id', 'states')
      .selectAll('path')
        .data(setStateData(us, races))
      .enter().append('path')
        .attr('d', path)
        .attr('class', function(d) {
          if(d.id === 35) {
            return "state new-mexico"
          }
          return d.id === 2 ? "state alaska" : "state"
        })
        .on('mouseover', function(d) {
          console.log(d)
        })

    //Deals with Alaska
    d3.select('.alaska')
      .style('fill', function(d) {
        return partyScale(d);
      })
      .style('fill', setFill)
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

    // var parties = getParties(races);
    var partyVotes = getPartyVotes(races);
    partyVotes = _.sortBy(partyVotes, function(d) { return -d.votes; }).slice(0,8);
    voteTotalScale.domain([0, d3.max(partyVotes, function(d) { return d.votes; })])
    var legendMarginRight = 100;
    var legendLineHeight = 20;

    svg.append("text")
      .attr("x", width - legendMarginRight)
      .attr("y", height - (partyVotes.length+1)*legendLineHeight)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("National vote total")

    var legend = svg.selectAll(".legend")
        .data(partyVotes)
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + (i * legendLineHeight + (height - partyVotes.length*legendLineHeight)) + ")"; });

    legend.append("rect")
        .attr("x", width - legendMarginRight)
        .attr("width", function(d) { return voteTotalScale(d.votes); })
        .attr("height", legendLineHeight - 2)
        .style("fill", function(d) { return partyScale(d.name); });

    legend.append("text")
        .attr("x", width - legendMarginRight - 4)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d.name; });

    legend.append("text")
        .attr("x", function(d) { return width - legendMarginRight + 4 + voteTotalScale(d.votes); })
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("fill", "#ccc")
        .text(function(d) { return bbwNumberFormat(d.votes); });
  }

  function setFill(d) {
    if(d.race[0] && d.race[0].reportingUnits) {
      var winner = getWinner(d);
      return winner.party ? partyScale(winner.party) : 'url(#crosshatch)';
    } else {
      return 'white'
    }
  }

  function getWinner(d) {
    if(d.race[0] && d.race[0].reportingUnits) {
      return  _.max(d.race[0].reportingUnits[0].candidates, function(candidate) {
        return candidate.voteCount
      })
    }
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
    var winner = getWinner(d);

    if(winner.name === undefined) {
      return '<span class="winner-name">Vacant Seat</span>'
    }

    return '<span class="winner-name">' + winner.name + '</span>' + '<span style="color:' + partyScale(winner.party) + '">' + winner.party + '</span>'
  }

  function getReportingUnitFromFipsCode(races, fipsCode) {
    return races.filter(function(race) {
      return race.reportingUnits[0].fipsCode === fipsCode
    })
  }

  function addRacesToUs(us, races) {
    var features = topojson.feature(us, us.objects.counties).features

    return features.map(function(feature) {
      feature.race = getReportingUnitFromFipsCode(races, feature.id.toString())
      return feature
    })

  }

  function setStateData(us, races) {
    var features = topojson.feature(us, us.objects.states).features

    return features.map(function(feature) {
      if(feature.id === 2) {
        feature.race = getReportingUnitFromFipsCode(races, "2000")
      } 
      return feature
    })
  }

  function getParties(races) {
    return _.uniq(_.flatten(races.map(function(race) {
      return race.reportingUnits[0].candidates.map(function(candidate) {
        return candidate.party;
      });
    })));
  }

  function getPartyVotes(races) {

    partyVotes = getParties(races).map(function(party, index) {
      return {
        "name": party,
        "votes": 0
      };
    });

    races.forEach(function(race, index) {
      race.reportingUnits[0].candidates.forEach(function(candidate, index) {
        _.findWhere(partyVotes, {"name": candidate.party}).votes += candidate.voteCount;
      })
    });

    return partyVotes;

  }

  // adapted from d3.formatPrefix
  function bbwNumberFormat(dolla) {
    var base = Math.max(1, Math.min(1e12, dolla));
    var scaler = bbwFormatPrefix(base);
    return parseFloat(scaler.scale(dolla).toPrecision(3))+scaler.symbol;
  }

  var bbw_formatPrefixes = [ "p", "n", "µ", "m", "", "k", "m", "b", "t" ].map(bbw_formatPrefix);
  function bbwFormatPrefix(value, precision) {
  	var i = 0;
  	if (value) {
  		if (value < 0) value *= -1;
  		if (precision) value = d3.round(value, d3_format_precision(value, precision));
  		i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
  		i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
  	}
  	return bbw_formatPrefixes[4 + i / 3];
  };
  function bbw_formatPrefix(d, i) {
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

  d3.select(self.frameElement).style('height', height + 'px');
}
