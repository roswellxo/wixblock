import { Show } from '@legendapp/state/react';
import localforage from 'localforage';
import { useEffect, useState } from 'react';

const port = chrome.runtime.connect({ name: 'main' });

export function Content() {
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    port.postMessage({ action: 'activeTab' });
    port.postMessage({ action: 'getBlocklist' });
    port.onMessage.addListener((msg) => {
      if (msg.action === 'activeTabUrl') {
        setUrl(msg.url);
      }
      if (msg.action === 'getBlocklist') {
        setBlocklist(msg.list);
      }
    });
  }, []);

  return (
    <div className="w-96 h-96 mx-auto relative bg-black prose prose-invert">
      <div className="w-[80%] h-full text-center flex flex-col gap-2 mx-auto">
        <img
          title="Wix Blocker"
          className="mx-auto h-28 w-28 border border-red-500"
          src="/assets/images/icon128.png"
          alt="WixBlocker Logo"
        />
        <Show
          if={!window.location.origin.includes('chrome-extension')}
          else={
            <div className="flex flex-col p-4 gap-2 text-center">
              <div>
                <h4>Blocked Sites: {blocklist.length}</h4>
                <Show if={blocklist.length}>
                  <p className="text-xs text-gray-400">
                    {'(click to unblock)'}
                  </p>
                </Show>
              </div>
              {blocklist.map((b) => {
                return (
                  <button
                    className="cursor-pointer hover:text-green-500"
                    key={b}
                    onClick={() => {
                      port.postMessage({ action: 'unblockSite', url: b });
                    }}
                  >
                    {JSON.stringify(b)}
                  </button>
                );
              })}
            </div>
          }
        >
          <button
            className="rounded-md border hover:border-green-400 hover: text-green-400 active:opacity-90 p-4 overflow-x-hidden"
            id="btn"
            onClick={() => {
              if (blocklist.includes(url)) {
                const list = blocklist.filter((b) => b !== url);
                localforage.setItem('blocklist', list);
                setBlocklist(list);
              } else {
                const list = [url, ...blocklist];
                localforage.setItem('blocklist', list);
                chrome.storage.local.set({ blocklist: list });
                setBlocklist(list);
              }
            }}
          >
            {blocklist.includes(url) ? 'Unblock' : 'Block'} {url}
          </button>
        </Show>
        <a
          className="prose-sm text-white mt-auto p-4 hover:text-green-400 cursor-pointer0"
          href="https://bdsmovement.net/"
        >
          learn more
        </a>
      </div>
    </div>
  );
}
