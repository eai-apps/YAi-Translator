/**
 * GET /api/buy-links — список ссылок «Где купить ключ» для профиля пользователя.
 * Отдаются только активные ссылки (hidden = 0).
 */
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { ensureSchema } from '../_lib/schema';
import type { BuyLinkItem } from '../../shared/types';

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await ensureSchema(context.env);

    const rows = await context.env.DB?.prepare(
      'SELECT * FROM buy_links WHERE hidden = 0 ORDER BY sort ASC, id ASC',
    ).all<BuyLinkRow>();

    const items: BuyLinkItem[] = (rows?.results ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      howtoRu: r.howto_ru,
      howtoDe: r.howto_de,
      howtoEn: r.howto_en,
      sort: r.sort,
      hidden: false,
    }));

    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
