// Mock Chrome Extension API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  }
};

// Set up DOM environment
document.body.innerHTML = `
  <div id="app">
    <button id="startButton">Start</button>
    <div id="status">Ready</div>
    <div id="progress">0%</div>
  </div>
`;
