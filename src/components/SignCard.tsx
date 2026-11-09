import type { Sign } from '../models/language';

interface SignCardProps {
  sign: Sign;
}

export function SignCard({ sign }: SignCardProps) {
  return (
    <article className="sign-card" aria-label={`Vocal ${sign.letter}`}>
      <h3 className="sign-card__title">Vocal {sign.letter}</h3>

      <div className="sign-card__pair">
        {sign.officialPhoto && (
          <figure className="sign-card__fig">
            <img
              src={sign.officialPhoto}
              alt={`Foto oficial de la vocal ${sign.letter} en el Diccionario de LSC del INSOR`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(event) => {
                (event.currentTarget.closest('figure') as HTMLElement | null)?.setAttribute('hidden', '');
              }}
            />
            <figcaption>
              <strong>Así se hace.</strong> Foto del Diccionario de LSC del INSOR.
            </figcaption>
          </figure>
        )}
        {sign.image && (
          <figure className="sign-card__fig">
            <img src={sign.image} alt={`Los 21 puntos de la mano en la vocal ${sign.letter}`} />
            <figcaption>
              <strong>Así deben quedar los puntos</strong> de tu mano.
            </figcaption>
          </figure>
        )}
      </div>

      {sign.video && (
        <div className="sign-card__media">
          <video src={sign.video} controls />
        </div>
      )}

      <div>
        <h4>¿Cómo se realiza?</h4>
        <p>{sign.description ?? '[EXPLICACIÓN PENDIENTE]'}</p>
      </div>

      <div>
        <h4>Cómo hacerla</h4>
        <p>{sign.instructions ?? '[INSTRUCCIONES PENDIENTES]'}</p>
      </div>
      <a
        className="sign-card__source"
        href="https://educativo.insor.gov.co/diccionario/"
        target="_blank"
        rel="noreferrer"
      >
        Buscar la seña en el diccionario del INSOR
      </a>
    </article>
  );
}
