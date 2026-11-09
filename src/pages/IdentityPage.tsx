import { Link } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL;
const logo = (file: string) => `${BASE}marca/logos/${file}`;

interface Use {
  file: string;
  title: string;
  when: string;
  tone: 'white' | 'navy' | 'yellow' | 'dark';
}

/** Las versiones del logotipo y cuándo usar cada una (resumen de la hoja de uso del paquete de logos). */
const USES: Use[] = [
  { file: 'diversena_horizontal_color.svg', title: 'A color', when: 'Sobre blanco o un fondo muy claro. Es la versión principal.', tone: 'white' },
  { file: 'diversena_horizontal_fondo_azul.svg', title: 'Sobre azul oscuro', when: 'Con el fondo ya incluido. El azul oscuro del símbolo pasa a blanco para no perderse.', tone: 'navy' },
  { file: 'diversena_horizontal_para_fondo_oscuro.svg', title: 'Para fondo oscuro', when: 'La misma versión, sin fondo, para ponerla sobre fotos o colores oscuros.', tone: 'dark' },
  { file: 'diversena_horizontal_sobre_amarillo.svg', title: 'Sobre amarillo', when: 'Azul muy oscuro sobre amarillo: pegatinas, carátulas y fondos de color.', tone: 'yellow' },
  { file: 'diversena_horizontal_negro.svg', title: 'Una tinta negra', when: 'Sellos, fotocopias, periódico, grabado láser y formularios en blanco y negro.', tone: 'white' },
  { file: 'diversena_horizontal_blanco.svg', title: 'Una tinta blanca', when: 'Camisetas, vinilo y bordado en hilo blanco sobre fondos oscuros.', tone: 'dark' },
];

const PALETTE = [
  { name: 'Azul oscuro', hex: '#1D2394', meaning: 'Humanidad, unión y liderazgo.', use: 'Letras «Diver», símbolo, botones y fondos de color.' },
  { name: 'Azul claro', hex: '#2F9BE6', meaning: 'El color mundial de la comunidad Sorda.', use: 'Mano de abajo, letras «Seña», ondas y barras de avance.' },
  { name: 'Amarillo', hex: '#FFD83D', meaning: 'Luz y convivencia.', use: 'El sol y los acentos. Nunca como texto sobre blanco.' },
];

const SYMBOLS = [
  {
    title: 'Dos manos que se encuentran',
    text: 'Una llega desde la izquierda con la palma hacia arriba y la otra desde la derecha. Son las dos personas que se encuentran en la lengua de señas. No decimos cuál es Sorda y cuál oyente, porque el encuentro es de las dos.',
  },
  {
    title: 'La de arriba es la de abajo, girada',
    text: 'Las dos manos son la misma figura girada media vuelta. Ninguna manda sobre la otra: una enseña y la otra aprende, y mañana cambian de lugar.',
  },
  {
    title: 'El sol en el centro',
    text: 'Lo que ocurre entre las dos manos es luz y convivencia, el amarillo de la bandera. El sol viene del ojo del primer boceto: la lengua de señas se ve.',
  },
  {
    title: 'Una S que se forma sola',
    text: 'Al girar una sobre otra, las dos manos dibujan una S de «Seña» alrededor del sol, sin que haya que dibujarla.',
  },
  {
    title: 'Un pulgar, una ranura',
    text: 'Una sola ranura separa el pulgar de los dedos. Con eso se lee «mano» sin dibujar los cinco dedos, y el símbolo se sostiene bordado, estampado o a 24 píxeles.',
  },
];

const PROCESS = [
  { step: '1', title: 'El boceto', text: 'Partimos de un dibujo hecho a mano: un ojo entre dos manos. Decía lo importante, que la lengua de señas se mira, pero se parecía a un ícono cualquiera.' },
  { step: '2', title: 'Cuatro caminos', text: 'Exploramos cuatro ideas: una constelación de puntos (la mano tal como la ve la cámara), el encuentro de dos manos, una virgulilla que dibuja el movimiento y el «Di» de decir con las manos.' },
  { step: '3', title: 'Elegimos el encuentro', text: 'Era la que mejor contaba la historia del proyecto, la más fiel al boceto y la que funcionaba en una sola tinta. Quedó como símbolo y la mano de 21 puntos pasó a ser su firma secundaria.' },
  { step: '4', title: 'Un nivel más profesional', text: 'Probamos el símbolo en bordado, estampado y pantalla pequeña. La ranura del pulgar se ensanchó hasta que cumplió los tres usos, y el sol quedó a la misma distancia de las cuatro partes que lo rodean.' },
];

const DONTS = [
  'Estirar, girar o inclinar el logo.',
  'Cambiarle los colores o agregarle sombras y contornos.',
  'Poner la versión a color sobre fondos oscuros o fotos con mucho detalle.',
  'Usar el símbolo completo por debajo de su tamaño mínimo.',
  'Usar la versión simplificada en tamaños grandes.',
  'Recortar el aire que el archivo ya trae alrededor.',
];

export function IdentityPage() {
  return (
    <article className="page identity">
      <header className="page-head">
        <p className="eyebrow">Identidad de marca</p>
        <h1>Así se ve y qué significa DiverSeña</h1>
        <p className="lead">
          El logo, sus colores y sus usos, y la historia de por qué quedó como quedó. Todo lo que se diseñe para DiverSeña sale de
          esta misma idea.
        </p>
      </header>

      <section className="identity-hero" aria-label="El logotipo">
        <div className="identity-hero__tile identity-hero__tile--white">
          <img src={logo('diversena_horizontal_color.svg')} alt="Logotipo de DiverSeña a color" />
        </div>
        <div className="identity-hero__tile identity-hero__tile--navy">
          <img src={logo('diversena_horizontal_fondo_azul.svg')} alt="Logotipo de DiverSeña sobre azul oscuro" />
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">La idea</p>
          <h2>La lengua de señas se ve</h2>
        </div>
        <p className="identity-lead">
          El símbolo se llama <strong>Encuentro</strong>: dos manos alrededor de un sol, dibujadas con los colores de la bandera de
          la comunidad Sorda. Cuenta lo que hace la aplicación: dos personas que se encuentran para comunicarse con las manos.
        </p>
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
        <div className="section__head">
          <p className="eyebrow">Proceso creativo</p>
          <h2>De un boceto a un símbolo</h2>
        </div>
        <ol className="identity-process">
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
        <div className="section__head">
          <p className="eyebrow">Colores</p>
          <h2>Inspirados en la bandera de la comunidad Sorda</h2>
        </div>
        <p className="identity-lead">
          Los tres colores vienen de la bandera de la comunidad Sorda y conservan su sentido. Son una inspiración con respeto, no
          una copia de la bandera.
        </p>
        <ul className="identity-palette">
          {PALETTE.map((color) => (
            <li key={color.hex} className="identity-color">
              <span className="identity-color__chip" style={{ background: color.hex }} aria-hidden="true" />
              <div>
                <h3>
                  {color.name} <code>{color.hex}</code>
                </h3>
                <p><strong>{color.meaning}</strong></p>
                <p>{color.use}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="note">
          Cuando se habla de la comunidad y de su identidad cultural se escribe «Sorda», con mayúscula. Los colores de estado de la
          aplicación (verde, ámbar y rojo) son aparte y no reemplazan a los de la marca.
        </p>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Usos</p>
          <h2>Una versión para cada lugar</h2>
        </div>
        <ul className="identity-uses">
          {USES.map((use) => (
            <li key={use.file} className="identity-use">
              <div className={`identity-use__tile identity-use__tile--${use.tone}`}>
                <img src={logo(use.file)} alt={`Logotipo de DiverSeña: ${use.title.toLowerCase()}`} loading="lazy" />
              </div>
              <h3>{use.title}</h3>
              <p>{use.when}</p>
            </li>
          ))}
        </ul>
        <div className="identity-forms">
          <figure>
            <div className="identity-use__tile identity-use__tile--white identity-use__tile--square">
              <img src={logo('diversena_simbolo_color.svg')} alt="Símbolo de DiverSeña" loading="lazy" />
            </div>
            <figcaption><strong>Símbolo.</strong> Solo las manos y el sol, cuando el nombre ya aparece cerca.</figcaption>
          </figure>
          <figure>
            <div className="identity-use__tile identity-use__tile--white identity-use__tile--square">
              <img src={logo('diversena_vertical_color.svg')} alt="Logotipo vertical de DiverSeña" loading="lazy" />
            </div>
            <figcaption><strong>Vertical.</strong> Para espacios altos o cuadrados: afiches, carátulas y sellos.</figcaption>
          </figure>
          <figure>
            <div className="identity-use__tile identity-use__tile--white identity-use__tile--square">
              <img src={logo('diversena_simbolo_simplificado_color.svg')} alt="Símbolo simplificado de DiverSeña" loading="lazy" />
            </div>
            <figcaption><strong>Simplificado.</strong> Sin ranura y con el sol más grande, para tamaños muy pequeños.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section section--split">
        <div>
          <p className="eyebrow">Tamaños mínimos</p>
          <h2>Hasta dónde se puede achicar</h2>
          <table className="identity-table">
            <thead>
              <tr><th>Aplicación</th><th>Ancho mínimo del símbolo</th></tr>
            </thead>
            <tbody>
              <tr><td>Pantalla</td><td>24 px</td></tr>
              <tr><td>Estampado (serigrafía, vinilo)</td><td>15 mm</td></tr>
              <tr><td>Bordado</td><td>30 mm</td></tr>
            </tbody>
          </table>
          <p className="note">
            Por debajo de esos tamaños se usa el símbolo simplificado. En bordado: relleno plano y máximo tres hilos, sin degradados.
          </p>
        </div>
        <div className="card card--tint">
          <p className="eyebrow">Mejor evitar</p>
          <ul className="identity-donts">
            {DONTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Letras y voz</p>
          <h2>Cómo se escribe y cómo suena</h2>
        </div>
        <div className="identity-type">
          <div className="card">
            <p className="identity-type__sample identity-type__sample--display">Lexend</p>
            <p>Para títulos y para el logotipo. Fue diseñada para facilitar la lectura.</p>
          </div>
          <div className="card">
            <p className="identity-type__sample">Atkinson Hyperlegible</p>
            <p>Para el texto. La creó el Braille Institute para que cada letra se distinga de las demás, incluso con baja visión.</p>
          </div>
          <div className="card">
            <p className="identity-type__sample">DiverSeña</p>
            <p>El nombre lleva D y S mayúsculas y la ñ. Se dice «lengua de señas» (es una lengua completa) y se habla de la LSC sin presentarla nunca como universal.</p>
          </div>
        </div>
      </section>

      <section className="section identity-download">
        <h2>Descarga el paquete de logos</h2>
        <p>
          Todas las versiones en SVG, PNG y PDF: horizontal, vertical, símbolo, símbolo simplificado, íconos de aplicación, avatares
          para redes y firma de correo, con una hoja de uso.
        </p>
        <div className="identity-download__actions">
          <a className="button button--lg" href={`${BASE}marca/diversena-logos.zip`} download>
            Descargar paquete (ZIP)
          </a>
          <Link className="button button--lg button--secondary" to="/proyecto">
            Volver al proyecto
          </Link>
        </div>
      </section>
    </article>
  );
}
