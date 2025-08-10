// src/components/DebugOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Logger } from '../utils/Logger';

export const DebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(Logger.getLogs());

  useEffect(() => {
    if (isOpen) {
      // Refresh logs when overlay opens
      setLogs(Logger.getLogs());
    }
  }, [isOpen]);

  // Only show in development or when you need it
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
        }}
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 1001,
          padding: '20px',
          color: 'white',
          fontFamily: 'monospace',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #333',
            paddingBottom: '10px',
          }}>
            <h2 style={{ margin: 0 }}>Debug Logs ({logs.length})</h2>
            <div>
              <button
                onClick={() => {
                  Logger.clearLogs();
                  setLogs([]);
                }}
                style={{
                  backgroundColor: '#FF3B30',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Logs Container */}
          <div style={{
            height: 'calc(100% - 80px)',
            overflowY: 'auto',
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.4',
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>
                No logs yet. Start using the app to see debug information.
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: 
                      log.level === 'error' ? '#2D1B1B' :
                      log.level === 'warn' ? '#2D2A1B' :
                      log.level === 'info' ? '#1B2D2D' :
                      '#1B1B2D',
                    borderLeft: `4px solid ${
                      log.level === 'error' ? '#FF3B30' :
                      log.level === 'warn' ? '#FF9500' :
                      log.level === 'info' ? '#007AFF' :
                      '#5856D6'
                    }`,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{
                    color: 
                      log.level === 'error' ? '#FF6B6B' :
                      log.level === 'warn' ? '#FFB84D' :
                      log.level === 'info' ? '#4DA6FF' :
                      '#8E8CE6',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}>
                    [{log.timestamp}] {log.level.toUpperCase()}
                  </div>
                  <div style={{ color: '#E0E0E0', marginBottom: log.data ? '8px' : '0' }}>
                    {log.message}
                  </div>
                  {log.data && (
                    <pre style={{
                      backgroundColor: '#0a0a0a',
                      padding: '8px',
                      borderRadius: '4px',
                      margin: '0',
                      fontSize: '11px',
                      color: '#A0A0A0',
                      overflow: 'auto',
                    }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};