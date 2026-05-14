/**
 * Struktur für die Startseite: Slots für spätere CMS/DB-Anbindung.
 * Texte kommen aktuell aus messages (home.*); IDs dienen nur der Reihenfolge.
 */
export const HOME_TESTIMONIAL_SLOTS = [1, 2, 3] as const;

export const HOME_METRIC_IDS = ["m1", "m2", "m3"] as const;

export type HomeTestimonialSlot = (typeof HOME_TESTIMONIAL_SLOTS)[number];
export type HomeMetricId = (typeof HOME_METRIC_IDS)[number];
