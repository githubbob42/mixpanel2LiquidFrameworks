const axios = require('axios');
const mpInfo = require('../mixpanel-info');
const utils = require('../utils');
const packageInfo = require('../package-info').PackageInfo;

const MOCK_licenseData = require('./mock/license-data.mock').LicenseData;
const MOCK_mixpanelData = require('./mock/mixpanel-data.mock').MixanelData;
const MOCK_accountData = require('./mock/account-data.mock').AccountData;

const useMocks = false; // if true, use data from `./api/mock` folder instead of MP/SFDC API
const showData = false; // if true, show data that was retrieved (very verbose)
const saveData = !useMocks && true; // if true (and useMocks=false), will save the data retrive via the API in the `./data` folder

exports.getMixanelData = function(mpInfo, jqlInfoResults) {

  if (useMocks) {
    console.log(`\x1B[0;31m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
    console.log(`\x1B[0;31m`, `>>>> !!!!!!!   MOCK DATA BEING USED   !!!!!!!! `  , `\x1B[0m` );
    console.log(`\x1B[0;31m`, `>>>> !!!!!!!       getMixanelData     !!!!!!!! `  , `\x1B[0m` );
    console.log(`\x1B[0;31m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
    console.log(`\x1B[0;32m`, `>>>> mixpanel orgs: `, Object.keys(MOCK_mixpanelData.mock).length, Object.keys(MOCK_mixpanelData.mock)  , `\x1B[0m` );
    return Promise.resolve(MOCK_mixpanelData.mock)
  }

  // MixPanel has an API Rate Limit of 5 concurrent requests so we need to run these in serial
  const getMixanelDataRequests = (jqlInfoResults || []).flat().map(jqlInfo => {
    return function getMixanelDataRequest() {
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
        console.log(`\x1B[0;31m`, `>>>> ERROR: getMixanelDataRequest ` , jqlInfo.fieldName, error.response && error.response.data && error.response.data.error, jqlInfo.jql , `\x1B[0m` );
      });
    }
  });

  console.log(`\x1B[0;32m`, `>>>> Retrieving Mixpanel Data `  , `\x1B[0m` );

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
  }, Promise.resolve())
  .then(data => {
    if (showData) {
      console.log(`\x1B[0;36m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> !!!!!!!       getMixanelData     !!!!!!!! `  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> mixpanel orgs: `, Object.keys(data).length, Object.keys(data)  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> mixpanel data: `, data  , `\x1B[0m` );
    }
    if (saveData) utils.writeDataFile('mixpanel-data', data);
    return data;
  })
  .catch(e => {
    return Promise.resolve(MOCK_mixpanelData.mock);
  })

};

exports.getMonthlyActiveUsageDescription = function(connection) {

  console.log(`\x1B[0;32m`, `>>>>  `, instanceUrl, version, accessToken  , `\x1B[0m` );

  var opts = {
    retry: 1,
    retryDelay: 500,
    method: 'GET',
    url: `${connection.instanceUrl}/services/data/v43.0/sobjects/Monthly_Active_Usage__c/describe`,
    jsonp: false,
    contentType : 'application/json',
    headers: {
      'Accept': 'application/json',
      'ContentType': 'application/json',
      'Authorization': `Bearer ${connection.accessToken}`
    }
  };

  // console.log(`\x1B[0;36m`, `>>>> opts ` , opts , `\x1B[0m` );
  return axios(opts)
    .then(function(response) {
      return response && response.data && response.data;
    })
    .catch(function(error) {
      console.log('\x1B[0;31m', '>>>> ERROR: getMonthlyActiveUsageDescription ' , error.response && error.response.data , '\x1B[0m' );
      // console.log('\x1B[0;31m', '>>>> data ' , sobjectType, JSON.stringify(data, null, 2) , '\x1B[0m' );
      throw error.response && error.response.data && error.response.data[0] || error;
    });
}

exports.queryLicenseInfo = function(connection, packageInfo) {

  if (useMocks) {
    return Promise.resolve(MOCK_licenseData.mock.records)
      .then(licenses => {
        return licenses.reduce((hash, data) => {
          hash[data.sfLma__Subscriber_Org_ID__c] = {...data};
          return hash;
        }, {});
      })
      .then(results => {
        console.log(`\x1B[0;31m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
        console.log(`\x1B[0;31m`, `>>>> !!!!!!!   MOCK DATA BEING USED   !!!!!!!! `  , `\x1B[0m` );
        console.log(`\x1B[0;31m`, `>>>> !!!!!!!     queryLicenseInfo     !!!!!!!! `  , `\x1B[0m` );
        console.log(`\x1B[0;31m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
        console.log(`\x1B[0;32m`, `>>>> license orgs: `, Object.keys(results).length, Object.keys(results)  , `\x1B[0m` );
        return MOCK_licenseData.mock.records;
      })
  }

  const soql = [`SELECT sfLma__Account__c, sfLma__Subscriber_Org_ID__c, sfLma__Package__c, Pkg_Name__c, sfLma__Licensed_Seats__c, sfLma__Used_Licenses__c`,
                `FROM sfLma__License__c`,
                `WHERE sfLma__Package__c IN ('${Object.values(packageInfo).join("', '")}')`,
                `AND IsDeleted = false`,
                `AND Attrited_Customer__c = false`,
                `AND sfLma__Is_Sandbox__c = false`,
                `AND sfLma__License_Status__c = 'Active'`,
                `AND sfLma__Subscriber_Org_Is_Sandbox__c = false`,
                `AND sfLma__Expiration__c > TODAY`,
                `AND Account_Type__c = 'Customer'`,
                `AND sfLma__Subscriber_Org_ID__c != null`,
                `order by sfLma__Subscriber_Org_ID__c`];

  var opts = {
    retry: 1,
    retryDelay: 500,
    method: 'GET',
    url: `${connection.instanceUrl}/services/data/v${connection.version}/query?q=${soql.join(' ')}`,
    jsonp: false,
    contentType : 'application/json',
    headers: {
      'Accept': 'application/json',
      'ContentType': 'application/json',
      'Authorization': `Bearer ${connection.accessToken}`
    }
  };

  console.log(`\x1B[0;32m`, `>>>> Retrieving License Data `  , `\x1B[0m` );

  return axios(opts)
    .then(function(response) {
      return response && response.data && response.data.records || [];
    })
    .catch(function(error) {
      console.log('\x1B[0;31m', '>>>> ERROR: getLicenseInfo ' , error.response && error.response.data, opts , '\x1B[0m' );
      throw error.response && error.response.data && error.response.data[0] || error;
    });

}

exports.getLicenseInfo = function(connection, packageInfo) {
  return exports.queryLicenseInfo(connection, packageInfo)
    .then(licenseResults => {

      if (saveData) utils.writeDataFile('license-data.raw', licenseResults);

      const packageInfoEntries = Object.entries(packageInfo);

      return licenseResults.reduce((hash, data) => {
        const [pkgName, pkgId] = packageInfoEntries.find(piEntry => piEntry[1] == data.sfLma__Package__c)

        if (pkgId === 'a0k30000003xIvlAAE') { // FieldFX CPQ
          hash[data.sfLma__Subscriber_Org_ID__c] = {
            ...hash[data.sfLma__Subscriber_Org_ID__c],
            Account__c: data.sfLma__Account__c,
            CPQ_License__c: true
          };
        }
        else {
          hash[data.sfLma__Subscriber_Org_ID__c] = {
            ...hash[data.sfLma__Subscriber_Org_ID__c],
            Account__c: data.sfLma__Account__c,
            [`${pkgName}_Licensed_Seats__c`]: parseInt(data.sfLma__Licensed_Seats__c),
            [`${pkgName}_Used_Licenses__c`]: data.sfLma__Used_Licenses__c
          };
        }
        return hash;
      }, {});
  })
  .then(data => {
    if (showData) {
      console.log(`\x1B[0;36m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> !!!!!!       queryLicenseInfo     !!!!!!! `  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> license orgs: `, Object.keys(data).length, Object.keys(data)  , `\x1B[0m` );
      console.log(`\x1B[0;36m`, `>>>> license data: `, data  , `\x1B[0m` );
    }
    if (saveData) utils.writeDataFile('license-data', data);
    return data;
  });
};

// ############################################################################

exports.createMonthlyActiveUsageEntry = function(connection, monthlyActiveUsageData) {
  return connection
    .sobject('Monthly_Active_Usage__c')
    .create(monthlyActiveUsageData)
    .then(result => {
      if (!result.success) {
        console.log(`\x1B[0;31m`, `>>>>  ERROR: createMonthlyActiveUsageEntry`, result.errors  , `\x1B[0m` );
        return;
      }
      return result.id;
    })
    .catch(err => {
      console.log(`\x1B[0;31m`, `>>>> ERROR: createMonthlyActiveUsageEntry ` , monthlyActiveUsageData, err , `\x1B[0m` );
    })
}

