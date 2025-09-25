const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI Provider Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama'; // ollama, openai, github-copilot
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'phi';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_COPILOT_API_KEY = process.env.GITHUB_COPILOT_API_KEY;

// AI Provider Functions
async function callOllama(prompt, options = {}) {
  const payload = {
    model: MODEL_NAME,
    prompt,
    stream: false,
    options: options || {}
  };

  const response = await axios.post(`${OLLAMA_URL}/api/generate`, payload, {
    timeout: 120000,
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data?.response || response.data?.text || 'No response from Ollama';
}

async function callOpenAI(prompt, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const payload = {
    model: options.model || 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000
  };

  const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
    timeout: 30000,
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data?.choices?.[0]?.message?.content || 'No response from OpenAI';
}

async function callGitHubCopilot(prompt, options = {}) {
  if (!GITHUB_COPILOT_API_KEY) {
    throw new Error('GitHub Copilot API key not configured');
  }

  // GitHub Copilot API endpoint (adjust based on actual API)
  const payload = {
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: options.model || 'gpt-4',
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000
  };

  const response = await axios.post('https://api.githubcopilot.com/chat/completions', payload, {
    timeout: 30000,
    headers: {
      'Authorization': `Bearer ${GITHUB_COPILOT_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data?.choices?.[0]?.message?.content || 'No response from GitHub Copilot';
}

// Main AI Generation Function
async function generateAIResponse(prompt, options = {}) {
  try {
    switch (AI_PROVIDER.toLowerCase()) {
      case 'openai':
        return await callOpenAI(prompt, options);
      case 'github-copilot':
        return await callGitHubCopilot(prompt, options);
      case 'ollama':
      default:
        return await callOllama(prompt, options);
    }
  } catch (error) {
    console.error(`Error with ${AI_PROVIDER}:`, error.message);
    
    // Fallback to Ollama if other providers fail
    if (AI_PROVIDER !== 'ollama') {
      try {
        console.log('Falling back to Ollama...');
        return await callOllama(prompt, options);
      } catch (ollamaError) {
        throw new Error(`All AI providers failed. ${AI_PROVIDER}: ${error.message}, Ollama: ${ollamaError.message}`);
      }
    }
    throw error;
  }
}

// POST /api/ai/generate
// body: { prompt: "Explain X", options: { temperature, max_tokens, model } }
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const response = await generateAIResponse(prompt, options);
    
    // Return consistent response format
    res.json({
      response: response,
      provider: AI_PROVIDER,
      success: true
    });
  } catch (err) {
    console.error('AI error', err?.response?.data || err.message);
    res.status(500).json({ 
      error: 'AI backend error', 
      details: err?.response?.data || err.message,
      provider: AI_PROVIDER,
      success: false
    });
  }
});

// GET /api/ai/providers - Get available providers and current status
router.get('/providers', (req, res) => {
  const providers = {
    current: AI_PROVIDER,
    available: [
      {
        name: 'ollama',
        enabled: true,
        description: 'Local Ollama instance'
      },
      {
        name: 'openai',
        enabled: !!OPENAI_API_KEY,
        description: 'OpenAI GPT models'
      },
      {
        name: 'github-copilot',
        enabled: !!GITHUB_COPILOT_API_KEY,
        description: 'GitHub Copilot API'
      }
    ]
  };
  
  res.json(providers);
});

module.exports = router;
