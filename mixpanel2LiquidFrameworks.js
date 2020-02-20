#!/usr/local/bin/node

var axios = require('axios');
var fs = require('fs');
var readline = require('readline');
var utils = require('./utils');
var mpInfo = require('./mixpanel-info');
var packageInfo = require('./package-info').PackageInfo;
var jsforce = require('jsforce');
var api = require('./api/api');
var connection = require('./api/connection');
var _ = require('lodash');

var debug = false;

function printUsage() {
  console.log('\033[0;36m', 'Usage: mixpanel2LiquidFrameworks.js [year month] '  , '\033[0m' );
  console.log('\033[0;36m', '              /? : prints help'  , '\033[0m' );
  console.log('\033[0;36m', '    [year month] : imports data for the given year/month'  , '\033[0m' );
  console.log('\033[0;36m', 'If no parameters then the first and last day of the current month are used.'  , '\033[0m' );
}

let today = new Date();
let year = today.getFullYear();
let month = today.getMonth();
let day = today.getDate();

if (process.argv.length > 2) {

  if (process.argv.length !== 4) {
    printUsage();
    process.exit(0);
  }

  year = Number.parseInt(process.argv[2]);
  month = Number.parseInt(process.argv[3])-1;
}

// const from_date = new Date(year, month, 1).toISOString().substr(0, 10); // first day of month
// const from_date_X60 = new Date(year, month-1, 1).toISOString().substr(0, 10); // first day of month (X60 days / 2 months)
// const from_date_X90 = new Date(year, month-2, 1).toISOString().substr(0, 10); // first day of month (x90 days / 3 months)
// const to_date = new Date(year, month+1, 0).toISOString().substr(0, 10); // last day of month

let to_date = new Date(year, month, day).toISOString().substr(0, 10);
let from_date_30 = new Date(year, month, day - 30).toISOString().substr(0, 10);
let from_date_60 = new Date(year, month, day - 60).toISOString().substr(0, 10);
let from_date_90 = new Date(year, month, day - 90).toISOString().substr(0, 10);

let dateRange = {to_date, from: {from_date_30, from_date_60, from_date_90}};

// console.log(`%c>>>> process.argv `, `background-color: yellow;` , process.argv, year, month, from_date, to_date );
// process.exit(0);


const self = this;

// ############################################################################

return utils.getJqlInfo(dateRange)
  .then(jqlInfoResults => {
// console.log(`\x1B[0;33m`, `>>>> jqlInfoResults ` , JSON.stringify(jqlInfoResults, null, 2) , `\x1B[0m` );
  return connection.getConnection()
    .then(connection => {

      return Promise.all([api.getMixanelData(mpInfo, jqlInfoResults), api.getLicenseInfo(connection, packageInfo), api.getAccountData(connection)])
        .then(([mixpanelData, licenseResults, accountResults]) => {
          // console.log(`\x1B[0;36m`, `>>>> getMixanelData ` , mixpanelData , `\x1B[0m` );
          // console.log(`\x1B[0;33m`, `>>>> licenseResults ` , licenseResults , `\x1B[0m` );
          // console.log(`\x1B[0;36m`, `>>>> getMixanelData ` , JSON.stringify(mixpanelData) , `\x1B[0m` );

          // return getMonthlyActiveUsageDescription()
          //   .then(description => {
          //     console.log(`\x1B[0;32m`, `>>>> getMonthlyActiveUsageDescription ` , description.urls , `\x1B[0m` );
          //   });

          // const now = new Date().toISOString().substr(0, 10);
          let monthlyActiveUsageData = Object.keys(mixpanelData).reduce((hash, orgId) => {
            // console.log(`\x1B[0;36m`, `>>>> reduce `, orgId, `\x1B[0m` );
            // console.log(`\x1B[0;36m`, `>>>> reduce mixpanelData[${orgId}] `, orgId, mixpanelData[orgId]  , `\x1B[0m` );
            // console.log(`\x1B[0;36m`, `>>>> reduce licenseResults[${orgId.substr(0,15)}] `, orgId, licenseResults[orgId.substr(0,15)]  , `\x1B[0m` );
            // console.log(`\x1B[0;32m`, `>>>>  `  , `\x1B[0m` );

            if (licenseResults[orgId.substr(0,15)] && licenseResults[orgId.substr(0,15)].Account__c) {
              hash[orgId] = {
                Date__c: dateRange.to_date,
                ...mixpanelData[orgId],
                ...licenseResults[orgId.substr(0,15)]
              };
              if (!hash[orgId].Users__c) {
                hash[orgId].Users__c = 0;
              }
            }
            return hash;
          }, {});

          // console.log(`\x1B[0;32m`, `>>>> monthlyActiveUsageData ` , monthlyActiveUsageData , `\x1B[0m` );

          console.log(`\x1B[0;32m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
          console.log(`\x1B[0;32m`, `>>>> !!!!!!!     IMPORTING DATA       !!!!!!!! `  , `\x1B[0m` );
          console.log(`\x1B[0;32m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );

          const createRequests = Object.keys(monthlyActiveUsageData || {}).map(orgId => {
            // console.log(`\x1B[0;32m`, `>>>> Importing monthlyActiveUsageData: ` , monthlyActiveUsageData[orgId], orgId , `\x1B[0m` );
            // return Promise.resolve();
            return api.createMonthlyActiveUsageEntry(connection, monthlyActiveUsageData[orgId]);
          });

          return Promise.all(createRequests)
          // api.importMonthlyActiveUsageData(connection, monthlyActiveUsageData)
            .then(() => {
              console.log(`\x1B[0;32m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
              console.log(`\x1B[0;32m`, `>>>> !!!!!!!           DONE           !!!!!!!! `  , `\x1B[0m` );
              console.log(`\x1B[0;32m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );

// const dataWithAcct = Object.entries(monthlyActiveUsageData).filter(x => x[1].Account__c).map(x => x[1]);
// const dataWithOutAcct = Object.entries(monthlyActiveUsageData).filter(x => !x[1].Account__c).map(x => x[1]);
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: with Account__c` , dataWithAcct.length, dataWithAcct , `\x1B[0m` );
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: without Account__c` , dataWithOutAcct.length, dataWithOutAcct , `\x1B[0m` );
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: ` , Object.keys(monthlyActiveUsageData).length, monthlyActiveUsageData , `\x1B[0m` );
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: ` , Object.keys(monthlyActiveUsageData).length, `\x1B[0m` );

// const dataWithAcct2 = Object.entries(monthlyActiveUsageData).filter(x => x[1].Account__c).map(x => x[0]);
// const dataWithOutAcct2 = Object.entries(monthlyActiveUsageData).filter(x => !x[1].Account__c).map(x => x[0]);
// const dataWithLmaAcct = Object.entries(monthlyActiveUsageData).filter(x => x[1].sfLma__Account__c).map(x => x[0]);
// const dataWithoutLmaAcct = Object.entries(monthlyActiveUsageData).filter(x => !x[1].sfLma__Account__c).map(x => x[0]);

// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: with LMA Account__c` , dataWithLmaAcct.length , `\x1B[0m` );
// // console.log(`\x1B[0;32m`, dataWithLmaAcct.sort().forEach(x => console.log(x)), `\x1B[0m` );
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: without LMA Account__c` , dataWithoutLmaAcct.length , `\x1B[0m` );
// // console.log(`\x1B[0;32m`, dataWithoutLmaAcct.sort().forEach(x => console.log(x)), `\x1B[0m` );
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: with Account__c` , dataWithAcct2.length , `\x1B[0m` );
// // console.log(`\x1B[0;32m`, dataWithAcct2.sort().forEach(x => console.log(x)), `\x1B[0m` );
// console.log(`\x1B[0;32m`, `>>>>  monthlyActiveUsageData: without Account__c` , dataWithOutAcct2.length , `\x1B[0m` );
// // console.log(`\x1B[0;32m`, dataWithAcct2.sort().forEach(x => console.log(x)), `\x1B[0m` );


/*
############################################################################
** Validation query
############################################################################

SELECT Id, Account__c, CreatedDate,
CPQ_30_Day_Event_Count__c, CPQ_60_Day_Event_Count__c, CPQ_90_Day_Event_Count__c, CPQ_License__c,
EAM_30_Day_Users__c, EAM_60_Day_Users__c, EAM_90_Day_Users__c, EAM_Licensed_Seats__c, EAM_Used_Licenses__c,
Scheduling_30_Day_Users__c, Scheduling_60_Day_Users__c, Scheduling_90_Day_Users__c, Scheduling_Licensed_Seats__c, Scheduling_Used_Licenses__c,
Timecards_30_Day_Users__c, Timecards_60_Day_Users__c, Timecards_90_Day_Users__c, Timecards_Licensed_Seats__c, Timecards_Used_Licenses__c,
Tkt_30_Day_Users__c, Tkt_60_Day_Users__c, Tkt_90_Day_Users__c, Tkt_Licensed_Seats__c, Tkt_Used_Licenses__c,
Users__c, X60_Day_Active_Users__c, X90_Day_Active_Users__c

FROM Monthly_Active_Usage__c
*/
            });
        });
    });
});


