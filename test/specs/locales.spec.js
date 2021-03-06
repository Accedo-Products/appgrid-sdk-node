const factory = require('../../src/node/index');

describe('Locales API Tests', () => {
  const client = factory({
    appKey: '56ea6a370db1bf032c9df5cb',
    deviceId: 'gregTestingSDK',
    // log: (...args) => console.log(...args),
  });

  test('getAvailableLocales should at return an array of locales', () => {
    return client.getAvailableLocales().then(res => {
      expect(typeof res).toBe('object');
      expect(res).toHaveProperty('locales');
      expect(Array.isArray(res.locales)).toBe(true);
      expect(res.locales[0]).toHaveProperty('code');
      expect(res.locales[0]).toHaveProperty('displayName');
    });
  });
});
