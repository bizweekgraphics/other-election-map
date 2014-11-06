(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./scripts/map.js')()

},{"./scripts/map.js":2}],2:[function(require,module,exports){
var $ = require('jquery');
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

  var partyScale = d3.scale.category20();

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
      .on("click", clicked);

  var g = svg.append("g");

  queue()
      .defer(d3.json, 'data/us_and_races.json')
      .await(ready);

  function ready(error, us) {

    g.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(us)
      .enter().append('path')
        .attr('class', 'county')
        .attr('d', path)
        .style('stroke', function(d) {
          return d.race && d.race.length > 0 ? '#FEF' : '#FEF'
        })
        .style('fill', setFill)
        // .on('mouseover', function(d) {
        //   console.log(d.race[0])
        // })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('click', clicked)

    // svg.append('path')
    //     .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    //     .attr('class', 'states')
    //     .attr('d', path);
  }

  function setFill(d) {
    if(d.race[0] && d.race[0].reportingUnits) {
      var winner = getWinner(d);
      return partyScale(winner.party);
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
    var winnerName = [winner.first, winner.last].join(' ');

    return '<span class="winner-name">' + winnerName + '</span>' + '<span style="color:' + partyScale(winner.party) + '">' + winner.party + '</span>'
  }


  d3.select(self.frameElement).style('height', height + 'px');
}

},{"./vendor/d3-tip":"./vendor/d3-tip","d3":"d3","jquery":"jquery","queue-async":"queue-async","topojson":"topojson","underscore":"underscore"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3NjcmlwdHMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vc2NyaXB0cy9tYXAuanMnKSgpXG4iLCJ2YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xudmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcbmQzLnRpcCA9IHJlcXVpcmUoJy4vdmVuZG9yL2QzLXRpcCcpKGQzKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJ3F1ZXVlLWFzeW5jJyk7XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHdpZHRoID0gOTYwLFxuICAgICAgaGVpZ2h0ID0gNjUwLFxuICAgICAgY2VudGVyZWQ7XG5cbiAgdmFyIHRpcCA9IGQzLnRpcCgpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2QzLXRpcCcpXG4gICAgLmh0bWwodG9vbHRpcEh0bWwpO1xuXG4gIHZhciBwYXJ0eVNjYWxlID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xuXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAuc2NhbGUoMTI4MClcbiAgICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pO1xuXG4gIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnYm9keScpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodClcbiAgICAgIC5jYWxsKHRpcClcblxuICBzdmcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgICAub24oXCJjbGlja1wiLCBjbGlja2VkKTtcblxuICB2YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gIHF1ZXVlKClcbiAgICAgIC5kZWZlcihkMy5qc29uLCAnZGF0YS91c19hbmRfcmFjZXMuanNvbicpXG4gICAgICAuYXdhaXQocmVhZHkpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5KGVycm9yLCB1cykge1xuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnRpZXMnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKHVzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvdW50eScpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIGQucmFjZSAmJiBkLnJhY2UubGVuZ3RoID4gMCA/ICcjRkVGJyA6ICcjRkVGJ1xuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBzZXRGaWxsKVxuICAgICAgICAvLyAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhkLnJhY2VbMF0pXG4gICAgICAgIC8vIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgdGlwLnNob3cpXG4gICAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSlcbiAgICAgICAgLm9uKCdjbGljaycsIGNsaWNrZWQpXG5cbiAgICAvLyBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAvLyAgICAgLmRhdHVtKHRvcG9qc29uLm1lc2godXMsIHVzLm9iamVjdHMuc3RhdGVzLCBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiOyB9KSlcbiAgICAvLyAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0YXRlcycpXG4gICAgLy8gICAgIC5hdHRyKCdkJywgcGF0aCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRGaWxsKGQpIHtcbiAgICBpZihkLnJhY2VbMF0gJiYgZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzKSB7XG4gICAgICB2YXIgd2lubmVyID0gZ2V0V2lubmVyKGQpO1xuICAgICAgcmV0dXJuIHBhcnR5U2NhbGUod2lubmVyLnBhcnR5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICd3aGl0ZSdcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRXaW5uZXIoZCkge1xuICAgIGlmKGQucmFjZVswXSAmJiBkLnJhY2VbMF0ucmVwb3J0aW5nVW5pdHMpIHtcbiAgICAgIHJldHVybiAgXy5tYXgoZC5yYWNlWzBdLnJlcG9ydGluZ1VuaXRzWzBdLmNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnZvdGVDb3VudFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja2VkKGQpIHtcbiAgICB2YXIgeCwgeSwgaztcblxuICAgIGlmIChkICYmIGNlbnRlcmVkICE9PSBkKSB7XG4gICAgICB2YXIgY2VudHJvaWQgPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgeCA9IGNlbnRyb2lkWzBdO1xuICAgICAgeSA9IGNlbnRyb2lkWzFdO1xuICAgICAgayA9IDQ7XG4gICAgICBjZW50ZXJlZCA9IGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSB3aWR0aCAvIDI7XG4gICAgICB5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIGsgPSAxO1xuICAgICAgY2VudGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuY2xhc3NlZChcImFjdGl2ZVwiLCBjZW50ZXJlZCAmJiBmdW5jdGlvbihkKSB7IHJldHVybiBkID09PSBjZW50ZXJlZDsgfSk7XG5cbiAgICBnLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oNzUwKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHdpZHRoIC8gMiArIFwiLFwiICsgaGVpZ2h0IC8gMiArIFwiKXNjYWxlKFwiICsgayArIFwiKXRyYW5zbGF0ZShcIiArIC14ICsgXCIsXCIgKyAteSArIFwiKVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMS41IC8gayArIFwicHhcIik7XG4gIH1cblxuICBmdW5jdGlvbiB0b29sdGlwSHRtbChkKSB7XG4gICAgdmFyIHdpbm5lciA9IGdldFdpbm5lcihkKTtcbiAgICB2YXIgd2lubmVyTmFtZSA9IFt3aW5uZXIuZmlyc3QsIHdpbm5lci5sYXN0XS5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gJzxzcGFuIGNsYXNzPVwid2lubmVyLW5hbWVcIj4nICsgd2lubmVyTmFtZSArICc8L3NwYW4+JyArICc8c3BhbiBzdHlsZT1cImNvbG9yOicgKyBwYXJ0eVNjYWxlKHdpbm5lci5wYXJ0eSkgKyAnXCI+JyArIHdpbm5lci5wYXJ0eSArICc8L3NwYW4+J1xuICB9XG5cblxuICBkMy5zZWxlY3Qoc2VsZi5mcmFtZUVsZW1lbnQpLnN0eWxlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbn1cbiJdfQ==
