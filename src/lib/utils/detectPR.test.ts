import { detectNewPRs } from './detectPR';
import { PersonalRecord, WorkoutSession } from '@/types/firestore';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp for testing
const mockTimestamp = { toDate: () => new Date(), seconds: 1234567890, nanoseconds: 0 } as Timestamp;

describe('detectNewPRs', () => {
    const mockUserId = 'user123';

    const existingPRs: PersonalRecord[] = [
        {
            exerciseName: 'Bench Press',
            weight: 100,
            reps: 1,
            date: mockTimestamp,
        },
        {
            exerciseName: 'Squat',
            weight: 140,
            reps: 1,
            date: mockTimestamp,
        }
    ];

    it('should detect a new PR when weight is higher', () => {
        const session: WorkoutSession = {
            id: 'w1',
            userId: mockUserId,
            planId: 'plan1',
            planName: 'Test Plan',
            dayNumber: 1,
            dayName: 'Push Day',
            date: mockTimestamp,
            createdAt: mockTimestamp,
            exercises: [
                {
                    name: 'Bench Press',
                    sets: [
                        { setNumber: 1, reps: 1, weight: 105 }, // 105kg > 100kg
                    ]
                }
            ]
        };

        const results = detectNewPRs(session, existingPRs);
        expect(results).toHaveLength(1);
        expect(results[0].exerciseName).toBe('Bench Press');
        expect(results[0].isNewPR).toBe(true);
        expect(results[0].newWeight).toBe(105);
    });

    it('should detect a new PR when reps create a higher projected 1RM', () => {
        // 100kg x 1 = 100 1RM
        // 90kg x 5 = ~101.25 1RM (Brzycki: w * (36 / (37 - r)))

        const session: WorkoutSession = {
            id: 'w2',
            userId: mockUserId,
            planId: 'plan1',
            planName: 'Test Plan',
            dayNumber: 1,
            dayName: 'Push Day',
            date: mockTimestamp,
            createdAt: mockTimestamp,
            exercises: [
                {
                    name: 'Bench Press',
                    sets: [
                        { setNumber: 1, reps: 5, weight: 90 },
                        { setNumber: 2, reps: 5, weight: 90 },
                        { setNumber: 3, reps: 5, weight: 90 },
                    ]
                }
            ]
        };

        const results = detectNewPRs(session, existingPRs);
        expect(results).toHaveLength(1);
        expect(results[0].exerciseName).toBe('Bench Press');
        expect(results[0].isNewPR).toBe(true);
    });

    it('should NOT detect PR if performance is lower', () => {
        const session: WorkoutSession = {
            id: 'w3',
            userId: mockUserId,
            planId: 'plan1',
            planName: 'Test Plan',
            dayNumber: 1,
            dayName: 'Push Day',
            date: mockTimestamp,
            createdAt: mockTimestamp,
            exercises: [
                {
                    name: 'Bench Press',
                    sets: [
                        { setNumber: 1, reps: 2, weight: 80 }, // ~83kg 1RM < 100
                    ]
                }
            ]
        };

        const results = detectNewPRs(session, existingPRs);
        expect(results).toHaveLength(0);
    });

    it('should detect PR for a new exercise (no existing history)', () => {
        const session: WorkoutSession = {
            id: 'w4',
            userId: mockUserId,
            planId: 'plan1',
            planName: 'Test Plan',
            dayNumber: 2,
            dayName: 'Leg Day',
            date: mockTimestamp,
            createdAt: mockTimestamp,
            exercises: [
                {
                    name: 'Leg Press',
                    sets: [
                        { setNumber: 1, reps: 10, weight: 200 },
                    ]
                }
            ]
        };

        const results = detectNewPRs(session, existingPRs);
        expect(results).toHaveLength(1);
        expect(results[0].exerciseName).toBe('Leg Press');
        expect(results[0].isNewPR).toBe(true);
    });
});
