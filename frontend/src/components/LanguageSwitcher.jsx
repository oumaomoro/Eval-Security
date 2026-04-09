import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-500" />
      <select
        onChange={handleLanguageChange}
        value={i18n.language || 'en'}
        className="text-sm bg-transparent border-none text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer uppercase font-medium"
      >
        <option value="en">EN</option>
        <option value="sw">SW</option>
        <option value="fr">FR</option>
        <option value="ar">AR</option>
      </select>
    </div>
  );
}
