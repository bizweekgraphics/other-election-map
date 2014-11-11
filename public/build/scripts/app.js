!function t(e,a,n){function r(i,s){if(!a[i]){if(!e[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(o)return o(i,!0);var l=new Error("Cannot find module '"+i+"'");throw l.code="MODULE_NOT_FOUND",l}var u=a[i]={exports:{}};e[i][0].call(u.exports,function(t){var a=e[i][1][t];return r(a?a:t)},u,u.exports,t,e,a,n)}return a[i].exports}for(var o="function"==typeof require&&require,i=0;i<n.length;i++)r(n[i]);return r}({1:[function(t){t("./scripts/map.js")()},{"./scripts/map.js":4}],2:[function(t,e){var a=t("d3");a.tip=t("./vendor/d3-tip")(a);var n=t("./map-helpers.js"),r=t("underscore"),o=[{name:"Libertarian",description:"“The Libertarian Party is for all who don't want to push other people around and don't want to be pushed around themselves”",url:"http://www.lp.org/introduction/what-is-the-libertarian-party"},{name:"Independent",description:"Independent candidates are not affiliated with any political party"},{name:"Petitioning Candidate",description:"A candidate unaffiliated with a recognized party may get on the ballot by collecting enough signatures on a petition; rules vary by state."},{name:"Working Families",description:"“Working Families is a growing progressive political organization that fights for an economy that works for all of us, and a democracy in which every voice matters”",url:"http://workingfamilies.org/about-us/"},{name:"Green",description:"“Committed to environmentalism, non-violence, social justice and grassroots organizing, Greens are renewing democracy without the support of corporate donors”",url:"http://www.gp.org/what-we-believe/about-us"},{name:"Constitution",description:"“It is our goal to limit the federal government to its delegated, enumerated, Constitutional functions”",url:"http://www.constitutionparty.com/the-party/mission-statement/"},{name:"Independence",description:"“The Independence Party of Minnesota’s platform contains 10 ‘Core Values’, 6 ‘Principals’ and 47 ‘planks’”, including cannabis legalization, balanced budgeting, and campaign finance reform",url:"http://www.mnip.org/about-us/what-we-stand-for"},{name:"U.S. Taxpayers",description:"The U.S. Taxpayers Party is the Michigan affiliate of the National Constitution Party",url:"http://www.ustpm.org/"},{name:"Mountain Party",description:"The West Virginia affiliate of the national Green Party, with a special focus on opposing mountaintop removal coal mining",url:"http://www.mtparty.org/"},{name:"Pacific Green",description:"The Oregon affiliate of the national Green Party",url:"http://www.pacificgreens.org/"}],i={voteTotalScale:a.scale.linear().range([0,50]),append:function(t){s.setPartyVotes(s.stateRaces(t)),s.setPartyVotesMax();var e=parseInt(a.select("#map-container").style("width")),i=20;if(960>e)var c=e/2,l=0;else var l=100,c=e;var u=200,d=a.select("#legend-container").on("mouseleave",function(){console.log("mouseout"),a.selectAll(".county").style("fill",n.setFill),a.select(".alaska").style("fill",function(){return n.partyScale("Libertarian")})}).append("svg").attr("height",u).attr("width",e),p=a.tip().attr("class","d3-tip").html(function(t){return r.findWhere(o,{name:t.name}).description});d.call(p),d.append("text").attr("x",c-l).attr("y",(s.partyVotes.length+1)*i-175).attr("dy",".95em").style("text-anchor","middle").style("font-weight","bold").text("National vote total");var f=d.selectAll(".legend").data(s.partyVotes).enter().append("g").attr("class","legend").attr("transform",function(t,e){return"translate(0,"+(e*i+(s.partyVotes.length*i-125))+")"}).on("mouseover",function(t){a.select(".alaska").style("fill",function(e){return t.name===n.getWinner(e).party?n.partyScale("Libertarian"):"white"}),a.selectAll(".county").style("fill",function(e){return e.race&&e.race.candidates&&t.name===n.getWinner(e).party?n.partyScale(t.name):"white"}),p.show(t)}).on("mouseout",p.hide);f.append("rect").attr("x",c-l).attr("width",function(t){return s.voteTotalScale(t.votes)}).attr("height",i-2).style("fill",function(t){return n.partyScale(t.name)}),f.append("text").attr("x",c-l-4).attr("y",9).attr("dy",".35em").style("text-anchor","end").text(function(t){return t.name}),f.append("text").attr("x",function(t){return c-l+4+s.voteTotalScale(t.votes)}).attr("y",9).attr("dy",".35em").attr("class","legend-values").text(function(t){return n.bbwNumberFormat(t.votes)})},stateRaces:function(t){return t.filter(function(t){return void 0===t.fipsCode})},setPartyVotes:function(t){var e=n.getPartyVotes(t);s.partyVotes=r.sortBy(e,function(t){return-t.votes}).slice(0,8)},partyVotes:void 0,setPartyVotesMax:function(){var t=a.max(s.partyVotes,function(t){return t.votes});s.voteTotalScale.domain([0,t])}},s=i;e.exports=i},{"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip",d3:"d3",underscore:"underscore"}],3:[function(t,e){var a,n=t("d3"),r=t("underscore"),o=t("topojson"),i=n.shuffle(["#FF00FF","#CC00FF","#00FF00","#FFFF00","#00FFFF","#CCFF00","#FFCC00","#00FF99","#6600CC","#FF0099","#006666","#006600","#CC9900","#6666FF"]),s=function(t,e){var a=Math.pow(10,3*Math.abs(4-e));return{scale:e>4?function(t){return t/a}:function(t){return t*a},symbol:t}},c=["p","n","µ","m","","k","m","b","t"].map(s);a={partyScale:n.scale.ordinal().range(i),getWinner:function(t){return r.max(t.race.candidates,function(t){return t.voteCount})},getParties:function(t){return r.uniq(r.flatten(t.map(function(t){return t.candidates.map(function(t){return t.party})})))},getPartyVotes:function(t){var e=l.getParties(t).map(function(t){return{name:t,votes:0}});return t.forEach(function(t){t.candidates.forEach(function(t){r.findWhere(e,{name:t.party}).votes+=t.voteCount})}),e},raceMap:n.map(),addRacesToUs:function(t,e){e.forEach(function(t){var e=t.fipsCode;l.raceMap.set(e,t)});var a=o.feature(t,t.objects.counties).features;return a.map(function(t){return t.race=l.raceMap.get(t.id.toString()),t})},getMaxVoteCount:function(t){return r.max(t.map(function(t){return 2e3==t.fipsCode?0:t.fipsCode?r.max(t.candidates.map(function(t){return t.voteCount})):0}))},setStateData:function(t){var e=o.feature(t,t.objects.states).features;return e.map(function(t){return 2===t.id&&(t.race=l.raceMap.get("2000")),t})},setFill:function(t){if(t.race&&t.race.candidates){var e=a.getWinner(t);return e.party?a.partyScale(e.party):"url(#crosshatch)"}return"white"},formatPrefixes:c,bbwNumberFormat:function(t){var e=Math.max(1,Math.min(1e12,t)),a=l.bbwFormatPrefix(e);return parseFloat(a.scale(t).toPrecision(3))+a.symbol},bbwFormatPrefix:function(t,e){var a=0;return t&&(0>t&&(t*=-1),e&&(t=n.round(t,d3_format_precision(t,e))),a=1+Math.floor(1e-12+Math.log(t)/Math.LN10),a=Math.max(-24,Math.min(24,3*Math.floor((0>=a?a+1:a-1)/3)))),l.formatPrefixes[4+a/3]}};var l=a;e.exports=a},{d3:"d3",topojson:"topojson",underscore:"underscore"}],4:[function(t,e){var a=t("d3");a.tip=t("./vendor/d3-tip")(a);var n=t("queue-async"),r=t("topojson"),o=t("underscore"),i=t("./map-helpers.js"),s=t("./legend.js");e.exports=function(){function t(t,n,c){function l(){b.attr("transform","translate("+a.event.translate+")scale("+a.event.scale+")")}races=c.races,g.domain([1,i.getMaxVoteCount(races)]);a.behavior.zoom().scaleExtent([.1,3]).on("zoom",l),a.behavior.drag().on("drag",function(){console.log("drag")});b.append("g").attr("class","counties").selectAll("path").data(i.addRacesToUs(n,races)).enter().append("path").attr("class","county").attr("d",v).style("fill",i.setFill).style("opacity",function(t){return t.race&&t.race.candidates?g(o.max(t.race.candidates.map(function(t){return t.voteCount}))):1}).on("mouseover",function(t){t.race&&h.show(t)}).on("mouseout",h.hide),b.append("g").attr("id","states").selectAll("path").data(i.setStateData(n,races)).enter().append("path").attr("d",v).attr("class",function(t){return 2===t.id?"state alaska":"state"});a.select(".alaska").style("fill",function(){return i.partyScale("Libertarian")}).on("mouseover",h.show).on("mouseout",h.hide);/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||(a.selectAll(".county").on("click",e),a.select(".alaska").on("click",e)),b.append("path").datum(r.mesh(n,n.objects.states,function(t,e){return t!==e})).attr("class","state-borders").attr("d",v),s.append(races),u()}function e(t){var e,a,n;if(t&&l!==t){var r=v.centroid(t);e=r[0],a=r[1],n=4,l=t}else e=d/2,a=f/2,n=1,l=null;b.selectAll("path").classed("active",l&&function(t){return t===l}),b.transition().duration(750).attr("transform","translate("+d/2+","+f/2+")scale("+n+")translate("+-e+","+-a+")").style("stroke-width",1.5/n+"px")}function c(t){var e=i.getWinner(t);return void 0===e.name?'<span class="winner-name">Vacant Seat</span>':'<span class="winner-name">'+e.name+'</span><span style="color:'+i.partyScale(e.party)+'">'+e.party+'</span> <span class="votes">'+a.format(",")(e.voteCount)+" votes</span>"}var l,u=function(){function t(){if(""!==e){a++;var t={method:"resize",windowId:e,height:document.documentElement.scrollHeight};window.parent.postMessage(n?JSON.stringify(t):t,"*")}}console.log("TEST");var e="",a=0,n=!1;return window.addEventListener("message",function(a){var r=a.data;r.substring&&(n=!0,r=JSON.parse(r)),"register"===r.method&&(e=r.windowId,t())},!1),t.windowId=function(){return e},t.resizeCount=function(){return a},t}(),d=parseInt(a.select("#map-container").style("width")),p=.6,f=d*p,m=1.2*d,h=a.tip().attr("class","d3-tip").html(c),g=(a.scale.linear().range([0,50]),a.scale.log().range([.35,1])),y=a.geo.albersUsa().scale(m).translate([d/2,f/2]),v=a.geo.path().projection(y),w=a.select("#map-container").append("svg").attr("width",d).attr("height",f).call(h);w.append("rect").attr("class","background").attr("width",d).attr("height",f).on("click",e);var b=w.append("g");n().defer(a.json,"data/us.json").defer(a.json,"data/updated_senate_by_county.json").await(t),a.select(self.frameElement).style("height",f+"px")}},{"./legend.js":2,"./map-helpers.js":3,"./vendor/d3-tip":"./vendor/d3-tip",d3:"d3","queue-async":"queue-async",topojson:"topojson",underscore:"underscore"}]},{},[1]);