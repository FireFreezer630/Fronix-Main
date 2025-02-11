import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Code as CodeIcon, Layout, Maximize2, Minimize2 } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  language: string;
  onClose: () => void;
}

interface CodeState {
  html: string;
  css: string;
  javascript: string;
}

export default function CodePreview({ code, language, onClose }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState(language);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  
  const [codeState, setCodeState] = useState<CodeState>(() => {
    const initialState = {
      html: '',
      css: '',
      javascript: ''
    };

    const processedCode = code.trim();
    
    // Check if the code is a complete HTML document
    if (processedCode.includes('<!DOCTYPE html>') && processedCode.includes('</html>')) {
      initialState.html = processedCode;
      setActiveTab('html');
      return initialState;
    }

    switch (language.toLowerCase()) {
      case 'html':
        initialState.html = processedCode;
        break;
      case 'css':
        initialState.css = processedCode;
        break;
      case 'javascript':
      case 'js':
        initialState.javascript = processedCode;
        break;
      default:
        // Auto-detect content type
        if (processedCode.includes('<html') || processedCode.includes('<body') || processedCode.includes('<div')) {
          initialState.html = processedCode;
          setActiveTab('html');
        } else if (processedCode.includes('{') && processedCode.includes('}') && 
                  (processedCode.includes(':') || processedCode.includes('@media'))) {
          initialState.css = processedCode;
          setActiveTab('css');
        } else {
          initialState.javascript = processedCode;
          setActiveTab('javascript');
        }
    }

    return initialState;
  });

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Base styles */
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              background-color: white;
              line-height: 1.5;
            }
            #console-output {
              margin-top: 20px;
              padding: 10px;
              border-top: 1px solid #eee;
            }
            .console-line {
              font-family: monospace;
              padding: 4px 8px;
              margin: 4px 0;
              border-radius: 4px;
            }
            .console-log {
              background-color: #f5f5f5;
            }
            .console-error {
              background-color: #fee2e2;
              color: #dc2626;
            }
            /* User CSS */
            ${codeState.css}
          </style>
        </head>
        <body>
          ${codeState.html || '<div id="root"></div>'}
          <div id="console-output"></div>
          <script>
            // Console wrapper
            const consoleOutput = document.getElementById('console-output');
            const originalConsole = window.console;
            
            window.console = {
              log: (...args) => {
                originalConsole.log(...args);
                const line = document.createElement('div');
                line.className = 'console-line console-log';
                line.textContent = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                consoleOutput.appendChild(line);
              },
              error: (...args) => {
                originalConsole.error(...args);
                const line = document.createElement('div');
                line.className = 'console-line console-error';
                line.textContent = args.map(arg => 
                  arg instanceof Error ? arg.message : 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                consoleOutput.appendChild(line);
              }
            };

            // Execute user JavaScript
            try {
              ${codeState.javascript}
            } catch (error) {
              console.error('Runtime Error:', error.message);
            }
          </script>
        </body>
      </html>
    `;

    // Create and set blob URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;

    return () => URL.revokeObjectURL(url);
  }, [codeState]);

  // Update preview when code state changes
  useEffect(() => {
    if (showPreview) {
      const cleanup = updatePreview();
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [codeState, showPreview, updatePreview]);

  const handleCodeChange = (value: string, type: keyof CodeState) => {
    setCodeState(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const tabs = [
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'javascript', label: 'JavaScript' },
  ];

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-[#202123] rounded-lg w-full flex flex-col ${isFullscreen ? 'h-full rounded-none' : 'max-w-4xl h-[80vh]'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <CodeIcon size={18} />
              Code Preview
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-2 rounded-md transition-colors ${
                  showPreview ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700 text-gray-400'
                }`}
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                <Layout size={16} />
              </button>
              <button
                onClick={updatePreview}
                className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white"
                title="Run Code"
              >
                <Play size={16} />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-gray-600 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full flex flex-col transition-all`}>
            <textarea
              value={codeState[activeTab as keyof CodeState]}
              onChange={(e) => handleCodeChange(e.target.value, activeTab as keyof CodeState)}
              className="flex-1 w-full bg-[#2A2B32] text-white p-4 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
              placeholder={`Enter ${activeTab} code here...`}
            />
          </div>

          {showPreview && (
            <div className="w-1/2 border-l border-gray-600">
              <iframe
                ref={iframeRef}
                className="w-full h-full bg-white"
                sandbox="allow-scripts"
                title="Code Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
