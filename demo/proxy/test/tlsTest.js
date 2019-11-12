// https://www.iteye.com/blog/looksgood-1870239

var tls = require('tls'), fs = require('fs'), path = require('path'), https = require('https'), net = require('net');

const creator = require('./creator');

var serverPort = 7000;

const serverConfig = {
    privateKey: fs.readFileSync(path.join(__dirname, '../cert/server-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../cert/server-cert.pem'))
};
const clientConfig = {
    privateKey: fs.readFileSync(path.join(__dirname, '../cert/client-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../cert/client-cert.pem'))
};

const ca = fs.readFileSync(path.join(__dirname, '../cert/ca-cert.pem'));

function createTlsServer() {


    var options = {
        key: serverConfig.privateKey,
        cert: serverConfig.cert,

        // This is necessary only if using the client certificate authentication.  
        // requestCert: true,

        // rejectUnauthorized: true,
        //    passphrase:'test',  
        // This is necessary only if the client uses the self-signed certificate.  
        ca: [ca]
    };

    var server = tls.createServer(options, function (cleartextStream) {

        console.log('server connected',
            cleartextStream.authorized ? 'authorized' : 'unauthorized');
        // cleartextStream.write('this message is come from server!');
        // cleartextStream.setEncoding('utf8');
        // cleartextStream.pipe(cleartextStream);
        cleartextStream.on('data', function (data) {
            console.log(new String(data));
            const srvSocket = net.connect(80, 'nodejs.cn', () => {
                cleartextStream.write('HTTP/1.1 200 Connection Established\r\n' +
                                'Proxy-agent: Node.js-Proxy\r\n' +
                                '\r\n');
                // srvSocket.write(head);
                srvSocket.pipe(cleartextStream);
                cleartextStream.pipe(srvSocket);
            });
        });
    });
    server.listen(serverPort, function () {
        console.log('server bound');

        createHttpRequest();
    });
}


function createTlsClient() {

    var options = {
        // These are necessary only if using the client certificate authentication  
        key: clientConfig.privateKey,
        cert: clientConfig.cert,

        rejectUnauthorized: true,
        // This is necessary only if the server uses the self-signed certificate  
        ca: [ca],
    };

    var cleartextStream = tls.connect(serverPort, '127.0.0.1', options, function () {
        console.log('client connected',
            cleartextStream.authorized ? 'authorized' : 'unauthorized');
        cleartextStream.setEncoding('utf8');
        if (!cleartextStream.authorized) {
            console.log('cert auth error: ', cleartextStream.authorizationError);
        }
        //    console.log(cleartextStream.getPeerCertificate());  
    });
    cleartextStream.setEncoding('utf8');
    cleartextStream.on('data', function (data) {
        console.log(data);
        cleartextStream.write('Hello,this message is come from client!');
        cleartextStream.end();
    });
    cleartextStream.on('end', function () {
        console.log('disconnected');
    });
    cleartextStream.on('error', function (exception) {
        console.log(exception);
    });
}

function createHttpRequest(){
    // 向隧道代理发出请求。
    const options = {
      port: serverPort,
      host: '127.0.0.1',
      method: 'CONNECT',
      path: 'nodejs.cn:80',
      key: clientConfig.privateKey, 
      cert: clientConfig.cert,
      ca: [ca],
      // rejectUnauthorized: false,
      // agent: false,
      // strictSSL: false
    };
  
    const req = https.request(options);
    req.write('this a message')
    req.end();
  
    req.on('connect', (res, socket, head) => {
      console.log('已连接');
  
      // 通过 HTTP 隧道发出请求。
      socket.write('GET / HTTP/1.1\r\n' +
                   'Host: nodejs.cn:80\r\n' +
                   'Connection: close\r\n' +
                   '\r\n');
      socket.on('data', (chunk) => {
        console.log(chunk.toString());
      });
      socket.on('end', () => {
      //   proxy.close();
      });
    });
  }


createTlsServer();