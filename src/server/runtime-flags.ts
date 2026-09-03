/**
 * Authoritative process test mode flag.
 * Evaluated strictly once at process startup from environment variables.
 * Immutable at runtime. Production MUST execute with test mode = false.
 */
export const IS_TEST_MODE: boolean = Object.freeze({
  enabled: Boolean(
    (process.env.NODE_ENV === 'test' ||
     process.env.CI === 'true' ||
     process.env.MARMOT_TEST_MODE === 'true') &&
    process.env.NODE_ENV !== 'production'
  )
}).enabled;
