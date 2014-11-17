!function t(e,a,n){function r(s,i){if(!a[s]){if(!e[s]){var c="function"==typeof require&&require;if(!i&&c)return c(s,!0);if(o)return o(s,!0);var u=new Error("Cannot find module '"+s+"'");throw u.code="MODULE_NOT_FOUND",u}var l=a[s]={exports:{}};e[s][0].call(l.exports,function(t){var a=e[s][1][t];return r(a?a:t)},l,l.exports,t,e,a,n)}return a[s].exports}for(var o="function"==typeof require&&require,s=0;s<n.length;s++)r(n[s]);return r}({1:[function(t){t("./scripts/map.js")()},{"./scripts/map.js":4}],2:[function(t,e){var a=t("d3"),n=t("./map-helpers.js"),r=t("underscore");e.exports=function(){"use strict";var t={voteTotalScale:a.scale.linear().range([0,50]),append:function(t){e.setPartyVotes(e.stateRaces(t)),e.setPartyVotesMax();var o,s,i=parseInt(a.select("#map-container").style("width")),c=20;960>i?(o=i/2,s=0):(s=100,o=i);var u=200,l=a.select("#legend-container").on("mouseleave",function(){a.selectAll(".county").style("fill",n.setFill).style("opacity",n.setOpacity),a.select(".alaska").style("fill",function(){return n.partyScale("Libertarian")}).style("opacity",function(t){return n.voteCountyTotalScale(r.max(t.race.candidates.map(function(t){return t.voteCount})))})}).append("svg").attr("height",u).attr("width",i);l.append("text").attr("x",o-s).attr("y",(e.partyVotes.length+1)*c-175).attr("dy",".95em").style("text-anchor","middle").style("font-weight","bold").text("National vote total");var d=l.selectAll(".legend").data(e.partyVotes).enter().append("g").attr("class","legend").attr("transform",function(t,a){return"translate(0,"+(a*c+(e.partyVotes.length*c-125))+")"}).on("mouseover",function(t){var e=t.name;a.select(".alaska").style("fill",function(e){return t.name===n.getWinner(e).party?n.partyScale("Libertarian"):"white"}).style("opacity",function(t){var a=r.findWhere(t.race.candidates,{party:e});return a?n.voteCountyHoverTotalScale(a.voteCount):"white"}),a.selectAll(".county").style("fill",function(t){return n.setPartyFill(t,e)}).style("opacity",function(t){return n.setPartyOpacity(t,e)})});d.append("rect").attr("x",o-s).attr("width",function(t){return e.voteTotalScale(t.votes)}).attr("height",c-2).style("fill",function(t){return n.partyScale(t.name)}),d.append("text").attr("x",o-s-4).attr("y",9).attr("dy",".35em").style("text-anchor","end").text(function(t){return t.name}),d.append("text").attr("x",function(t){return o-s+4+e.voteTotalScale(t.votes)}).attr("y",9).attr("dy",".35em").attr("class","legend-values").text(function(t){return n.bbwNumberFormat(t.votes)})},stateRaces:function(t){return t.filter(function(t){return void 0===t.fipsCode})},setPartyVotes:function(t){var a=n.getPartyVotes(t);e.partyVotes=r.sortBy(a,function(t){return-t.votes}).slice(0,8)},partyVotes:void 0,setPartyVotesMax:function(){var t=a.max(e.partyVotes,function(t){return t.votes});e.voteTotalScale.domain([0,t])}},e=t;return t}},{"./map-helpers.js":3,d3:"d3",underscore:"underscore"}],3:[function(t,e){var a=t("d3"),n=t("underscore"),r=t("topojson");e.exports=function(){"use strict";var t,e=a.shuffle(["#FF00FF","#CC00FF","#00FF00","#FFFF00","#00FFFF","#CCFF00","#FFCC00","#00FF99","#6600CC","#FF0099","#006666","#006600","#CC9900","#6666FF"]),o=function(t,e){var a=Math.pow(10,3*Math.abs(4-e));return{scale:e>4?function(t){return t/a}:function(t){return t*a},symbol:t}},s=["p","n","µ","m","","k","m","b","t"].map(o);t={resize:function(){function t(){if(""!==e){a++;var t={method:"resize",windowId:e,height:document.documentElement.scrollHeight};window.parent.postMessage(n?JSON.stringify(t):t,"*")}}var e="",a=0,n=!1;return window.addEventListener("message",function(a){var r=a.data;r.substring&&(n=!0,r=JSON.parse(r)),"register"===r.method&&(e=r.windowId,t())},!1),t.windowId=function(){return e},t.resizeCount=function(){return a},t}(),voteCountyHoverTotalScale:a.scale.log().range([0,1]),voteCountyTotalScale:a.scale.log().range([.35,1]),partyScale:a.scale.ordinal().range(e),getWinner:function(t){return n.max(t.race.candidates,function(t){return t.voteCount})},getParties:function(t){return n.uniq(n.flatten(t.map(function(t){return t.candidates.map(function(t){return t.party})})))},getPartyVotes:function(t){var e=i.getParties(t).map(function(t){return{name:t,votes:0}});return t.forEach(function(t){t.candidates.forEach(function(t){n.findWhere(e,{name:t.party}).votes+=t.voteCount})}),e},raceMap:a.map(),addRacesToUs:function(t,e){e.forEach(function(t){var e=t.fipsCode;i.raceMap.set(e,t)});var a=r.feature(t,t.objects.counties).features;return a.map(function(t){return t.race=i.raceMap.get(t.id.toString()),t})},getMaxVoteCount:function(t){return n.max(t.map(function(t){return 2e3==t.fipsCode?0:t.fipsCode?n.max(t.candidates.map(function(t){return t.voteCount})):0}))},setStateData:function(t){var e=r.feature(t,t.objects.states).features;return e.map(function(t){return 2===t.id&&(t.race=i.raceMap.get("2000")),t})},setFill:function(e){if(e.race&&e.race.candidates){var a=t.getWinner(e);return a.party?t.partyScale(a.party):"url(#crosshatch)"}return"white"},setOpacity:function(e){if(!e.race||!e.race.candidates)return 1;var a=n.max(e.race.candidates.map(function(t){return t.voteCount}));return t.voteCountyTotalScale(a)},setPartyOpacity:function(t,e){if(!t.race||!t.race.candidates)return 1;var a=n.findWhere(t.race.candidates,{party:e});return a&&a.voteCount?i.voteCountyHoverTotalScale(a.voteCount):"white"},setPartyFill:function(e,a){if(e.race&&e.race.candidates){var r=n.findWhere(e.race.candidates,{party:a});return r?t.partyScale(a):"white"}return"white"},formatPrefixes:s,bbwNumberFormat:function(t){var e=Math.max(1,Math.min(1e12,t)),a=i.bbwFormatPrefix(e);return parseFloat(a.scale(t).toPrecision(3))+a.symbol},bbwFormatPrefix:function(t,e){var n=0;return t&&(0>t&&(t*=-1),e&&(t=a.round(t,d3_format_precision(t,e))),n=1+Math.floor(1e-12+Math.log(t)/Math.LN10),n=Math.max(-24,Math.min(24,3*Math.floor((0>=n?n+1:n-1)/3)))),i.formatPrefixes[4+n/3]}};var i=t;return t}()},{d3:"d3",topojson:"topojson",underscore:"underscore"}],4:[function(t,e){var a=t("d3");a.tip=t("./vendor/d3-tip")(a);var n=t("queue-async"),r=t("topojson"),o=t("underscore"),s=t("./map-helpers.js"),i=t("./legend.js")();e.exports=function(){"use strict";function t(t,n,c){var u=c.races;s.voteCountyTotalScale.domain([1,s.getMaxVoteCount(u)]),s.voteCountyHoverTotalScale.domain(s.voteCountyTotalScale.domain()),g.append("g").attr("class","counties").selectAll("path").data(s.addRacesToUs(n,u)).enter().append("path").attr("class","county").attr("d",m).style("fill",s.setFill).style("opacity",s.setOpacity).on("mouseover",function(t){t.race&&y.show(t)}).on("mouseout",y.hide),g.append("g").attr("id","states").selectAll("path").data(s.setStateData(n,u)).enter().append("path").attr("d",m).attr("class",function(t){return 2===t.id?"state alaska":"state"});a.select(".alaska").style("fill",function(){return s.partyScale("Libertarian")}).on("mouseover",y.show).on("mouseout",y.hide).style("opacity",function(t){return s.voteCountyTotalScale(o.max(t.race.candidates.map(function(t){return t.voteCount})))});/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||(a.selectAll(".county").on("click",e),a.select(".alaska").on("click",e)),g.append("path").datum(r.mesh(n,n.objects.states,function(t,e){return t!==e})).attr("class","state-borders").attr("d",m),i.append(u),s.resize()}function e(t){var e,a,n;if(t&&u!==t){var r=m.centroid(t);e=r[0],a=r[1],n=4,u=t}else e=l/2,a=p/2,n=1,u=null;g.selectAll("path").classed("active",u&&function(t){return t===u}),g.transition().duration(750).attr("transform","translate("+l/2+","+p/2+")scale("+n+")translate("+-e+","+-a+")").style("stroke-width",1.5/n+"px")}function c(t){var e=s.getWinner(t);return void 0===e.name?'<span class="winner-name">Vacant Seat</span>':'<span class="winner-name">'+e.name+'</span><span style="color:'+s.partyScale(e.party)+'">'+e.party+'</span> <span class="votes">'+a.format(",")(e.voteCount)+" votes</span>"}var u,l=parseInt(a.select("#map-container").style("width")),d=.6,p=l*d,f=1.2*l,y=a.tip().attr("class","d3-tip").html(c),v=(a.scale.linear().range([0,50]),a.geo.albersUsa().scale(f).translate([l/2,p/2])),m=a.geo.path().projection(v),h=a.select("#map-container").append("svg").attr("width",l).attr("height",p).call(y);h.append("rect").attr("class","background").attr("width",l).attr("height",p).on("click",e);var g=h.append("g");n().defer(a.json,"data/us.json").defer(a.json,"data/updated_senate_by_county_sc_fix.json").await(t),a.select(self.frameElement).style("height",p+"px")}},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip",d3:"d3","queue-async":"queue-async",topojson:"topojson",underscore:"underscore"}]},{},[1]);