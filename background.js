// Register the context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'explain',
      title: 'Explain',
      contexts: ['selection'],
    });
  });
  
  // Listen for the context menu item click
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'explain') {
      const selectedText = info.selectionText;
      getSimplifiedText(selectedText, tab.id);
    }
  });
  
  async function getSimplifiedText(text, tabId) {
    try {
      // send a waiting message to the content script
      chrome.tabs.sendMessage(tabId, { waiting: true });
      // Call the OpenAI API with the selected text (placeholder)
      const simplifiedText = await callOpenAI(text);
  
      // Send the simplified text to the content script
      chrome.tabs.sendMessage(tabId, { simplifiedText });
    } catch (error) {
      console.error('Error getting simplified text:', error);
    }
  }

  async function callOpenAI(text) {
    // Get the stored API key
    const apiKey = await getStoredAPIKey();
  
    if (!apiKey) {
      console.error('No API key found');
      return;
    }
  
    // Define the URL for the OpenAI API endpoint
    const url = "https://api.openai.com/v1/chat/completions";
  
    // Define the request data (model and messages)
    // get model from chrome.storage
    const model = await getStoredModel();

    const lang = await getStoredLanguage();
    const data = {
        model: model,
        max_tokens: 1024,
        temperature: 1,
        messages: [
          { role: "system", content: "You are a high school teacher"},
          { role: "user", content: "Please help me explain some complex paper contents to high school students. Such as the following examples: Have you ever thought about ...; Let's start by talking about ...; Let's talk about an idea...; ...researchers saw something new and exciting!"},
          { role: "system", content: "Sure! Please send me the paper. I will use informative / popular science writing style, with scientific terminology and analogies to explain complex concepts in a clear and concise manner! I will direclty give you the explained text in English."},
          { role: "user", content: text }],
      };
  
    try {
      // Make a POST request to the OpenAI API
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });
  
      // Check if the response is successful (status code 200-299)
      if (!response.ok) {
        throw new Error(`OpenAI API request failed with status ${response.status}`);
      }
  
      // Parse the response as JSON
      const result = await response.json();
  
      // Extract the simplified text from the result (you may need to adjust this based on the API response structure)
      let simplifiedText = result.choices && result.choices.length > 0
        ? result.choices[0].message.content
        : 'No response from the API';
      
      // Translate the simplified text to the selected language
      if (lang !== 'en') {
        simplifiedText = await translateText(simplifiedText, lang);
      }
      
      return simplifiedText;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
    }
  }

async function translateText(text, lang) {
    // Using GPT-3 to translate text to the selected language
    const apiKey = await getStoredAPIKey();
    const url = "https://api.openai.com/v1/chat/completions";
    
    let eng_data;
    if (lang === 'zh') {
      eng_data = {
        model: 'gpt-3.5-turbo',
        max_tokens: 1024,
        temperature: 1,
        messages: [
          { role: "system", content: "You are a translator"},
          { role: "user", content: "Translate the following text to Chinese: \n" + text}
        ],
      };
    }

    try {
      // Make a POST request to the OpenAI API
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(eng_data),
      });
  
      // Check if the response is successful (status code 200-299)
      if (!response.ok) {
        throw new Error(`OpenAI API request failed with status ${response.status}`);
      }
  
      // Parse the response as JSON
      const result = await response.json();
  
      // Extract the simplified text from the result (you may need to adjust this based on the API response structure)
      let translated = result.choices && result.choices.length > 0
        ? result.choices[0].message.content
        : 'No response from the API';
      
      return translated;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
    }

  }  
  
  
function getStoredAPIKey() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['apiKey'], (result) => {
        resolve(result.apiKey);
      });
    });
  }
  
function getStoredModel() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['model'], (result) => {
        resolve(result.model);
        });
    });
    }

function getStoredLanguage() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['language'], (result) => {
        resolve(result.language);
        });
    });
    }