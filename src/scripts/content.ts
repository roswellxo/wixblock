const url = window.location.hostname;
chrome.runtime.sendMessage({ checkIfWix: true, url });
