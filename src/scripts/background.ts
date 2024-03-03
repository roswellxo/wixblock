import { ActiveTabUrl } from './internal';
const getBlocklist = async () =>
  ((await chrome.storage.local.get('blocklist'))['blocklist'] ??
    []) as string[];

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const blocklist = await getBlocklist();
  const tabId = sender.tab?.id;
  if (message.checkIfWix) {
    const url = message.url;
    console.log(`checking if ${url} is in blocklist: ${blocklist}`);
    if (blocklist.includes(url)) {
      console.log('Redirecting to index.html');
      chrome.tabs.update(sender.tab?.id ?? -1, { url: 'index.html' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      chrome.action.setBadgeText({ text: '!', tabId: sender.tab?.id });
      return;
    }
    console.log(`checking if ${tabId} is in set:`, set);
    if (set.has(`${tabId}`)) {
      console.log("It's a wix site! Notifying user...");
      notifyUser(url);
      return;
    }
  }
  if (message.action === 'blockSite') {
    const url = (await chrome.storage.local.get(`sus-${message.id}`))[
      `sus-${message.id}`
    ];
    console.log({ url });
    // make unique
    const bl = [...new Set([...blocklist, url])];
    chrome.storage.local.set({ blocklist: bl });
    chrome.notifications.clear(message.id);
  }
});

chrome.notifications.onClicked.addListener(async (id) => {
  const url = (await chrome.storage.local.get(`wix-${id}`))[`wix-${id}`];
  const blocklist = await getBlocklist();
  const bl = [...new Set([...blocklist, url])];
  chrome.storage.local.set({ blocklist: bl });
  chrome.notifications.clear(id);
  chrome.tabs.create({ url: 'index.html', active: true });
});

chrome.notifications.onButtonClicked.addListener(async (id, btn) => {
  console.log({ id, btn });
});

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === 'main');
  port.onMessage.addListener(async (msg) => {
    if (msg.action === 'activeTab') {
      const url = await ActiveTabUrl();
      port.postMessage({ action: 'activeTabUrl', url });
    }
    if (msg.action === 'getBlocklist') {
      const list = await getBlocklist();
      port.postMessage({ action: 'getBlocklist', list });
    }
    if (msg.action === 'unblockSite') {
      const list = await getBlocklist();
      const newlist = list.filter((b) => b !== msg.url);
      chrome.storage.local.set({ blocklist: newlist });
      port.postMessage({ action: 'getBlocklist', list: newlist });
    }
  });
});

/* ------------------ */
const blockUrls = [
  '*://*.parastorage.com/*',
  '*://*.wixstatic.com/*',
  '*://*.wix.com/*',
];

const set = new Set<string>();

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log(`blocking ${details.url} in tab ${details.tabId}`);
    set.add(details.tabId.toString());
    console.log(`adding ${details.tabId} to set`, set);
  },
  {
    urls: blockUrls,
  },
  []
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(`tab ${tabId} updated with url ${changeInfo.url}`);
  if (set.has(`${tabId}`)) {
    set.delete(`${tabId}`);
  }
});

function notifyUser(url: string) {
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  chrome.action.setBadgeText({ text: '!' });
  chrome.notifications.create(
    {
      type: 'basic',
      iconUrl: 'assets/images/logo.png',
      title: 'Click here to block this wix site!',
      message: `${url}`,
      isClickable: true,
      requireInteraction: true,
      buttons: [{ title: 'Block' }, { title: 'Allow' }],
    },
    (id) => {
      chrome.storage.local.set({ [`wix-${id}`]: url });
    }
  );
}
