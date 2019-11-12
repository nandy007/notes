var https = require('https');
var forge = require('node-forge');
    forge.options.usePureJavaScript = true; 

var pki = forge.pki;
var keys = pki.rsa.generateKeyPair(2048);
var cert = pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear()+1);

var attrs = [
     {name:'commonName',value:'example.org'}
    ,{name:'countryName',value:'US'}
    ,{shortName:'ST',value:'Virginia'}
    ,{name:'localityName',value:'Blacksburg'}
    ,{name:'organizationName',value:'Test'}
    ,{shortName:'OU',value:'Test'}
];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey);

var pem_pkey = pki.privateKeyToPem(keys.privateKey);
var pem_cert = pki.certificateToPem(cert);

console.log(pem_pkey);
console.log(pem_cert);

const server = https.createServer( { 
    key:pem_pkey, 
    cert:pem_cert,
    requestCert: true,
}, (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('111111');
});

module.exports = {
    proxy: server,
    key: pki.publicKeyToPem(keys.publicKey)
};