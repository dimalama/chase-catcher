describe('Popup Interface', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div class="header">
        <h1 class="title">Chase-Catcher</h1>
        <p class="subtitle">Automate Your Rewards</p>
      </div>
      <div class="button-container">
        <button id="startButton">Start Catching</button>
      </div>
      <div class="status">
        <p id="statusText">Ready to catch rewards!</p>
      </div>
      <div class="progress-container">
        <div id="progressBar">
          <div id="progressFill"></div>
        </div>
      </div>
    `;
    
    // Reset chrome mocks
    chrome.tabs.query.mockClear();
    chrome.tabs.sendMessage.mockClear();
    chrome.runtime.onMessage.addListener.mockClear();
  });

  describe('Initial State', () => {
    it('should show correct initial UI state', () => {
      expect(document.querySelector('.title').textContent).toBe('Chase-Catcher');
      expect(document.querySelector('.subtitle').textContent).toBe('Automate Your Rewards');
      expect(document.getElementById('statusText').textContent).toBe('Ready to catch rewards!');
      expect(document.getElementById('startButton').disabled).toBe(false);
    });
  });

  describe('Button Functionality', () => {
    it('should handle start button click', () => {
      const startButton = document.getElementById('startButton');
      const mockTab = { id: 1, url: 'https://creditcards.chase.com/rewards-credit-cards/rewards/offers' };
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([mockTab]);
      });

      startButton.click();
      
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        mockTab.id,
        { action: 'startHunting' },
        expect.any(Function)
      );
    });

    it('should disable button while processing', () => {
      const startButton = document.getElementById('startButton');
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://creditcards.chase.com/rewards-credit-cards/rewards/offers' }]);
      });

      startButton.click();
      expect(startButton.disabled).toBe(true);
    });

    it('should handle invalid URLs', () => {
      const startButton = document.getElementById('startButton');
      const statusText = document.getElementById('statusText');
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com' }]);
      });

      startButton.click();
      
      expect(statusText.textContent).toContain('Please navigate to Chase');
      expect(startButton.disabled).toBe(false);
    });
  });

  describe('Progress Updates', () => {
    it('should update progress bar', () => {
      const progressFill = document.getElementById('progressFill');
      const mockMessage = { action: 'updateProgress', progress: 50 };
      
      // Simulate message from content script
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(mockMessage);
      
      expect(progressFill.style.width).toBe('50%');
    });

    it('should handle completion message', () => {
      const statusText = document.getElementById('statusText');
      const startButton = document.getElementById('startButton');
      const mockMessage = { action: 'huntingComplete' };
      
      // Simulate message from content script
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(mockMessage);
      
      expect(statusText.textContent).toContain('Complete');
      expect(startButton.disabled).toBe(false);
    });

    it('should handle error message', () => {
      const statusText = document.getElementById('statusText');
      const startButton = document.getElementById('startButton');
      const mockMessage = { action: 'error', error: 'Test error' };
      
      // Simulate message from content script
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(mockMessage);
      
      expect(statusText.textContent).toContain('Error');
      expect(startButton.disabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle message sending errors', () => {
      const startButton = document.getElementById('startButton');
      const statusText = document.getElementById('statusText');
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://creditcards.chase.com/rewards-credit-cards/rewards/offers' }]);
      });

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        callback({ error: 'Failed to send message' });
      });

      startButton.click();
      
      expect(statusText.textContent).toContain('Error');
      expect(startButton.disabled).toBe(false);
    });

    it('should handle no active tab', () => {
      const startButton = document.getElementById('startButton');
      const statusText = document.getElementById('statusText');
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([]);
      });

      startButton.click();
      
      expect(statusText.textContent).toContain('Error');
      expect(startButton.disabled).toBe(false);
    });
  });
});
