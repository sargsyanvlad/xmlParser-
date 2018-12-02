/* eslint-disable camelcase, no-console */
const fs = require('fs');
const xml2js = require('xml2js');
const builder = require('xmlbuilder');

const parser = new xml2js.Parser();

const OddsMatrixData = {
  OddsMatrixData: {
    Sports: {
      League: [],
    },
  },
};
let leagueArr = [];

function createXMLFromJson(JSONData) {
  const xml = builder.create(JSONData.OddsMatrixData, { encoding: 'utf-8' });
  fs.writeFile('/tmp/test.xml', xml,
    (error) => {
      if (error) {
        console.log(error);
      } else {
        console.log("The file was saved! in --> '/tmp/test.xml' directory }");
      }
    });
}

function transformLeagueData(data) {
  const {
    MatchOdds, sortName, StartDate, ParticipantNames, leagueName,
  } = data;
  const LeagueData = {
    '@name': leagueName,
    '@sortName': sortName,
    Match: {
      Participants: { Participant: [] },
      StartDate: {
        '@type': 'GMT',
        '#text': StartDate,
      },
      MatchOdds: [],
    },
  };

  ParticipantNames.forEach((name) => {
    LeagueData.Match.Participants.Participant.push({ '@name': name });
  });

  LeagueData.Match.MatchOdds.push(...MatchOdds);
  return LeagueData;
}

function transformOddsData(gameObject) {
  try {
    const odds = [];
    for (let i = 0; i < gameObject.result.length; i++) {
      const OddsObject = { '@outcome': '', '#text': '' };
      OddsObject['@outcome'] = gameObject.result[i].$.name;
      OddsObject['#text'] = gameObject.result[i].$.odd;
      odds.push(OddsObject);
    }
    return odds;
  } catch (err) {
    console.log('--TransformXml-->transformOddsData', err);
    return err;
  }
}

function TransformXml(leagues) {
  try {
    let sortName;
    let StartDate;
    let ParticipantNames;

    for (let i = 0; i < leagues.length; i++) {
      const leagueName = leagues[i].$.name;
      for (let j = 0; j < leagues[i].event.length; j++) {
        const MatchOdds = [];// Transform Odds
        leagueArr = [];
        sortName = leagues[i].event[j].$.name;
        StartDate = leagues[i].event[j].$.eventdate;
        ParticipantNames = leagues[i].event[j].$.name.split(' - ', 2);

        for (let k = 0; k < leagues[i].event[j].games.length; k++) {
          const BettingOffer = { BettingOffer: { '@type': '', Odds: [] } };
          BettingOffer.BettingOffer['@type'] = leagues[i].event[j].games[k].$.name;
          const transformedOddsObject = transformOddsData(leagues[i].event[j].games[k]);
          BettingOffer.BettingOffer.Odds.push(...transformedOddsObject);
          MatchOdds.push(BettingOffer);
        }

        const LeagueData = transformLeagueData({
          MatchOdds, sortName, StartDate, ParticipantNames, leagueName,
        });
        leagueArr.push(LeagueData);
      }
      OddsMatrixData.OddsMatrixData.Sports.League.push(leagueArr);
    }
    createXMLFromJson(OddsMatrixData);
  } catch (err) {
    console.log('--TransformXml-->err', err);
    return err;
  }
}

function parseXML(data) {
  try {
    let parsedXmlLeagues;
    parser.parseString(data, (err, result) => {
      parsedXmlLeagues = result.leaguelist.league;
      TransformXml(parsedXmlLeagues); // NOTE Pass ParsedXml To Transformer Function
    });
  } catch (err) {
    console.log('--parseXML-->transformOddsData', err);
    return err;
  }
}

// NOTE READ XML FROM Directory
fs.readFile(`${__dirname}/response.xml`, (err, data) => {
  if (err) throw err;
  parseXML(data);
});
