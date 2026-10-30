/** Красивый экран «Скоро» для разделов следующих этапов. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { IconArrowLeft, IconCheck } from '../layout/icons';

interface SoonScreenProps {
  icon: ReactNode;
  title: string;
  text: string;
  features: string[];
}

export function SoonScreen({ icon, title, text, features }: SoonScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[62dvh] flex-col items-center justify-center px-2 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accentSoft text-accent">
        {icon}
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">{text}</p>

      <ul className="mt-6 grid w-full max-w-md gap-2 text-left">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
          >
            <IconCheck className="h-4 w-4 shrink-0 text-accent" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accentInk transition-colors hover:brightness-110"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t('soon.back')}
      </Link>
    </div>
  );
}
