/**
 * Управление ссылками «Где купить ключ» в админке.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuyLinkItem } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { IconTrash, IconArrowUp, IconArrowDown } from '../layout/icons';

export function AdminBuyLinksSection({ onError }: { onError: (msg: string | null) => void }) {
  const { t } = useTranslation();
  const [links, setLinks] = useState<BuyLinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [howtoRu, setHowtoRu] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const resp = await api.adminBuyLinks();
      setLinks(resp.items);
    } catch {
      onError(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    try {
      await api.adminBuyLinkAction({ action: 'add', title, url, howtoRu, howtoDe: '', howtoEn: '' });
      setTitle('');
      setUrl('');
      setHowtoRu('');
      setShowAdd(false);
      void load();
    } catch {
      onError(t('admin.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.adminBuyLinkAction({ action: 'delete', id });
      void load();
    } catch {
      onError(t('admin.saveError'));
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.adminBuyLinkAction({ action: 'toggle', id });
      void load();
    } catch {
      onError(t('admin.saveError'));
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= links.length) return;
    const reordered = [...links];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    setLinks(reordered);
    try {
      await api.adminBuyLinkAction({ action: 'reorder', ids: reordered.map((l) => l.id) });
    } catch {
      onError(t('admin.saveError'));
      void load();
    }
  };

  return (
    <div className="mt-6 border-t border-line pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{t('admin.buyLinksTitle', 'Ссылки «Где купить ключ»')}</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? t('common.cancel') : t('admin.addLink', '+ Добавить ссылку')}
        </Button>
      </div>

      {showAdd ? (
        <Card className="mb-4 p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted">{t('admin.linkTitle', 'Заголовок ссылки')}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="✅ Проверенный продавец ключа от 1$"
                className="mt-1 h-9 w-full rounded-lg border border-line bg-card px-2.5 text-xs text-ink"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 h-9 w-full rounded-lg border border-line bg-card px-2.5 text-xs text-ink"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">{t('admin.linkHowto', 'Инструкция после покупки')}</label>
              <textarea
                value={howtoRu}
                onChange={(e) => setHowtoRu(e.target.value)}
                rows={3}
                placeholder="После оплаты внимательно прочитайте чек..."
                className="mt-1 w-full rounded-lg border border-line bg-card p-2 text-xs text-ink"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              {t('common.save')}
            </Button>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <div className="py-4 text-center"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <Card key={link.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">{link.title}</span>
                  {link.hidden ? (
                    <span className="rounded bg-soft px-1.5 py-0.5 text-[10px] text-muted">{t('admin.hidden', 'скрыта')}</span>
                  ) : null}
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent truncate block hover:underline">
                  {link.url}
                </a>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <IconArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === links.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <IconArrowDown className="h-4 w-4" />
                </button>
                <Button size="sm" variant="ghost" onClick={() => handleToggle(link.id)}>
                  {link.hidden ? t('admin.show', 'Показать') : t('admin.hide', 'Скрыть')}
                </Button>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  className="p-1 text-danger hover:opacity-80"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
