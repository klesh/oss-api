const should = require('should');
const OssApi = require('../index');

describe('oss api', async function() {
  const keyId = process.env.OSS_API_KEY;
  const keySecret = process.env.OSS_API_SECRET;
  const endPoint = process.env.OSS_API_ENDPOINT || 'oss-cn-beijing.aliyuncs.com';
  const objectKey = process.env.OSS_API_OBJECT_KEY || 'oss-api-test/foo.bar';
  const bucketName = process.env.OSS_API_BUCKET;

  it('signature', async function() {
    const oss = new OssApi({
      keyId,
      keySecret,
      endPoint
    });

    const bucket = oss.useBucket(bucketName);
    await should(bucket.get('', {prefix: objectKey})).be.resolved();

    const objectText = 'this is a test';
    await bucket.put(objectKey, {
      body: objectText,
      headers: {
        'Content-Type': 'application/text',
        'x-oss-meta-foo': 'bar'
      }
    });

    let resp;
    resp = await bucket.get(objectKey);
    should(resp.body).be.exactly(objectText);

    resp = await bucket.head(objectKey);
    should(resp.headers['x-oss-meta-foo']).be.exactly('bar');

  });

  it('copy with meta', async function()  {
    const bucket = new OssApi({
      keyId,
      keySecret,
      endPoint,
      bucketName
    });

    const objectKey2 = `${objectKey}.2`;
    await bucket.put(objectKey2, {
      headers: {
        'x-oss-copy-source': `/${bucketName}/${objectKey}`,
        'x-oss-meta-bar': 'foo',
        'x-oss-metadata-directive': 'REPLACE'
      }
    });

    resp = await bucket.head(objectKey2);
    should(resp.headers['x-oss-meta-bar']).be.exactly('foo');
  })
});
