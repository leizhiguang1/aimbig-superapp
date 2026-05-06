// Fallback lists used when a brand has no rows configured for a given
// brand_config_items category. As soon as a brand adds their first row,
// the fallback stops being used.
//
// Order here drives the rendered dropdown order for the fallback case
// and matches the seed migrations (e.g. `0093_seed_default_salutations`).
export const SALUTATION_FALLBACK = ["Mr", "Ms", "Mrs", "Dr"] as const;
