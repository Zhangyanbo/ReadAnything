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
    let data;

    if (lang === 'en') {
      data = {
        model: model,
        max_tokens: 1024,
        temperature: 1,
        messages: [
          { role: "system", content: "You are a high school teacher"},
          { role: "user", content: "Please help me explain some complex paper contents to high school students. Such as the following examples: Have you ever thought about ...; Let's start by talking about ...; Let's talk about an idea...; ...researchers saw something new and exciting!"},
          { role: "system", content: "Sure! Please send me the paper. I will use informative / popular science writing style, with scientific terminology and analogies to explain complex concepts in a clear and concise manner! I will direclty give you the explained text in English."},
          { role: "user", content: text }],
      };
    } else if (lang === 'zh') {
      data = {
        model: model,
        max_tokens: 1024,
        temperature: 1,
        messages: [
          { role: "system", content: "你是一个高中教师"},
          { role: "user", content: "请帮我向高中生解释一些复杂的论文内容。 比如下面的例子：你有没有想过……； 让我们从……开始讨论吧； 我们来聊聊一个想法......; ...研究人员看到了令人兴奋的新事物！"},
          { role: "system", content: "没问题！请把论文发给我。我将使用科普的写作风格，运用科学术语和类比，以清晰简洁的方式解释复杂的概念！我会直接给你解释后的中文文字。"},
          { role: "user", content: text }],
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
        body: JSON.stringify(data),
      });
  
      // Check if the response is successful (status code 200-299)
      if (!response.ok) {
        throw new Error(`OpenAI API request failed with status ${response.status}`);
      }
  
      // Parse the response as JSON
      const result = await response.json();
  
      // Extract the simplified text from the result (you may need to adjust this based on the API response structure)
      const simplifiedText = result.choices && result.choices.length > 0
        ? result.choices[0].message.content
        : 'No response from the API';
  
      return simplifiedText;
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