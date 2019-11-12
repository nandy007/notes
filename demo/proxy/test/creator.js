var fs = require('fs'), path = require('path');
var forge = require('node-forge');
    forge.options.usePureJavaScript = true; 

var pki = forge.pki;


const caCertContent = fs.readFileSync(path.resolve(__dirname, '../cert/cacert.pem'));
const caKey = pki.decryptRsaPrivateKey(fs.readFileSync(path.resolve(__dirname, '../cert/cakey.pem')));
const caCert = pki.certificateFromPem(caCertContent);

module.exports = function(domain){
    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    // cert.serialNumber = '01';
    // cert.validity.notBefore = new Date();
    // cert.validity.notAfter = new Date();
    // cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear()+1);

    cert.serialNumber = `${new Date().getTime()}`;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(
        cert.validity.notBefore.getFullYear() - 1,
    );
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
        cert.validity.notAfter.getFullYear() + 1,
    );

    var attrs = [
        {name:'commonName',value:domain}
        ,{name:'countryName',value:'US'}
        ,{shortName:'ST',value:'Virginia'}
        ,{name:'localityName',value:'Blacksburg'}
        ,{name:'organizationName',value:'Test'}
        ,{shortName:'OU',value:'Test'}
    ];
    // cert.setSubject(attrs);
    // cert.setIssuer(attrs);
    // cert.sign(keys.privateKey);

    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(caCert.subject.attributes);

    cert.setExtensions([
        {
            name: 'basicConstraints',
            critical: true,
            cA: false,
        },
        {
            name: 'keyUsage',
            critical: true,
            digitalSignature: true,
            contentCommitment: true,
            keyEncipherment: true,
            dataEncipherment: true,
            keyAgreement: true,
            keyCertSign: true,
            cRLSign: true,
            encipherOnly: true,
            decipherOnly: true,
        },
        {
            name: 'subjectAltName',
            altNames: [
                {
                    type: 2,
                    value: domain,
                },
            ],
        },
        {
            name: 'subjectKeyIdentifier',
        },
        {
            name: 'extKeyUsage',
            serverAuth: true,
            clientAuth: true,
            codeSigning: true,
            emailProtection: true,
            timeStamping: true,
        },
        {
            name: 'authorityKeyIdentifier',
        },
    ]);

    cert.sign(caKey, forge.md.sha256.create());

    var pem_privateKey = pki.privateKeyToPem(keys.privateKey);
    var pem_publicKey = pki.publicKeyToPem(keys.publicKey);
    var pem_cert = pki.certificateToPem(cert);

    return {
        caCertContent,
        cert: pem_cert,
        privateKey: pem_privateKey,
        publicKey: pem_publicKey
    };
};