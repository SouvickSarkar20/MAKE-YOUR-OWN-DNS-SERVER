const dgram = require('node:dgram');
const dnsPacket = require('dns-packet');

const server = dgram.createSocket('udp4');

const db = {
    'souvick.dev': '1.2.3.4',
    'blog.souvick.dev': '4.5.6.7'
};

server.on('message', (msg, rinfo) => {
    try {
        const incomingReq = dnsPacket.decode(msg); // Decode the incoming DNS query
        const domainName = incomingReq.questions[0]?.name; // Extract the domain name
        const ipFromDb = db[domainName]; // Look up the domain in the database

        const response = {
            type: 'response',
            id: incomingReq.id,
            flags: dnsPacket.AUTHORITATIVE_ANSWER | dnsPacket.RECURSION_DESIRED | dnsPacket.RECURSION_AVAILABLE, // Proper flags
            questions: incomingReq.questions,
            answers: ipFromDb
                ? [
                      {
                          type: 'A', // IPv4 address
                          class: 'IN', // Internet class
                          name: domainName,
                          ttl: 300, // Time-to-live
                          data: ipFromDb // The IP from the database
                      }
                  ]
                : [] // No answer if the domain isn't in the database
        };

        const ans = dnsPacket.encode(response); // Encode the response

        server.send(ans, rinfo.port, rinfo.address, (err) => {
            if (err) console.error('Error sending response:', err);
        });
    } catch (error) {
        console.error('Error processing request:', error);
    }
});

server.bind(53, () => {
    console.log('DNS server is running on port 53');
});
