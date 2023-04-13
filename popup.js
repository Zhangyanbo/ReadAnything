document.getElementById('save-api-key').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key').value;
    chrome.storage.sync.set({ apiKey }, () => {
      console.log('API key saved:', apiKey);
    });
  });

document.getElementById('reset-position').addEventListener('click', () => {
    // get popup element by id = simplified-text-popup
    chrome.storage.local.set({
        popupRight: null,
        popupBottom: null,
      });
});

document.getElementById('model-choose').addEventListener('change', () => {
const model = document.getElementById('model-choose').value;
chrome.storage.sync.set({ model }, () => {
    console.log('Model saved:', model);
    });
});

// save language setting from language-choose
document.getElementById('language-choose').addEventListener('change', () => {
    const language = document.getElementById('language-choose').value;
    chrome.storage.sync.set({ language }, () => {
        console.log('Language saved:', language);
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

// Retrieve the stored language when the popup opens
chrome.storage.sync.get(['language'], (result) => {
    document.getElementById('language-choose').value = result.language || 'en';
    }
);