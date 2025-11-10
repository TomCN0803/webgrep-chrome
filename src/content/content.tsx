import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { MESSAGE_TYPE_TOGGLE_SEARCH } from '../types/messages';
import { SearchWidget } from './SearchWidget';
import { SearchController } from './searchController';
import './searchWidget.css';

let widgetContainer: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;
let controller: SearchController | null = null;

/**
 * Initialize the search widget container with Shadow DOM for style isolation
 */
function createWidgetContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'webgrep-search-widget-root';

  // Use Shadow DOM to isolate styles from the host page
  shadowRoot = container.attachShadow({ mode: 'open' });

  return container;
}

/**
 * Mount the React SearchWidget into the page
 */
function mountWidget(): void {
  if (!widgetContainer) {
    widgetContainer = createWidgetContainer();
    document.body.appendChild(widgetContainer);
  }

  if (!controller) {
    controller = new SearchController();
  }

  if (shadowRoot && !reactRoot) {
    const appContainer = document.createElement('div');
    shadowRoot.appendChild(appContainer);
    reactRoot = createRoot(appContainer);
    reactRoot.render(<SearchWidget controller={controller} onClose={unmountWidget} />);
  }
}

/**
 * Unmount the React SearchWidget and clean up
 */
function unmountWidget(): void {
  controller?.clear();

  // Unmount React component
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  // Remove container from DOM
  if (widgetContainer) {
    widgetContainer.remove();
    widgetContainer = null;
    shadowRoot = null;
  }
}

/**
 * Listen for toggle messages from the service worker
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === MESSAGE_TYPE_TOGGLE_SEARCH) {
    widgetContainer?.isConnected ? unmountWidget() : mountWidget();
  }
});
