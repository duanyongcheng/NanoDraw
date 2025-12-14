import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUiStore } from '../store/useUiStore';
import { Key, X, ExternalLink, RefreshCw, ChevronDown, Search } from 'lucide-react';
import { fetchModels, ModelInfo } from '../services/modelService';

export const ApiKeySettingsModal: React.FC = () => {
  const { apiKey, setApiKey, updateSettings, settings, fetchBalance } = useAppStore();
  const { isApiKeySettingsOpen, closeApiKeySettings, addToast } = useUiStore();

  const [inputKey, setInputKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('');

  // 模型列表相关状态
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  // 过滤后的模型列表
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models;
    const search = modelSearch.toLowerCase();
    return models.filter(m =>
      m.id.toLowerCase().includes(search) ||
      m.name.toLowerCase().includes(search) ||
      m.description?.toLowerCase().includes(search)
    );
  }, [models, modelSearch]);

  // 打开弹窗时同步当前设置
  useEffect(() => {
    if (isApiKeySettingsOpen) {
      setInputKey(apiKey || '');
      setEndpoint(settings.customEndpoint || '');
      setModel(settings.modelName || 'gemini-3-pro-image-preview');
      setModels([]);
      setShowModelDropdown(false);
      setModelSearch('');
    }
  }, [isApiKeySettingsOpen, apiKey, settings.customEndpoint, settings.modelName]);

  // 查询模型列表
  const handleFetchModels = async () => {
    if (!inputKey.trim()) {
      addToast('请先输入 API Key', 'error');
      return;
    }

    setLoadingModels(true);
    try {
      const modelList = await fetchModels(inputKey, endpoint || undefined);
      setModels(modelList);
      setShowModelDropdown(true);
      addToast(`获取到 ${modelList.length} 个模型`, 'success');
    } catch (error: any) {
      addToast(error.message || '获取模型列表失败', 'error');
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // 选择模型
  const handleSelectModel = (modelId: string) => {
    setModel(modelId);
    setShowModelDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      addToast('请输入 API Key', 'error');
      return;
    }

    // 更新设置
    updateSettings({
      customEndpoint: endpoint || undefined,
      modelName: model || undefined
    });

    // 设置新的 API Key
    setApiKey(inputKey);

    // 立即刷新余额
    setTimeout(() => fetchBalance(), 0);

    addToast('API 配置已更新', 'success');
    closeApiKeySettings();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeApiKeySettings();
    }
  };

  if (!isApiKeySettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-8 transition-colors duration-200 animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-50 dark:bg-blue-500/10 p-2.5 ring-1 ring-blue-200 dark:ring-blue-500/50">
              <Key className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">修改 API 配置</h2>
          </div>
          <button
            onClick={closeApiKeySettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          修改后将立即生效，并应用于后续的对话。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Key Input */}
          <div>
            <label htmlFor="apiKeySettings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              API Key
            </label>
            <input
              type="password"
              id="apiKeySettings"
              value={inputKey}
              onChange={(e) => setInputKey(e.currentTarget.value)}
              className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              placeholder="AIzaSy..."
              autoFocus
            />
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              自定义接口地址 <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.currentTarget.value)}
              className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              placeholder="https://generativelanguage.googleapis.com"
            />
          </div>

          {/* Model */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              模型名称
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.currentTarget.value)}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-4 py-3 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="gemini-3-pro-image-preview"
                />
                {models.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                  >
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={loadingModels || !inputKey.trim()}
                className="px-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="获取模型列表"
              >
                <RefreshCw className={`h-5 w-5 ${loadingModels ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Model Dropdown */}
            {showModelDropdown && models.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.currentTarget.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      placeholder="搜索模型..."
                      autoFocus
                    />
                  </div>
                </div>
                {/* Model List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredModels.length > 0 ? (
                    filteredModels.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m.id)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                          model === m.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="text-sm font-medium truncate">{m.name}</div>
                        {m.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.description}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      没有找到匹配的模型
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeApiKeySettings}
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!inputKey.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>

        <div className="mt-6 flex justify-center">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <span>获取 Gemini API Key</span>
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
