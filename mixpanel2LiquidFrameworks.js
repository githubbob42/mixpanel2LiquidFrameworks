#!/usr/local/bin/node

var axios = require('axios');
var fs = require('fs');
var readline = require('readline');
var utils = require('./utils');
var mpInfo = require('./mixpanel-info');

var debug = false;

function printUsage() {
  console.log('\033[0;36m', 'Usage: mixpanel2LiquidFrameworks.js [year month] '  , '\033[0m' );
  console.log('\033[0;36m', '              /? : prints help'  , '\033[0m' );
  console.log('\033[0;36m', '    [year month] : imports data for the given year/month'  , '\033[0m' );
  console.log('\033[0;36m', 'If no parameters then the first and last day of the current month are used.'  , '\033[0m' );
}

const today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

if (process.argv.length > 2) {

  if (process.argv.length !== 4) {
    printUsage();
    process.exit(0);
  }

  year = Number.parseInt(process.argv[2]);
  month = Number.parseInt(process.argv[3])-1;
}

const from_date = new Date(year, month, 1).toISOString().substr(0, 10); // first day of month
const to_date = new Date(year, month+1, 0).toISOString().substr(0, 10); // last day of month

console.log(`%c>>>> process.argv `, `background-color: yellow;` , process.argv, year, month, from_date, to_date );
// process.exit(0);


function getJqlInfo() {
  return fs.readdirAsync('./JQL')
    .then(function(files) {
      const proms = files.map(file => {
        return loadFile(`JQL/${file}`)
          .then(result => {
            let {fieldName, jql} = result;
            jql = jql.replace('@@params', JSON.stringify({from_date, to_date}));
            return {fieldName, jql};
          });
      });

      return Promise.all(proms);
    });
}


function loadFile(file) {
  return new Promise(function(resolve) {
    var lineReader = readline.createInterface({
      input: fs.createReadStream(file)
    });

    var lines = [];
    lineReader.on('line', function (line) {
        lines.push(line);
    }).on('close', () => {
      const fieldName = lines.shift().split(':')[1].trim();
      resolve({fieldName, jql: lines.filter(line => !~line.indexOf('//')).join(' ')});
    });
  });
}

function getMixanelData(jqlInfoResults) {
  const getMixanelDataRequests = (jqlInfoResults || []).map(jqlInfo => {
    return function() {
      return axios({
        url: "https://mixpanel.com/api/2.0/jql",
        data: {script: `${jqlInfo.jql}`},
        withCredentials: true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Access-Control-Allow-Credentials": 'true',
          "Access-Control-Allow-Origin": "*",
        },
        auth: {
          username: mpInfo.backOfficeApi,
        }
      })
      .then(results => {
        return {data: results && results.data, jqlInfo};
      })
      .catch(error => {
        console.log(`\x1B[0;31m`, `>>>> err ` , jqlInfo.fieldName, error.response && error.response.data && error.response.data.error , `\x1B[0m` );
      });
    }
  });

  let combined = {}; // we need this outside to accumulate the results across each request (reduce inside of a reduce)
  return getMixanelDataRequests.reduce(function(current, next) {
    return current.then(function() {
      return next().then(function(result) {
        return result.data.reduce((hash, data) => {
          if (data.key[0]) {
            hash[data.key[0]] = {...hash[data.key[0]], [result.jqlInfo.fieldName]: data.value};
          }
          return hash;
        }, combined);
      });
    });
  }, Promise.resolve());
}

getJqlInfo()
  .then(jqlInfoResults => {
    return getMixanelData(jqlInfoResults)
    .then(results => {
      console.log(`\x1B[0;36m`, `>>>> getMixanelData ` , results , `\x1B[0m` );
      // console.log(`\x1B[0;36m`, `>>>> getMixanelData ` , JSON.stringify(results) , `\x1B[0m` );
    })
  });

