'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBroadcastEngine } from './engine';
import { NetworkBug, LowerThird } from './graphics';
import { HumanAnchorFeed } from './shows/HumanAnchorFeed';
import { BigBoardSet } from './shows/BigBoardSet';
import { MockDraftSet } from './shows/MockDraftSet';
import { WarRoomSet } from './shows/WarRoomSet';

export function StudioArena() {
    const { isLive, currentSegment } = useBroadcastEngine();

    if (!isLive || !currentSegment) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060606] overflow-hidden flex flex-col"
        >
            {/* Studio Background Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/40 via-black to-black" />

            {/* Network Bug Top Right */}
            <NetworkBug />

            {/* Main Set Content (Changes based on Segment) */}
            <div className="flex-1 relative flex items-center justify-center pt-16 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSegment.id}
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full"
                    >
                        {currentSegment.type === 'HUMAN_ANCHOR_FEED' && <HumanAnchorFeed segment={currentSegment} />}
                        {currentSegment.type === 'BIG_BOARD' && <BigBoardSet segment={currentSegment} />}
                        {currentSegment.type === 'MOCK_DRAFT_DESK' && <MockDraftSet segment={currentSegment} />}
                        {currentSegment.type === 'WAR_ROOM_DEBATE' && <WarRoomSet segment={currentSegment} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Broadcast Graphics Overlay (Lower Thirds) */}
            <LowerThird title={currentSegment.title} topic={currentSegment.topic} host={currentSegment.host} />
        </motion.div>
    );
}
