import {describe, expect, it} from 'vitest';

import {createInternalOutcome, projectInternalStatusToPublic, projectOutcomeToPublic} from '../layerge/internals/outcome.js';

describe('internals/outcome', () => {
    it('projects internal status to public status (blocked -> aborted)', () => {
        expect(projectInternalStatusToPublic('blocked')).toBe('aborted');
        expect(projectInternalStatusToPublic('completed')).toBe('completed');
        expect(projectInternalStatusToPublic('failed')).toBe('failed');
        expect(projectInternalStatusToPublic('aborted')).toBe('aborted');
        expect(projectInternalStatusToPublic('superseded')).toBe('superseded');
    });

    it('projects internal outcome to public outcome without adding new public statuses', () => {
        const internal = createInternalOutcome({
            traceId: 't1',
            stage: 'open',
            status: 'blocked',
            reason: 'controlledHooks.beforeOpen'
        });

        expect(internal.stage).toBe('open');
        expect(internal.status).toBe('blocked');

        const pub = projectOutcomeToPublic(internal);
        expect(pub).toEqual({
            traceId: 't1',
            status: 'aborted'
        });
    });
});
