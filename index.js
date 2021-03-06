const RestClient = require('bblib/rest-client');
const _ = require('lodash');
const crypto = require('crypto');
const debug = require('debug')('oss-api')
const {resolve} = require('url');

/**
 * @example
 * ```
 * const oss = new OssApi({
 *   keyId: '...',
 *   keySecret: '...',
 *   endPoint: 'http://oss-cn-beijing.aliyuncs.com'
 * });
 *
 * const bucket = oss.useBucket('foo');
 *
 * const page1 = await bucket.get('/');
 * ```
 */
class OssApi extends RestClient {
  constructor(opts) {
    const {keyId, keySecret, endPoint, ...rest} = opts;
    if (!keyId)
      throw new Error('opts.keyId is required');
    if (!keySecret)
      throw new Error('opts.keySecret is required');
    if (!endPoint)
      throw new Error('opts.endPoint is required');

    super(_.defaultsDeep(rest, {defaults: {baseUrl: endPoint}}));

    this.opts = opts;
  }

  buildResource(path, qs) {
    let url = path;
    if (qs) {
      const query = _(qs)
        .map((v, k) => [k, v])
        .filter(([k, v]) => _.isBoolean(v) ? v : true)
        .sortBy(([k]) => k)
        .map(([k, v]) => {
          if (_.isBoolean(v)) {
            return encodeURIComponent(k);
          }
          return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
        })
        .join('&');
      if (query)
        url += '?' + query;
    }
    return url;
  }

  beforeSend(options) {
    const {method, headers} = _.defaults(options, {method: 'GET', headers: {}});
    headers['Date'] = new Date().toGMTString();

    const builder = [
      method,
      headers['Content-MD5'] || '',
      headers['Content-Type'] || '',
      headers['Date']
    ];

    // canonical oss headers
    _(headers)
      .map((v, k) => [k, v])
      .filter(([k]) => k.startsWith('x-oss-'))
      .sortBy(([k]) => k)
      .each(([k, v]) => {
        builder.push(`${k}:${v}`);
      });

    const {bucketName, keyId, keySecret} = this.opts;
    if (bucketName) {
      let url = `/${bucketName}/`;
      if (options.url) {
        url += options.url;
      }
      options.url = url;
    }
    if (method.toUpperCase() !== 'GET') {
      options.url = this.buildResource(options.url, options.qs);
      delete options.qs;
    }

    builder.push(options.url);
    const text = builder.join('\n');
    debug('StringToSign: ', text);
    const signature = crypto.createHmac('sha1', keySecret).update(text).digest('base64');
    headers['Authorization'] = `OSS ${keyId}:${signature}`;
  }

  useBucket(bucketName) {
    return new OssApi({...this.opts, bucketName});
  }
}

module.exports = OssApi;
