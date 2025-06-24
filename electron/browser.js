const { BrowserView, shell, Menu, MenuItem, clipboard, desktopCapturer } = require('electron');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Browser view management
function setupBrowserHandlers(ipcMain, getMainWindow, browserViews) {
  // Create a new browser view
  ipcMain.handle('browser:create', async (event, options = {}) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    const id = options.id || `browser_${uuidv4()}`;
    
    // Create browser view
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // Store the view
    browserViews.set(id, view);
    console.log(`[Browser] Created browser view ${id}. Total views: ${browserViews.size}`);

    // Inject script to handle middle clicks
    view.webContents.on('dom-ready', () => {
      view.webContents.executeJavaScript(`
        // Handle middle-click on links
        document.addEventListener('auxclick', (e) => {
          if (e.button === 1) { // Middle mouse button
            const link = e.target.closest('a');
            if (link && link.href) {
              e.preventDefault();
              e.stopPropagation();
              window.open(link.href, '_blank');
            }
          }
        }, true);
        
        // Override window.open to prevent external browser
        const originalOpen = window.open;
        window.open = function(url, target, features) {
          if (target === '_blank' || !target) {
            // For blank targets, we'll handle it via setWindowOpenHandler
            return originalOpen.call(this, url, '_blank', 'noopener');
          }
          return originalOpen.call(this, url, target, features);
        };
      `);
    });

    // Set up event handlers
    view.webContents.on('did-navigate', (event, url) => {
      mainWindow.webContents.send('browser:navigate', { id, url });
    });

    view.webContents.on('page-title-updated', (event, title) => {
      mainWindow.webContents.send('browser:titleUpdate', { id, title });
    });

    view.webContents.on('did-start-loading', () => {
      mainWindow.webContents.send('browser:loadStart', { id });
    });

    view.webContents.on('did-stop-loading', () => {
      mainWindow.webContents.send('browser:loadStop', { id });
    });

    // Handle new window requests - create new tab instead of external browser
    view.webContents.setWindowOpenHandler(({ url, disposition }) => {
      // Send event to create new tab in the app
      mainWindow.webContents.send('browser:newTabRequest', { url, disposition });
      return { action: 'deny' };
    });

    // Context menu handler
    view.webContents.on('context-menu', (event, params) => {
      const menu = new Menu();

      // Add navigation items if applicable
      if (params.canGoBack || params.canGoForward) {
        if (view.webContents.navigationHistory.canGoBack()) {
          menu.append(new MenuItem({
            label: 'Back',
            click: () => view.webContents.goBack()
          }));
        }
        
        if (view.webContents.navigationHistory.canGoForward()) {
          menu.append(new MenuItem({
            label: 'Forward',
            click: () => view.webContents.goForward()
          }));
        }
        
        menu.append(new MenuItem({ type: 'separator' }));
      }

      // Add text selection items
      if (params.selectionText) {
        menu.append(new MenuItem({
          label: 'Copy',
          role: 'copy',
          enabled: params.editFlags.canCopy
        }));
      }

      if (params.editFlags.canPaste) {
        menu.append(new MenuItem({
          label: 'Paste',
          role: 'paste'
        }));
      }

      if (params.editFlags.canCut) {
        menu.append(new MenuItem({
          label: 'Cut',
          role: 'cut'
        }));
      }

      if (params.selectionText) {
        menu.append(new MenuItem({ type: 'separator' }));
        
        menu.append(new MenuItem({
          label: `Search for "${params.selectionText.slice(0, 20)}${params.selectionText.length > 20 ? '...' : ''}"`,
          click: () => {
            mainWindow.webContents.send('browser:newTabRequest', { 
              url: `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`, 
              disposition: 'foreground-tab' 
            });
          }
        }));
      }

      // Add link items
      if (params.linkURL) {
        if (menu.items.length > 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }
        
        menu.append(new MenuItem({
          label: 'Open Link in New Tab',
          click: () => {
            mainWindow.webContents.send('browser:newTabRequest', { 
              url: params.linkURL, 
              disposition: 'foreground-tab' 
            });
          }
        }));
        
        menu.append(new MenuItem({
          label: 'Open Link in Background Tab',
          click: () => {
            mainWindow.webContents.send('browser:newTabRequest', { 
              url: params.linkURL, 
              disposition: 'background-tab' 
            });
          }
        }));
        
        menu.append(new MenuItem({
          label: 'Copy Link Address',
          click: () => {
            clipboard.writeText(params.linkURL);
          }
        }));
      }

      // Add image items
      if (params.mediaType === 'image') {
        if (menu.items.length > 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }
        
        menu.append(new MenuItem({
          label: 'Copy Image',
          click: () => view.webContents.copyImageAt(params.x, params.y)
        }));
        
        menu.append(new MenuItem({
          label: 'Copy Image Address',
          click: () => {
            clipboard.writeText(params.srcURL);
          }
        }));
        
        menu.append(new MenuItem({
          label: 'Open Image in New Tab',
          click: () => {
            mainWindow.webContents.send('browser:newTabRequest', { 
              url: params.srcURL, 
              disposition: 'foreground-tab' 
            });
          }
        }));
      }

      // Always add developer tools and page actions
      if (menu.items.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }));
      }

      menu.append(new MenuItem({
        label: 'Reload',
        click: () => view.webContents.reload()
      }));

      menu.append(new MenuItem({
        label: 'View Page Source',
        click: () => {
          const sourceUrl = view.webContents.getURL();
          mainWindow.webContents.send('browser:newTabRequest', { 
            url: `view-source:${sourceUrl}`, 
            disposition: 'foreground-tab' 
          });
        }
      }));

      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Inspect Element',
        click: () => {
          view.webContents.inspectElement(params.x, params.y);
        }
      }));

      // Show the context menu
      menu.popup();
    });

    // Load initial URL if provided
    if (options.url) {
      view.webContents.loadURL(options.url);
    }

    // Set initial bounds if provided
    if (options.bounds) {
      view.setBounds(options.bounds);
    }

    // Add to window if not hidden
    if (!options.hidden) {
      mainWindow.addBrowserView(view);
    }

    return {
      id,
      url: options.url || 'about:blank'
    };
  });

  // Navigate to URL
  ipcMain.handle('browser:navigate', async (event, id, url) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    // Normalize URL
    let normalizedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      if (/^[\w.-]+\.\w+/.test(url)) {
        normalizedUrl = `https://${url}`;
      } else {
        normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    view.webContents.loadURL(normalizedUrl);
    return true;
  });

  // Go back
  ipcMain.handle('browser:goBack', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    if (view.webContents.navigationHistory.canGoBack()) {
      view.webContents.goBack();
    }
    return true;
  });

  // Go forward
  ipcMain.handle('browser:goForward', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    if (view.webContents.navigationHistory.canGoForward()) {
      view.webContents.goForward();
    }
    return true;
  });

  // Refresh
  ipcMain.handle('browser:refresh', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    view.webContents.reload();
    return true;
  });

  // Close browser view
  ipcMain.handle('browser:close', async (event, id) => {
    const mainWindow = getMainWindow();
    const view = browserViews.get(id);
    if (!view) {
      return true; // Already closed
    }

    try {
      // Remove from window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.removeBrowserView(view);
      }

      // Destroy web contents if not already destroyed
      if (!view.webContents.isDestroyed()) {
        view.webContents.destroy();
      }
    } catch (e) {
      console.error(`[Browser] Error closing browser view ${id}:`, e);
    }
    
    // Remove from map
    browserViews.delete(id);
    console.log(`[Browser] Closed browser view ${id}. Total views: ${browserViews.size}`);
    return true;
  });

  // Set bounds
  ipcMain.handle('browser:setBounds', async (event, id, bounds) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    view.setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    });
    return true;
  });

  // Show browser view
  ipcMain.handle('browser:show', async (event, id) => {
    const mainWindow = getMainWindow();
    const view = browserViews.get(id);
    if (!view || !mainWindow) {
      console.warn(`[Browser] Cannot show view ${id}: view or window not found`);
      return false;
    }
    
    if (mainWindow.isDestroyed() || view.webContents.isDestroyed()) {
      console.warn(`[Browser] Cannot show view ${id}: window or view destroyed`);
      return false;
    }

    // Hide all other browser views first to prevent overlap
    const currentViews = mainWindow.getBrowserViews();
    for (const existingView of currentViews) {
      // Check if this view belongs to our browser views
      const existingId = Array.from(browserViews.entries()).find(([_, v]) => v === existingView)?.[0];
      if (existingId && existingId !== id) {
        mainWindow.removeBrowserView(existingView);
        console.log(`[Browser] Hid browser view ${existingId} to show ${id}`);
      }
    }

    // Add the target view if not already added
    if (!currentViews.includes(view)) {
      mainWindow.addBrowserView(view);
      console.log(`[Browser] Showing browser view ${id}`);
    }
    return true;
  });

  // Hide browser view
  ipcMain.handle('browser:hide', async (event, id) => {
    const mainWindow = getMainWindow();
    const view = browserViews.get(id);
    if (!view || !mainWindow) {
      console.warn(`[Browser] Cannot hide view ${id}: view or window not found`);
      return false;
    }
    
    if (mainWindow.isDestroyed() || view.webContents.isDestroyed()) {
      console.warn(`[Browser] Cannot hide view ${id}: window or view destroyed`);
      return false;
    }

    try {
      mainWindow.removeBrowserView(view);
    } catch (e) {
      console.error(`[Browser] Error hiding view ${id}:`, e);
      return false;
    }
    return true;
  });

  // Open DevTools
  ipcMain.handle('browser:openDevTools', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    view.webContents.openDevTools();
    return true;
  });

  // Close DevTools
  ipcMain.handle('browser:closeDevTools', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    view.webContents.closeDevTools();
    return true;
  });

  // Capture screenshot
  ipcMain.handle('browser:captureScreenshot', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    const image = await view.webContents.capturePage();
    return image.toDataURL();
  });

  // Capture region of screenshot
  ipcMain.handle('browser:captureRegion', async (event, id, rect) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    // Validate rect parameters
    if (!rect || typeof rect.x !== 'number' || typeof rect.y !== 'number' || 
        typeof rect.width !== 'number' || typeof rect.height !== 'number') {
      throw new Error('Invalid capture region parameters');
    }

    // Ensure positive dimensions
    if (rect.width <= 0 || rect.height <= 0) {
      throw new Error('Capture region must have positive dimensions');
    }

    // Capture the specified region
    const image = await view.webContents.capturePage({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
    
    return image.toDataURL();
  });

  // Save screenshot to file
  ipcMain.handle('browser:saveScreenshot', async (event, id, filePath) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    const image = await view.webContents.capturePage();
    const buffer = image.toPNG();
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save the file
    await fs.writeFile(filePath, buffer);
    return filePath;
  });

  // Start screen recording
  const recordingSessions = new Map();
  
  ipcMain.handle('browser:startRecording', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    // Check if already recording
    if (recordingSessions.has(id)) {
      throw new Error('Already recording this browser view');
    }

    // Get the browser view bounds for recording
    const bounds = view.getBounds();
    
    // Get available sources
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen']
    });

    // Find the main window
    const mainWindow = getMainWindow();
    const mainSource = sources.find(source => 
      source.id === `window:${mainWindow.getMediaSourceId()}:0`
    );

    if (!mainSource) {
      throw new Error('Could not find window to record');
    }

    // Store recording session info
    recordingSessions.set(id, {
      sourceId: mainSource.id,
      bounds,
      startTime: Date.now()
    });

    return {
      sourceId: mainSource.id,
      bounds
    };
  });

  // Stop screen recording
  ipcMain.handle('browser:stopRecording', async (event, id) => {
    const session = recordingSessions.get(id);
    if (!session) {
      throw new Error('No recording session found');
    }

    recordingSessions.delete(id);
    
    return {
      duration: Date.now() - session.startTime
    };
  });

  // Get recording status
  ipcMain.handle('browser:getRecordingStatus', async (event, id) => {
    return recordingSessions.has(id);
  });

  // Get current URL
  ipcMain.handle('browser:getUrl', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    return view.webContents.getURL();
  });

  // Get title
  ipcMain.handle('browser:getTitle', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    return view.webContents.getTitle();
  });

  // Can go back
  ipcMain.handle('browser:canGoBack', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    return view.webContents.navigationHistory.canGoBack();
  });

  // Can go forward
  ipcMain.handle('browser:canGoForward', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    return view.webContents.navigationHistory.canGoForward();
  });

  // No cleanup needed here - handled in main.js to prevent "object destroyed" errors
}

module.exports = { setupBrowserHandlers };