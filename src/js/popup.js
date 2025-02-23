// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');

  // Update UI based on automation status
  const updateUI = (isRunning) => {
    startBtn.style.display = isRunning ? 'none' : 'block';
    stopBtn.style.display = isRunning ? 'block' : 'none';
    statusDiv.textContent = isRunning ? '🎯 Catching rewards...' : 'Ready to catch some rewards!';
  };

  // Start automation
  startBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].url || !tabs[0].url.includes('chase.com')) {
        statusDiv.textContent = '❌ Error: Please open Chase offers page';
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'startHunting' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Error:', chrome.runtime.lastError);
          statusDiv.textContent = '❌ Error: Please refresh the page and try again';
          return;
        }
        if (!response) {
          statusDiv.textContent = '❌ Error: Extension not ready. Please refresh the page.';
          return;
        }
        if (response.error) {
          statusDiv.textContent = '❌ Error: Please navigate to the Chase offers page';
          return;
        }
        if (response.success) {
          updateUI(true);
        }
      });
    });
  });

  // Stop automation
  stopBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs || !tabs[0]) return;
            
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stopHunting' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Error stopping catch:', chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          updateUI(false);
          statusDiv.textContent = '⏸️ Paused - Ready to continue!';
        }
      });
    });
  });

  // Listen for automation complete message
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'huntingComplete') {
      updateUI(false);
      statusDiv.textContent = '✨ Great job! All rewards caught!';
      sendResponse({ received: true });
    }
    return false;
  });

  // Check current status when popup opens
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].url || !tabs[0].url.includes('chase.com')) {
      statusDiv.textContent = '❌ Error: Please open Chase offers page';
      return;
    }
        
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Error getting status:', chrome.runtime.lastError);
        return;
      }
      if (response && typeof response.isRunning === 'boolean') {
        updateUI(response.isRunning);
      }
    });
  });
});
