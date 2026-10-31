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
  // Несколько моделей одного ключа: каждая появится в списке «Быстрый перевод ▾» на главной.
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id].slice(0, 20)));
  const [fetchLoading, setFetchLoading] = useState(false);

  const fetchModelsList = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) return;
    setFetchLoading(true);
    try {
      onError(null);
      const res = await api.adminPaidAction<{ models: PaidModelOption[]; error?: string }>({
        action: 'fetch-models',
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
      });
      setModels(res.models);
      if (res.models.length === 0) onError(`${t('admin.paid.fetchModelsError')}${res.error ? ` — ${res.error}` : ''}`);
    } catch {
      onError(t('admin.paid.fetchModelsError'));
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = picked.length > 0 ? picked : defaultModel ? [defaultModel] : [];
    if (!baseUrl.trim() || !apiKey.trim() || chosen.length === 0) {
      onError(t('admin.paid.pickModel'));
      return;
    }
    try {
      await api.adminPaidAction({
        action: 'save',
        name: name.trim() || chosen[0],
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        defaultModel: chosen[0],
        models: chosen,
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
        selected={picked}
        onToggle={toggle}
      />
      <Button size="sm" variant="primary" type="submit">
        {t('common.save')}
      </Button>
    </form>
  );
}
