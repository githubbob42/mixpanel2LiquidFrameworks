const jsforce = require('jsforce');
const axios = require('axios');
const loginData = require('../credentials-prod');
// const loginData = require('../credentials-tomSB');

const apiVersion = 'v45.0';
const PRODUCTION = 'https://login.salesforce.com';
const SANDBOX = 'https://test.salesforce.com';

exports.getConnection = () => {
  var connection = new jsforce.Connection({
    // you can change loginUrl to connect to sandbox or prerelease env.
    // loginUrl : PRODUCTION
    // loginUrl : SANDBOX
    loginUrl: loginData.login_url
  });
  return connection.login(loginData.username, loginData.password)
    .then(() => {
      // if (buildNumber === 'DEV') saveConnection(connection, username);
      return Promise.resolve(connection);
    });

};
