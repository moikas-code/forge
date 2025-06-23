# Terminal Input Test Instructions

## Debug Steps

1. **Open the browser developer console** (F12 or right-click → Inspect → Console tab)

2. **Click on the terminal area** to give it focus

3. **Try typing some characters** (e.g., "hello")

4. **Look for console logs** with the following prefixes:
   - `[EnhancedTerminal]` - From the EnhancedTerminal component
   - `[Terminal]` - From the Terminal component
   
5. **Expected logs when typing**:
   ```
   [EnhancedTerminal] Container clicked, focusing terminal
   [EnhancedTerminal] Attempting to focus terminal
   [EnhancedTerminal] Focused terminal textarea element
   [EnhancedTerminal] onData triggered with: {data: "h", data_length: 1, ...}
   [EnhancedTerminal] Sending bytes to backend: [104]
   [EnhancedTerminal] Successfully sent to terminal backend
   ```

## Common Issues and Solutions

### Issue: No onData logs when typing
- **Cause**: Terminal not properly focused
- **Solution**: Click directly on the terminal area, check for focus logs

### Issue: "Failed to write to terminal" error
- **Cause**: Parameter name mismatch (now fixed)
- **Solution**: The code has been updated to use `terminal_id` instead of `terminalId`

### Issue: No terminal output displayed
- **Cause**: Event listeners not properly set up
- **Solution**: Check for `terminal-output` event logs

### Issue: Import errors for xterm addons
- **Cause**: Wrong package names
- **Solution**: Updated to use `@xterm/addon-*` packages

## Testing Commands

Once the terminal is working, try these commands:
1. `echo "Hello World"` - Basic output test
2. `ls` - Directory listing
3. `pwd` - Current directory
4. `help` - Custom IDE commands (if implemented)

## What was fixed:

1. **Parameter name consistency**: Changed all Tauri invoke calls to use `terminal_id` (snake_case) instead of `terminalId` (camelCase)
2. **Package dependencies**: Installed correct `@xterm/addon-*` packages and removed old `xterm-addon-fit`
3. **Enhanced debugging**: Added detailed console logging to track input flow
4. **Focus handling**: Improved focus management with click handlers and timeouts