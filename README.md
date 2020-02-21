[![MixPanel 2 LiquidFrameworks](http://www.liquidframeworks.com/sites/default/files/LiqFra_header_logo.png)](http://www.liquidframeworks.com/)
# mixpanel2LiquidFrameworks

## Getting Started
Install Dependencies

```term
$ npm install
```

## Importing Mixpanel Data into LiquidFrameworks org

### Migrate data for Today back 30|60|90 days
```term
./mixpanel2LiquidFrameworks.js
```

### Options

Inside of the module `api/api.js`
```js
const useMocks = false; // if true, use data from `./api/mock` folder instead of MP/SFDC API
const showData = false; // if true, show data that was retrieved (very verbose)
const saveData = !useMocks && true; // if true (and useMocks=false), will save the data retrived via the API in the `./data` folder
```

### Dry Run

To peform a dry-run, set `dryRun` to `true` (in `mixpanel2LiquidFrameworks.js`, line 23'ish)

```js
const dryRun = true;
```

This will perform all of the API calls (unless `useMocks=true`) and instead of inserting the data into the LiquidFrameworks org, it will output each record that it would import.

NOTE: MixPanel has an API Limit of 60 calls per hour (and 5 concurrent requests at a time) so if you need to run this multiple times, it might to wise to run it once with `saveData=true`, update the `mock` files, then subsequent runs with `useMocks=true`.


### Debugging

Uncomment any of the numerous `console.log` statements to output data at different stages of processing.


