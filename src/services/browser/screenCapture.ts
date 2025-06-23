import { invoke } from '@tauri-apps/api/core';

export interface CaptureOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage?: boolean;
}

export interface RecordingOptions {
  fps?: number;
  quality?: number;
  audio?: boolean;
}

export class ScreenCaptureService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /**
   * Capture screenshot of an iframe element
   */
  async captureIframeScreenshot(
    iframe: HTMLIFrameElement, 
    options: CaptureOptions = {}
  ): Promise<Blob | null> {
    try {
      // For same-origin iframes, we can use html2canvas or similar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Get iframe dimensions
      const rect = iframe.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Try to access iframe content (only works for same-origin)
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          // Use html2canvas if available
          // For now, we'll use a simpler approach
          return await this.captureWithCanvas(iframe, options);
        }
      } catch (e) {
        // Cross-origin iframe
        console.warn('Cannot capture cross-origin iframe directly');
      }

      // Fallback: capture the iframe element itself
      return await this.captureElement(iframe, options);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  /**
   * Capture screenshot using canvas (for same-origin content)
   */
  private async captureWithCanvas(
    element: HTMLElement, 
    options: CaptureOptions
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Draw element to canvas (simplified version)
      // In production, use html2canvas library
      canvas.toBlob(
        (blob) => resolve(blob),
        `image/${options.format || 'png'}`,
        options.quality || 0.92
      );
    });
  }

  /**
   * Capture element using DOM-to-image approach
   */
  private async captureElement(
    element: HTMLElement,
    options: CaptureOptions
  ): Promise<Blob | null> {
    // This is a placeholder - in production, use dom-to-image or similar library
    return null;
  }

  /**
   * Start recording the browser view
   */
  async startRecording(
    element: HTMLElement,
    options: RecordingOptions = {}
  ): Promise<boolean> {
    try {
      // Stop any existing recording
      if (this.mediaRecorder) {
        await this.stopRecording();
      }

      // Get display media stream
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: options.fps || 30,
        },
        audio: options.audio || false
      });

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: options.quality || 2500000
      });

      this.recordedChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle stop
      this.mediaRecorder.onstop = () => {
        this.stream?.getTracks().forEach(track => track.stop());
      };

      // Start recording
      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop recording and return the video blob
   */
  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedChunks = [];
        this.stream?.getTracks().forEach(track => track.stop());
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Save blob as file using Tauri
   */
  async saveFile(blob: Blob, filename: string): Promise<boolean> {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Remove data URL prefix
      const base64Data = base64.split(',')[1];

      // Save using Tauri
      await invoke('save_screenshot', { 
        data: base64Data, 
        filename 
      });

      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  /**
   * Copy screenshot to clipboard
   */
  async copyToClipboard(blob: Blob): Promise<boolean> {
    try {
      // Use Clipboard API if available
      if ('ClipboardItem' in window) {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

// Singleton instance
export const screenCaptureService = new ScreenCaptureService();