var axios = require('axios');
var fs = require('fs');
var readline = require('readline');


// finally polyfill
(function () {
  if (typeof Promise.prototype.finally === 'function') {
    return;
  }
  Promise.prototype.finally = function (fn) {
    return this
      .then(value => this.constructor.resolve(fn()).then(() => value))
      .catch(reason => this.constructor.resolve(fn()).then(() => { throw reason }))
  }

  if (!Array.prototype.flat) {
    Object.defineProperty(Array.prototype, 'flat', {
      configurable: true,
      value: function flat () {
        var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

        return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
          if (Array.isArray(cur)) {
            acc.push.apply(acc, flat.call(cur, depth - 1));
          } else {
            acc.push(cur);
          }

          return acc;
        }, []) : Array.prototype.slice.call(this);
      },
      writable: true
    });
  }
})();


exports.getDaysInMonth = function(month,year) {
 return new Date(year, month, 0).getDate();
};

exports.getTimestamp = function() {
  var date = new Date();
  var hour = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var milliseconds = date.getMilliseconds();

  return '[' +
         ((hour < 10) ? '0' + hour: hour) +
         ':' +
         ((minutes < 10) ? '0' + minutes: minutes) +
         ':' +
         ((seconds < 10) ? '0' + seconds: seconds) +
         '.' +
         ('00' + milliseconds).slice(-3) +
         '] ';
};

exports.pad = function(n) {
  return (n < 10) ? ("0" + n).slice(-2) : n;
}

exports.showProgress = function(idx) {
  process.stdout.write((idx+1).toString());
  for(var x=0; x < (idx+1).toString().length; x++) {
    process.stdout.write("\b");
  }
};

// ############################################################################
// promisify methods
// ############################################################################

// make promise version of fs.readFile()
fs.readFileAsync = function(filename) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, 'utf8', function(err, data){
      if (err)
        reject(err);
      else
        resolve(data);
    });
  });
};

// make promise version of fs.readDir()
fs.readdirAsync = function(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, 'utf8', function(err, items) {
      // console.log(items);
      if (err)
        reject(err);
      else
        resolve(items);
    });
  });
};

// ############################################################################

exports.loadFile = function(file) {
  return new Promise(function(resolve) {
    var lineReader = readline.createInterface({
      input: fs.createReadStream(file)
    });

    var lines = [];
    lineReader.on('line', function (line) {
      lines.push(line);
    }).on('close', () => {
      resolve(lines);
    });
  });
};


exports.getJqlInfo = function(dateRange) {
  return fs.readdirAsync('./JQL')
    .then(function(files) {
      const proms = files.map(file => {
        return exports.loadFile(`JQL/${file}`)
          .then(lines => {

            console.log("Working on file " + file);
            lines.shift(); // remove warning line
            const fieldline = lines.shift();
            lines.shift();  // remove existing "let __params__ = {...}" line and thrown away (will be added back later)

            let fieldInfo = fieldline.split(':');
            fieldInfo.shift(); // remove "FIELDNAMES"
            fieldInfo = JSON.parse(fieldInfo.join(':').trim().replace(/'/g, '"'));

            let jql = lines.filter(line => !~line.indexOf('//')); // remove any comments (jql will be concatenated in to one-line string)

            return Object.keys(fieldInfo).map(fieldName => {
              let jqlFormatted = [...jql];
              const params = `let __params__ = ${JSON.stringify({'from_date': dateRange.from[fieldInfo[fieldName]], 'to_date': dateRange.to_date})};`
              jqlFormatted.unshift(params);
              // console.log(`\x1B[0;36m`, `>>>> jqlFormatted ` , jqlFormatted.join('\n') , `\x1B[0m` );
              return {fieldName, jql: jqlFormatted.join(' ')};
            });

          }).catch(err =>{
            console.log("Error reading file " + file);
          });
      });

      return Promise.all(proms)
        .then(results => {
          return results.filter(x => x); // filter out bad files.  I.e. .DS_Store, etc
        })
    });
};

exports.writeDataFile = function(filename, contents) {

  var filepath = './data/' + filename + '.json';
  console.log('\x1B[0;36m', ' - Writing datafiles:', filepath  , '\x1B[0m' );
  try {
    fs.writeFileSync(filepath, JSON.stringify(contents, null, 2));
  }
  catch(e) {
    console.log(`\x1B[0;31m`, `>>>> Erroor writing data file: ${filepath} `, e , contents , `\x1B[0m` );
  }
  return contents;
};
