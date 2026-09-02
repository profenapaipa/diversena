import type { Sign } from '../models/language';

interface VowelSelectorProps {
  signs: Sign[];
  selectedId: string | null;
  onSelect: (signId: string) => void;
}

export function VowelSelector({ signs, selectedId, onSelect }: VowelSelectorProps) {
  return (
    <div className="option-grid" role="group" aria-label="Selecciona una vocal">
      {signs.map((sign) => {
        const isSelected = sign.id === selectedId;
        return (
          <button
            key={sign.id}
            type="button"
            className={isSelected ? 'option-card option-card--selected' : 'option-card'}
            aria-pressed={isSelected}
            onClick={() => onSelect(sign.id)}
          >
            <span className="option-card__letter">{sign.letter}</span>
          </button>
        );
      })}
    </div>
  );
}
