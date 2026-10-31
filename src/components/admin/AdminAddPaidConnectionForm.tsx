/**
 * Форма добавления платного подключения в админке.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaidModelOption } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { PaidConnectionFields } from '../paid/PaidConnectionFields';

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
    if (!baseUrl.trim() || !apiKey.trim() || !defaultModel) return;
    try {
      await api.adminPaidAction({
        action: 'save',
        name: name.trim() || defaultModel,
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
    <form onSubmit={(e) => void handleAdd(e)} className="p-3 border border-line rounded-xl space-y-3 bg-soft">
      <input
        type="text"
        placeholder={t('admin.paid.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-9 px-3 text-sm rounded-lg border border-line bg-card text-ink"
      />
      <PaidConnectionFields
        baseUrl={baseUrl}
        onBaseUrl={setBaseUrl}
        apiKey={apiKey}
        onApiKey={setApiKey}
        models={models}
        model={defaultModel}
        onModel={setDefaultModel}
        onLoadModels={() => void fetchModelsList()}
        loading={fetchLoading}
      />
      <Button size="sm" variant="primary" type="submit">
        {t('common.save')}
      </Button>
    </form>
  );
}
