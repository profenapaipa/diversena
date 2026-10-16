/**
 * Estabiliza un resultado que llega cuadro a cuadro: solo cambia la
 * respuesta mostrada cuando una misma etiqueta gana la mayoría de las
 * últimas `windowSize` observaciones. Evita que el texto "parpadee" entre
 * dos letras mientras la mano se acomoda.
 *
 * `null` también es un voto ("no reconocido"), así que el resultado se
 * apaga igual de estable que se enciende.
 */
export class TemporalVoter<T> {
  private history: Array<T | null> = [];
  private current: T | null = null;
  private readonly windowSize: number;
  private readonly minAgreement: number;

  constructor(windowSize = 8, minAgreement = 5) {
    this.windowSize = windowSize;
    this.minAgreement = minAgreement;
  }

  push(label: T | null): T | null {
    this.history.push(label);
    if (this.history.length > this.windowSize) this.history.shift();

    const counts = new Map<T | null, number>();
    for (const item of this.history) counts.set(item, (counts.get(item) ?? 0) + 1);

    let winner: T | null = this.current;
    let winnerCount = 0;
    for (const [label, count] of counts) {
      if (count > winnerCount) {
        winner = label;
        winnerCount = count;
      }
    }

    if (winnerCount >= this.minAgreement) this.current = winner;
    return this.current;
  }

  reset(): void {
    this.history = [];
    this.current = null;
  }
}
