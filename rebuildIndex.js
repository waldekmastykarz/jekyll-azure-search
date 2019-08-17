// Rebuild Azure Search index
// call: node rebuildIndex.js --postsDir=./export.json --serviceName=jekyllblog --indexName=posts --adminKey=ABC --blogUrl=https://jekyllblog.hosting.io

var fs = require('fs'),
    path = require('path'),
    https = require('https'),
    yaml = require('yaml'),
    removeMd = require('remove-markdown'),
    argv = require('yargs').argv;

var postsDir = argv.postsDir,
    serviceName = argv.serviceName,
    indexName = argv.indexName,
    adminKey = argv.adminKey,
    blogUrl = argv.blogUrl;
    
var hasError = false;

if (postsDir === undefined || postsDir.length === 0) {
    console.error('ERROR: Specify the path to the Jekyll posts directory using the postsDir argument');
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

if (blogUrl === undefined || blogUrl.length === 0) {
    console.error('ERROR: Specify the URL of your blog (without the trailing slash) using the blogUrl argument');
    hasError = true;
}

if (hasError) {
    console.log();
    console.log('Sample usage:');
    console.log('node rebuildIndex.js --postsDir=./_posts --serviceName=jekyllblog --indexName=posts --adminKey=ABC --blogUrl=https://jekyllblog.hosting.io');
    process.exit();
}

var posts = [];
var postFiles = fs.readdirSync(postsDir);
postFiles.forEach(f => {
    var postFile = fs.readFileSync(path.resolve(postsDir, f), 'utf-8');
    var contents = postFile.match(/---(.*?)---\s*(.*)/s);
    var frontMatter = yaml.parse(contents[1]);
    var body = contents[2];
    posts.push({
        '@search.action': 'mergeOrUpload',
        id: frontMatter.slug,
        title: frontMatter.title,
        content: removeMd(body.replace(/<[^>]+>/g, ' ')),
        url: blogUrl + '/' + frontMatter.slug + '/',
        pubDate: new Date(frontMatter.date)
    });
});

var requestData = {
    value: posts
};

var requestString = JSON.stringify(requestData);

var request = https.request({
      host: serviceName + '.search.windows.net',
      path: '/indexes/' + indexName + '/docs/index?api-version=2015-02-28',
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