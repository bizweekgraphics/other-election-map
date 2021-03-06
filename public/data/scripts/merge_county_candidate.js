var fs = require('fs')

var racesArray = require('./../senate_by_county.json').races;
var candidatesArray = require('./../candidates.json').candidates;
var partyArray = require('./../party_abbrev.json').parties;

function addPartyToCandidates(racesArray, candidates) {
  return racesArray.map(function(race) {
    race.data = race.reportingUnits.map(function(reportingUnit) {
      reportingUnit.candidates = reportingUnit.candidates.map(function(candidate) {
        var matchingCandidate = candidatesArray.filter(function(candidateObj) {
          return candidateObj.polID === candidate.polID
        })
 
        var partyAbbrv = matchingCandidate[0].party;

        if(partyAbbrv === 'Una') {
          partyAbbrv = 'Ind'
        }

        if(partyAbbrv !== "Dem" && partyAbbrv !== "GOP") {
          candidate.party = getPartyNameFromAbbrv(partyAbbrv);

          var candidateName = [candidate.first, candidate.last].join(' ')

          var strippedCandidate = {name: candidateName, polId: candidate.polID, voteCount: candidate.voteCount, party: candidate.party}
          return strippedCandidate        
        }
      })

      reportingUnit.candidates = reportingUnit.candidates.filter(function(candidate) {
        return candidate
      })
      var strippedReportingUnit = {fipsCode: reportingUnit.fipsCode, candidates: reportingUnit.candidates}
      return strippedReportingUnit
    })
    // var strippedRace = {reportingUnits: race.reportingUnits}
    var strippedRace = {fipsCode: race.reportingUnits[0].fipsCode, candidates: race.reportingUnits[0].candidates}
    return strippedRace
  })
}

function getPartyNameFromAbbrv(abbrv) {
  var filteredParty = partyArray.filter(function(party) {
    return party.abbreviation === abbrv.toUpperCase()
  })
  return filteredParty[0].name
}

function writeFile(json) {
  fs.writeFile('../updated_senate_by_county.json', JSON.stringify(json), function(err) {
    err ? console.log(err) : console.log("JSON SAVED")
  })
}

function mergeMatches(races) {
  var newRaces = []

  races.forEach(function(race, idx) {
    var matchingRace = newRaces.filter(function(r) {
      return r.fipsCode && r.fipsCode === race.fipsCode
    })

    if(!matchingRace[0]) {
      var raceMatch = races.filter(function(r, i) {
        return r.fipsCode && r.fipsCode === race.fipsCode && i !== idx
      })[0]

      if(raceMatch) {
        race.candidates = race.candidates.concat(raceMatch.candidates)
      }

      newRaces.push(race)
    } 
  })


  return newRaces
}

var races = addPartyToCandidates(racesArray, candidatesArray);
var mergedRaces = mergeMatches(races);

writeFile({races: mergedRaces});