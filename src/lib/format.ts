import { clinic } from '../data/clinic';

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export interface HoursLine {
  days: string;
  hours: string;
}

/** Horario de apertura listo para mostrar (agrupa los días contiguos). */
export function openingHoursLines(): HoursLine[] {
  return clinic.openingHours.map((schedule) => {
    const first = schedule.days[0];
    const last = schedule.days[schedule.days.length - 1];

    let days = 'Consultar';
    if (first !== undefined && last !== undefined) {
      days =
        first === last
          ? (DAY_LABELS[first] ?? '')
          : `${DAY_LABELS[first]} a ${(DAY_LABELS[last] ?? '').toLowerCase()}`;
    }

    return {
      days,
      hours: schedule.ranges.map(([open, close]) => `${open} – ${close}`).join(' · '),
    };
  });
}

/** "14 de noviembre de 2026" */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
