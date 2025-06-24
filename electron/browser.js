const { BrowserView, shell, Menu, MenuItem, clipboard } = require('electron');
const { v4: uuidv4 } = require('uuid');

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

    // Handle new window requests
    view.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Context menu handler
    view.webContents.on('context-menu', (event, params) => {
      const menu = new Menu();

      // Add navigation items if applicable
      if (params.canGoBack || params.canGoForward) {
        if (view.webContents.canGoBack()) {
          menu.append(new MenuItem({
            label: 'Back',
            click: () => view.webContents.goBack()
          }));
        }
        
        if (view.webContents.canGoForward()) {
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
            shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`);
          }
        }));
      }

      // Add link items
      if (params.linkURL) {
        if (menu.items.length > 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }
        
        menu.append(new MenuItem({
          label: 'Open Link in External Browser',
          click: () => shell.openExternal(params.linkURL)
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
          label: 'Open Image in External Browser',
          click: () => shell.openExternal(params.srcURL)
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
          shell.openExternal(`view-source:${sourceUrl}`);
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

    if (view.webContents.canGoBack()) {
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

    if (view.webContents.canGoForward()) {
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

    // Remove from window
    if (mainWindow) {
      mainWindow.removeBrowserView(view);
    }

    // Destroy web contents
    view.webContents.destroy();
    
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
      throw new Error(`Browser view ${id} not found`);
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
      throw new Error(`Browser view ${id} not found`);
    }

    mainWindow.removeBrowserView(view);
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

    return view.webContents.canGoBack();
  });

  // Can go forward
  ipcMain.handle('browser:canGoForward', async (event, id) => {
    const view = browserViews.get(id);
    if (!view) {
      throw new Error(`Browser view ${id} not found`);
    }

    return view.webContents.canGoForward();
  });

  // Clean up on window close
  process.on('exit', () => {
    browserViews.forEach(view => {
      try {
        view.webContents.destroy();
      } catch (e) {
        // Already destroyed
      }
    });
  });
}

module.exports = { setupBrowserHandlers };