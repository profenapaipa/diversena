import { useState, type FormEvent } from 'react';
import { getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { useCamera } from '../hooks/useCamera';
import { captureFaceAvatar, useFaceDetection, type FaceBox } from '../hooks/useFaceDetection';
import { useProfile } from '../hooks/useProfile';
import type { DominantHand } from '../models/dataset';
import { deleteProfile, saveProfile, type ProfileRole } from '../services/profile/profileStore';

const ROLE_LABEL: Record<ProfileRole, string> = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  familia: 'Familia',
  otro: 'Otro',
};

/** Pistas de encuadre según dónde y qué tan grande se ve la cara. */
function framingHint(face: FaceBox | undefined, count: number): { ok: boolean; text: string } {
  if (count === 0 || !face) return { ok: false, text: 'No vemos tu rostro. Mira de frente a la cámara.' };
  if (count > 1) return { ok: false, text: 'Hay más de una persona en cámara. Deja solo a quien crea el perfil.' };
  const centerX = face.x + face.width / 2;
  const centerY = face.y + face.height / 2;
  if (face.width < 0.15) return { ok: false, text: 'Acércate un poco a la cámara.' };
  if (face.width > 0.6) return { ok: false, text: 'Aléjate un poco de la cámara.' };
  if (Math.abs(centerX - 0.5) > 0.2 || Math.abs(centerY - 0.45) > 0.22) {
    return { ok: false, text: 'Ubica tu cara en el centro del recuadro.' };
  }
  return { ok: true, text: '¡Perfecto! Ya puedes tomar la foto.' };
}

export function ProfilePage() {
  const profile = useProfile();
  const [editing, setEditing] = useState(profile === null);
  const [name, setName] = useState(profile?.name ?? '');
  const [role, setRole] = useState<ProfileRole>(profile?.role ?? 'estudiante');
  const [dominantHand, setDominantHand] = useState<DominantHand>(profile?.dominantHand ?? 'derecha');
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar ?? null);

  const { status: cameraStatus, error: cameraError, videoRef, start: startCamera, stop: stopCamera } = useCamera();
  const face = useFaceDetection(videoRef, cameraStatus === 'active');
  const hint = framingHint(face.faces[0], face.faces.length);

  const language = getLanguageById(DEFAULT_LANGUAGE_ID);

  function handleCapture() {
    const video = videoRef.current;
    const box = face.faces[0];
    if (!video || !box) return;
    const image = captureFaceAvatar(video, box);
    if (image) {
      setAvatar(image);
      stopCamera();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    saveProfile({ name: name.trim(), role, dominantHand, avatar });
    stopCamera();
    setEditing(false);
  }

  function handleDelete() {
    if (!window.confirm('¿Borrar tu perfil y tu progreso de este navegador?')) return;
    deleteProfile();
    setName('');
    setAvatar(null);
    setEditing(true);
  }

  if (profile && !editing) {
    return (
      <section className="page">
        <h1>Mi perfil</h1>
        <div className="profile-card">
          {profile.avatar ? (
            <img className="avatar avatar--large" src={profile.avatar} alt="" />
          ) : (
            <span className="avatar avatar--large avatar--empty" aria-hidden="true">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h2 className="profile-card__name">{profile.name}</h2>
            <p className="option-card__subtitle">
              {ROLE_LABEL[profile.role]} · mano dominante {profile.dominantHand}
            </p>
          </div>
        </div>

        {language && (
          <>
            <h2>Mi progreso en {language.shortName}</h2>
            <div className="progress-grid">
              {language.signs.map((sign) => {
                const entry = profile.progress[`${language.id}:${sign.id}`];
                return (
                  <div key={sign.id} className={entry ? 'progress-tile progress-tile--done' : 'progress-tile'}>
                    <span className="option-card__letter">{sign.letter}</span>
                    <span className="option-card__subtitle">
                      {entry ? `${entry.successes} acierto${entry.successes === 1 ? '' : 's'}` : 'Sin practicar'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="video-actions">
          <button type="button" className="button" onClick={() => setEditing(true)}>
            Editar perfil
          </button>
          <button type="button" className="button button--secondary" onClick={handleDelete}>
            Borrar perfil
          </button>
        </div>
        <p className="practice-panel__note">
          Tu perfil, tu foto y tu progreso se guardan solo en este navegador. No se envían a ningún
          servidor.
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>{profile ? 'Editar perfil' : 'Crea tu perfil'}</h1>
      <p>
        Con un perfil, DiverSeña recuerda tu progreso al practicar. La cámara detecta tu rostro solo
        para encuadrar una foto de perfil: <strong>no te identifica ni guarda datos biométricos</strong>,
        y la foto no sale de este navegador.
      </p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre o apodo</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={40} />
        </label>

        <label className="field">
          <span>Soy</span>
          <select value={role} onChange={(event) => setRole(event.target.value as ProfileRole)}>
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field">
          <legend>Mano dominante</legend>
          <label className="camera-view__toggle">
            <input
              type="radio"
              name="dominant-hand"
              checked={dominantHand === 'derecha'}
              onChange={() => setDominantHand('derecha')}
            />
            Derecha
          </label>
          <label className="camera-view__toggle">
            <input
              type="radio"
              name="dominant-hand"
              checked={dominantHand === 'izquierda'}
              onChange={() => setDominantHand('izquierda')}
            />
            Izquierda
          </label>
        </fieldset>

        <h2>Foto de perfil (opcional)</h2>
        <div className="profile-photo">
          {avatar ? (
            <img className="avatar avatar--large" src={avatar} alt="Tu foto de perfil" />
          ) : (
            <span className="avatar avatar--large avatar--empty" aria-hidden="true">
              ?
            </span>
          )}

          <div className="camera-view">
            <div className="camera-view__frame" data-status={cameraStatus}>
              <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
              {cameraStatus === 'active' && (
                <div className="face-overlay" aria-hidden="true">
                  <div className="face-overlay__guide" />
                  {face.faces.map((box, i) => (
                    <div
                      key={i}
                      className={hint.ok ? 'face-overlay__box face-overlay__box--ok' : 'face-overlay__box'}
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}
              {cameraStatus !== 'active' && (
                <p className="camera-view__overlay-text">
                  {cameraStatus === 'requesting' ? 'Iniciando cámara…' : 'Cámara desactivada'}
                </p>
              )}
            </div>

            {cameraStatus === 'active' ? (
              <>
                <p role="status" className={hint.ok ? 'camera-view__result--match' : 'camera-view__status'}>
                  {face.status === 'cargando'
                    ? 'Cargando el detector de rostro…'
                    : face.status === 'error'
                      ? 'No se pudo cargar el detector de rostro.'
                      : hint.text}
                </p>
                <div className="video-actions">
                  <button type="button" className="button" onClick={handleCapture} disabled={!hint.ok}>
                    📸 Tomar foto
                  </button>
                  <button type="button" className="button button--secondary" onClick={stopCamera}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="video-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={startCamera}
                  disabled={cameraStatus === 'requesting'}
                >
                  🎥 {avatar ? 'Tomar otra foto' : 'Usar la cámara'}
                </button>
                {avatar && (
                  <button type="button" className="button button--secondary" onClick={() => setAvatar(null)}>
                    Quitar foto
                  </button>
                )}
              </div>
            )}
            {cameraError && (
              <p role="alert" className="camera-view__error">
                {cameraError.message}
              </p>
            )}
          </div>
        </div>

        <div className="video-actions">
          <button type="submit" className="button" disabled={!name.trim()}>
            Guardar perfil
          </button>
          {profile && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                stopCamera();
                setEditing(false);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
