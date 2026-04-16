// Manual mock for webextension-polyfill used in Jest tests.
// moduleNameMapper in jest.config.js routes all imports to this file.

const browser = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({}),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({})
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn().mockResolvedValue(undefined)
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined)
    }
  }
};

export default browser;
