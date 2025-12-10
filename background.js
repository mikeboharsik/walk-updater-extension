/* copy youtube ID */
function onMenuItemCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}

browser.menus.create({
  id: 'copy-youtube-id',
  title: 'Copy YouTube ID',
  contexts: ['link']
}, onMenuItemCreated);

const patterns = [
  /https\:\/\/www\.youtube\.com\/watch\?v=(.+?)($|&)/,
  /https\:\/\/youtu\.be\/(.+)(&)*/,
  /https\:\/\/youtube\.com\/shorts\/(.+)/,
  /https\:\/\/studio\.youtube\.com\/video\/(.+)\/edit/,
];

browser.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'copy-youtube-id': {
      const id = patterns.reduce((acc, pattern) => {
        if (acc === null) {
          const matchedId = info.linkUrl.match(pattern);
          if (matchedId) {
            acc = matchedId[1];
          }
        }
        return acc;
      }, null);
      if (id) {
        navigator.clipboard.writeText(id);
      }
      break;
    }
  }
});
/********************/

async function executeContentScript(tabId, file) {
    try {
        await browser.scripting.executeScript({
            target: { tabId: tabId },
            files: [file]
        });
    } catch (error) {
        console.error(`Error executing content script ${file}:`, error);
    }
}

async function runAction() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    if (tabs.length === 0) {
        console.error("Could not find the active tab to inject the script.");
        return;
    }
    
    const tabId = tabs[0].id;
    
    executeContentScript(tabId, 'action.js');
}

browser.commands.onCommand.addListener(async (command) => {
    if (command === 'run-action') {
        await runAction();
    }
});

browser.runtime.onMessage.addListener(async (message, sender) => {    
    if (message.command === 'run-action') {
        await runAction();
    }
    return true; 
});

console.log("Initialized walk-updater background script");
