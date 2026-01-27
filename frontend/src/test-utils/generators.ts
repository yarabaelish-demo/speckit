import * as fc from 'fast-check';
import { AudioEntry } from '../models/audioEntry';

/**
 * Generator for AudioEntry objects
 * Creates random but valid AudioEntry instances for property-based testing
 */
export const audioEntryArbitrary: fc.Arbitrary<AudioEntry> = fc.record({
  entryId: fc.uuid(),
  userId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  audioUrl: fc.webUrl(),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
  transcription: fc.lorem({ maxCount: 50 }),
  aiResponse: fc.lorem({ maxCount: 50 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
});

/**
 * Generator for search query strings
 * Creates random search queries with reasonable constraints
 */
export const searchQueryArbitrary: fc.Arbitrary<string> = fc.string({ 
  minLength: 1, 
  maxLength: 50 
});

/**
 * Generator for page numbers
 * Creates valid page numbers (1-indexed) for pagination testing
 */
export const pageNumberArbitrary: fc.Arbitrary<number> = fc.integer({ 
  min: 1, 
  max: 100 
});

/**
 * Generator for arrays of AudioEntry objects
 * Useful for testing with multiple entries
 */
export const audioEntryArrayArbitrary = (
  minLength: number = 0,
  maxLength: number = 50
): fc.Arbitrary<AudioEntry[]> => {
  return fc.array(audioEntryArbitrary, { minLength, maxLength });
};

/**
 * Generator for entries per page count
 * Creates valid entries per page values
 */
export const entriesPerPageArbitrary: fc.Arbitrary<number> = fc.integer({
  min: 1,
  max: 20
});
