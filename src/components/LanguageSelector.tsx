import type { Language } from '../models/language';

interface LanguageSelectorProps {
  languages: Language[];
  selectedId: string | null;
  onSelect: (languageId: string) => void;
}

export function LanguageSelector({ languages, selectedId, onSelect }: LanguageSelectorProps) {
  return (
    <div className="option-grid" role="group" aria-label="Selecciona una lengua de señas">
      {languages.map((language) => {
        const isSelected = language.id === selectedId;
        return (
          <button
            key={language.id}
            type="button"
            className={isSelected ? 'option-card option-card--selected' : 'option-card'}
            aria-pressed={isSelected}
            onClick={() => onSelect(language.id)}
          >
            <span className="option-card__title">{language.name}</span>
            <span className="option-card__subtitle">{language.country}</span>
          </button>
        );
      })}
    </div>
  );
}
