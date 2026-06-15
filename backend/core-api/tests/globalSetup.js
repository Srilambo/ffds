const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_TEST_URI = mongoServer.getUri();
  global.__MONGO_SERVER__ = mongoServer;
};
