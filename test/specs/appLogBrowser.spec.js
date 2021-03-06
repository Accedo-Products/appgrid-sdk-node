require('../fakeNetworkCalls');
const factory = require('../../src/browser/index');
const apiHelper = require('../../src/apiHelper');

const nightOrDay = () => {
  const hour = new Date().getHours();
  // NOTE: These strings are expected by Accedo One
  switch (true) {
    case hour < 5 || hour > 17:
      return 'night';
    default:
      return 'day';
  }
};

// NOTE: This is simply a convenience/helper method for building a logEvent object.
const getLogEventOptions = message => {
  const networkErrorCode = '88002';
  const middlewareSourceCode = 'service-mw';
  const noneViewName = 'sdk_unit_test';
  const deviceType = 'desktop';
  return {
    message,
    errorCode: networkErrorCode,
    dim1: middlewareSourceCode,
    dim2: noneViewName,
    dim3: deviceType,
    dim4: nightOrDay(),
  };
};

const levels = ['debug', 'info', 'warn', 'error'];
const sendOneLogOfEach = client =>
  Promise.all(
    levels.map(level =>
      client.sendLog(level, getLogEventOptions('just a test'))
    )
  );

const makeClient = () =>
  factory({
    appKey: '56ea6a370db1bf032c9df5cb',
    deviceId: 'gregTestingSDK',
    // log(...args) { console.log(...args); },
  });

describe('Logging API, using a browser', () => {
  test('sendLog should trigger a call to getLogLevel', () => {
    const client = makeClient();
    const logLevelSpy = jest.spyOn(client, 'getLogLevel');
    return client
      .sendLog('error', getLogEventOptions('just a test'))
      .then(() => {
        expect(logLevelSpy.mock.calls.length).toBe(1);
        logLevelSpy.mockRestore();
      });
  });

  test('with `error` level, only one log will actually be posted as a batch', () => {
    const client = makeClient();

    apiHelper.__changeMaps({ '/application/log/level': { logLevel: 'error' } });

    return sendOneLogOfEach(client).then(allResults => {
      expect(allResults.filter(res => res.requestAvoided).length).toBe(3);
      expect(allResults.filter(res => res.requestQueued).length).toBe(1);
    });
  });

  test('with `warn` level, 2 logs will actually be posted as a batch', () => {
    const client = makeClient();

    apiHelper.__changeMaps({ '/application/log/level': { logLevel: 'warn' } });

    return sendOneLogOfEach(client).then(allResults => {
      expect(allResults.filter(res => res.requestAvoided).length).toBe(2);
      expect(allResults.filter(res => res.requestQueued).length).toBe(2);
    });
  });

  test('with `info` level, 3 logs will actually be posted as a batch', () => {
    const client = makeClient();

    apiHelper.__changeMaps({ '/application/log/level': { logLevel: 'info' } });

    return sendOneLogOfEach(client).then(allResults => {
      expect(allResults.filter(res => res.requestAvoided).length).toBe(1);
      expect(allResults.filter(res => res.requestQueued).length).toBe(3);
    });
  });

  test('with `debug` level, all 4 logs will actually be posted as a batch', () => {
    const client = makeClient();

    apiHelper.__changeMaps({ '/application/log/level': { logLevel: 'debug' } });

    return sendOneLogOfEach(client).then(allResults => {
      expect(allResults.filter(res => res.requestAvoided).length).toBe(0);
      expect(allResults.filter(res => res.requestQueued).length).toBe(4);
    });
  });

  test('with `off` level, no log will actually be posted', () => {
    const client = makeClient();

    apiHelper.__changeMaps({ '/application/log/level': { logLevel: 'off' } });

    return sendOneLogOfEach(client).then(allResults => {
      expect(allResults.filter(res => res.requestAvoided).length).toBe(4);
    });
  });
});
