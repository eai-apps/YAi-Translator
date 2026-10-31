/**
 * Форма добавления платного подключения в админке.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaidModelOption } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';

interface Props {
  onSaved: () => void;
  onError: (msg: string | null) => void;
}

export function AdminAddPaidConnectionForm({ onSaved, onError }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<PaidModelOption[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  const fetchModelsList = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) return;
    setFetchLoading(true);
    try {
      const res = await api.adminPaidAction<{ models: PaidModelOption[] }>({
        action: 'fetch-models',
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
      });
      setModels(res.models);
      if (res.models.length > 0 && !defaultModel) setDefaultModel(res.models[0].id);
    } catch {
      onError(t('admin.paid.fetchModelsError'));
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim() || !defaultModel) return;
    try {
      await api.adminPaidAction({
        action: 'save',
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        defaultModel,
        enabled: true,
      });
      onSaved();
    } catch {
      onError(t('admin.saveError'));
    }
  };

  return (
    <form onSubmit={(e) => void handleAdd(e)} className="p-3 border border-line rounded-xl space-y-2 bg-soft">
      <input
        type="text"
        placeholder={t('admin.paid.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-8 px-2 text-sm rounded border border-line bg-card text-ink"
        required
      />
      <input
        type="url"
        placeholder="https://openrouter.ai/api/v1"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
        className="w-full h-8 px-2 text-sm rounded border border-line bg-card text-ink"
        required
      />
      <div className="flex gap-2">
        <input
          type="password"
          placeholder={t('admin.paid.keyPlaceholder')}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="flex-1 h-8 px-2 text-sm rounded border border-line bg-card text-ink"
          required
        />
        <Button type="button" size="sm" variant="secondary" loading={fetchLoading} onClick={() => void fetchModelsList()}>
          {t('admin.paid.loadModels')}
        </Button>
      </div>
      {models.length > 0 && (
        <select
          value={defaultModel}
          onChange={(e) => setDefaultModel(e.target.value)}
          className="w-full h-8 px-2 text-sm rounded border border-line bg-card text-ink"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
            </option>
          ))}
        </select>
      )}
      <Button size="sm" variant="primary" type="submit">
        {t('common.save')}
      </Button>
    </form>
  );
}
