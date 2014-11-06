var fs = require('fs');
var _  = require('underscore');
var d3 = require('d3');
var topojson = require('topojson');

var us = require('./../us.json');
var races = require('./../updated_senate_by_county.json').races



// function addRacesToUS(us, races) {
//   us.objects.counties = us.objects.counties.geometries.map(function(county) {
//     var fipsCode = county.id.toString();
//     race = getReportingUnitFromFipsCode(races, fipsCode)
//     if(race) {county.race = race;};

//     return county
//   })

//   return us
// }

function getReportingUnitFromFipsCode(races, fipsCode) {
  return races.filter(function(race) {
    return race.reportingUnits[0].fipsCode === fipsCode
  })
} 

function writeFile(json) {
  fs.writeFile('../us_and_races.json', JSON.stringify(json), function(err) {
    err ? console.log(err) : console.log("JSON SAVED")
  })
}


function addRacesToUs(us, races) {
  var features = topojson.feature(us, us.objects.counties).features

  features = features.map(function(feature) {
    feature.race = getReportingUnitFromFipsCode(races, feature.id.toString())
    return feature
  })

  writeFile(features)
}

addRacesToUs(us, races)
