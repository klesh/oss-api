const should = require('should');
const OssApi = require('../index');

describe('oss api', async function() {

  it('signature', async function() {
    const oss = new OssApi({
      keyId: process.env.OSS_API_KEY,
      keySecret: process.env.OSS_API_SECRET,
      endPoint: process.env.OSS_API_ENDPOINT
    });

    const bucket = oss.useBucket(process.env.OSS_API_BUCKET);
    await should(bucket.get()).be.resolved();
  });

});
