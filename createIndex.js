// create Azure Search index
// call: node createIndex.js --indexFile=./index.json --serviceName=jekyllblog --indexName=posts --adminKey=ABC

var fs = require('fs'),
    https = require('https'),
    argv = require('yargs').argv;

var indexFile = argv.indexFile,
    serviceName = argv.serviceName,
    indexName = argv.indexName,
    adminKey = argv.adminKey;
    
var hasError = false;

if (indexFile === undefined || indexFile.length === 0) {
    console.error('ERROR: Specify the path to the .json file containing index definition using the indexFile argument');
    hasError = true;
}

if (serviceName === undefined || serviceName.length === 0) {
    console.error('ERROR: Specify the name of your Azure Search instance using the serviceName argument');
    hasError = true;
}

if (indexName === undefined || indexName.length === 0) {
    console.error('ERROR: Specify the name of of your index using the indexName argument');
    hasError = true;
}

if (adminKey === undefined || adminKey.length === 0) {
    console.error('ERROR: Specify your Azure Search instance admin key using the adminKey argument');
    hasError = true;
}

if (hasError) {
    console.log();
    console.log('Sample usage:');
    console.log('node createIndex.js --indexFile=./index.json --serviceName=jekyllblog --indexName=posts --adminKey=ABC');
    process.exit();
}

var index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
index.name = indexName;

var requestString = JSON.stringify(index);

var request = https.request({
      host: serviceName + '.search.windows.net',
      path: '/indexes?api-version=2015-02-28',
      method: 'POST',
      headers: {
          'Connection': 'Close',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestString),
          'api-key': adminKey
      },
      secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
      ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
      honorCipherOrder: true
  }, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log('Response: ' + chunk);
    });
    res.on('end', () => {
        console.log('Done');
    })
}).on('error', (e) => {
    console.log(e);
});

request.write(requestString);
request.end();