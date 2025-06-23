// Test script to check terminal functionality
const { invoke } = require('@tauri-apps/api/core');
const { listen } = require('@tauri-apps/api/event');

async function testTerminal() {
  console.log('Creating terminal...');
  
  try {
    // Create terminal
    const response = await invoke('create_terminal', {
      options: {
        shell: null,
        cwd: null,
        env: null,
        size: { rows: 24, cols: 80 }
      }
    });
    
    console.log('Terminal created:', response);
    
    // Listen for output
    const unlisten = await listen('terminal-output', (event) => {
      console.log('Terminal output event:', event);
      if (event.payload && event.payload.data) {
        const text = new TextDecoder().decode(new Uint8Array(event.payload.data));
        console.log('Output text:', text);
      }
    });
    
    // Send a test command
    const testCommand = 'echo "Hello from test"\n';
    const bytes = new TextEncoder().encode(testCommand);
    await invoke('write_to_terminal', {
      terminalId: response.terminal_id,
      data: Array.from(bytes)
    });
    
    console.log('Test command sent');
    
    // Wait for output
    setTimeout(async () => {
      // Close terminal
      await invoke('close_terminal', { terminalId: response.terminal_id });
      unlisten();
      console.log('Test complete');
    }, 3000);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test if this is executed in Tauri context
if (typeof window !== 'undefined' && window.__TAURI__) {
  testTerminal();
} else {
  console.log('This script must be run in a Tauri application context');
}