var d3 = require('d3');
d3.tip = require('./vendor/d3-tip')(d3);
var b3 = require('./map-helpers.js');
var _ = require('underscore');

// party descriptions, sorry not loading async!
var partyDescriptions = [
  {
    "name": "Libertarian",
    "description": "“The Libertarian Party is for all who don't want to push other people around and don't want to be pushed around themselves”",
    "url": "http://www.lp.org/introduction/what-is-the-libertarian-party"
  },
  {
    "name": "Independent",
    "description": "Independent candidates are not affiliated with any political party"
  },
  {
    "name": "Petitioning Candidate",
    "description": "A candidate unaffiliated with a recognized party may get on the ballot by collecting enough signatures on a petition; rules vary by state."
  },
  {
    "name": "Working Families",
    "description": "“Working Families is a growing progressive political organization that fights for an economy that works for all of us, and a democracy in which every voice matters”",
    "url": "http://workingfamilies.org/about-us/"
  },
  {
    "name": "Green",
    "description": "“Committed to environmentalism, non-violence, social justice and grassroots organizing, Greens are renewing democracy without the support of corporate donors”",
    "url": "http://www.gp.org/what-we-believe/about-us"
  },
  {
    "name": "Constitution",
    "description": "“It is our goal to limit the federal government to its delegated, enumerated, Constitutional functions”",
    "url": "http://www.constitutionparty.com/the-party/mission-statement/"
  },
  {
    "name": "Independence",
    "description": "“The Independence Party of Minnesota’s platform contains 10 ‘Core Values’, 6 ‘Principals’ and 47 ‘planks’”, including cannabis legalization, balanced budgeting, and campaign finance reform",
    "url": "http://www.mnip.org/about-us/what-we-stand-for"
  },
  {
    "name": "U.S. Taxpayers",
    "description": "The U.S. Taxpayers Party is the Michigan affiliate of the National Constitution Party",
    "url": "http://www.ustpm.org/"
  },
  {
    "name": "Mountain Party",
    "description": "The West Virginia affiliate of the national Green Party, with a special focus on opposing mountaintop removal coal mining",
    "url": "http://www.mtparty.org/"
  },
  {
    "name": "Pacific Green",
    "description": "The Oregon affiliate of the national Green Party",
    "url": "http://www.pacificgreens.org/"
  }
];

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
        console.log('mouseout');
        d3.selectAll('.county')
          .style('fill', b3.setFill)

        d3.select('.alaska')
          .style('fill', function(d) {
            return b3.partyScale('Libertarian')
          })
      })
      .append('svg')
      .attr('height', legendHeight)
      .attr('width', width)

    // create tooltip instance
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .html(function(d) {
        return _.findWhere(partyDescriptions, {name: d.name }).description
      });
    legendContainer.call(tip);

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
          d3.select('.alaska')
            .style('fill', function(data) {
              return d.name === b3.getWinner(data).party ? b3.partyScale('Libertarian') : 'white'
            })

          d3.selectAll('.county')
            .style('fill', function(data) {
              return data.race && data.race.candidates && d.name === b3.getWinner(data).party ? b3.partyScale(d.name) : 'white'
            })

          tip.show(d);
        })
        .on('mouseout', tip.hide);


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
