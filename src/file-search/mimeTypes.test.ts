import {
  EXTENSION_TO_MIME,
  TEXT_FALLBACK_EXTENSIONS,
  FILE_SIZE_LIMITS,
  UnsupportedFileTypeError,
  FileSizeExceededError,
  FileUploadError,
  isExtensionSupported,
  getMimeType,
  getSupportedExtensions,
  getMimeTypeWithFallback,
  isExtensionSupportedWithFallback,
  getFallbackExtensions,
} from './mimeTypes';

describe('mimeTypes', () => {
  describe('EXTENSION_TO_MIME', () => {
    it('should have exactly 36 validated MIME type mappings', () => {
      const extensions = Object.keys(EXTENSION_TO_MIME);
      expect(extensions.length).toBe(36);
    });

    it('should use lowercase extensions with leading dots', () => {
      const extensions = Object.keys(EXTENSION_TO_MIME);

      for (const ext of extensions) {
        // Allow dots, letters, numbers, and plus signs in extensions (e.g., .d.ts, .c++)
        expect(ext).toMatch(/^\.[a-z0-9+.]+$/);
        expect(ext[0]).toBe('.');
        expect(ext).toBe(ext.toLowerCase());
      }
    });

    it('should have valid MIME type format', () => {
      const mimeTypes = Object.values(EXTENSION_TO_MIME);

      for (const mimeType of mimeTypes) {
        // MIME types should be in format: type/subtype
        expect(mimeType).toMatch(/^[a-z]+\/[a-z0-9+.-]+$/i);
      }
    });

    it('should include validated application types', () => {
      expect(EXTENSION_TO_MIME['.pdf']).toBe('application/pdf');
      expect(EXTENSION_TO_MIME['.xml']).toBe('application/xml');
    });

    it('should include validated programming languages', () => {
      expect(EXTENSION_TO_MIME['.py']).toBe('text/x-python');
      expect(EXTENSION_TO_MIME['.java']).toBe('text/x-java');
      expect(EXTENSION_TO_MIME['.c']).toBe('text/x-c');
      expect(EXTENSION_TO_MIME['.go']).toBe('text/x-go');
      expect(EXTENSION_TO_MIME['.kt']).toBe('text/x-kotlin');
      expect(EXTENSION_TO_MIME['.pl']).toBe('text/x-perl');
      expect(EXTENSION_TO_MIME['.lua']).toBe('text/x-lua');
      expect(EXTENSION_TO_MIME['.erl']).toBe('text/x-erlang');
    });

    it('should include validated markup formats', () => {
      expect(EXTENSION_TO_MIME['.html']).toBe('text/html');
      expect(EXTENSION_TO_MIME['.md']).toBe('text/markdown');
      expect(EXTENSION_TO_MIME['.xml']).toBe('application/xml');
    });

    it('should include validated configuration formats', () => {
      expect(EXTENSION_TO_MIME['.env']).toBe('text/plain');
      expect(EXTENSION_TO_MIME['.gitignore']).toBe('text/plain');
      expect(EXTENSION_TO_MIME['.gitattributes']).toBe('text/plain');
    });
  });

  describe('FILE_SIZE_LIMITS', () => {
    it('should have correct 100 MB limit', () => {
      expect(FILE_SIZE_LIMITS.MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024);
      expect(FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB).toBe(100);
    });
  });

  describe('isExtensionSupported', () => {
    it('should return true for validated extensions', () => {
      expect(isExtensionSupported('.py')).toBe(true);
      expect(isExtensionSupported('.pdf')).toBe(true);
      expect(isExtensionSupported('.java')).toBe(true);
      expect(isExtensionSupported('.md')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(isExtensionSupported('.exe')).toBe(false);
      expect(isExtensionSupported('.dll')).toBe(false);
      expect(isExtensionSupported('.so')).toBe(false);
      expect(isExtensionSupported('.unknown')).toBe(false);
      // These failed API validation and are now handled by fallback mechanism
      expect(isExtensionSupported('.js')).toBe(false);
      expect(isExtensionSupported('.ts')).toBe(false);
      expect(isExtensionSupported('.json')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isExtensionSupported('.PY')).toBe(true);
      expect(isExtensionSupported('.Pdf')).toBe(true);
      expect(isExtensionSupported('.MD')).toBe(true);
      expect(isExtensionSupported('.Java')).toBe(true);
    });

    it('should work with or without leading dot', () => {
      expect(isExtensionSupported('.py')).toBe(true);
      expect(isExtensionSupported('py')).toBe(true);
      expect(isExtensionSupported('.pdf')).toBe(true);
      expect(isExtensionSupported('pdf')).toBe(true);
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for file path', () => {
      expect(getMimeType('/path/to/file.py')).toBe('text/x-python');
      expect(getMimeType('/path/to/file.pdf')).toBe('application/pdf');
      expect(getMimeType('/path/to/file.java')).toBe('text/x-java');
      expect(getMimeType('/path/to/file.md')).toBe('text/markdown');
    });

    it('should handle file paths without directories', () => {
      expect(getMimeType('file.py')).toBe('text/x-python');
      expect(getMimeType('test.pdf')).toBe('application/pdf');
    });

    it('should be case-insensitive', () => {
      expect(getMimeType('file.PY')).toBe('text/x-python');
      expect(getMimeType('file.PDF')).toBe('application/pdf');
      expect(getMimeType('file.MD')).toBe('text/markdown');
    });

    it('should return null for unsupported extensions', () => {
      expect(getMimeType('file.exe')).toBeNull();
      expect(getMimeType('file.dll')).toBeNull();
      expect(getMimeType('file.unknown')).toBeNull();
      // These failed API validation (handled by fallback, not getMimeType)
      expect(getMimeType('file.js')).toBeNull();
      expect(getMimeType('file.ts')).toBeNull();
      expect(getMimeType('file.json')).toBeNull();
    });

    it('should return null for files without extensions', () => {
      expect(getMimeType('README')).toBeNull();
      expect(getMimeType('Makefile')).toBeNull();
    });

    it('should handle complex file paths', () => {
      expect(getMimeType('/home/user/projects/app/src/main.py')).toBe('text/x-python');
      expect(getMimeType('C:\\Users\\test\\document.pdf')).toBe('application/pdf');
    });

    it('should handle multiple dots in filename', () => {
      expect(getMimeType('file.test.py')).toBe('text/x-python');
      expect(getMimeType('component.spec.java')).toBe('text/x-java');
      expect(getMimeType('README.md')).toBe('text/markdown');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return all supported extensions', () => {
      const extensions = getSupportedExtensions();
      expect(extensions).toBeInstanceOf(Array);
      expect(extensions.length).toBe(36);
    });

    it('should include common validated extensions', () => {
      const extensions = getSupportedExtensions();
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.md');
      expect(extensions).toContain('.java');
      expect(extensions).toContain('.go');
    });

    it('should return extensions with leading dots', () => {
      const extensions = getSupportedExtensions();
      for (const ext of extensions) {
        expect(ext).toMatch(/^\./);
      }
    });
  });

  describe('TEXT_FALLBACK_EXTENSIONS', () => {
    it('should include common programming languages', () => {
      expect(TEXT_FALLBACK_EXTENSIONS.has('.js')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.ts')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.jsx')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.tsx')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.rb')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.php')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.rs')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.swift')).toBe(true);
    });

    it('should include configuration formats', () => {
      expect(TEXT_FALLBACK_EXTENSIONS.has('.json')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.yaml')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.yml')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.toml')).toBe(true);
    });

    it('should include web technologies', () => {
      expect(TEXT_FALLBACK_EXTENSIONS.has('.css')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.scss')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.vue')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.svelte')).toBe(true);
    });

    it('should include shell scripts', () => {
      expect(TEXT_FALLBACK_EXTENSIONS.has('.sh')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.bash')).toBe(true);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.zsh')).toBe(true);
    });

    it('should NOT include validated extensions', () => {
      // These are in EXTENSION_TO_MIME, not fallback
      expect(TEXT_FALLBACK_EXTENSIONS.has('.py')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.java')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.go')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.pdf')).toBe(false);
    });

    it('should NOT include binary file types', () => {
      expect(TEXT_FALLBACK_EXTENSIONS.has('.exe')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.dll')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.zip')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.png')).toBe(false);
      expect(TEXT_FALLBACK_EXTENSIONS.has('.jpg')).toBe(false);
    });
  });

  describe('getMimeTypeWithFallback', () => {
    it('should return validated MIME types without fallback flag', () => {
      const result = getMimeTypeWithFallback('/path/to/file.py');
      expect(result).toEqual({ mimeType: 'text/x-python', isFallback: false });
    });

    it('should return text/plain with fallback flag for text files', () => {
      const result = getMimeTypeWithFallback('/path/to/file.js');
      expect(result).toEqual({ mimeType: 'text/plain', isFallback: true });
    });

    it('should return null for unsupported file types', () => {
      expect(getMimeTypeWithFallback('/path/to/file.exe')).toBeNull();
      expect(getMimeTypeWithFallback('/path/to/file.dll')).toBeNull();
      expect(getMimeTypeWithFallback('/path/to/file.png')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(getMimeTypeWithFallback('file.JS')).toEqual({ mimeType: 'text/plain', isFallback: true });
      expect(getMimeTypeWithFallback('file.PY')).toEqual({ mimeType: 'text/x-python', isFallback: false });
    });

    it('should handle common web development files', () => {
      expect(getMimeTypeWithFallback('app.tsx')).toEqual({ mimeType: 'text/plain', isFallback: true });
      expect(getMimeTypeWithFallback('styles.css')).toEqual({ mimeType: 'text/plain', isFallback: true });
      expect(getMimeTypeWithFallback('config.json')).toEqual({ mimeType: 'text/plain', isFallback: true });
      expect(getMimeTypeWithFallback('package.yaml')).toEqual({ mimeType: 'text/plain', isFallback: true });
    });
  });

  describe('isExtensionSupportedWithFallback', () => {
    it('should return true for validated extensions', () => {
      expect(isExtensionSupportedWithFallback('.py')).toBe(true);
      expect(isExtensionSupportedWithFallback('.pdf')).toBe(true);
      expect(isExtensionSupportedWithFallback('.java')).toBe(true);
    });

    it('should return true for fallback extensions', () => {
      expect(isExtensionSupportedWithFallback('.js')).toBe(true);
      expect(isExtensionSupportedWithFallback('.ts')).toBe(true);
      expect(isExtensionSupportedWithFallback('.json')).toBe(true);
      expect(isExtensionSupportedWithFallback('.css')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(isExtensionSupportedWithFallback('.exe')).toBe(false);
      expect(isExtensionSupportedWithFallback('.dll')).toBe(false);
      expect(isExtensionSupportedWithFallback('.zip')).toBe(false);
      expect(isExtensionSupportedWithFallback('.png')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isExtensionSupportedWithFallback('.JS')).toBe(true);
      expect(isExtensionSupportedWithFallback('.TS')).toBe(true);
      expect(isExtensionSupportedWithFallback('.PY')).toBe(true);
    });

    it('should work with or without leading dot', () => {
      expect(isExtensionSupportedWithFallback('js')).toBe(true);
      expect(isExtensionSupportedWithFallback('.js')).toBe(true);
      expect(isExtensionSupportedWithFallback('py')).toBe(true);
      expect(isExtensionSupportedWithFallback('.py')).toBe(true);
    });
  });

  describe('getFallbackExtensions', () => {
    it('should return an array of fallback extensions', () => {
      const extensions = getFallbackExtensions();
      expect(extensions).toBeInstanceOf(Array);
      expect(extensions.length).toBeGreaterThan(50);
    });

    it('should include common fallback extensions', () => {
      const extensions = getFallbackExtensions();
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.json');
      expect(extensions).toContain('.css');
    });

    it('should return extensions with leading dots', () => {
      const extensions = getFallbackExtensions();
      for (const ext of extensions) {
        expect(ext).toMatch(/^\./);
      }
    });
  });

  describe('UnsupportedFileTypeError', () => {
    it('should format error message correctly', () => {
      const error = new UnsupportedFileTypeError('/path/to/file.exe', '.exe');

      expect(error.message).toContain('Unsupported file type');
      expect(error.message).toContain('/path/to/file.exe');
      expect(error.message).toContain('.exe');
      expect(error.message).toContain('Supported extensions include');
      expect(error.name).toBe('UnsupportedFileTypeError');
    });

    it('should include sample of supported extensions', () => {
      const error = new UnsupportedFileTypeError('/path/to/file.exe', '.exe');

      // Should include at least 10 example extensions
      expect(error.message).toMatch(/\.(js|ts|py|pdf|md)/);
    });

    it('should include total count of supported extensions', () => {
      const error = new UnsupportedFileTypeError('/path/to/file.exe', '.exe');
      const totalCount = getSupportedExtensions().length;

      expect(error.message).toContain(`${totalCount} total`);
    });

    it('should include link to API documentation', () => {
      const error = new UnsupportedFileTypeError('/path/to/file.exe', '.exe');

      expect(error.message).toContain('https://ai.google.dev/gemini-api/docs/file-search#supported-files');
    });
  });

  describe('FileSizeExceededError', () => {
    it('should format error message with MB conversion', () => {
      const sizeBytes = 150 * 1024 * 1024; // 150 MB
      const limitBytes = 100 * 1024 * 1024; // 100 MB
      const error = new FileSizeExceededError('/path/to/file.pdf', sizeBytes, limitBytes);

      expect(error.message).toContain('File size exceeded');
      expect(error.message).toContain('/path/to/file.pdf');
      expect(error.message).toContain('150.00 MB');
      expect(error.message).toContain('100.00 MB');
      expect(error.name).toBe('FileSizeExceededError');
    });

    it('should format small file sizes correctly', () => {
      const sizeBytes = 1.5 * 1024 * 1024; // 1.5 MB
      const limitBytes = 1 * 1024 * 1024; // 1 MB
      const error = new FileSizeExceededError('/path/to/file.txt', sizeBytes, limitBytes);

      expect(error.message).toContain('1.50 MB');
      expect(error.message).toContain('1.00 MB');
    });

    it('should handle exact limit boundary', () => {
      const sizeBytes = 100 * 1024 * 1024 + 1; // 100 MB + 1 byte
      const limitBytes = 100 * 1024 * 1024;
      const error = new FileSizeExceededError('/path/to/file.bin', sizeBytes, limitBytes);

      expect(error.message).toContain('100.00 MB');
    });
  });

  describe('FileUploadError', () => {
    it('should wrap original error message', () => {
      const originalError = new Error('Network timeout');
      const error = new FileUploadError('/path/to/file.pdf', originalError);

      expect(error.message).toContain('Failed to upload');
      expect(error.message).toContain('/path/to/file.pdf');
      expect(error.message).toContain('Network timeout');
      expect(error.name).toBe('FileUploadError');
    });

    it('should preserve original error as cause', () => {
      const originalError = new Error('API error');
      const error = new FileUploadError('/path/to/file.pdf', originalError);

      expect(error.cause).toBe(originalError);
    });

    it('should handle errors without message property', () => {
      const originalError = { toString: () => 'Unknown error' };
      const error = new FileUploadError('/path/to/file.pdf', originalError);

      expect(error.message).toContain('Failed to upload');
      expect(error.message).toContain('/path/to/file.pdf');
    });
  });
});
