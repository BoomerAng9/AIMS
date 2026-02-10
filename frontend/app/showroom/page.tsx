
import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A.I.M.S. Design System Showroom',
  description: 'Showcasing the new operational interface design language.',
};

export default function ShowroomPage() {
  return (
    <div className="min-h-screen w-full bg-obsidian text-frosty-white overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto p-8 space-y-16">
        
        {/* Header Section */}
        <header className="space-y-4 text-center">
          <div className="inline-block px-4 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-display tracking-widest uppercase mb-4">
            System Design v2.0
          </div>
          <h1 className="text-6xl font-display font-medium text-white tracking-tighter drop-shadow-2xl">
            A.I.M.S. <span className="text-gold text-shadow-gold">Showroom</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto font-light">
            Operational interface standards for the AI Managed Systems platform.
            <br />
            <span className="font-marker text-gold/80 text-sm rotate-3 inline-block mt-2">Certified for Production</span>
          </p>
        </header>

        {/* 1. Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-light border-b border-wireframe-stroke pb-2">01. Chromatic Array</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ColorCard name="Obsidian" hex="#0A0A0A" bg="bg-obsidian" text="text-white" />
            <ColorCard name="Gold (Primary)" hex="#D4AF37" bg="bg-gold" text="text-black" />
            <ColorCard name="Gunmetal" hex="#2A2A2A" bg="bg-gunmetal" text="text-white" />
            <ColorCard name="Signal Green" hex="#10B981" bg="bg-signal-green" text="text-black" />
          </div>
        </section>

        {/* 2. Typography */}
        <section className="space-y-6">
          <h2 className="text-2xl font-light border-b border-wireframe-stroke pb-2">02. Typography</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-gold font-mono uppercase">Header / Display (Doto)</p>
              <div className="text-5xl font-display">
                AI Managed<br/>Systems
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gold font-mono uppercase">Sans / Body (Inter)</p>
              <p className="text-lg leading-relaxed text-muted">
                The quick brown fox jumps over the lazy dog. Used for primary content, 
                documentation, and chat interfaces. optimized for long-form readability 
                in low-light environments.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gold font-mono uppercase">Human Annotation (Permanent Marker)</p>
              <p className="font-marker text-xl text-white/80 -rotate-1">
                "Check the neural configurations before deployment!"
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gold font-mono uppercase">Code / Data (Doto)</p>
              <div className="font-mono text-sm bg-black/50 p-4 rounded border border-wireframe-stroke text-green-400">
                {`> SYSTEM.INIT(CORE_V2)\n> CONNECTING TO NEURAL HUB... [OK]`}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Surface & Glass */}
        <section className="space-y-6">
          <h2 className="text-2xl font-light border-b border-wireframe-stroke pb-2">03. Glass Surfaces</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Standard Glass Panel */}
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-64 hover-glow-border group">
              <div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-gold transition-colors">
                  <span className="font-display font-bold">01</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Standard Glass</h3>
                <p className="text-muted text-sm">Used for secondary modules and list items. Lightweight blur.</p>
              </div>
              <div className="text-xs font-mono text-white/40">.glass-panel</div>
            </div>

            {/* Premium Glass Panel */}
            <div className="glass-premium p-6 rounded-xl flex flex-col justify-between h-64 hover-glow-border relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 blur-3xl group-hover:bg-gold/20 transition-all"></div>
              <div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center mb-4 text-black shadow-lg shadow-gold/20">
                  <span className="font-display font-bold">02</span>
                </div>
                <h3 className="text-xl font-medium mb-2 text-white">Premium Glass</h3>
                <p className="text-white/70 text-sm">High-fidelity surface for primary dashboards and active states. Includes gold radial tint.</p>
              </div>
              <div className="text-xs font-mono text-gold/60">.glass-premium</div>
            </div>

            {/* Active/Signal Panel */}
            <div className="glass-panel border-signal-green/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] p-6 rounded-xl flex flex-col justify-between h-64">
              <div>
                <div className="w-2 h-2 rounded-full bg-signal-green shadow-[0_0_10px_#10B981] mb-6 animate-pulse"></div>
                <h3 className="text-xl font-medium mb-2">System Active</h3>
                <p className="text-muted text-sm">Example of a state-driven card variant (Online/Active).</p>
              </div>
              <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded text-xs uppercase tracking-wider transition-colors border border-wireframe-stroke">
                View Logs
              </button>
            </div>

          </div>
        </section>

        {/* 4. Controls */}
        <section className="space-y-6">
          <h2 className="text-2xl font-light border-b border-wireframe-stroke pb-2">04. Interactive Controls</h2>
          <div className="glass-panel p-10 rounded-xl space-y-8">
            
            {/* Buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              <button className="px-6 py-3 bg-gold hover:bg-gold-light text-black font-semibold rounded-lg shadow-neon-gold transition-all transform hover:-translate-y-0.5">
                Primary Action
              </button>
              <button className="px-6 py-3 bg-transparent border border-white/20 text-white hover:bg-white hover:text-black rounded-lg transition-all">
                Secondary Action
              </button>
              <button className="px-6 py-3 text-gold hover:text-white transition-colors relative group">
                <span className="relative z-10">Ghost Link</span>
                <span className="absolute bottom-2 left-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>

            {/* Inputs */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted">Agent ID</label>
                <input 
                  type="text" 
                  placeholder="AG-001" 
                  className="w-full bg-black/40 border-b border-white/20 p-3 text-white focus:outline-none focus:border-gold focus:bg-black/60 transition-colors font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted">Directive</label>
                <select className="w-full bg-black/40 border-b border-white/20 p-3 text-white focus:outline-none focus:border-gold transition-colors font-sans appearance-none">
                  <option>Autonomous Execution</option>
                  <option>Human Oversight</option>
                  <option>System Diagnostics</option>
                </select>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}

function ColorCard({ name, hex, bg, text }: { name: string, hex: string, bg: string, text: string }) {
  return (
    <div className="glass-panel rounded-lg overflow-hidden group">
      <div className={`h-24 ${bg} relative`}>
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
      </div>
      <div className="p-4">
        <p className={`font-medium ${text === 'text-black' ? 'text-white' : 'text-white'}`}>{name}</p>
        <p className="text-xs font-mono text-muted mt-1">{hex}</p>
      </div>
    </div>
  );
}
