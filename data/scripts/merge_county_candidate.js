var fs = require('fs')

var racesArray = require('./../senate_by_county.json').races;
var candidatesArray = require('./../candidates.json').candidates


function addPartyToCandidates(racesArray, candidates) {
  return racesArray.map(function(race) {
    race.reportingUnits.map(function(reportingUnit) {
      reportingUnit.candidates = reportingUnit.candidates.map(function(candidate) {
        var matchingCandidate = candidatesArray.filter(function(candidateObj) {
          return candidateObj.candidateID === candidate.candidateID 
        })
        candidate.party = matchingCandidate[0].party;
        if(candidate.party !== "Dem" && candidate.party !== "GOP") {
          return candidate        
        }
      })
      reportingUnit.candidates = reportingUnit.candidates.filter(function(candidate) {
        return candidate
      })
      return reportingUnit
    })
    return race
  })
}

function writeFile(json) {
  fs.writeFile('../updated_senate_by_county.json', JSON.stringify(json, undefined, 2), function(err) {
    err ? console.log(err) : console.log("JSON SAVED")
  })
}

var races = addPartyToCandidates(racesArray, candidatesArray)
writeFile({races: races});