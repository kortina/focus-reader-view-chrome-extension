// Called when the url of a tab changes.
function showPageAction(tabId, changeInfo, tab) {
  // check if reader view is available
  chrome.pageAction.show(tabId);
}

chrome.tabs.onUpdated.addListener(showPageAction);

// notify content.js to act on user click
chrome.pageAction.onClicked.addListener(function(tab) {
    //console.log("unsubscribe-button:background.js:pageAction.onClicked");
    chrome.tabs.sendRequest(tab.id, {}, null);
});

