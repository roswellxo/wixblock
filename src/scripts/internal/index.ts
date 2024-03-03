/* This file can be used to export functionality that can then be used in the
 * extension's content and background scripts.
 */
export async function ActiveTabUrl() {
  const t = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const u = t[0].url;
  if (!u) return;
  const url = new URL(u).hostname;
  console.log(`responding with lastActiveTab: ${JSON.stringify(t)} ${url}`);
  return url;
}
