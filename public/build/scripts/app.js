!function t(e,a,n){function r(s,c){if(!a[s]){if(!e[s]){var i="function"==typeof require&&require;if(!c&&i)return i(s,!0);if(o)return o(s,!0);var u=new Error("Cannot find module '"+s+"'");throw u.code="MODULE_NOT_FOUND",u}var l=a[s]={exports:{}};e[s][0].call(l.exports,function(t){var a=e[s][1][t];return r(a?a:t)},l,l.exports,t,e,a,n)}return a[s].exports}for(var o="function"==typeof require&&require,s=0;s<n.length;s++)r(n[s]);return r}({1:[function(t){t("./scripts/map.js")()},{"./scripts/map.js":4}],2:[function(t,e){var a=t("d3"),n=t("./map-helpers.js"),r=t("underscore"),o={voteTotalScale:a.scale.linear().range([0,50]),append:function(t){s.setPartyVotes(s.stateRaces(t)),s.setPartyVotesMax();var e=parseInt(a.select("#map-container").style("width")),r=20;if(960>e)var o=e/2,c=0;else var c=100,o=e;var i=200,u=a.select("#legend-container").on("mouseleave",function(){console.log("mouseout"),a.selectAll(".county").style("fill",n.setFill),a.select(".alaska").style("fill",function(){return n.partyScale("Libertarian")})}).append("svg").attr("height",i).attr("width",e);u.append("text").attr("x",o-c).attr("y",(s.partyVotes.length+1)*r-175).attr("dy",".95em").style("text-anchor","middle").style("font-weight","bold").text("National vote total");var l=u.selectAll(".legend").data(s.partyVotes).enter().append("g").attr("class","legend").attr("transform",function(t,e){return"translate(0,"+(e*r+(s.partyVotes.length*r-125))+")"}).on("mouseover",function(t){a.select(".alaska").style("fill",function(e){return t.name===n.getWinner(e).party?n.partyScale("Libertarian"):"white"}),a.selectAll(".county").style("fill",function(e){return e.race&&e.race.candidates&&t.name===n.getWinner(e).party?n.partyScale(t.name):"white"})});l.append("rect").attr("x",o-c).attr("width",function(t){return s.voteTotalScale(t.votes)}).attr("height",r-2).style("fill",function(t){return n.partyScale(t.name)}),l.append("text").attr("x",o-c-4).attr("y",9).attr("dy",".35em").style("text-anchor","end").text(function(t){return t.name}),l.append("text").attr("x",function(t){return o-c+4+s.voteTotalScale(t.votes)}).attr("y",9).attr("dy",".35em").attr("class","legend-values").text(function(t){return n.bbwNumberFormat(t.votes)})},stateRaces:function(t){return t.filter(function(t){return void 0===t.fipsCode})},setPartyVotes:function(t){var e=n.getPartyVotes(t);s.partyVotes=r.sortBy(e,function(t){return-t.votes}).slice(0,8)},partyVotes:void 0,setPartyVotesMax:function(){var t=a.max(s.partyVotes,function(t){return t.votes});s.voteTotalScale.domain([0,t])}},s=o;e.exports=o},{"./map-helpers.js":3,d3:"d3",underscore:"underscore"}],3:[function(t,e){var a,n=t("d3"),r=t("underscore"),o=t("topojson"),s=n.shuffle(["#FF00FF","#CC00FF","#00FF00","#FFFF00","#00FFFF","#CCFF00","#FFCC00","#00FF99","#6600CC","#FF0099","#006666","#006600","#CC9900","#6666FF"]),c=function(t,e){var a=Math.pow(10,3*Math.abs(4-e));return{scale:e>4?function(t){return t/a}:function(t){return t*a},symbol:t}},i=["p","n","µ","m","","k","m","b","t"].map(c);a={partyScale:n.scale.ordinal().range(s),getWinner:function(t){return r.max(t.race.candidates,function(t){return t.voteCount})},getParties:function(t){return r.uniq(r.flatten(t.map(function(t){return t.candidates.map(function(t){return t.party})})))},getPartyVotes:function(t){var e=u.getParties(t).map(function(t){return{name:t,votes:0}});return t.forEach(function(t){t.candidates.forEach(function(t){r.findWhere(e,{name:t.party}).votes+=t.voteCount})}),e},raceMap:n.map(),addRacesToUs:function(t,e){e.forEach(function(t){var e=t.fipsCode;u.raceMap.set(e,t)});var a=o.feature(t,t.objects.counties).features;return a.map(function(t){return t.race=u.raceMap.get(t.id.toString()),t})},getMaxVoteCount:function(t){return r.max(t.map(function(t){return 2e3==t.fipsCode?0:t.fipsCode?r.max(t.candidates.map(function(t){return t.voteCount})):0}))},setStateData:function(t){var e=o.feature(t,t.objects.states).features;return e.map(function(t){return 2===t.id&&(t.race=u.raceMap.get("2000")),t})},setFill:function(t){if(t.race&&t.race.candidates){var e=a.getWinner(t);return e.party?a.partyScale(e.party):"url(#crosshatch)"}return"white"},formatPrefixes:i,bbwNumberFormat:function(t){var e=Math.max(1,Math.min(1e12,t)),a=u.bbwFormatPrefix(e);return parseFloat(a.scale(t).toPrecision(3))+a.symbol},bbwFormatPrefix:function(t,e){var a=0;return t&&(0>t&&(t*=-1),e&&(t=n.round(t,d3_format_precision(t,e))),a=1+Math.floor(1e-12+Math.log(t)/Math.LN10),a=Math.max(-24,Math.min(24,3*Math.floor((0>=a?a+1:a-1)/3)))),u.formatPrefixes[4+a/3]}};var u=a;e.exports=a},{d3:"d3",topojson:"topojson",underscore:"underscore"}],4:[function(t,e){var a=t("d3");a.tip=t("./vendor/d3-tip")(a);var n=t("queue-async"),r=t("topojson"),o=t("underscore"),s=t("./map-helpers.js"),c=t("./legend.js");e.exports=function(){function t(t,n,i){function u(){F.attr("transform","translate("+a.event.translate+")scale("+a.event.scale+")")}races=i.races,h.domain([1,s.getMaxVoteCount(races)]);a.behavior.zoom().scaleExtent([.1,3]).on("zoom",u),a.behavior.drag().on("drag",function(){console.log("drag")});F.append("g").attr("class","counties").selectAll("path").data(s.addRacesToUs(n,races)).enter().append("path").attr("class","county").attr("d",g).style("fill",s.setFill).style("opacity",function(t){return t.race&&t.race.candidates?h(o.max(t.race.candidates.map(function(t){return t.voteCount}))):1}).on("mouseover",function(t){t.race&&v.show(t)}).on("mouseout",v.hide),F.append("g").attr("id","states").selectAll("path").data(s.setStateData(n,races)).enter().append("path").attr("d",g).attr("class",function(t){return 2===t.id?"state alaska":"state"});a.select(".alaska").style("fill",function(){return s.partyScale("Libertarian")}).on("mouseover",v.show).on("mouseout",v.hide);/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||(a.selectAll(".county").on("click",e),a.select(".alaska").on("click",e)),F.append("path").datum(r.mesh(n,n.objects.states,function(t,e){return t!==e})).attr("class","state-borders").attr("d",g),c.append(races),l()}function e(t){var e,a,n;if(t&&u!==t){var r=g.centroid(t);e=r[0],a=r[1],n=4,u=t}else e=d/2,a=f/2,n=1,u=null;F.selectAll("path").classed("active",u&&function(t){return t===u}),F.transition().duration(750).attr("transform","translate("+d/2+","+f/2+")scale("+n+")translate("+-e+","+-a+")").style("stroke-width",1.5/n+"px")}function i(t){var e=s.getWinner(t);return void 0===e.name?'<span class="winner-name">Vacant Seat</span>':'<span class="winner-name">'+e.name+'</span><span style="color:'+s.partyScale(e.party)+'">'+e.party+'</span> <span class="votes">'+a.format(",")(e.voteCount)+"</span>"}var u,l=function(){function t(){if(""!==e){a++;var t={method:"resize",windowId:e,height:document.documentElement.scrollHeight};window.parent.postMessage(n?JSON.stringify(t):t,"*")}}console.log("TEST");var e="",a=0,n=!1;return window.addEventListener("message",function(a){var r=a.data;r.substring&&(n=!0,r=JSON.parse(r)),"register"===r.method&&(e=r.windowId,t())},!1),t.windowId=function(){return e},t.resizeCount=function(){return a},t}(),d=parseInt(a.select("#map-container").style("width")),p=.6,f=d*p,m=1.2*d,v=a.tip().attr("class","d3-tip").html(i),h=(a.scale.linear().range([0,50]),a.scale.log().range([.35,1])),y=a.geo.albersUsa().scale(m).translate([d/2,f/2]),g=a.geo.path().projection(y),x=a.select("#map-container").append("svg").attr("width",d).attr("height",f).call(v);x.append("rect").attr("class","background").attr("width",d).attr("height",f).on("click",e);var F=x.append("g");n().defer(a.json,"data/us.json").defer(a.json,"data/updated_senate_by_county.json").await(t),a.select(self.frameElement).style("height",f+"px")}},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip",d3:"d3","queue-async":"queue-async",topojson:"topojson",underscore:"underscore"}]},{},[1]);