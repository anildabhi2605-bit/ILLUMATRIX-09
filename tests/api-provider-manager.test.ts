import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  providerManager, 
  sanitizeError, 
  maskApiKey, 
  cleanJsonText,
  detectProvider,
  PROVIDER_REGISTRY,
  SupportedProvider
} from '../src/server/providerManager';

test('Provider Manager - Key Protection and Sanitization across All Providers', async (t) => {
  await t.test('maskApiKey hides secret characters securely', () => {
    assert.equal(maskApiKey(''), 'None configured');
    assert.equal(maskApiKey(undefined), 'None configured');
    assert.equal(maskApiKey('12345678'), '••••••••');
    assert.equal(maskApiKey('AIzaSyD-TestKey123456789'), 'AIza••••6789');
    assert.equal(maskApiKey('sk-proj-abcdef1234567890xyz'), 'sk-p••••0xyz');
    assert.equal(maskApiKey('gsk_1234567890abcdef1234567890'), 'gsk_••••7890');
    assert.equal(maskApiKey('csk-wafer1234567890abcdef'), 'csk-••••cdef');
    assert.equal(maskApiKey('hf_0123456789abcdef0123456789'), 'hf_0••••6789');
  });

  await t.test('sanitizeError scrubs API keys across all 10 provider key prefixes', () => {
    // Google Gemini
    const googleErr = 'GoogleGenAIError: Request failed with key=AIzaSySecretKey123456789 and quota exceeded';
    assert.ok(!sanitizeError(googleErr).includes('AIzaSySecretKey123456789'));
    assert.ok(sanitizeError(googleErr).includes('AIza***') || sanitizeError(googleErr).includes('key=***'));

    // OpenAI Project
    const openAiErr = 'Error: 401 Unauthorized for Bearer sk-proj-1234567890abcdef1234567890';
    assert.ok(!sanitizeError(openAiErr).includes('sk-proj-1234567890abcdef1234567890'));

    // OpenRouter
    const openRouterErr = 'OpenRouterError: Invalid key sk-or-v1-abcdef0123456789abcdef0123456789';
    assert.ok(!sanitizeError(openRouterErr).includes('sk-or-v1-abcdef0123456789abcdef0123456789'));

    // Groq
    const groqErr = 'GroqAPI: 401 Invalid credentials gsk_0123456789abcdef0123456789abcdef';
    assert.ok(!sanitizeError(groqErr).includes('gsk_0123456789abcdef0123456789abcdef'));

    // Cerebras
    const cerebrasErr = 'CerebrasCS3: 403 Forbidden with csk-0123456789abcdef0123456789';
    assert.ok(!sanitizeError(cerebrasErr).includes('csk-0123456789abcdef0123456789'));

    // Hugging Face
    const hfErr = 'HuggingFace: Token rejected hf_0123456789abcdef0123456789abcdef';
    assert.ok(!sanitizeError(hfErr).includes('hf_0123456789abcdef0123456789abcdef'));

    // SambaNova UUID
    const sambaErr = 'SambaNova: Failed request for 550e8400-e29b-41d4-a716-446655440000 key';
    assert.ok(!sanitizeError(sambaErr).includes('550e8400-e29b-41d4-a716-446655440000'));
  });

  await t.test('Public connection representations NEVER expose cleartext API keys', () => {
    const publicConns = providerManager.getPublicConnections();
    for (const conn of publicConns) {
      assert.equal((conn as any).apiKey, undefined, `Connection ${conn.id} leaked raw apiKey in public view!`);
      assert.ok(typeof conn.hasKey === 'boolean');
      assert.ok(typeof conn.maskedKey === 'string');
      if (conn.hasKey && conn.provider !== 'Ollama') {
        assert.ok(conn.maskedKey.includes('••••'));
      }
    }
  });
});

test('Provider Manager - Task 2: Provider Auto-Detection & Ambiguity Handling', async (t) => {
  await t.test('Detects Google Gemini from AIzaSy prefix', () => {
    const res = detectProvider('AIzaSyD_TestGoogleKey123456789');
    assert.equal(res.detectedProvider, 'Google GenAI');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects Groq from gsk_ prefix', () => {
    const res = detectProvider('gsk_testGroqKey1234567890abcdef');
    assert.equal(res.detectedProvider, 'Groq');
    assert.equal(res.confidence, 'reliable');
    assert.equal(res.suggestedModel, 'llama-3.3-70b-versatile');
  });

  await t.test('Detects OpenRouter from sk-or-v1- prefix', () => {
    const res = detectProvider('sk-or-v1-testOpenRouterKey123456789');
    assert.equal(res.detectedProvider, 'OpenRouter');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects Cerebras from csk- prefix', () => {
    const res = detectProvider('csk-cerebrasKey1234567890');
    assert.equal(res.detectedProvider, 'Cerebras');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects Hugging Face from hf_ prefix', () => {
    const res = detectProvider('hf_userToken1234567890abcdef');
    assert.equal(res.detectedProvider, 'Hugging Face');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects SambaNova from 36-char UUID format', () => {
    const res = detectProvider('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
    assert.equal(res.detectedProvider, 'SambaNova');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects Cloudflare Workers AI from accountId or endpoint URL', () => {
    const res = detectProvider('some_token_here', '', '023e105f4ecef8ad9ca31a8372d0c353');
    assert.equal(res.detectedProvider, 'Cloudflare Workers AI');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects Ollama from localhost:11434 endpoint', () => {
    const res = detectProvider('', 'http://localhost:11434');
    assert.equal(res.detectedProvider, 'Ollama');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Detects OpenAI Project key from sk-proj- prefix', () => {
    const res = detectProvider('sk-proj-testOpenAiKey1234567890');
    assert.equal(res.detectedProvider, 'OpenAI');
    assert.equal(res.confidence, 'reliable');
  });

  await t.test('Flags ambiguous generic sk- prefix and asks user to confirm provider', () => {
    const res = detectProvider('sk-genericAmbiguousKey123456789');
    assert.equal(res.detectedProvider, null);
    assert.equal(res.confidence, 'ambiguous');
    assert.ok(res.reason.includes('shared by multiple providers'));
    assert.ok(res.ambiguousOptions?.includes('OpenAI'));
    assert.ok(res.ambiguousOptions?.includes('Mistral AI'));
  });

  await t.test('Flags unclassified strings as ambiguous without guessing', () => {
    const res = detectProvider('unrecognized_custom_token_12345');
    assert.equal(res.detectedProvider, null);
    assert.equal(res.confidence, 'ambiguous');
  });
});

test('Provider Manager - Task 1: Multiple Connections per Provider & CRUD', async (t) => {
  const groqId1 = `conn_groq_work_${Date.now()}`;
  const groqId2 = `conn_groq_personal_${Date.now()}`;

  await t.test('Add multiple distinct connections for the same provider (Groq)', () => {
    const conn1 = providerManager.addOrUpdateConnection({
      id: groqId1,
      name: 'Groq Work LPU Account',
      provider: 'Groq',
      modelId: 'llama-3.3-70b-versatile',
      apiKey: 'gsk_testWorkAccountKey1234567890',
      quotaPool: 'GROQ_WORK_ACCOUNT_POOL',
    });

    const conn2 = providerManager.addOrUpdateConnection({
      id: groqId2,
      name: 'Groq Personal Free Account',
      provider: 'Groq',
      modelId: 'llama-3.1-8b-instant',
      apiKey: 'gsk_testPersonalAccountKey1234567890',
      quotaPool: 'GROQ_PERSONAL_FREE_POOL',
    });

    assert.equal(conn1.id, groqId1);
    assert.equal(conn1.provider, 'Groq');
    assert.equal(conn1.quotaPool, 'GROQ_WORK_ACCOUNT_POOL');

    assert.equal(conn2.id, groqId2);
    assert.equal(conn2.provider, 'Groq');
    assert.equal(conn2.quotaPool, 'GROQ_PERSONAL_FREE_POOL');

    // Both connections exist concurrently
    const publicConns = providerManager.getPublicConnections();
    assert.ok(publicConns.some(c => c.id === groqId1));
    assert.ok(publicConns.some(c => c.id === groqId2));
  });

  await t.test('Switch active connection to second connection', () => {
    const ok = providerManager.setActiveConnectionId(groqId2);
    assert.equal(ok, true);
    assert.equal(providerManager.getActiveConnectionId(), groqId2);

    const creds = providerManager.getEffectiveCredentials(groqId2);
    assert.equal(creds.name, 'Groq Personal Free Account');
    assert.equal(creds.modelId, 'llama-3.1-8b-instant');
    assert.equal(creds.quotaPool, 'GROQ_PERSONAL_FREE_POOL');
  });

  await t.test('Safely deleting active connection re-routes to a valid replacement', () => {
    // Delete groqId2 which is active
    const deleteResult = providerManager.deleteConnection(groqId2);
    assert.equal(deleteResult.success, true);
    assert.ok(deleteResult.switchedActiveTo);
    assert.notEqual(providerManager.getActiveConnectionId(), groqId2);

    // Clean up groqId1
    providerManager.deleteConnection(groqId1);
  });
});

test('Provider Manager - Task 3 & 4: Provider-Specific Adapters & Testing Statuses', async (t) => {
  await t.test('Cloudflare Workers AI returns CONFIG_MISSING when accountId is missing', async () => {
    const cfId = `conn_cf_test_${Date.now()}`;
    providerManager.addOrUpdateConnection({
      id: cfId,
      name: 'Cloudflare Incomplete Node',
      provider: 'Cloudflare Workers AI',
      modelId: '@cf/meta/llama-3.3-70b-instruct',
      apiKey: 'test_bearer_token',
      // accountId deliberately omitted
    });

    const testRes = await providerManager.testConnection(cfId);
    assert.equal(testRes.success, false);
    assert.equal(testRes.errorCategory, 'CONFIG_MISSING');
    assert.ok(testRes.error?.includes('Account ID is required'));

    providerManager.deleteConnection(cfId);
  });

  await t.test('Ollama connection supports key-less configuration', () => {
    const ollamaId = `conn_ollama_local_${Date.now()}`;
    const conn = providerManager.addOrUpdateConnection({
      id: ollamaId,
      name: 'Local Ollama Node',
      provider: 'Ollama',
      modelId: 'llama3.2',
      baseUrl: 'http://localhost:11434',
      apiKey: '', // Empty key permitted for local Ollama!
    });

    assert.equal(conn.provider, 'Ollama');
    assert.equal(conn.hasKey, true); // Ollama is ready without required key
    assert.equal(conn.status, 'untested'); // Untested status, not green!

    providerManager.deleteConnection(ollamaId);
  });

  await t.test('Untested connections are honestly marked as untested, never green', () => {
    const testId = `conn_untested_${Date.now()}`;
    const conn = providerManager.addOrUpdateConnection({
      id: testId,
      name: 'Untested Mistral Node',
      provider: 'Mistral AI',
      modelId: 'mistral-small-latest',
      apiKey: 'test_mistral_key_1234567890',
    });

    assert.equal(conn.status, 'untested');
    assert.equal(conn.lastTestStatus, 'untested');

    providerManager.deleteConnection(testId);
  });

  await t.test('Registry covers all 10 requested providers', () => {
    const requiredProviders: SupportedProvider[] = [
      'Google GenAI',
      'Groq',
      'OpenRouter',
      'Cerebras',
      'Cloudflare Workers AI',
      'Hugging Face',
      'Mistral AI',
      'SambaNova',
      'Ollama',
      'OpenAI'
    ];

    for (const p of requiredProviders) {
      assert.ok(PROVIDER_REGISTRY[p], `Registry is missing provider: ${p}`);
      assert.ok(PROVIDER_REGISTRY[p].defaultModel, `Provider ${p} has no default model`);
      assert.ok(PROVIDER_REGISTRY[p].defaultQuotaPool, `Provider ${p} has no quota pool`);
    }
  });
});
