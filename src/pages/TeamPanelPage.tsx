import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { languages, getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { REQUIREMENTS, PROJECT_ORIGIN, type RequirementStatus } from '../data/project';
import type { SignerProfile, TrainingSample } from '../models/dataset';
import { DATASET_CHANGED_EVENT } from '../services/dataset/datasetStore';
import {
  TARGET_CLIPS_PER_SIGN,
  TARGET_PEOPLE_PER_SIGN,
  countBySignerProfile,
  statsBySign,
  type SignReadiness,
} from '../services/dataset/datasetGoals';
import { loadAllSamples } from '../services/recognition/referenceSet';

const READINESS: Record<SignReadiness, { label: string; tone: string }> = {
  'sin-datos': { label: 'Sin datos', tone: 'badge--crit' },
  iniciando: { label: 'Iniciando', tone: 'badge--warn' },
  'en-camino': { label: 'En camino', tone: 'badge--soon' },
  lista: { label: 'Lista', tone: 'badge--ok' },
};

const REQ_STATUS: Record<RequirementStatus, { label: string; tone: string }> = {
  cumplido: { label: 'Cumplido', tone: 'badge--ok' },
  'en-progreso': { label: 'En progreso', tone: 'badge--warn' },
  pendiente: { label: 'Pendiente', tone: 'badge--crit' },
};

const SIGNER_LABEL: Record<SignerProfile, string> = {
  sorda: 'Personas Sordas',
  interprete: 'Intérpretes',
  'oyente-fluido': 'Oyentes con fluidez',
  aprendiz: 'Aprendices',
};

/** Fecha de la muestra final del semillero (ruta del semestre 2026-II). */
const SHOWCASE_DATE = new Date('2026-10-28T08:00:00-05:00');

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function TeamPanelPage() {
  const [languageId, setLanguageId] = useState(DEFAULT_LANGUAGE_ID);
  const [samples, setSamples] = useState<TrainingSample[] | null>(null);
  const language = getLanguageById(languageId);

  useEffect(() => {
    if (!language) return;
    let cancelled = false;
    const load = () => {
      loadAllSamples(language).then((all) => {
        if (!cancelled) setSamples(all);
      });
    };
    load();
    window.addEventListener(DATASET_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(DATASET_CHANGED_EVENT, load);
    };
  }, [language]);

  const bySign = statsBySign(samples ?? []);
  const signs = language?.signs ?? [];
  const totalClips = signs.reduce((sum, sign) => sum + (bySign[sign.id]?.clips ?? 0), 0);
  const totalTarget = signs.length * TARGET_CLIPS_PER_SIGN;
  const people = new Set((samples ?? []).map((s) => s.contributor.alias.trim().toLowerCase())).size;
  const readySigns = signs.filter((sign) => bySign[sign.id]?.readiness === 'lista').length;
  const requirementsDone = REQUIREMENTS.filter((r) => r.status === 'cumplido').length;
  const profiles = countBySignerProfile(samples ?? []);
  const days = daysUntil(SHOWCASE_DATE);

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Herramientas internas</p>
        <h1>Panel del equipo</h1>
        <p className="lead">
          El estado del proyecto de un vistazo: cuántos datos de entrenamiento hay por seña, quién los
          grabó y qué falta para que el reconocimiento sea confiable.
        </p>
      </header>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi__label">Clips de entrenamiento</span>
          <span className="kpi__value">
            {samples === null ? '…' : totalClips}
            <small>/ {totalTarget}</small>
          </span>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (totalClips / totalTarget) * 100)}%` }} />
          </span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Personas que grabaron</span>
          <span className="kpi__value">
            {samples === null ? '…' : people}
            <small>/ {TARGET_PEOPLE_PER_SIGN} mínimo</small>
          </span>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (people / TARGET_PEOPLE_PER_SIGN) * 100)}%` }} />
          </span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Señas listas</span>
          <span className="kpi__value">
            {readySigns}
            <small>/ {signs.length}</small>
          </span>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${signs.length ? (readySigns / signs.length) * 100 : 0}%` }} />
          </span>
        </div>
        <div className="kpi kpi--accent">
          <span className="kpi__label">Muestra final</span>
          <span className="kpi__value">
            {days > 0 ? days : 0}
            <small>{days === 1 ? 'día' : 'días'}</small>
          </span>
          <span className="kpi__note">{PROJECT_ORIGIN.showcase}</span>
        </div>
      </div>

      <div className="panel-grid">
        <div className="card">
          <div className="card__head">
            <h2>Dataset por seña</h2>
            <Link className="button button--sm" to="/herramientas/entrenar">
              Grabar clips
            </Link>
          </div>
          <label className="field field--inline">
            <span>Lengua</span>
            <select value={languageId} onChange={(event) => setLanguageId(event.target.value)}>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.shortName}){l.status === 'proximamente' ? ' · próximamente' : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seña</th>
                  <th>Clips</th>
                  <th>Personas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {signs.map((sign) => {
                  const stats = bySign[sign.id] ?? { clips: 0, people: 0, readiness: 'sin-datos' as const };
                  const readiness = READINESS[stats.readiness];
                  return (
                    <tr key={sign.id}>
                      <td className="data-table__sign">{sign.letter}</td>
                      <td>
                        <span className="cell-meter">
                          <span className="meter" aria-hidden="true">
                            <span style={{ width: `${Math.min(100, (stats.clips / TARGET_CLIPS_PER_SIGN) * 100)}%` }} />
                          </span>
                          <span className="num">
                            {stats.clips}/{TARGET_CLIPS_PER_SIGN}
                          </span>
                        </span>
                      </td>
                      <td className="num">
                        {stats.people}/{TARGET_PEOPLE_PER_SIGN}
                      </td>
                      <td>
                        <span className={`badge ${readiness.tone}`}>{readiness.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note">
            Una seña está lista con {TARGET_CLIPS_PER_SIGN} clips de al menos {TARGET_PEOPLE_PER_SIGN}{' '}
            personas distintas. Cuenta el dataset publicado más lo grabado en este navegador.
          </p>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Requisitos del proyecto</h2>
            <p className="note">
              {requirementsDone} de {REQUIREMENTS.length} cumplidos, según la ficha técnica.
            </p>
            <ul className="req-list">
              {REQUIREMENTS.map((req) => (
                <li key={req.action}>
                  <span className={`badge ${REQ_STATUS[req.status].tone}`}>{REQ_STATUS[req.status].label}</span>
                  <div>
                    <p>{req.action}</p>
                    <p className="note">{req.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Quién grabó</h2>
            <ul className="bar-list">
              {(Object.keys(SIGNER_LABEL) as SignerProfile[]).map((profile) => {
                const count = profiles[profile];
                const max = Math.max(1, ...Object.values(profiles));
                return (
                  <li key={profile}>
                    <span>{SIGNER_LABEL[profile]}</span>
                    <span className="meter" aria-hidden="true">
                      <span style={{ width: `${(count / max) * 100}%` }} />
                    </span>
                    <span className="num">{count}</span>
                  </li>
                );
              })}
            </ul>
            <p className="note">Las referencias deben venir sobre todo de personas Sordas e intérpretes.</p>
          </div>

          <div className="card">
            <h2>Herramientas</h2>
            <div className="tool-links">
              <Link to="/herramientas/entrenar">Entrenar la IA: grabar y subir clips</Link>
              <Link to="/herramientas/referencias">Referencias rápidas (una postura)</Link>
              <a
                href="https://github.com/profenapaipa/diversena/blob/main/docs/ENTRENAMIENTO-IA.md"
                target="_blank"
                rel="noreferrer"
              >
                Guía de grabación (GitHub)
              </a>
              <Link to="/proyecto">Documentación del proyecto</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
