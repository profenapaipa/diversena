import type { Sign } from '../models/language';

interface SignCardProps {
  sign: Sign;
}

export function SignCard({ sign }: SignCardProps) {
  return (
    <article className="sign-card" aria-label={`Vocal ${sign.letter}`}>
      <h3 className="sign-card__title">Vocal {sign.letter}</h3>

      <div className="sign-card__media" aria-hidden={sign.image === null}>
        {sign.image ? (
          <img src={sign.image} alt={`Seña de la vocal ${sign.letter}`} />
        ) : (
          <p className="sign-card__placeholder">[IMAGEN PENDIENTE]</p>
        )}
      </div>

      <div className="sign-card__media" aria-hidden={sign.video === null}>
        {sign.video ? (
          <video src={sign.video} controls />
        ) : (
          <p className="sign-card__placeholder">[VIDEO PENDIENTE]</p>
        )}
      </div>

      <div>
        <h4>¿Cómo se realiza?</h4>
        <p>{sign.description ?? '[EXPLICACIÓN PENDIENTE]'}</p>
      </div>

      <div>
        <h4>Instrucciones de posición</h4>
        <p>{sign.instructions ?? '[INSTRUCCIONES PENDIENTES]'}</p>
      </div>
    </article>
  );
}
