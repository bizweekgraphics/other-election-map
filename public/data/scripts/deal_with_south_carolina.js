var fs = require('fs');
var _ = require('underscore');

var scFips = require('./../south_carolina_fips.json');
var scVotes = require('./../south_carolina_hutto.json');
var races = require('./../updated_senate_by_county.json').races;
var scCounties = require('./../south_carolina_with_fips.json');

function countyNameToFips(fips, counties) {
  return counties.map(function(county) {
    county.fipsCode = findCounty(fips, county).fipsCode
    return county
  })
}

function findCounty(fips, county) {
  return _.findWhere(fips, {county: county.countyName.toUpperCase()})
}

function writeFile(json, filePath) {
  fs.writeFile(filePath, JSON.stringify(json, undefined, 2), function(err) {
    err ? console.log(err) : console.log("JSON SAVED")
  })
}


function fixSC(scCounties) {
  var updatedRaces = races;
  scCounties.forEach(function(county) {
    updatedRaces = updatedRaces.map(function(race) {
      var matchingCounty = _.findWhere(scCounties, {fipsCode: parseInt(race.fipsCode)})
      console.log(matchingCounty);
      if(matchingCounty) {
        race.candidates = race.candidates.map(function(candidate) {
          if(candidate.name === "Brad Hutto") {
            candidate.voteCount = matchingCounty["Brad Hutto"];
          }

          return candidate
        })
      }
      return race
    })
  })
  return {races: updatedRaces}
}


// writeFile(countyNameToFips(scFips, scVotes), '../south_carolina_with_fips.json')
writeFile(fixSC(scCounties), '../updated_senate_by_county_sc_fix.json')