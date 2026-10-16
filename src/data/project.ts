/**
 * Contenido de la página "El proyecto", tomado de la documentación del
 * Equipo 6 en el Drive del Semillero de Tecnología Maker 2026-II (propuesta,
 * ficha técnica, artículo base, matriz de antecedentes y ruta del semestre).
 * Se mantiene aquí, separado del diseño, para que el equipo lo actualice sin
 * tocar componentes. Ver docs/PROYECTO.md.
 */

export const PROJECT_ORIGIN = {
  program: 'Semillero de Tecnología Maker',
  period: '2026-II',
  team: 'Equipo 6 · Lector de lengua de señas',
  /**
   * Los integrantes son menores de edad: en la web pública se publican con
   * nombre e inicial del apellido. Los nombres completos están en el
   * artículo del equipo.
   */
  members: ['Matías A.', 'Nicolás P.', 'César P.'],
  grade: '9C',
  showcase: '28 y 29 de octubre de 2026',
};

export const PROBLEM =
  'En distintos espacios, las personas sordas pueden enfrentar dificultades para comunicarse de manera clara y lograr que otras personas comprendan lo que necesitan expresar. Esta situación suele pasar desapercibida hasta que se requiere comunicación o ayuda.';

export const QUESTION =
  '¿Qué problemas tienen las personas sordas para comunicarse de manera clara, sabiendo lo que quieren expresar?';

export const AUDIENCE =
  'Personas desde los 6 años que necesitan o quieren entender la lengua de señas: familias, estudiantes, docentes y cualquiera que conviva con la comunidad Sorda.';

export type RequirementStatus = 'cumplido' | 'en-progreso' | 'pendiente';

/** Las tres acciones de la ficha técnica (paso 2), con cómo se comprueban. */
export const REQUIREMENTS: Array<{ action: string; test: string; status: RequirementStatus; note: string }> = [
  {
    action: 'Reconocer las manos y la posición de cada dedo en la cámara.',
    test: 'Mostrar las manos frente a la cámara y ver los 21 puntos de cada una siguiéndolas.',
    status: 'cumplido',
    note: 'Dos manos en vivo, a ~30 cuadros por segundo, en el navegador.',
  },
  {
    action: 'Comprender las señas hechas con las manos y traducirlas a texto.',
    test: 'Hacer cada vocal y comprobar que aparece la letra correcta.',
    status: 'en-progreso',
    note: 'El reconocedor ya funciona; falta grabar los videos de entrenamiento con personas Sordas.',
  },
  {
    action: 'Dar sugerencias cuando no entiende la seña.',
    test: 'Hacer una seña a medias y ver si propone opciones parecidas.',
    status: 'cumplido',
    note: '"¿Quizás quisiste decir…?" con las señas más parecidas, como en el boceto.',
  },
];

export interface Phase {
  name: string;
  dates: string;
  did: string;
  produced: string;
}

/** Ruta Design Thinking del semestre, con lo que hizo el equipo en cada fase. */
export const PHASES: Phase[] = [
  {
    name: 'Empatizar',
    dates: '15 – 23 jul',
    did: 'Observación del contexto y propuesta escrita en dos versiones.',
    produced: 'Público definido: quienes necesitan comunicarse y quienes quieren aprender.',
  },
  {
    name: 'Definir',
    dates: '29 – 30 jul',
    did: 'Problema, pregunta de investigación y primeros antecedentes.',
    produced: 'Pregunta de investigación y tres artículos de referencia.',
  },
  {
    name: 'Idear',
    dates: '5 – 13 ago',
    did: 'Alternativas, matriz de antecedentes y bocetos en papel de la interfaz.',
    produced: 'Boceto: menú con perfil, aprender (libro), cámara y sugerencias.',
  },
  {
    name: 'Prototipar',
    dates: '19 ago – 24 sep',
    did: 'Ficha técnica, cambio de Unity a página web, cámara y clasificador.',
    produced: 'Prototipo web con detección de manos y reconocimiento por referencias.',
  },
  {
    name: 'Evaluar e iterar',
    dates: '30 sep – 22 oct',
    did: 'Prueba cruzada, ajustes y recolección de datos de entrenamiento.',
    produced: 'Versión estable, perfil, panel y espacio para entrenar la IA.',
  },
  {
    name: 'Muestra final',
    dates: '28 – 29 oct',
    did: 'Presentación del proyecto y del artículo de desarrollo tecnológico.',
    produced: 'Entrega final.',
  },
];

/** Decisiones técnicas registradas por el equipo y por el desarrollo posterior. */
export const DECISIONS: Array<{ title: string; why: string }> = [
  {
    title: 'Página web en lugar de app instalable',
    why: 'Se abre desde cualquier celular o computador con un enlace, sin instalar nada: más personas pueden usarla.',
  },
  {
    title: 'De Unity y Teachable Machine al navegador',
    why: 'La detección de manos con MediaPipe corre directamente en la página, sin servidores y sin enviar video a ningún lado.',
  },
  {
    title: 'Puntos de la mano en lugar de imágenes',
    why: 'El reconocimiento usa 21 puntos por mano, no fotos: es más liviano, más rápido y respeta la privacidad.',
  },
  {
    title: 'Primero la Lengua de Señas Colombiana',
    why: 'Cada lengua de señas es distinta. Se consolida la LSC con la comunidad Sorda antes de abrir la mexicana y la ecuatoriana.',
  },
];

export interface Reference {
  apa: string;
  doi: string;
  finding: string;
}

/** Matriz de antecedentes del equipo (01_Antecedentes), en APA 7 y orden alfabético. */
export const REFERENCES: Reference[] = [
  {
    apa: 'González, T. de J. (2023). Percepción del uso de herramientas tecnológicas en el proceso de enseñanza aprendizaje de los estudiantes con discapacidad auditiva de un centro educativo para sordos de la República Dominicana. Revista de Educación Inclusiva.',
    doi: 'https://dialnet.unirioja.es/servlet/articulo?codigo=9361875',
    finding: '123 estudiantes Sordos valoraron positivamente las herramientas tecnológicas para aprender en lengua de señas.',
  },
  {
    apa: 'Quevedo-Sánchez, L. del P., Peralta-Eugenio, G., Morales-Pérez, L., & Quevedo-Sánchez, J. E. (2026). Software en el proceso de enseñanza aprendizaje de lengua de señas: una revisión sistemática y bibliométrica. Revista InveCom.',
    doi: 'https://doi.org/10.5281/zenodo.18014342',
    finding: 'En 16 estudios, la visión por computador y las redes neuronales hicieron más accesible el aprendizaje de lengua de señas.',
  },
  {
    apa: 'Ramírez Cabezas, J. A., Jiménez Bedón, A. M., Bajaña Zajía, J. X., & Cunuhay Cuchipe, W. C. (2025). Aplicación móvil para la comunicación entre oyentes y personas con discapacidad auditiva mediante reconocimiento de frases en LSEC con redes neuronales convolucionales. e-Revista Multidisciplinaria del Saber.',
    doi: 'https://doi.org/10.61286/e-rms.v3i.307',
    finding: 'Una app reconoció 15 frases en Lengua de Señas Ecuatoriana con más del 90 % de precisión.',
  },
  {
    apa: 'Ritmeester, J., Sümer, B., Boonstra, M., de Meulder, M., van der Aa, B., Roelofsen, F., et al. (2026). From words to sentences: Designing and evaluating a parent-facing sign language learning app. Universal Access in the Information Society.',
    doi: 'https://doi.org/10.1007/s10209-026-01378-9',
    finding: 'Familias y docentes valoraron controlar la velocidad, ver varios ángulos y aprender con frases completas.',
  },
  {
    apa: 'Rodríguez-Fuentes, A., Alain, L., & García García, F. (2020). EnSenias: herramienta tecnológica para aprender, enseñar, mejorar y usar la lengua de signos panameña. Íkala, Revista de Lenguaje y Cultura, 25(3).',
    doi: 'https://doi.org/10.17533/udea.ikala.v25n03a05',
    finding: 'Una plataforma de vocabulario y diccionario de señas fue considerada necesaria y accesible por 57 participantes.',
  },
  {
    apa: 'Vesely, S. E., & Frampton, S. E. (2026). The use of self-study and matrix training to teach sign language. The Analysis of Verbal Behavior, 42, 84–108.',
    doi: 'https://doi.org/10.1007/s40616-026-00228-2',
    finding: 'Con autoestudio de videos y texto, adultos aprendieron señas e incluso combinaciones no enseñadas.',
  },
];

/** Qué falta, en orden de prioridad, para pasar de prototipo a solución sostenible. */
export const NEXT_STEPS: string[] = [
  'Grabar al menos 40 clips por vocal con personas Sordas e intérpretes de LSC.',
  'Validar cada seña y su explicación con la comunidad Sorda y el diccionario del INSOR.',
  'Ampliar al alfabeto dactilológico completo, números y saludos.',
  'Cuentas en la nube para guardar el progreso y paneles para docentes.',
  'Abrir la Lengua de Señas Mexicana y la Ecuatoriana con aliados de cada país.',
];
