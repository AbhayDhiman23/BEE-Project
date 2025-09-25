import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SERVER = (import.meta.env.VITE_SERVER_URL) || 'http://localhost:4000';

export default function AISettings({ isOpen, onClose }) {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${SERVER}/api/ai/providers`);
      setProviders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setLoading(false);
    }
  };

  const testProvider = async (providerName) => {
    setTestResults(prev => ({ ...prev, [providerName]: 'testing' }));
    
    try {
      const response = await axios.post(`${SERVER}/api/ai/generate`, {
        prompt: 'Say "Hello! I am working correctly." in a friendly way.',
        options: { provider: providerName }
      });
      
      if (response.data.success) {
        setTestResults(prev => ({ ...prev, [providerName]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-settings-overlay">
      <div className="ai-settings-modal">
        <div className="ai-settings-header">
          <h2>⚙️ AI Provider Settings</h2>
          <button onClick={onClose} className="close-btn">✖️</button>
        </div>

        <div className="ai-settings-content">
          {loading ? (
            <div className="loading">Loading providers...</div>
          ) : (
            <>
              <div className="current-provider">
                <h3>Current Provider: <span className="provider-name">{providers.current}</span></h3>
              </div>

              <div className="providers-list">
                <h3>Available Providers</h3>
                {providers.available?.map(provider => (
                  <div key={provider.name} className={`provider-card ${!provider.enabled ? 'disabled' : ''}`}>
                    <div className="provider-info">
                      <div className="provider-header">
                        <h4>{provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}</h4>
                        <div className={`status-indicator ${provider.enabled ? 'enabled' : 'disabled'}`}>
                          {provider.enabled ? '✅ Configured' : '❌ Not Configured'}
                        </div>
                      </div>
                      <p>{provider.description}</p>
                    </div>
                    
                    {provider.enabled && (
                      <div className="provider-actions">
                        <button 
                          onClick={() => testProvider(provider.name)}
                          disabled={testResults[provider.name] === 'testing'}
                          className="test-btn"
                        >
                          {testResults[provider.name] === 'testing' ? '🔄 Testing...' :
                           testResults[provider.name] === 'success' ? '✅ Test Passed' :
                           testResults[provider.name] === 'error' ? '❌ Test Failed' :
                           '🧪 Test Connection'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="api-key-setup">
                <h3>🔐 API Key Setup Instructions</h3>
                <div className="setup-instructions">
                  <div className="instruction-card">
                    <h4>OpenAI API Key</h4>
                    <ol>
                      <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a></li>
                      <li>Create a new API key</li>
                      <li>Copy the key and add it to your backend .env file: <code>OPENAI_API_KEY=your_key_here</code></li>
                      <li>Set <code>AI_PROVIDER=openai</code> in your .env file</li>
                      <li>Restart the backend server</li>
                    </ol>
                  </div>
                  
                  <div className="instruction-card">
                    <h4>GitHub Copilot API Key</h4>
                    <ol>
                      <li>Go to <a href="https://github.com/settings/copilot" target="_blank" rel="noopener noreferrer">GitHub Copilot Settings</a></li>
                      <li>Generate an API key</li>
                      <li>Copy the key and add it to your backend .env file: <code>GITHUB_COPILOT_API_KEY=your_key_here</code></li>
                      <li>Set <code>AI_PROVIDER=github-copilot</code> in your .env file</li>
                      <li>Restart the backend server</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="performance-comparison">
                <h3>📊 Provider Comparison</h3>
                <div className="comparison-table">
                  <div className="comparison-row header">
                    <div>Provider</div>
                    <div>Speed</div>
                    <div>Quality</div>
                    <div>Cost</div>
                  </div>
                  <div className="comparison-row">
                    <div>Ollama (Local)</div>
                    <div>⭐⭐ Slow</div>
                    <div>⭐⭐⭐ Good</div>
                    <div>⭐⭐⭐⭐⭐ Free</div>
                  </div>
                  <div className="comparison-row">
                    <div>OpenAI GPT</div>
                    <div>⭐⭐⭐⭐⭐ Very Fast</div>
                    <div>⭐⭐⭐⭐⭐ Excellent</div>
                    <div>⭐⭐⭐ Paid</div>
                  </div>
                  <div className="comparison-row">
                    <div>GitHub Copilot</div>
                    <div>⭐⭐⭐⭐ Fast</div>
                    <div>⭐⭐⭐⭐⭐ Excellent</div>
                    <div>⭐⭐⭐⭐ Subscription</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}