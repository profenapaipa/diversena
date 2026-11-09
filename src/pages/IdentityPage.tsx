const BASE = import.meta.env.BASE_URL;
const logo = (file: string) => `${BASE}marca/logos/${file}`;

interface Use {
  file: string;
  title: string;
  tone: 'white' | 'navy' | 'yellow' | 'dark';
}

/** Las versiones del logotipo, una por lugar. El resto está en el paquete descargable. */
const USES: Use[] = [
  { file: 'diversena_horizontal_color.svg', title: 'Sobre blanco', tone: 'white' },
  { file: 'diversena_horizontal_fondo_azul.svg', title: 'Sobre azul', tone: 'navy' },
  { file: 'diversena_horizontal_para_fondo_oscuro.svg', title: 'Fondo oscuro', tone: 'dark' },
  { file: 'diversena_horizontal_sobre_amarillo.svg', title: 'Sobre amarillo', tone: 'yellow' },
  { file: 'diversena_horizontal_negro.svg', title: 'Una tinta negra', tone: 'white' },
  { file: 'diversena_horizontal_blanco.svg', title: 'Una tinta blanca', tone: 'dark' },
];

const PALETTE = [
  { name: 'Azul oscuro', hex: '#1D2394', meaning: 'Humanidad y unión' },
  { name: 'Azul claro', hex: '#2F9BE6', meaning: 'El color de la comunidad Sorda' },
  { name: 'Amarillo', hex: '#FFD83D', meaning: 'Luz y convivencia' },
];

/** El símbolo, explicado en una línea por idea. */
const SYMBOLS = [
  { title: 'Dos manos', text: 'Dos personas que se encuentran para comunicarse.' },
  { title: 'Una gira sobre la otra', text: 'Ninguna manda: una enseña, la otra aprende.' },
  { title: 'El sol al centro', text: 'La luz y la convivencia de la bandera.' },
  { title: 'Una S que aparece', text: 'La S de Seña se forma sola entre las manos.' },
];

const PROCESS = [
  { step: '1', title: 'Boceto', text: 'Un ojo entre dos manos, dibujado a mano.' },
  { step: '2', title: 'Cuatro caminos', text: 'Exploramos cuatro ideas de logo.' },
  { step: '3', title: 'Encuentro', text: 'Elegimos las dos manos con el sol.' },
  { step: '4', title: 'Afinado', text: 'Probado en bordado, estampado y pantalla pequeña.' },
];

const DONTS = ['Estirarlo o girarlo', 'Cambiarle los colores', 'Ponerlo sobre fotos con mucho detalle'];

/** Identidad de marca: el logo, lo que significa y cómo se usa, con lo mínimo de texto. */
export function IdentityContent() {
  return (
    <div className="identity">
      <section className="identity-hero" aria-label="El logotipo">
        <div className="identity-hero__tile identity-hero__tile--white">
          <img src={logo('diversena_horizontal_color.svg')} alt="Logotipo de DiverSeña a color" />
        </div>
        <div className="identity-hero__tile identity-hero__tile--navy">
          <img src={logo('diversena_horizontal_fondo_azul.svg')} alt="Logotipo de DiverSeña sobre azul oscuro" />
        </div>
      </section>

      <section className="section">
        <h2>La lengua de señas se ve</h2>
        <ul className="identity-symbols">
          {SYMBOLS.map((item) => (
            <li key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>De un boceto a un símbolo</h2>
        <ol className="identity-process identity-process--row">
          {PROCESS.map((item) => (
            <li key={item.step} className="identity-process__item">
              <span className="identity-process__num" aria-hidden="true">{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>Colores de la bandera Sorda</h2>
        <ul className="identity-palette identity-palette--row">
          {PALETTE.map((color) => (
            <li key={color.hex} className="identity-color">
              <span className="identity-color__chip" style={{ background: color.hex }} aria-hidden="true" />
              <div>
                <h3>
                  {color.name} <code>{color.hex}</code>
                </h3>
                <p>{color.meaning}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Una versión para cada lugar</h2>
        <ul className="identity-uses">
          {USES.map((use) => (
            <li key={use.file} className="identity-use">
              <div className={`identity-use__tile identity-use__tile--${use.tone}`}>
                <img src={logo(use.file)} alt={`Logotipo de DiverSeña: ${use.title.toLowerCase()}`} loading="lazy" />
              </div>
              <h3>{use.title}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section--split">
        <div>
          <h2>Tamaño mínimo</h2>
          <ul className="identity-min">
            <li><strong>24 px</strong> en pantalla</li>
            <li><strong>15 mm</strong> estampado</li>
            <li><strong>30 mm</strong> bordado</li>
          </ul>
          <p className="note">Más pequeño: símbolo simplificado.</p>
        </div>
        <div className="card card--tint">
          <h3>Mejor evitar</h3>
          <ul className="identity-donts">
            {DONTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section identity-download">
        <h2>Paquete de logos</h2>
        <p>SVG, PNG y PDF, con íconos, avatares y una hoja de uso.</p>
        <div className="identity-download__actions">
          <a className="button button--lg" href={`${BASE}marca/diversena-logos.zip`} download>
            Descargar (ZIP)
          </a>
        </div>
      </section>
    </div>
  );
}
