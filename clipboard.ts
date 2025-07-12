// Enhanced clipboard utility with robust fallbacks
// Handles various browser environments and permission issues

interface ClipboardResult {
  success: boolean;
  error?: string;
  method?: 'navigator' | 'legacy' | 'fallback';
}

// Check if Clipboard API is available and allowed
const isClipboardApiAvailable = (): boolean => {
  try {
    return !!(
      navigator?.clipboard?.writeText && 
      window.isSecureContext && 
      typeof navigator.clipboard.writeText === 'function'
    );
  } catch {
    return false;
  }
};

// Check if we're in a secure context
const isSecureContext = (): boolean => {
  try {
    return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  } catch {
    return false;
  }
};

// Modern Clipboard API method
const copyWithClipboardApi = async (text: string): Promise<ClipboardResult> => {
  try {
    if (!isClipboardApiAvailable()) {
      throw new Error('Clipboard API not available');
    }

    await navigator.clipboard.writeText(text);
    console.log('✅ Copied with Clipboard API');
    return { success: true, method: 'navigator' };
  } catch (error) {
    console.warn('❌ Clipboard API failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Clipboard API failed',
      method: 'navigator'
    };
  }
};

// Legacy execCommand method
const copyWithExecCommand = (text: string): ClipboardResult => {
  try {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      console.log('✅ Copied with execCommand');
      return { success: true, method: 'legacy' };
    } else {
      throw new Error('execCommand returned false');
    }
  } catch (error) {
    console.warn('❌ execCommand failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'execCommand failed',
      method: 'legacy'
    };
  }
};

// Fallback selection method (for mobile)
const copyWithSelection = (text: string): ClipboardResult => {
  try {
    // Create a temporary input element
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.style.opacity = '0';
    input.setAttribute('readonly', '');
    
    document.body.appendChild(input);
    
    // Focus and select the text
    input.focus();
    input.select();
    
    // For mobile devices, try to trigger selection
    if (input.setSelectionRange) {
      input.setSelectionRange(0, text.length);
    }
    
    // Try to copy
    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (e) {
      // execCommand might not work, but text might still be selected
    }
    
    document.body.removeChild(input);
    
    if (successful) {
      console.log('✅ Copied with selection fallback');
      return { success: true, method: 'fallback' };
    } else {
      // Even if execCommand failed, the text might be selected for manual copy
      console.log('⚠️  Text selected for manual copy');
      return { 
        success: false, 
        error: 'Text selected - use Ctrl+C (Cmd+C) to copy',
        method: 'fallback'
      };
    }
  } catch (error) {
    console.warn('❌ Selection fallback failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Selection failed',
      method: 'fallback'
    };
  }
};

// Main copy function with multiple fallbacks
export const copyToClipboard = async (text: string): Promise<ClipboardResult> => {
  console.log('📋 Attempting to copy text:', text.substring(0, 50) + '...');
  
  // Validate input
  if (!text || typeof text !== 'string') {
    return { 
      success: false, 
      error: 'Invalid text provided' 
    };
  }

  // Check environment
  const environment = {
    isSecureContext: isSecureContext(),
    hasClipboardApi: isClipboardApiAvailable(),
    hasExecCommand: typeof document.execCommand === 'function',
    userAgent: navigator?.userAgent || 'unknown'
  };
  
  console.log('🌍 Copy environment:', environment);

  // Try methods in order of preference
  
  // 1. Try modern Clipboard API first (if available and in secure context)
  if (environment.hasClipboardApi && environment.isSecureContext) {
    const result = await copyWithClipboardApi(text);
    if (result.success) {
      return result;
    }
  }

  // 2. Try legacy execCommand method
  if (environment.hasExecCommand) {
    const result = copyWithExecCommand(text);
    if (result.success) {
      return result;
    }
  }

  // 3. Try selection fallback method
  const result = copyWithSelection(text);
  if (result.success) {
    return result;
  }

  // All methods failed
  console.error('❌ All copy methods failed');
  return {
    success: false,
    error: 'Unable to copy to clipboard. Try selecting the text manually and using Ctrl+C (Cmd+C).',
    method: 'fallback'
  };
};

// Utility to check if copying is likely to work
export const canCopyToClipboard = (): { canCopy: boolean; reason?: string; suggestions?: string[] } => {
  const environment = {
    isSecureContext: isSecureContext(),
    hasClipboardApi: isClipboardApiAvailable(),
    hasExecCommand: typeof document.execCommand === 'function',
    hasDocument: typeof document !== 'undefined'
  };

  console.log('🔍 Clipboard capability check:', environment);

  if (!environment.hasDocument) {
    return { 
      canCopy: false, 
      reason: 'Document not available (SSR environment)',
      suggestions: ['Wait for client-side rendering']
    };
  }

  if (environment.hasClipboardApi && environment.isSecureContext) {
    return { canCopy: true };
  }

  if (environment.hasExecCommand) {
    return { canCopy: true };
  }

  const suggestions = [];
  
  if (!environment.isSecureContext) {
    suggestions.push('Use HTTPS or localhost');
  }
  
  if (!environment.hasClipboardApi && !environment.hasExecCommand) {
    suggestions.push('Use a modern browser');
    suggestions.push('Enable JavaScript');
  }

  return {
    canCopy: false,
    reason: 'No clipboard methods available',
    suggestions
  };
};

// Check if clipboard is supported (simple boolean)
export const isClipboardSupported = (): boolean => {
  return canCopyToClipboard().canCopy;
};

// Download file function
export const downloadAsFile = (content: string, filename: string, mimeType: string = 'text/plain'): boolean => {
  try {
    // Create blob
    const blob = new Blob([content], { type: mimeType });
    
    // Create temporary URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('✅ File downloaded successfully:', filename);
    return true;
  } catch (error) {
    console.error('❌ Download failed:', error);
    return false;
  }
};

// Share text using Web Share API (mobile-friendly)
export const shareText = async (text: string, title?: string): Promise<boolean> => {
  try {
    // Check if Web Share API is available
    if (!navigator.share) {
      console.log('🚫 Web Share API not available');
      return false;
    }
    
    const shareData: ShareData = {
      text: text,
      title: title || 'Shared Text'
    };
    
    await navigator.share(shareData);
    console.log('✅ Text shared successfully');
    return true;
  } catch (error) {
    // User cancelled sharing or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('📤 User cancelled sharing');
    } else {
      console.error('❌ Share failed:', error);
    }
    return false;
  }
};

// Generate a user-friendly error message
export const getClipboardErrorMessage = (result: ClipboardResult): string => {
  if (result.success) {
    return 'Copiado com sucesso!';
  }

  const baseMessage = 'Não foi possível copiar automaticamente.';
  
  if (result.error?.includes('not allowed') || result.error?.includes('NotAllowedError')) {
    return `${baseMessage} Por favor, selecione o texto e use Ctrl+C (Cmd+C) para copiar.`;
  }
  
  if (result.error?.includes('not supported') || result.error?.includes('not available')) {
    return `${baseMessage} Seu navegador não suporta cópia automática.`;
  }
  
  if (result.error?.includes('secure context') || result.error?.includes('https')) {
    return `${baseMessage} A cópia automática requer HTTPS.`;
  }

  return `${baseMessage} Use Ctrl+C (Cmd+C) para copiar o texto selecionado.`;
};

// Demo/test function for debugging
export const testClipboard = async (): Promise<void> => {
  console.log('🧪 Testing clipboard functionality...');
  
  const capability = canCopyToClipboard();
  console.log('📋 Clipboard capability:', capability);
  
  const testText = 'Test clipboard functionality';
  const result = await copyToClipboard(testText);
  console.log('📋 Test result:', result);
  
  if (result.success) {
    console.log('✅ Clipboard test passed');
  } else {
    console.log('❌ Clipboard test failed:', result.error);
    console.log('💡 Suggestions:', capability.suggestions);
  }
};

// Export the main copy function as default
export default copyToClipboard;

// Additional utility for copying with user feedback
export const copyWithFeedback = async (
  text: string,
  onSuccess?: (method: string) => void,
  onError?: (error: string) => void
): Promise<boolean> => {
  const result = await copyToClipboard(text);
  
  if (result.success) {
    const method = result.method || 'unknown';
    console.log(`✅ Copy successful via ${method}`);
    onSuccess?.(method);
    return true;
  } else {
    const errorMessage = getClipboardErrorMessage(result);
    console.log('❌ Copy failed:', errorMessage);
    onError?.(errorMessage);
    return false;
  }
};

// Browser/environment detection utilities
export const getBrowserInfo = () => {
  const userAgent = navigator?.userAgent || '';
  
  return {
    isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isEdge: /Edge/.test(userAgent),
    isMobile: /Mobi|Android/i.test(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isSecureContext: isSecureContext(),
    hasClipboardApi: isClipboardApiAvailable(),
    hasWebShare: !!navigator.share,
    hasDownload: typeof document !== 'undefined' && 'download' in document.createElement('a')
  };
};

// Get best available sharing method for current environment
export const getBestSharingMethod = () => {
  const browser = getBrowserInfo();
  
  if (browser.hasWebShare && browser.isMobile) {
    return 'share';
  }
  
  if (browser.hasClipboardApi && browser.isSecureContext) {
    return 'clipboard';
  }
  
  if (browser.hasDownload) {
    return 'download';
  }
  
  return 'manual';
};

// All-in-one sharing function that picks the best method
export const smartShare = async (
  content: string, 
  options: {
    title?: string;
    filename?: string;
    mimeType?: string;
    preferredMethod?: 'share' | 'clipboard' | 'download' | 'auto';
  } = {}
): Promise<{ success: boolean; method: string; error?: string }> => {
  
  const { 
    title = 'Shared Content', 
    filename = 'content.txt', 
    mimeType = 'text/plain',
    preferredMethod = 'auto'
  } = options;
  
  let method = preferredMethod;
  
  if (method === 'auto') {
    method = getBestSharingMethod() as any;
  }
  
  console.log(`🎯 Smart share using method: ${method}`);
  
  try {
    switch (method) {
      case 'share':
        const shareSuccess = await shareText(content, title);
        if (shareSuccess) {
          return { success: true, method: 'share' };
        }
        // Fallback to clipboard
        const clipboardResult = await copyToClipboard(content);
        return { 
          success: clipboardResult.success, 
          method: 'clipboard-fallback',
          error: clipboardResult.error 
        };
        
      case 'clipboard':
        const clipResult = await copyToClipboard(content);
        return { 
          success: clipResult.success, 
          method: 'clipboard',
          error: clipResult.error 
        };
        
      case 'download':
        const downloadSuccess = downloadAsFile(content, filename, mimeType);
        return { 
          success: downloadSuccess, 
          method: 'download',
          error: downloadSuccess ? undefined : 'Download failed' 
        };
        
      default:
        return { 
          success: false, 
          method: 'manual',
          error: 'No automatic sharing method available' 
        };
    }
  } catch (error) {
    return { 
      success: false, 
      method: method,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};