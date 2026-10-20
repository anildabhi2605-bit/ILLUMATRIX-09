import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { 
  X, 
  Cpu, 
  Key, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Server,
  Layers,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Tag,
  ChevronRight,
  Info,
  Coins,
  Shield,
  SlidersHorizontal
} from 'lucide-react';
import { ProviderConnection, SupportedProvider, DiscoveredModel, AccountLimitSnapshot, ModelPricing, ModelCapability } from '../../types/hud';
import { AIService } from '../../services/aiService';

const PROVIDER_OPTIONS: Array<{
  id: SupportedProvider;
  name: string;
  badge: string;
  defaultModel: string;
  models: string[];
  defaultBaseUrl?: string;
  defaultQuotaPool: string;
  requiresKey: boolean;
  requiresAccountId?: boolean;
  placeholderKey: string;
  keyHint?: string;
}> = [
  {
    id: 'Google GenAI',
    name: 'Google Gemini (Google AI Studio)',
    badge: '1P SDK',
    defaultModel: 'gemini-3.1-flash-lite',
    models: ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'],
    defaultQuotaPool: 'GCP_PROJECT_DEFAULT_QUOTA',
    requiresKey: true,
    placeholderKey: 'AIzaSy...',
    keyHint: 'Google AI Studio API key starting with AIzaSy',
  },
  {
    id: 'Groq',
    name: 'Groq Console',
    badge: 'LPU Speed',
    defaultModel: 'qwen/qwen3.8-27b',
    models: ['qwen/qwen3.8-27b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultQuotaPool: 'GROQ_CONSOLE_POOL',
    requiresKey: true,
    placeholderKey: 'gsk_...',
    keyHint: 'Groq API key starting with gsk_',
  },
  {
    id: 'OpenRouter',
    name: 'OpenRouter',
    badge: 'Gateway',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-r1:free',
      'anthropic/claude-3.5-sonnet',
      'mistralai/mistral-large-2407',
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultQuotaPool: 'OPENROUTER_POOL',
    requiresKey: true,
    placeholderKey: 'sk-or-v1-...',
    keyHint: 'OpenRouter API key starting with sk-or-v1-',
  },
  {
    id: 'Cerebras',
    name: 'Cerebras',
    badge: 'Wafer LPU',
    defaultModel: 'llama-3.3-70b',
    models: ['llama-3.3-70b', 'llama3.1-70b', 'llama3.1-8b'],
    defaultBaseUrl: 'https://api.cerebras.ai/v1',
    defaultQuotaPool: 'CEREBRAS_CS3_POOL',
    requiresKey: true,
    placeholderKey: 'csk-...',
    keyHint: 'Cerebras API key starting with csk-',
  },
  {
    id: 'Cloudflare Workers AI',
    name: 'Cloudflare Workers AI',
    badge: 'Edge GPU',
    defaultModel: '@cf/meta/llama-3.3-70b-instruct',
    models: [
      '@cf/meta/llama-3.3-70b-instruct',
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.2',
    ],
    defaultQuotaPool: 'CLOUDFLARE_WORKERS_AI_POOL',
    requiresKey: true,
    requiresAccountId: true,
    placeholderKey: 'Bearer token from Cloudflare API Tokens...',
    keyHint: 'Cloudflare API Token with Workers AI Read/Write permission',
  },
  {
    id: 'Hugging Face',
    name: 'Hugging Face Inference',
    badge: 'Hub Router',
    defaultModel: 'meta-llama/Llama-3.2-3B-Instruct',
    models: [
      'meta-llama/Llama-3.2-3B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    defaultBaseUrl: 'https://router.huggingface.co/hf-inference/v1',
    defaultQuotaPool: 'HUGGINGFACE_INFERENCE_POOL',
    requiresKey: true,
    placeholderKey: 'hf_...',
    keyHint: 'User Access Token starting with hf_',
  },
  {
    id: 'Mistral AI',
    name: 'Mistral AI',
    badge: 'European LLM',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest', 'open-mistral-nemo'],
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    defaultQuotaPool: 'MISTRAL_AI_POOL',
    requiresKey: true,
    placeholderKey: 'API key from console.mistral.ai...',
    keyHint: 'Mistral API key from console.mistral.ai',
  },
  {
    id: 'SambaNova',
    name: 'SambaNova Cloud',
    badge: 'RDU Fast',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    models: ['Meta-Llama-3.3-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct', 'Qwen2.5-72B-Instruct'],
    defaultBaseUrl: 'https://api.sambanova.ai/v1',
    defaultQuotaPool: 'SAMBANOVA_CLOUD_POOL',
    requiresKey: true,
    placeholderKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyHint: 'SambaNova Cloud API Key (UUID format)',
  },
  {
    id: 'Ollama',
    name: 'Ollama (Local / Self-Hosted)',
    badge: 'Private / Local',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'llama3.1', 'mistral', 'qwen2.5', 'phi3'],
    defaultBaseUrl: 'http://localhost:11434',
    defaultQuotaPool: 'OLLAMA_LOCAL_MACHINE',
    requiresKey: false,
    placeholderKey: 'Leave blank (optional unless protected by auth proxy)',
    keyHint: 'Key is optional for local Ollama instances',
  },
  {
    id: 'OpenAI',
    name: 'OpenAI',
    badge: 'Standard',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultQuotaPool: 'OPENAI_API_POOL',
    requiresKey: true,
    placeholderKey: 'sk-proj-... or sk-...',
    keyHint: 'Standard OpenAI Platform API key',
  },
  {
    id: 'OpenAI Compatible',
    name: 'Custom OpenAI-Compatible Endpoint',
    badge: 'Generic 3P',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'llama-3-8b', 'custom-model'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultQuotaPool: 'CUSTOM_3P_POOL',
    requiresKey: true,
    placeholderKey: 'Bearer token or secret key...',
    keyHint: 'Any compatible endpoint implementing /chat/completions',
  },
];

export const ProviderManagerModal: React.FC = () => {
  const {
    isProviderModalOpen,
    setIsProviderModalOpen,
    connections,
    activeConnection,
    setActiveConnectionId,
    saveProviderConnection,
    testProviderConnection,
    toggleProviderConnection,
    deleteProviderConnection,
    refreshProviders,
    discoverModels,
    showToast,
  } = useWorkflow();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, {
    success: boolean;
    status?: string;
    latencyMs?: number;
    error?: string;
    errorCategory?: string;
    model?: string;
    testedAt?: string;
  }>>({});

  // Form State
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<SupportedProvider>('Google GenAI');
  const [formModelId, setFormModelId] = useState('gemini-3.1-flash-lite');
  const [formModelDisplayName, setFormModelDisplayName] = useState('Gemini 3.1 Flash Lite');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formAccountId, setFormAccountId] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formQuotaPool, setFormQuotaPool] = useState('GCP_PROJECT_DEFAULT_QUOTA');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [formAccountLimits, setFormAccountLimits] = useState<AccountLimitSnapshot | undefined>(undefined);
  const [formPricing, setFormPricing] = useState<ModelPricing | undefined>(undefined);
  const [formCapabilities, setFormCapabilities] = useState<ModelCapability | undefined>(undefined);

  // Auto-detection state
  const [detectionNotice, setDetectionNotice] = useState<{
    detectedProvider: SupportedProvider | null;
    confidence: 'reliable' | 'ambiguous' | 'none';
    reason: string;
    suggestedModel?: string;
    suggestedBaseUrl?: string;
    suggestedQuotaPool?: string;
    ambiguousOptions?: SupportedProvider[];
  } | null>(null);

  // Dynamic Model Browser State
  const [modelBrowserOpen, setModelBrowserOpen] = useState(false);
  const [modelBrowserTarget, setModelBrowserTarget] = useState<{
    connectionId?: string;
    provider: SupportedProvider;
    currentModelId: string;
    isFormTarget?: boolean;
    apiKey?: string;
    baseUrl?: string;
  } | null>(null);
  const [browserModels, setBrowserModels] = useState<DiscoveredModel[]>([]);
  const [isDiscoveringModels, setIsDiscoveringModels] = useState(false);
  const [browserSearch, setBrowserSearch] = useState('');
  const [browserFilter, setBrowserFilter] = useState<'all' | 'text' | 'free' | 'paid' | 'json'>('all');
  const [discoveryStatusMessage, setDiscoveryStatusMessage] = useState<string>('');
  const [discoverySource, setDiscoverySource] = useState<'live_api' | 'cached_catalog'>('cached_catalog');

  if (!isProviderModalOpen) return null;

  const currentProviderConfig = PROVIDER_OPTIONS.find(p => p.id === formProvider) || PROVIDER_OPTIONS[0];

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormName('New Provider Connection');
    setFormProvider('Google GenAI');
    setFormModelId('gemini-3.1-flash-lite');
    setFormModelDisplayName('Gemini 3.1 Flash Lite');
    setFormBaseUrl('');
    setFormAccountId('');
    setFormApiKey('');
    setFormQuotaPool('GCP_PROJECT_DEFAULT_QUOTA');
    setFormAccountLimits(undefined);
    setFormPricing(undefined);
    setFormCapabilities(undefined);
    setShowKeyPassword(false);
    setDetectionNotice(null);
  };

  const handleStartEdit = (conn: ProviderConnection) => {
    setEditingId(conn.id);
    setIsAdding(false);
    setFormName(conn.name);
    setFormProvider(conn.provider);
    setFormModelId(conn.modelId);
    setFormModelDisplayName(conn.modelDisplayName || conn.modelId);
    setFormBaseUrl(conn.baseUrl || '');
    setFormAccountId(conn.accountId || '');
    setFormApiKey(''); // Secret key input starts blank; only updated if changing
    setFormQuotaPool(conn.quotaPool);
    setFormAccountLimits(conn.accountLimits);
    setFormPricing(conn.pricing);
    setFormCapabilities(conn.capabilities);
    setShowKeyPassword(false);
    setDetectionNotice(null);
  };

  const handleProviderSelect = (provId: SupportedProvider) => {
    setFormProvider(provId);
    const cfg = PROVIDER_OPTIONS.find(p => p.id === provId);
    if (cfg) {
      setFormModelId(cfg.defaultModel);
      setFormModelDisplayName(cfg.defaultModel === 'qwen/qwen3.8-27b' ? 'Qwen 3.8 27B' : cfg.defaultModel);
      setFormBaseUrl(cfg.defaultBaseUrl || '');
      setFormQuotaPool(cfg.defaultQuotaPool);
      setFormAccountLimits(undefined);
      setFormPricing(undefined);
      setFormCapabilities(undefined);
      if (isAdding && (!formName || formName.includes('Connection') || formName === 'New Provider Connection')) {
        setFormName(`${cfg.name} Connection`);
      }
    }
  };

  const handleOpenModelDiscovery = async (target: {
    connectionId?: string;
    provider: SupportedProvider;
    currentModelId: string;
    isFormTarget?: boolean;
    apiKey?: string;
    baseUrl?: string;
  }) => {
    setModelBrowserTarget(target);
    setModelBrowserOpen(true);
    setBrowserSearch('');
    setBrowserFilter('all');
    setIsDiscoveringModels(true);
    setDiscoveryStatusMessage(`Connecting to ${target.provider} model catalog...`);

    try {
      const res = await discoverModels({
        connectionId: target.connectionId,
        provider: target.provider,
        apiKey: target.apiKey || (target.isFormTarget ? formApiKey : undefined),
        baseUrl: target.baseUrl || (target.isFormTarget ? formBaseUrl : undefined),
      });

      setBrowserModels(res.models || []);
      setDiscoverySource(res.source);
      setDiscoveryStatusMessage(res.message || `Found ${res.models?.length || 0} models.`);
    } catch (err: any) {
      setDiscoveryStatusMessage(`Model discovery failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDiscoveringModels(false);
    }
  };

  const handleSelectDiscoveredModel = async (model: DiscoveredModel) => {
    if (!modelBrowserTarget) return;

    if (modelBrowserTarget.isFormTarget) {
      setFormModelId(model.id);
      setFormModelDisplayName(model.displayName);
      setFormAccountLimits(model.accountLimits);
      setFormPricing(model.pricing);
      setFormCapabilities(model.capabilities);
      setModelBrowserOpen(false);
      showToast(`Selected: ${model.displayName} (${model.id})`);
    } else if (modelBrowserTarget.connectionId) {
      const targetConn = connections.find(c => c.id === modelBrowserTarget.connectionId);
      if (targetConn) {
        const updateRes = await saveProviderConnection({
          id: targetConn.id,
          name: targetConn.name,
          provider: targetConn.provider,
          modelId: model.id,
          modelDisplayName: model.displayName,
          baseUrl: targetConn.baseUrl,
          accountId: targetConn.accountId,
          quotaPool: targetConn.quotaPool,
          isEnabled: targetConn.isEnabled,
          accountLimits: model.accountLimits,
          pricing: model.pricing,
          capabilities: model.capabilities,
          supportedParameters: model.supportedParameters,
        });
        if (updateRes.success) {
          showToast(`Model updated to "${model.displayName}" (${model.id})`);
          setModelBrowserOpen(false);
        } else {
          showToast(`Failed to update model: ${updateRes.message}`);
        }
      }
    }
  };

  const filteredBrowserModels = useMemo(() => {
    return browserModels.filter(m => {
      const q = browserSearch.trim().toLowerCase();
      const matchSearch = !q || m.id.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q));
      if (!matchSearch) return false;

      if (browserFilter === 'text') {
        return m.capabilities?.supportsText !== false && !m.id.includes('image-only') && m.id !== 'gemini-3.1-flash-lite-image';
      }
      if (browserFilter === 'free') {
        return Boolean(m.pricing?.isZeroPriced || m.id.endsWith(':free') || (m.pricing && m.pricing.promptPricePerMillion === 0 && m.pricing.completionPricePerMillion === 0));
      }
      if (browserFilter === 'paid') {
        return Boolean(m.pricing && !m.pricing.isZeroPriced && (m.pricing.promptPricePerMillion! > 0 || m.pricing.completionPricePerMillion! > 0));
      }
      if (browserFilter === 'json') {
        return Boolean(m.capabilities?.supportsStructuredJson);
      }
      return true;
    });
  }, [browserModels, browserSearch, browserFilter]);

  // Run local detection whenever user types into key, url, or account ID
  const handleKeyOrUrlChange = async (keyVal: string, urlVal: string, accVal: string) => {
    setFormApiKey(keyVal);
    if (keyVal.trim().length >= 4 || urlVal.trim().length > 0 || accVal.trim().length > 0) {
      const result = await AIService.detectProvider({
        key: keyVal,
        baseUrl: urlVal,
        accountId: accVal,
      });

      if (result.confidence !== 'none') {
        setDetectionNotice(result);
        if (result.confidence === 'reliable' && result.detectedProvider && !editingId) {
          if (result.detectedProvider !== formProvider) {
            setFormProvider(result.detectedProvider);
            const cfg = PROVIDER_OPTIONS.find(p => p.id === result.detectedProvider);
            if (cfg) {
              setFormModelId(result.suggestedModel || cfg.defaultModel);
              setFormModelDisplayName(result.suggestedModel === 'qwen/qwen3.8-27b' ? 'Qwen 3.8 27B' : result.suggestedModel || cfg.defaultModel);
              setFormBaseUrl(result.suggestedBaseUrl || cfg.defaultBaseUrl || '');
              setFormQuotaPool(result.suggestedQuotaPool || cfg.defaultQuotaPool);
              setFormName(`${cfg.name}`);
            }
          }
        }
      } else {
        setDetectionNotice(null);
      }
    } else {
      setDetectionNotice(null);
    }
  };

  const applyDetectedProvider = (provId: SupportedProvider) => {
    handleProviderSelect(provId);
    setDetectionNotice(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Connection name is required.');
      return;
    }

    if (formProvider === 'Cloudflare Workers AI' && !formAccountId.trim()) {
      showToast('Cloudflare Account ID is required for Workers AI routing.');
      return;
    }

    if (currentProviderConfig.requiresKey && !editingId && !formApiKey.trim()) {
      showToast(`API Key is required for ${formProvider}.`);
      return;
    }

    const payload: any = {
      name: formName.trim(),
      provider: formProvider,
      modelId: formModelId.trim() || currentProviderConfig.defaultModel,
      modelDisplayName: formModelDisplayName.trim() || formModelId.trim() || currentProviderConfig.defaultModel,
      baseUrl: formBaseUrl.trim() || currentProviderConfig.defaultBaseUrl || undefined,
      accountId: formAccountId.trim() || undefined,
      quotaPool: formQuotaPool.trim() || currentProviderConfig.defaultQuotaPool,
      accountLimits: formAccountLimits,
      pricing: formPricing,
      capabilities: formCapabilities,
    };

    if (editingId) {
      payload.id = editingId;
      if (formApiKey.trim().length > 0) {
        payload.apiKey = formApiKey.trim();
      }
    } else {
      payload.apiKey = formApiKey.trim();
      payload.isEnabled = true;
    }

    const res = await saveProviderConnection(payload);
    if (res.success) {
      setIsAdding(false);
      setEditingId(null);
      setFormApiKey('');
      setDetectionNotice(null);
    } else {
      showToast(res.message || 'Failed to save provider.');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await testProviderConnection(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
      if (result.success) {
        showToast(`✓ Test passed! Latency: ${result.latencyMs}ms (${result.model})`);
      } else {
        showToast(`✗ Test failed [${result.errorCategory || 'ERROR'}]: ${result.error}`);
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [id]: {
          success: false,
          errorCategory: 'NETWORK_ERROR',
          error: err.message || 'Network exception connecting to test ping',
          testedAt: new Date().toISOString(),
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (conn: ProviderConnection) => {
    if (conn.isDefault) {
      showToast('The baseline default connection cannot be deleted.');
      return;
    }

    const isActive = conn.id === activeConnection.id;
    const replacement = connections.find(c => c.id !== conn.id && c.isEnabled) || connections[0];

    const confirmMsg = isActive
      ? `Connection "${conn.name}" is currently ACTIVE.\n\nDeleting it will switch active routing to "${replacement.name}".\n\nAre you sure you want to proceed?`
      : `Remove connection "${conn.name}"?`;

    if (confirm(confirmMsg)) {
      await deleteProviderConnection(conn.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#070C18] border border-[#1E293B] rounded-xl shadow-[0_10px_60px_rgba(0,0,0,0.95)] overflow-hidden font-mono flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-[#1E293B] bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-[#00F0FF]/40 bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wider">
                  MULTI-PROVIDER API MANAGER
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
                  10 PROVIDERS SUPPORTED
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Configure multiple connections, automatic provider detection, and isolated quota pools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshProviders()}
              className="p-1.5 rounded text-slate-400 hover:text-[#00F0FF] hover:bg-[#111726] border border-[#1E293B] transition-colors"
              title="Refresh provider telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsProviderModalOpen(false)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#111726] border border-[#1E293B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Architecture & Quota Security Banner */}
          <div className="p-3 rounded-lg bg-[#030712] border border-[#1E293B] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span className="flex items-center gap-1.5 text-[#FFE600]">
                <ShieldCheck className="w-3.5 h-3.5" />
                SECRET SECURITY & REAL VERIFICATION PROTOCOL
              </span>
              <span className="text-slate-500 text-[10px]">RESTRICTED 0600 STORAGE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1">
              <div className="bg-[#0B0F19] p-2 rounded border border-[#1E293B]">
                <strong className="text-slate-200 block mb-0.5">🔒 Zero Cleartext Leaks</strong>
                All keys stay on the server. Never saved to localStorage, client logs, or exported backups.
              </div>
              <div className="bg-[#0B0F19] p-2 rounded border border-[#1E293B]">
                <strong className="text-slate-200 block mb-0.5">🧪 Honest Test Verification</strong>
                Green status appears ONLY after a live provider ping succeeds. Untested connections remain neutral.
              </div>
              <div className="bg-[#0B0F19] p-2 rounded border border-[#1E293B]">
                <strong className="text-slate-200 block mb-0.5">⚖️ Quota Pool Truth</strong>
                Keys in the same pool share limits. Multiple keys for the same account do NOT grant extra quota.
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 tracking-wider">
                CONFIGURED CONNECTIONS ({connections.length})
              </span>
              <span className="text-[10px] text-slate-500">
                Active: <span className="text-[#00F0FF]">{activeConnection.name}</span>
              </span>
            </div>
            {!isAdding && !editingId && (
              <button
                onClick={handleStartAdd}
                className="px-3 py-1.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/50 text-[#00F0FF] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD CONNECTION</span>
              </button>
            )}
          </div>

          {/* Add / Edit Inline Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="p-4 rounded-lg bg-[#0B0F19] border border-[#00F0FF]/50 space-y-3.5 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold text-[#00F0FF]">
                    {isAdding ? 'ADD NEW PROVIDER CONNECTION' : `EDIT CONNECTION: ${formName}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingId(null); setDetectionNotice(null); }}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Selector Grid */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">
                  1. Select Provider Target *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {PROVIDER_OPTIONS.map((p) => {
                    const isSelected = formProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleProviderSelect(p.id)}
                        className={`p-2 rounded border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                            : 'bg-[#030712] border-[#1E293B] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-[11px] font-semibold truncate">{p.name.split(' (')[0]}</span>
                          <span className={`text-[8px] px-1 py-0.2 rounded border ${
                            isSelected ? 'bg-[#00F0FF]/30 border-[#00F0FF] text-[#00F0FF]' : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 truncate">{p.defaultModel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Detection Notice Banner */}
              {detectionNotice && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  detectionNotice.confidence === 'reliable'
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-slate-200'
                    : 'bg-[#FFE600]/10 border-[#FFE600]/50 text-slate-200'
                }`}>
                  <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${
                    detectionNotice.confidence === 'reliable' ? 'text-[#00F0FF]' : 'text-[#FFE600]'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px]">
                        {detectionNotice.confidence === 'reliable' ? '⚡ Auto-Detected Provider:' : '⚠️ Ambiguous Key Format:'}
                      </span>
                      {detectionNotice.detectedProvider && (
                        <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/20 px-2 py-0.5 rounded border border-[#00F0FF]/40">
                          {detectionNotice.detectedProvider}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {detectionNotice.reason}
                    </p>
                    {detectionNotice.ambiguousOptions && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[9px] text-slate-500">Pick matching provider:</span>
                        {detectionNotice.ambiguousOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => applyDetectedProvider(opt)}
                            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-[#00F0FF]/20 border border-slate-700 hover:border-[#00F0FF] text-[10px] text-slate-300 hover:text-[#00F0FF] transition-colors"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Detail Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Connection Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. My Primary Gemini Account"
                    className="w-full px-2.5 py-1.5 rounded bg-[#030712] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#00F0FF]"
                    required
                  />
                  <span className="text-[9px] text-slate-500">Name this specific account/key instance.</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Model Identifier (Exact API ID) *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenModelDiscovery({
                        provider: formProvider,
                        currentModelId: formModelId,
                        isFormTarget: true,
                        apiKey: formApiKey,
                        baseUrl: formBaseUrl,
                      })}
                      className="text-[10px] text-[#00F0FF] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3 text-[#00F0FF]" />
                      <span>DISCOVER MODELS</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formModelId}
                      onChange={(e) => {
                        setFormModelId(e.target.value);
                        if (!formModelDisplayName || formModelDisplayName === formModelId) {
                          setFormModelDisplayName(e.target.value);
                        }
                      }}
                      placeholder="e.g. qwen/qwen3.8-27b, gemini-3.8-flash, meta-llama/llama-3.3-70b-instruct"
                      className="w-full px-2.5 py-1.5 rounded bg-[#030712] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#00F0FF]"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500">Display Name:</span>
                      <input
                        type="text"
                        value={formModelDisplayName}
                        onChange={(e) => setFormModelDisplayName(e.target.value)}
                        placeholder="Human-readable label"
                        className="flex-1 px-2 py-0.5 rounded bg-[#030712] border border-[#1E293B] text-slate-300 text-[10px] focus:outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {currentProviderConfig.models.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setFormModelId(m);
                            setFormModelDisplayName(m === 'qwen/qwen3.8-27b' ? 'Qwen 3.8 27B' : m === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : m);
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                            formModelId === m
                              ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cloudflare Account ID field (Conditional) */}
                {formProvider === 'Cloudflare Workers AI' && (
                  <div className="sm:col-span-2 p-2.5 rounded bg-[#030712] border border-[#00F0FF]/30">
                    <label className="block text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider mb-1">
                      Cloudflare Account ID (Required for Workers AI) *
                    </label>
                    <input
                      type="text"
                      value={formAccountId}
                      onChange={(e) => {
                        setFormAccountId(e.target.value);
                        handleKeyOrUrlChange(formApiKey, formBaseUrl, e.target.value);
                      }}
                      placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
                      className="w-full px-2.5 py-1.5 rounded bg-[#070C18] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#00F0FF] font-mono"
                      required
                    />
                    <span className="text-[9px] text-slate-400">
                      Found in your Cloudflare dashboard URL: dash.cloudflare.com/{'{account_id}'}
                    </span>
                  </div>
                )}

                {/* Base URL (For Ollama, OpenAI-compatible, custom endpoints) */}
                {(formProvider !== 'Google GenAI') && (
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      Endpoint Base URL {formProvider === 'Ollama' ? '(Required for Ollama)' : ''}
                    </label>
                    <input
                      type="text"
                      value={formBaseUrl}
                      onChange={(e) => {
                        setFormBaseUrl(e.target.value);
                        handleKeyOrUrlChange(formApiKey, e.target.value, formAccountId);
                      }}
                      placeholder={currentProviderConfig.defaultBaseUrl || 'https://api.openai.com/v1'}
                      className="w-full px-2.5 py-1.5 rounded bg-[#030712] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#00F0FF]"
                    />
                    <span className="text-[9px] text-slate-500">
                      {formProvider === 'Ollama' ? 'Default: http://localhost:11434' : 'API base endpoint'}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Quota Pool Identifier
                  </label>
                  <input
                    type="text"
                    value={formQuotaPool}
                    onChange={(e) => setFormQuotaPool(e.target.value)}
                    placeholder="e.g. ACCOUNT_A_POOL"
                    className="w-full px-2.5 py-1.5 rounded bg-[#030712] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#00F0FF]"
                  />
                  <span className="text-[9px] text-slate-500">
                    Connections sharing a quota pool share rate limits during failover.
                  </span>
                </div>

                {/* Secret Key Input */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    API Secret Key / Token {formProvider === 'Ollama' ? '(Optional for local Ollama)' : editingId ? '(Leave blank to retain saved key)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showKeyPassword ? 'text' : 'password'}
                      value={formApiKey}
                      onChange={(e) => handleKeyOrUrlChange(e.target.value, formBaseUrl, formAccountId)}
                      placeholder={editingId ? '••••••••••••••••••••' : currentProviderConfig.placeholderKey}
                      className="w-full px-2.5 py-1.5 pr-9 rounded bg-[#030712] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#00F0FF] font-mono"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                      className="absolute right-2 top-2 text-slate-500 hover:text-white"
                    >
                      {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                    <span>{currentProviderConfig.keyHint || 'Kept server-side only in 0600 storage.'}</span>
                    <span className="text-slate-400">Local format detection active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingId(null); setDetectionNotice(null); }}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white border border-transparent hover:border-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update Connection' : 'Save Connection'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Connections List */}
          <div className="space-y-3">
            {connections.map((conn) => {
              const isActive = conn.id === activeConnection.id;
              const testRes = testResults[conn.id];
              const isTestingThis = testingId === conn.id;

              // Honest color status indicator
              const isOnline = conn.status === 'online';
              const isDegraded = conn.status === 'degraded';
              const isCooldown = conn.status === 'cooldown';
              const isUntested = conn.status === 'untested';
              const isDisabled = !conn.isEnabled;

              const statusColor = isDisabled
                ? 'text-slate-500'
                : isOnline
                ? 'text-[#10B981]'
                : isCooldown || isDegraded
                ? 'text-[#FB7185]'
                : 'text-[#EAB308]';

              const statusDotBg = isDisabled
                ? 'bg-slate-600'
                : isOnline
                ? 'bg-[#10B981] animate-pulse'
                : isCooldown
                ? 'bg-[#FB7185] animate-ping'
                : isDegraded
                ? 'bg-[#FB7185]'
                : 'bg-[#EAB308]';

              const statusBadgeText = isDisabled
                ? 'DISABLED'
                : !conn.hasKey && conn.provider !== 'Ollama'
                ? 'UNCONFIGURED'
                : isOnline
                ? 'ONLINE (VERIFIED)'
                : isCooldown
                ? 'COOLDOWN'
                : isDegraded
                ? 'FAILED / DEGRADED'
                : 'UNTESTED';

              return (
                <div
                  key={conn.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-[#0B0F19] border-[#00F0FF]/70 shadow-[0_0_18px_rgba(0,240,255,0.12)]'
                      : isDisabled
                      ? 'bg-[#0B0F19]/30 border-[#1E293B] opacity-60'
                      : isDegraded
                      ? 'bg-[#0B0F19]/80 border-[#FB7185]/40'
                      : 'bg-[#0B0F19]/60 border-[#1E293B] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1E293B]/60">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setActiveConnectionId(conn.id)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isActive 
                            ? 'border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF]' 
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        title="Set as active routing connection"
                      >
                        {isActive && <div className="w-2 h-2 rounded-full bg-[#00F0FF]" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {conn.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {conn.provider}
                        </span>
                      </div>

                      {isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]">
                          ACTIVE ROUTE
                        </span>
                      )}

                      {conn.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          BASELINE
                        </span>
                      )}
                    </div>

                    {/* Status & Enable Toggle */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <span className={`text-[10px] flex items-center gap-1.5 font-semibold ${statusColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotBg}`} />
                        {statusBadgeText}
                      </span>

                      <button
                        onClick={() => toggleProviderConnection(conn.id)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          conn.isEnabled
                            ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                            : 'bg-[#FB7185]/10 border-[#FB7185]/30 text-[#FB7185] hover:bg-[#FB7185]/20'
                        }`}
                      >
                        {conn.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-[10px] text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Model:</span>
                      <span className="text-slate-200 truncate block font-medium">{conn.modelId}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">API Key:</span>
                      <span className={`font-mono truncate block ${conn.hasKey ? 'text-[#10B981]' : conn.provider === 'Ollama' ? 'text-slate-400' : 'text-[#FB7185]'}`}>
                        {conn.provider === 'Ollama' && !conn.hasKey ? 'Not required' : (conn.maskedKey || (conn.hasKey ? 'Configured' : 'Missing'))}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Last Verified:</span>
                      <span className="text-slate-300 block truncate">
                        {conn.lastTestedAt 
                          ? new Date(conn.lastTestedAt).toLocaleTimeString()
                          : (conn.lastChecked !== 'Never' ? conn.lastChecked : 'Never Tested')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Quota Pool:</span>
                      <span className="text-slate-200 truncate block" title={conn.quotaPool}>
                        {conn.quotaPool}
                      </span>
                    </div>
                  </div>

                  {/* Cloudflare Account ID display if applicable */}
                  {conn.accountId && (
                    <div className="mt-1 text-[9px] text-slate-500 font-mono">
                      Cloudflare Account: {conn.accountId}
                    </div>
                  )}

                  {/* Real Test Result Banner */}
                  {(testRes || conn.lastTestError) && (
                    <div className={`mt-2.5 p-2 rounded border text-[10px] ${
                      testRes?.success || conn.lastTestStatus === 'success'
                        ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]' 
                        : 'bg-[#FB7185]/10 border-[#FB7185]/40 text-[#FB7185]'
                    }`}>
                      {testRes?.success ? (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Live request verified in {testRes.latencyMs}ms ({testRes.model})
                          </span>
                          <span className="font-bold">STATUS: ONLINE</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold block">
                              Test Failed [{testRes?.errorCategory || 'ERROR'}]:
                            </span>
                            <span className="text-slate-300 break-words">
                              {testRes?.error || conn.lastTestError}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#1E293B]/40">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTest(conn.id)}
                        disabled={isTestingThis || (!conn.hasKey && conn.provider !== 'Ollama')}
                        className={`px-2.5 py-1 rounded border text-[10px] font-semibold flex items-center gap-1 transition-all ${
                          !conn.hasKey && conn.provider !== 'Ollama'
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-[#0B0F19] hover:bg-[#00F0FF]/15 border-[#1E293B] hover:border-[#00F0FF]/50 text-slate-300 hover:text-[#00F0FF]'
                        }`}
                        title={!conn.hasKey && conn.provider !== 'Ollama' ? 'Configure API key first' : 'Perform real live model test'}
                      >
                        <Zap className={`w-3 h-3 ${isTestingThis ? 'animate-spin text-[#00F0FF]' : 'text-[#FFE600]'}`} />
                        <span>{isTestingThis ? 'TESTING...' : 'TEST CONNECTION'}</span>
                      </button>

                      <button
                        onClick={() => handleStartEdit(conn)}
                        className="px-2.5 py-1 rounded bg-[#0B0F19] hover:bg-slate-800 border border-[#1E293B] text-slate-300 hover:text-white text-[10px] transition-colors"
                      >
                        EDIT
                      </button>
                    </div>

                    {!conn.isDefault && (
                      <button
                        onClick={() => handleDelete(conn)}
                        className="text-slate-500 hover:text-[#FB7185] p-1 rounded transition-colors"
                        title={isActive ? 'Delete active connection (will prompt for safe replacement)' : 'Delete connection'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Disclaimer Notice */}
          <div className="p-2.5 rounded bg-[#030712] border border-[#1E293B] text-[10px] text-slate-500 flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Testing Notice:</strong> A successful test connection confirms authentication credentials and network reachability for the selected model. Full video script and prompt generation workflows may have different token limits, quota tiers, and latency characteristics.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-[#1E293B] bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Globe className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Active Routing: <strong className="text-white">{activeConnection.name}</strong> ({activeConnection.provider} // {activeConnection.modelId})</span>
          </div>

          <button
            onClick={() => setIsProviderModalOpen(false)}
            className="px-4 py-1.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF] text-[#00F0FF] text-xs font-semibold transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
