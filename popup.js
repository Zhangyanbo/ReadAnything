document.getElementById('save-api-key').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.sync.set({ apiKey }, () => {
      console.log('API key saved:', apiKey);
    });
  });

  document.getElementById('model-choose').addEventListener('change', () => {
    const model = document.getElementById('model-choose').value;
    chrome.storage.sync.set({ model }, () => {
        console.log('Model saved:', model);
        });
  });
  
// Retrieve the stored API key when the popup opens
chrome.storage.sync.get(['apiKey'], (result) => {
document.getElementById('api-key').value = result.apiKey || '';
});

// Retrieve the stored model when the popup opens
chrome.storage.sync.get(['model'], (result) => {
    document.getElementById('model-choose').value = result.model || 'gpt-3.5-turbo';
    });