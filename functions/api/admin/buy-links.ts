/**
 * Управление ссылками «Где купить ключ» в админке.
 */
import type { Env } from '../../_lib/env';
import { requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { ensureSchema } from '../../_lib/schema';
import { seedBuyLinksOnce } from '../../_lib/paid/buyLinksSeed';
import type { BuyLinkItem } from '../../../shared/types';

interface BuyLinkRow {
  id: number;
  title: string;
  url: string;
  howto_ru: string;
  howto_de: string;
  howto_en: string;
  sort: number;
  hidden: number;
}

function mapRow(r: BuyLinkRow): BuyLinkItem {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    howtoRu: r.howto_ru,
    howtoDe: r.howto_de,
    howtoEn: r.howto_en,
    sort: r.sort,
    hidden: Boolean(r.hidden),
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    await ensureSchema(context.env);
    await seedBuyLinksOnce(context.env);

    const rows = await context.env.DB?.prepare('SELECT * FROM buy_links ORDER BY sort ASC, id ASC')
      .all<BuyLinkRow>();

    const items = (rows?.results ?? []).map(mapRow);
    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const body = await readJsonBody(context.request);
    const action = String(body.action || '');

    if (action === 'add') {
      const title = String(body.title || '').trim();
      const url = String(body.url || '').trim();
      const howtoRu = String(body.howtoRu || '').trim();
      const howtoDe = String(body.howtoDe || '').trim();
      const howtoEn = String(body.howtoEn || '').trim();
      if (!title || !url) throw new ApiError('VALIDATION', 400);

      const maxSortRow = await context.env.DB?.prepare('SELECT MAX(sort) as maxSort FROM buy_links').first<{ maxSort: number | null }>();
      const sort = (maxSortRow?.maxSort ?? 0) + 1;

      await context.env.DB?.prepare(
        'INSERT INTO buy_links (title, url, howto_ru, howto_de, howto_en, sort, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
      )
        .bind(title, url, howtoRu, howtoDe, howtoEn, sort)
        .run();

      return jsonResponse({ ok: true });
    }

    if (action === 'update') {
      const id = Number(body.id);
      const title = String(body.title || '').trim();
      const url = String(body.url || '').trim();
      const howtoRu = String(body.howtoRu || '').trim();
      const howtoDe = String(body.howtoDe || '').trim();
      const howtoEn = String(body.howtoEn || '').trim();
      if (!id || !title || !url) throw new ApiError('VALIDATION', 400);

      await context.env.DB?.prepare(
        'UPDATE buy_links SET title = ?, url = ?, howto_ru = ?, howto_de = ?, howto_en = ? WHERE id = ?',
      )
        .bind(title, url, howtoRu, howtoDe, howtoEn, id)
        .run();

      return jsonResponse({ ok: true });
    }

    if (action === 'delete') {
      const id = Number(body.id);
      if (!id) throw new ApiError('VALIDATION', 400);
      await context.env.DB?.prepare('DELETE FROM buy_links WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }

    if (action === 'toggle') {
      const id = Number(body.id);
      if (!id) throw new ApiError('VALIDATION', 400);
      await context.env.DB?.prepare('UPDATE buy_links SET hidden = CASE WHEN hidden = 1 THEN 0 ELSE 1 END WHERE id = ?')
        .bind(id)
        .run();
      return jsonResponse({ ok: true });
    }

    if (action === 'reorder') {
      const ids = Array.isArray(body.ids) ? (body.ids as number[]) : [];
      for (let i = 0; i < ids.length; i++) {
        await context.env.DB?.prepare('UPDATE buy_links SET sort = ? WHERE id = ?')
          .bind(i + 1, ids[i])
          .run();
      }
      return jsonResponse({ ok: true });
    }

    throw new ApiError('VALIDATION', 400);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
