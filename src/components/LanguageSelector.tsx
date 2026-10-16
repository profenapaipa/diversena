import type { Language } from '../models/language';

interface LanguageSelectorProps {
  languages: Language[];
  selectedId: string | null;
  onSelect: (languageId: string) => void;
  /**
   * Herramientas del equipo (capturar referencias, entrenar la IA): permiten
   * elegir lenguas "Próximamente" para ir reuniendo sus datos antes de
   * abrirlas a estudiantes.
   */
  allowLocked?: boolean;
}

export function LanguageSelector({ languages, selectedId, onSelect, allowLocked = false }: LanguageSelectorProps) {
  return (
    <div className="option-grid" role="group" aria-label="Selecciona una lengua de señas">
      {languages.map((language) => {
        const isSelected = language.id === selectedId;
        const isLocked = language.status === 'proximamente';
        const isDisabled = isLocked && !allowLocked;
        const classes = ['option-card'];
        if (isSelected) classes.push('option-card--selected');
        if (isLocked) classes.push('option-card--locked');

        return (
          <button
            key={language.id}
            type="button"
            className={classes.join(' ')}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => onSelect(language.id)}
          >
            <span className="option-card__title">
              {language.name} ({language.shortName})
            </span>
            <span className="option-card__subtitle">{language.country}</span>
            {isLocked && <span className="lock-badge">🔒 Próximamente</span>}
          </button>
        );
      })}
    </div>
  );
}
