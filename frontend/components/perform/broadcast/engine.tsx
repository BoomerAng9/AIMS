import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type SegmentType = 'BIG_BOARD' | 'WAR_ROOM_DEBATE' | 'MOCK_DRAFT_DESK' | 'HUMAN_ANCHOR_FEED';

export interface BroadcastSegment {
    id: string;
    type: SegmentType;
    title: string;
    durationSeconds: number; // How long the segment runs
    host: 'ACHEEVY' | 'BOOMER_ANG' | 'HUMAN' | 'LIL_HAWK';
    topic: string; // Used for lower thirds
    dataContext?: any; // The data being discussed
}

// Defining the Run of Show (RoS)
const RUN_OF_SHOW: BroadcastSegment[] = [
    {
        id: 'intro',
        type: 'HUMAN_ANCHOR_FEED',
        title: 'Per|Form Draft Center',
        durationSeconds: 15,
        host: 'HUMAN',
        topic: `Welcome to the ${new Date().getFullYear()} NFL Draft Coverage`,
    },
    {
        id: 'top-prospects',
        type: 'BIG_BOARD',
        title: 'Top Prospects',
        durationSeconds: 20,
        host: 'ACHEEVY',
        topic: 'Breaking down the consensus Top 5 entering the Draft',
    },
    {
        id: 'team-needs',
        type: 'MOCK_DRAFT_DESK',
        title: `NFL Draft ${new Date().getFullYear()}`,
        durationSeconds: 25,
        host: 'BOOMER_ANG',
        topic: 'On The Clock — Who goes #1 Overall?',
    },
    {
        id: 'closing-debate',
        type: 'WAR_ROOM_DEBATE',
        title: 'War Room Debate',
        durationSeconds: 12,
        host: 'BOOMER_ANG',
        topic: 'Bull vs. Bear: Breaking down the top Draft storylines',
    }
];

interface BroadcastEngineState {
    isLive: boolean;
    currentSegment: BroadcastSegment | null;
    timeRemaining: number;
    startBroadcast: () => void;
    stopBroadcast: () => void;
    skipSegment: () => void;
}

const BroadcastContext = createContext<BroadcastEngineState | null>(null);

export function useBroadcastEngine() {
    const ctx = useContext(BroadcastContext);
    if (!ctx) throw new Error('Must be used within a BroadcastProvider');
    return ctx;
}

export function BroadcastProvider({ children }: { children: React.ReactNode }) {
    const [isLive, setIsLive] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const startBroadcast = useCallback(() => {
        setIsLive(true);
        setActiveIdx(0);
        setTimeRemaining(RUN_OF_SHOW[0].durationSeconds);
    }, []);

    const stopBroadcast = useCallback(() => {
        setIsLive(false);
        setActiveIdx(0);
        setTimeRemaining(0);
    }, []);

    const skipSegment = useCallback(() => {
        if (!isLive) return;
        const nextIdx = (activeIdx + 1) % RUN_OF_SHOW.length;
        setActiveIdx(nextIdx);
        setTimeRemaining(RUN_OF_SHOW[nextIdx].durationSeconds);
    }, [activeIdx, isLive]);

    // The Segments Timer Loop
    useEffect(() => {
        if (!isLive) return;

        const tick = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Move to next segment
                    const nextIdx = (activeIdx + 1) % RUN_OF_SHOW.length;
                    setActiveIdx(nextIdx);
                    return RUN_OF_SHOW[nextIdx].durationSeconds;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(tick);
    }, [isLive, activeIdx]);

    const value = {
        isLive,
        currentSegment: isLive ? RUN_OF_SHOW[activeIdx] : null,
        timeRemaining,
        startBroadcast,
        stopBroadcast,
        skipSegment
    };

    return (
        <BroadcastContext.Provider value={value}>
            {children}
        </BroadcastContext.Provider>
    );
}
