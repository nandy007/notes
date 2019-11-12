const https = require('https');
const http = require('http');
const net = require('net');
const { URL } = require('url');
var tls = require('tls'), fs = require('fs'), path = require('path');

// 创建 HTTP 隧道代理。
// const proxy = http.createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('1111');
// });

const creator = require('./creator');

const serverConfig = {
  privateKey: fs.readFileSync(path.join(__dirname, '../cert/server-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../cert/server-cert.pem'))
};
const clientConfig = {
  privateKey: fs.readFileSync(path.join(__dirname, '../cert/client-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../cert/client-cert.pem'))
};

const ca = fs.readFileSync(path.join(__dirname, '../cert/ca-cert.pem'));
function createProxyServer(){
  const proxy = https.createServer( { 
    key: serverConfig.privateKey, 
    cert: serverConfig.cert,
    ca: [ca],
    requestCert: true,
    // rejectUnauthorized: false
  }, (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('111111');
  });
  
  proxy.on('connect', (req, cltSocket, head) => {
      console.log(333333)
    // 连接到原始服务器。
    const { port, hostname } = new URL(`http://${req.url}`);
    const srvSocket = net.connect(port || 80, hostname, () => {
      cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                      'Proxy-agent: Node.js-Proxy\r\n' +
                      '\r\n');
      srvSocket.write(head);
      srvSocket.pipe(cltSocket);
      cltSocket.pipe(srvSocket);
    });
  });
  
  // 代理正在运行。
  proxy.listen(1337, '127.0.0.1', () => {
    
    createHttpRequest();
    
  });
}


function createHttpRequest(){
  // 向隧道代理发出请求。
  const options = {
    port: 1337,
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



createProxyServer();

