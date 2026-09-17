import {describe, expect, it, vi} from 'vitest';

import {createDecisionTraceStore} from '../layerge/internals/decisionTrace.js';

describe('internals/decisionTrace', () => {
    it('does not capture when isDev=false or level=off', () => {
        const store1 = createDecisionTraceStore({
            isDev: false,
            level: 'verbose'
        });

        expect(store1.start('t1')).toBe(null);
        expect(store1.getAll()).toEqual([]);

        const store2 = createDecisionTraceStore({
            isDev: true,
            level: 'off'
        });

        expect(store2.start('t2')).toBe(null);
        expect(store2.getAll()).toEqual([]);
    });

    it('captures start and settle and keeps trace count within maxTraces', () => {
        const store = createDecisionTraceStore({
            isDev: true,
            level: 'verbose',
            maxTraces: 3
        });

        for (let i = 0; i < 5; i++) {
            const id = `t${i}`;
            store.start(id);
            store.push(id, 'validate', {i: i});
            store.settle(id);
        }

        const traces = store.getAll();
        expect(traces.length).toBe(3);
        expect(traces[0].traceId).toBe('t2');
        expect(traces[2].traceId).toBe('t4');
        expect(traces[2].events[0].type).toBe('start');
        expect(traces[2].events[traces[2].events.length - 1].type).toBe('settle');
    });

    it('keeps event count within maxEventsPerTrace and always records settle', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-02T00:00:00Z'));

        const store = createDecisionTraceStore({
            isDev: true,
            level: 'verbose',
            maxTraces: 10,
            maxEventsPerTrace: 3
        });

        store.start('t1'); // start (1)
        store.push('t1', 'resolveTarget'); // (2)
        store.push('t1', 'validate'); // (3)
        store.push('t1', 'runHook'); // would exceed, ring should evict oldest non-start
        store.settle('t1'); // settle must exist at the end

        const traces = store.getAll();
        expect(traces.length).toBe(1);

        const events = traces[0].events;
        expect(events.length).toBeLessThanOrEqual(3);
        expect(events[0].type).toBe('start');
        expect(events[events.length - 1].type).toBe('settle');

        vi.useRealTimers();
    });

    it('sanitizes event payload via provided sanitize()', () => {
        const store = createDecisionTraceStore({
            isDev: true,
            level: 'verbose',
            sanitize: (data) => {
                const next = {...data};
                if ('url' in next) {
                    next.url = '[redacted]';
                }
                return next;
            }
        });

        store.start('t1');
        store.push('t1', 'applyRouter', {url: 'https://example.com/a?token=secret'});
        store.settle('t1');

        const traces = store.getAll();
        const apply = traces[0].events.find((e) => e.type === 'applyRouter');

        expect(apply && apply.data).toEqual({url: '[redacted]'});
    });
});
