// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.simplifiedText) {
        // try to remove popup if it already exists
        closeExistingPopup();
        showSimplifiedText(message.simplifiedText);
    } else if (message.token || message.token === ' ') {
        appendTokenToContent(message.token);
    }
    if (message.waiting) {
        // try to remove popup if it already exists
        closeExistingPopup();
        showWaitingMessage();
    }
  });

// close existing popup if it exists
function closeExistingPopup() {
    const popup = document.getElementById('simplified-text-popup');
    if (popup) {
        document.body.removeChild(popup);
    }
}

// Show a waiting message in the popup
async function showWaitingMessage() {
    const lang = await getStoredLanguage();
    if (lang == 'en') {
        showSimplifiedText('Waiting for OpenAI to respond...');
    } else if (lang == 'zh') {
        showSimplifiedText('等待OpenAI服务器回应...');
    }
};
  
function showSimplifiedText(simplifiedText) {
    // Retrieve the last position from storage
    chrome.storage.local.get(['popupBottom', 'popupRight'], (result) => {
        const popupBottom = result.popupBottom || '1cm';
        const popupRight = result.popupRight || '1cm';
    // Create the popup element
    const popup = document.createElement('div');
    popup.id = 'simplified-text-popup';
    popup.style.position = 'fixed';
    popup.style.bottom = popupBottom;
    popup.style.width = '10cm'
    popup.style.height = '15cm'
    // add scroll bar to the popup
    popup.style.overflow = 'auto';
    popup.style.right = popupRight;
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid #ccc';
    popup.style.padding = '5mm';
    // add blank space for the close button
    popup.style.paddingTop = '10mm';
    popup.style.zIndex = '999999';
    // set rounded corners
    popup.style.borderRadius = '5mm';
    // add shadow
    popup.style.boxShadow = '0 0 5mm #000';
  
    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerText = '⊗';
    // set the inner text font size to 5mm
    closeButton.style.fontSize = '5mm';
    // set the inner text font
    closeButton.style.fontFamily = 'Arial';
    // set text color to black
    closeButton.style.color = 'black';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0';
    // set button with no border nor frame
    closeButton.style.border = 'none';
    closeButton.style.outline = 'none';
    // setting button height to 5mm
    closeButton.style.height = '5mm';
    // setting button background color to transparent
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.right = '0';
    closeButton.onclick = () => {
      document.body.removeChild(popup);
    };
  
    // Create the content container
    const content = document.createElement('div');
    content.id = "simplified-text-content";
    content.innerText = "";
    // set the inner text font and size
    content.style.fontFamily = 'Arial';
    content.style.fontSize = '4mm';
    content.style.color = 'black';
  
    // Add the content and close button to the popup
    popup.appendChild(closeButton);
    popup.appendChild(content);
  
    // Add the popup to the page
    document.body.appendChild(popup);

    // Make the popup draggable
    makePopupDraggable(popup);
    });
}
  

function getStoredLanguage() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['language'], (result) => {
        resolve(result.language);
        });
    });
    }

function makePopupDraggable(popup) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    
    popup.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        // Check if the target is the popup
        if (e.target === popup) {
          e = e || window.event;
          e.preventDefault();
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          document.onmousemove = elementDrag;
        }
      }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        popup.style.bottom = `${document.documentElement.clientHeight - (popup.offsetTop + popup.offsetHeight) + pos2}px`;
        popup.style.right = `${document.documentElement.clientWidth - (popup.offsetLeft + popup.offsetWidth) + pos1}px`;
    }
    
    function closeDragElement() {
        // Save the position in storage
        chrome.storage.local.set({
          popupRight: popup.style.right,
          popupBottom: popup.style.bottom,
        });
    
        document.onmouseup = null;
        document.onmousemove = null;
      }
}

function appendTokenToContent(token) {
    const content = document.getElementById("simplified-text-content");
    if (content) {
      content.innerHTML += token.replace(/\n/g, '<br>');
    }
  }
  