// background.js

let youtubeStartTime = null;
let currentTabId = null;
let timeIntervalId = null;

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    handleTabChange(tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (tab.active) {
      handleTabChange(tab);
    }
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    handleWindowBlur();
  } else {
    chrome.windows.get(windowId, window => {
      if (window.focused) {
        chrome.tabs.query({ active: true, windowId: windowId }, tabs => {
          if (tabs.length > 0) {
            handleTabChange(tabs[0]);
          }
        });
      } else {
        handleWindowBlur();
      }
    });
  }
});

function handleTabChange(tab) {
  if (currentTabId !== null && youtubeStartTime !== null) {
    // ユーザーがYouTubeから離れるとき
    if (timeIntervalId !== null) {
      clearInterval(timeIntervalId);
      timeIntervalId = null;
    }
    let timeSpent = Date.now() - youtubeStartTime;
    saveTimeData(timeSpent);
    youtubeStartTime = null;
    currentTabId = null;
  }

  if (tab.url && tab.url.includes('youtube.com')) {
    youtubeStartTime = Date.now();
    currentTabId = tab.id;
    // インターバルを開始
    if (timeIntervalId === null) {
      timeIntervalId = setInterval(() => {
        let timeSpent = Date.now() - youtubeStartTime;
        saveTimeData(timeSpent);
        youtubeStartTime = Date.now(); // 開始時間をリセット
      }, 1000); // 毎秒実行
    }
  }
}

function handleWindowBlur() {
  if (currentTabId !== null && youtubeStartTime !== null) {
    if (timeIntervalId !== null) {
      clearInterval(timeIntervalId);
      timeIntervalId = null;
    }
    let timeSpent = Date.now() - youtubeStartTime;
    saveTimeData(timeSpent);
    youtubeStartTime = null;
    currentTabId = null;
  }
}

function saveTimeData(timeSpent) {
  let date = new Date();
  let dateString = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();

  chrome.storage.local.get('timeData', data => {
    let timeData = data.timeData || {};
    if (!timeData[dateString]) {
      timeData[dateString] = 0;
    }
    timeData[dateString] += timeSpent;
    chrome.storage.local.set({ timeData: timeData });
  });
}

// ブラウザが起動したとき
chrome.runtime.onStartup.addListener(() => {
  youtubeStartTime = null;
  currentTabId = null;
  if (timeIntervalId !== null) {
    clearInterval(timeIntervalId);
    timeIntervalId = null;
  }
});

// エクステンションがインストールされたとき
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ timeData: {} });
});
