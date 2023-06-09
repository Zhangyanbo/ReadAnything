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
      const simplifiedText = await callOpenAI(text, tabId);
  
      // Send the simplified text to the content script
      chrome.tabs.sendMessage(tabId, { simplifiedText });
    } catch (error) {
      console.error('Error getting simplified text:', error);
    }
  }

async function callOpenAI(text, tabId) {
    // Get the stored API key
    const apiKey = await getStoredAPIKey();
  
    // Define the request data (model and messages)
    const model = await getStoredModel();
    const lang = await getStoredLanguage();

    let finish = "";
    let instructions = "";

    if (lang == 'zh') {
      // add sentence to the end of the text to make sure the translation is correct
      finish = "我会用中文回答你的问题。"
      instructions = "请用中文回答我。"
    }

    const data = {
      model: model,
      max_tokens: 1024,
      temperature: 1,
      stream: true,
      messages: [
        { role: "system", content: "You are a high school teacher who is good at explaining complex concepts to students."},
        { role: "user", content: `\
Please help me explain some complex sentences from papers to high school students. \
You need to try your best to attract their attention and make them understand the concepts. \
Please connects the key points with questions and examples to make it attractive. \
Please use examples, imagnations, questions, and analogies to make it vivid and concrete.\
Please directly explain without any thing like "let me give it a try" or anything similar.`},
        { role: "assistant", content: `\
Sure! As a passionate high school teacher, I thrive on using an informative \
and popular science writing style that weaves in scientific terminology and analogies to \
make even the most complex concepts effortlessly understandable. Give me your sentences and \
let's get started! I will explain the sentences in a vivid and concrete way for best understanding. \
Don't hesitate - send it my way!` + finish},
        { role: "user", content: text + instructions},
      ],
    };

    // if (lang == 'zh') {
    //   // Call GPT-3 API to translate the text to Chinese
    //   chrome.tabs.sendMessage(tabId, { token: "（中文版本会在英文版之后给出）\n\n" })
    // }

    const raw_content = await readStream(data, apiKey, tabId);

    // if (lang == 'zh') {
    //   // Call GPT-3 API to translate the text to Chinese
    //   await translate_zh(raw_content, tabId)
    // }
  }

  function extractContent(jsonStr) {
    const regex = /data: (\{.*\})/g;
    let lastMatch;
  
    while ((match = regex.exec(jsonStr)) !== null) {
      lastMatch = match;
    }

    if (lastMatch) {
      try {
        const content = JSON.parse(lastMatch[1]).choices[0].delta.content;
        return content;
      } catch (error) {return null;}
    } else {
      return null;
    }
  }

async function readStream(data, apiKey, tabId) {
  let raw_content = "";
  // Define the URL for the OpenAI API endpoint
  const url = "https://api.openai.com/v1/chat/completions";
  
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

    // Read the response as a stream
    const reader = response.body.getReader();

    // Process the stream
    while (true) {
      const { value, done } = await reader.read();
      // stop the stram if chrome.runtime.sendMessage({ stopStream: true });
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.stopStream) {
          reader.releaseLock();
        }
      });
      
      if (done) {
        console.log("Done reading stream")
        // close the stream
        reader.releaseLock();
        break
      };

      // Parse the value as a string
      const token = new TextDecoder("utf-8").decode(value);

      const content = extractContent(token);
      console.log("content:", content);

      raw_content += token;

      // Send the content to the content script
      chrome.tabs.sendMessage(tabId, { token: content });

    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
  return raw_content;
}


async function translate_zh(raw_content, tabId){
  // Translate the text to Chinese
  // Get the stored API key
  chrome.tabs.sendMessage(tabId, { token: "\n\n 中文版本：\n" })
  const apiKey = await getStoredAPIKey();
  
  // Define the URL for the OpenAI API endpoint

  // Define the request data (model and messages)
  const model = "gpt-3.5-turbo";

  const data = {
    model: model,
    max_tokens: 1024,
    temperature: 1,
    stream: true,
    messages: [
      { role: "system", content: "You are a good translator who can translate English to Chinese in a fluent way."},
      { role: "user", content: "Please translate the following text to Chinese:\n" + raw_content}
    ],
  };

  await readStream(data, apiKey, tabId);
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