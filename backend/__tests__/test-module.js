//push bill to redis

const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')

let output = {
    amount:"1",
    type:"credit"
}
publisher.publish('payments',JSON.stringify(output))
// const redis = require('redis');
// const publisher = redis.createClient();

// (async () => {
//
//     const article = {
//         id: '123456',
//         name: 'Using Redis Pub/Sub with Node.js',
//         blog: 'Logrocket Blog',
//     };
//
//     await publisher.connect();
//
//     await publisher.publish('article', JSON.stringify(article));
// })();