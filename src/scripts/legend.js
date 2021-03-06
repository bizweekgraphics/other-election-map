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



