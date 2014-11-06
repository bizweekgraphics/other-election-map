var fs = require('fs');
var _  = require('underscore');

var us = require('./us.json');
var races = require('./updated_senate_by_county.json').races



function addRacesToUS(us, races) {
  us.objects.counties.geometries = us.objects.counties.geometries.map(function(county) {
    var fipsCode = county.id.toString();
    race = getReportingUnitFromFipsCode(races, fipsCode)
    if(race) {county.race = race;};

    return county
  })

  return us
}

function getReportingUnitFromFipsCode(races, fipsCode) {
  return races.filter(function(race) {
    return race.reportingUnits[0].fipsCode === fipsCode
  })
} 

function writeFile(json) {
  fs.writeFile('us_and_races.json', JSON.stringify(json, undefined, 2), function(err) {
    err ? console.log(err) : console.log("JSON SAVED")
  })
}

writeFile(addRacesToUS(us, races))
