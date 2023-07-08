const http = require('http');

export const getIPAddress = () => {
    return new Promise((resolve, reject) => {
        http.get('http://api.ipify.org', (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};
