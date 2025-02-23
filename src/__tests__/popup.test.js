// Mock popup.js module
jest.mock('../js/popup', () => {
  const actual = jest.requireActual('../js/popup');
  return {
    ...actual,
    initializePopup: jest.fn()
  };
});

describe('Popup Interface', () => {
  let messageListener;
  let startBtn;
  let stopBtn;
  let statusDiv;
  let progressFill;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div class="header">
        <h1 class="title">Chase-Catcher</h1>
        <p class="subtitle">Automate Your Rewards</p>
      </div>
      <div class="button-container">
        <button id="startBtn">Start Catching</button>
        <button id="stopBtn" style="display: none;">Stop Catching</button>
      </div>
      <div class="status">
        <p id="status">Ready to catch rewards!</p>
      </div>
      <div class="progress-container">
        <div id="progressBar">
          <div id="progressFill" style="width: 0%"></div>
        </div>
      </div>
    `;

    // Get DOM elements
    startBtn = document.getElementById('startBtn');
    stopBtn = document.getElementById('stopBtn');
    statusDiv = document.getElementById('status');
    progressFill = document.getElementById('progressFill');
    
    // Reset chrome mocks
    chrome.tabs.query.mockReset();
    chrome.tabs.sendMessage.mockReset();
    chrome.runtime.onMessage.addListener.mockReset();

    // Set up message listener capture
    chrome.runtime.onMessage.addListener.mockImplementation((fn) => {
      messageListener = fn;
    });

    // Initialize popup
    require('../js/popup');

    // Trigger message listener setup
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  });

  describe('Initial State', () => {
    it('should show correct initial UI state', () => {
      expect(document.querySelector('.title').textContent).toBe('Chase-Catcher');
      expect(document.querySelector('.subtitle').textContent).toBe('Automate Your Rewards');
      expect(statusDiv.textContent).toBe('Ready to catch rewards!');
      expect(startBtn.style.display).toBe('');
      expect(stopBtn.style.display).toBe('none');
    });
  });

  describe('Button Functionality', () => {
    it('should handle start button click', () => {
      const mockTab = { id: 1, url: 'https://creditcards.chase.com/rewards-credit-cards/rewards/offers' };
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([mockTab]);
      });

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        callback({ success: true });
      });

      startBtn.click();
      
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );
      expect(startBtn.style.display).toBe('none');
      expect(stopBtn.style.display).toBe('block');
    });

    it('should handle invalid URLs', () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com' }]);
      });

      startBtn.click();
      expect(statusDiv.textContent).toBe('❌ Error: Please open Chase offers page');
      expect(startBtn.style.display).toBe('');
      expect(stopBtn.style.display).toBe('none');
    });
  });

  describe('Progress Updates', () => {
    it('should update progress bar', () => {
      const mockMessage = { action: 'updateProgress', progress: 50 };
      messageListener(mockMessage, {}, () => {});
      expect(progressFill.style.width).toBe('50%');
    });

    it('should handle completion message', () => {
      const mockMessage = { action: 'huntingComplete' };
      messageListener(mockMessage, {}, () => {});
      expect(statusDiv.textContent).toBe('✨ Great job! All rewards caught!');
      expect(startBtn.style.display).toBe('block');
      expect(stopBtn.style.display).toBe('none');
    });

    it('should handle error message', () => {
      const mockMessage = { action: 'error', error: 'Test error' };
      messageListener(mockMessage, {}, () => {});
      expect(statusDiv.textContent).toBe('❌ Error: Test error');
      expect(startBtn.style.display).toBe('block');
      expect(stopBtn.style.display).toBe('none');
    });
  });

  describe('Error Handling', () => {
    it('should handle message sending errors', () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://creditcards.chase.com/rewards-credit-cards/rewards/offers' }]);
      });

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        callback({ error: 'Failed to send message' });
      });

      startBtn.click();
      expect(statusDiv.textContent).toBe('❌ Error: Please navigate to the Chase offers page');
      expect(startBtn.style.display).toBe('');
      expect(stopBtn.style.display).toBe('none');
    });

    it('should handle no active tab', () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([]);
      });

      startBtn.click();
      expect(statusDiv.textContent).toBe('❌ Error: Please open Chase offers page');
      expect(startBtn.style.display).toBe('');
      expect(stopBtn.style.display).toBe('none');
    });
  });
});
