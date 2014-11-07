!function t(e,n,r){function a(s,c){if(!n[s]){if(!e[s]){var i="function"==typeof require&&require;if(!c&&i)return i(s,!0);if(o)return o(s,!0);var u=new Error("Cannot find module '"+s+"'");throw u.code="MODULE_NOT_FOUND",u}var l=n[s]={exports:{}};e[s][0].call(l.exports,function(t){var n=e[s][1][t];return a(n?n:t)},l,l.exports,t,e,n,r)}return n[s].exports}for(var o="function"==typeof require&&require,s=0;s<r.length;s++)a(r[s]);return a}({1:[function(t){t("./scripts/map.js")()},{"./scripts/map.js":2}],2:[function(t,e){var n=t("d3");n.tip=t("./vendor/d3-tip")(n);var r=t("queue-async"),a=t("topojson"),o=t("underscore");e.exports=function(){function t(t,r,s){races=s.races,q.append("g").attr("class","counties").selectAll("path").data(l(r,races)).enter().append("path").attr("class","county").attr("d",M).style("fill",e).on("mouseover",function(t){t.race&&x.show(t)}).on("mouseout",x.hide).on("click",c),q.append("g").attr("id","states").selectAll("path").data(p(r,races)).enter().append("path").attr("d",M).attr("class",function(t){return 2===t.id?"state alaska":"state"}),n.select(".alaska").style("fill",function(t){return j(t)}).style("fill",e).on("mouseover",x.show).on("mouseout",x.hide).on("click",c),q.append("path").datum(a.mesh(r,r.objects.states,function(t,e){return t!==e})).attr("class","state-borders").attr("d",M);var i=f(races);i=o.sortBy(i,function(t){return-t.votes}).slice(0,8),b.domain([0,n.max(i,function(t){return t.votes})]);var u=100,d=20;k.append("text").attr("x",F-u).attr("y",g-(i.length+1)*d).attr("dy",".35em").style("text-anchor","middle").style("font-weight","bold").text("National vote total");var m=k.selectAll(".legend").data(i).enter().append("g").attr("class","legend").attr("transform",function(t,e){return"translate(0,"+(e*d+(g-i.length*d))+")"});m.append("rect").attr("x",F-u).attr("width",function(t){return b(t.votes)}).attr("height",d-2).style("fill",function(t){return j(t.name)}),m.append("text").attr("x",F-u-4).attr("y",9).attr("dy",".35em").style("text-anchor","end").text(function(t){return t.name}),m.append("text").attr("x",function(t){return F-u+4+b(t.votes)}).attr("y",9).attr("dy",".35em").style("fill","#ccc").text(function(t){return h(t.votes)}),console.timeEnd("toph")}function e(t){if(t.race&&t.race.candidates){var e=s(t);return e.party?j(e.party):"url(#crosshatch)"}return"white"}function s(t){return o.max(t.race.candidates,function(t){return t.voteCount})}function c(t){var e,n,r;if(t&&y!==t){var a=M.centroid(t);e=a[0],n=a[1],r=4,y=t}else e=F/2,n=g/2,r=1,y=null;q.selectAll("path").classed("active",y&&function(t){return t===y}),q.transition().duration(750).attr("transform","translate("+F/2+","+g/2+")scale("+r+")translate("+-e+","+-n+")").style("stroke-width",1.5/r+"px")}function i(t){var e=s(t);return void 0===e.name?'<span class="winner-name">Vacant Seat</span>':'<span class="winner-name">'+e.name+'</span><span style="color:'+j(e.party)+'">'+e.party+"</span>"}function u(t,e){for(var n,r=0;"undefined"==typeof n&&r<t.length;r++){var a=t[r];a.fipsCode===e&&(t.splice(r,1),n=a)}return{race:n,races:t}}function l(t,e){var n=a.feature(t,t.objects.counties).features;return n.map(function(t){var n=u(e,t.id.toString());return t.race=n.race,e=n.races,t})}function p(t,e){var n=a.feature(t,t.objects.states).features;return n.map(function(t){return 2===t.id&&(t.race=u(e,"2000")),t})}function d(t){return o.uniq(o.flatten(t.map(function(t){return t.candidates.map(function(t){return t.party})})))}function f(t){return partyVotes=d(t).map(function(t){return{name:t,votes:0}}),t.forEach(function(t){t.candidates.forEach(function(t){o.findWhere(partyVotes,{name:t.party}).votes+=t.voteCount})}),partyVotes}function h(t){var e=Math.max(1,Math.min(1e12,t)),n=m(e);return parseFloat(n.scale(t).toPrecision(3))+n.symbol}function m(t,e){var r=0;return t&&(0>t&&(t*=-1),e&&(t=n.round(t,d3_format_precision(t,e))),r=1+Math.floor(1e-12+Math.log(t)/Math.LN10),r=Math.max(-24,Math.min(24,3*Math.floor((0>=r?r+1:r-1)/3)))),_[4+r/3]}function v(t,e){var n=Math.pow(10,3*Math.abs(4-e));return{scale:e>4?function(t){return t/n}:function(t){return t*n},symbol:t}}console.time("toph");var y,F=960,g=650,x=n.tip().attr("class","d3-tip").html(i),w=["#FF00FF","#CC00FF","#00FF00","#FFFF00","#00FFFF","#CCFF00","#FFCC00","#00FF99","#6600CC","#FF0099","#006666","#006600"],j=n.scale.ordinal().range(n.shuffle(w)),b=n.scale.linear().range([0,50]),C=n.geo.albersUsa().scale(1280).translate([F/2,g/2]),M=n.geo.path().projection(C),k=n.select("#map-container").append("svg").attr("width",F).attr("height",g).call(x);k.append("rect").attr("class","background").attr("width",F).attr("height",g).on("click",c);var q=k.append("g");r().defer(n.json,"data/us.json").defer(n.json,"data/updated_senate_by_county.json").await(t);var _=["p","n","µ","m","","k","m","b","t"].map(v);n.select(self.frameElement).style("height",g+"px")}},{"./vendor/d3-tip":"./vendor/d3-tip",d3:"d3","queue-async":"queue-async",topojson:"topojson",underscore:"underscore"}]},{},[1]);