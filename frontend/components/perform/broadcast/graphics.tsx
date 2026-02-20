import { motion } from 'framer-motion';

export function NetworkBug() {
    return (
        <div className="absolute top-8 right-8 z-[100] flex flex-col items-end pointer-events-none">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center bg-black/60 shadow-[0_0_15px_rgba(218,165,32,0.5)]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="w-full h-full rounded-full border-t-2 border-l-2 border-gold/80"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-[0.2em] text-white leading-none">PER|FORM</span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-gold text-right">Draft Center</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-red-600 rounded">
                <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-white"
                />
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Live Network</span>
            </div>
        </div>
    );
}

export function LowerThird({ title, topic, host }: { title: string; topic: string; host: string }) {
    return (
        <motion.div
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute bottom-16 left-12 z-[90] pointer-events-none"
        >
            <div className="relative overflow-hidden bg-black/80 backdrop-blur-md border border-gold/30 rounded-lg p-5 w-[600px] shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
                <div className="absolute -inset-1 bg-gradient-to-r from-gold/10 to-transparent blur-xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-sm">
                            {({
                                HUMAN: 'Analyst Desk',
                                ACHEEVY: 'Draft Intelligence',
                                BOOMER_ANG: 'Draft Analyst',
                                LIL_HAWK: 'Draft Analyst',
                            } as Record<string, string>)[host] ?? 'Per|Form Network'}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">
                        {title}
                    </h2>
                    <p className="text-lg text-gold font-medium">
                        {topic}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
