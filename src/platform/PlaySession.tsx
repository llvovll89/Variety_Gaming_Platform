// The session context lives in playSessionContext.ts; the shared result widgets moved to the game kit.
// Re-exported here so existing game imports keep working while they move to src/shared/kit.
export { PlaySession, type PlaySessionValue } from './playSessionContext';
export { NextGameActions, ScoreFeedback } from '../shared/kit/nextGame';
