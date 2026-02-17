/**
 * A.I.M.S. Lore Content Data Layer
 *
 * Single source of truth for all lore, character bios, races, and the Book of V.I.B.E.
 * Pages import from here so content stays lean and pages stay structural.
 *
 * Canonical V.I.B.E. Universe — sourced from:
 *   frontend/docs/The Book of VIBE – Worldbuilding Glossary & Character Bible.md
 *
 * DOMAIN SEPARATION — CRITICAL:
 * This file is STORYTELLING / FICTION. The Book of V.I.B.E., Aether Vos, Achievmor,
 * the races, the Elder — this is the fictional worldbuilding universe.
 *
 * Sports, athletes, Per|Form, N.I.L. (Name Image Likeness), transfer portal,
 * scouting, P.A.I. formula — NONE of that belongs here. That lives in nil.ts.
 * These are two completely separate domains under the A.I.M.S. umbrella.
 */

// ─────────────────────────────────────────────────────────────
// The Book of V.I.B.E.
// ─────────────────────────────────────────────────────────────

export interface VibeChapter {
  number: number;
  title: string;
  subtitle: string;
  content: string;
  color: string; // Tailwind accent color for the chapter
}

/**
 * The Book of V.I.B.E.
 *
 * An Afrofuturist saga set on the planet A-C-H-V-M-R (Achievmor).
 * Blends techno-mysticism, cyberpunk, and sociopolitical subtext.
 * Advanced technology intertwines with spirituality — AI helmets
 * interface with souls, time travel is policed by zealots, and
 * reproduction taps cosmic forces.
 *
 * Source: The Book of VIBE – Worldbuilding Glossary & Character Bible
 */
export const BOOK_OF_VIBE: {
  title: string;
  subtitle: string;
  prologue: string;
  chapters: VibeChapter[];
  epilogue: string;
} = {
  title: 'The Book of V.I.B.E.',
  subtitle: 'An Afrofuturist Saga of Achievmor',
  prologue:
    'The Book of VIBE is an expansive Afrofuturist saga that blends techno-mysticism and cyberpunk aesthetics with rich sociopolitical subtext. It envisions a future through a Black cultural lens with social justice at its core. In this universe, advanced technology intertwines with spirituality\u2014AI helmets interface with souls, time travel is policed by zealots, and reproduction itself taps cosmic forces. The setting spans the planet A-C-H-V-M-R (pronounced "Achieve More"), its capital cities powered by kinetic energy, and portals opening windows to distant galaxies.',

  chapters: [
    {
      number: 1,
      title: 'The Planet Achievmor',
      subtitle: 'A world teeming with advanced cities, diverse habitats, and portal links to the stars.',
      content:
        'The planet A-C-H-V-M-R\u2014called Achievmor in speech\u2014is a world symbolizing the ethos "achieve more." It has gravity and climate similar to Earth, but its sky shimmers with unusual colors due to high-frequency technologies and cosmic phenomena. Legends say it orbits a star that is square-shaped and a moon that is pitch-black.\n\nGeographically, Achievmor has several continents and city-states, each corresponding to the letters in its name:\n\nAureon (A): The capital region, home to Achiev-City. A cosmopolitan metropolis where Clouded Nebula intellectuals walk the same streets as merchant-class Playbills and monitored Ruusoh workers. Notable locations include the Hall of Vibes and the Elder\'s Monument.\n\nCelestine (C): A coastal city known for arts and mystics, housing the Sky Theater and Chrono-Monk archives beneath a cathedral.\n\nHarmonia (H): A plateau city famed for scientific research, where Harvesters and surface folk maintain a rare peaceful trade.\n\nViton (V): The industrial City of Gears, with a stark class divide between corporate arcologies and sprawling slums. A hotbed for the black market.\n\nMoralia (M): A spiritual region of floating monasteries and farming villages, where transformed Clouded Nebula retreat to meditate.\n\nRuus Prime (R): The zone where most Ruusohs are concentrated\u2014an enormous labor camp spanning a fertile valley. The town of New Adygea preserves Ruusoh culture under guard.',
      color: 'gold',
    },
    {
      number: 2,
      title: 'The Clouded Nebula',
      subtitle: 'An ancient people whose heads transform into luminous nebula clouds upon awakening.',
      content:
        'The Clouded Nebula are an ancient people of Achievmor distinguished by their melanated copper-brown skin and a latent cosmic gene. Upon spiritual awakening\u2014triggered by intense emotional frequency or ritual\u2014their DNA activates and their head transforms into a luminous nebula-like cloud. A halo of shimmering stardust replaces the physical head, glowing with inner light.\n\nClouded Nebula individuals value knowledge, harmony, and vibrational purity. They practice a sacred pineal gland coupling ritual with their mates, believing the pineal is the seat of the soul\'s sight. Because of this mystic tradition, they refrain from casual physical intimacy\u2014love for them is a profound psychic bond.\n\nHistorically, the Clouded Nebula led Achievmor\'s push for unity and higher consciousness, promoting the VIBE system as a tool for personal growth. It was an elder of this tribe who created the ACHIEEVY helmet generations ago. They revere ancestors and view the planet Mor as a living entity. Clouded Nebula can communicate via kinetic telepathy, sending thoughts through controlled energy vibrations.\n\nSociety holds awakened Cloud-Heads in high esteem\u2014many serve as scholars, councilors, or mentors\u2014yet this also breeds tension with those not yet transformed or of other tribes.',
      color: 'purple',
    },
    {
      number: 3,
      title: 'Aether Vos \u2014 The Kinetic Prodigy',
      subtitle: 'A young man of Clouded Nebula heritage who discovers the ACHIEEVY helmet and his destiny.',
      content:
        'Aether Vos is a young man of Clouded Nebula heritage, born with copper-brown skin, inquisitive amber eyes, and an aura of latent power. In childhood, Aether was quiet and introspective, often found communing with nature or listening to the hum of kinetic hubs in the distance.\n\nRaised in the outskirts of Achiev-City, he grew up hearing bedtime stories of his illustrious ancestor "The Elder" who once united tribes and forged a mighty artifact. Unbeknownst to him, these were not just fables\u2014the Elder was real, the creator of the ACHIEEVY helmet, and Aether is his direct descendant chosen by lineage.\n\nFrom an early age, Aether displayed kinetic telepathy\u2014he could sense the emotions of others as vibrations and, in rare instances, move small objects by concentrating on their vibrational frequency. He also has an uncanny resonance with Mor, the planet: sometimes he dreams of a colossal presence guiding him.\n\nHis journey begins when he stumbles upon the long-hidden ACHIEEVY helmet in an ancient vault left by the Elder. Upon wearing it, the AI awakens and recognizes him, initiating him into his legacy. Through Season 1, Aether grapples with imposter syndrome while learning to use ACHIEEVY\'s powers and seeing firsthand the injustices in Achievmor\u2014Ruusoh slavery, Marai persecution.\n\nHe evolves into a hero as he uses kinetic telepathy to unite allies and his combat skills to defend the oppressed. His ultimate internal goal is balancing rage at oppression with compassion and hope.',
      color: 'indigo',
    },
    {
      number: 4,
      title: 'The Elder \u2014 Architect of ACHIEEVY',
      subtitle: 'A visionary who created the helmet and the VIBE system, only to be assassinated by those who feared his vision.',
      content:
        'The Elder (real name lost to time, often called Elder Achiev in legends) was Aether Vos\'s great ancestor, a visionary from the Clouded Nebula tribe who lived several centuries ago. He is revered as the architect of the ACHIEEVY helmet and the VIBE system itself.\n\nIn an era when Achievmor was rife with tribal wars and aimless technology, the Elder dreamed of a way to synchronize technology with conscious evolution. He spent his life studying both quantum mechanics and ancient meditation, and ultimately forged the first ACHIEEVY prototype using a rare crystal from Mor\'s core and his own neural patterns as the AI seed.\n\nThe Elder successfully united warring city-states by introducing the VIBE rating system as a universal metric to replace racial or tribal superiority. He installed the first kinetic hubs in capitals, providing free energy and reducing resource conflicts. He kickstarted a golden age.\n\nNear the end of his life, the Elder saw the shadow of what would become the Malluminati\u2014a faction of ambitious leaders who coveted control. To prevent ACHIEEVY from falling into the wrong hands, he hid the helmet in a crypt accessible only to his bloodline. He passed away under mysterious circumstances\u2014some suspect poisoning orchestrated by proto-Malluminati.\n\nThough not physically present in the story, the Elder is a guiding spirit. ACHIEEVY\'s AI contains snippets of his consciousness, mentoring Aether like a digital ancestor across time.',
      color: 'amber',
    },
    {
      number: 5,
      title: 'The ACHIEEVY Helmet',
      subtitle: 'A neural-linked AI armor\u2014the most prized technological artifact on Achievmor.',
      content:
        'ACHIEEVY is a neural-linked AI armor helmet\u2014the most prized technological artifact on Achievmor. At first glance, it\'s a sleek, obsidian-black helmet with glowing runic patterns, form-fitting around the skull with a crown-like ridge. When activated, it extends an exoskeletal suit of adaptive armor around the wearer\'s body.\n\nThe name is stylized in all-caps. Scholars speculate it stands for "Advanced Consciousness Heuristic for Integrating, Evaluating, and Elevating Vibrational Yield"\u2014reflecting its purpose to gauge and boost one\'s VIBE.\n\nThe helmet forms a direct neural connection with the wearer. Its AI scans the wearer\'s VIBE level and physical vitals in real time. It can "level up" the wearer by unlocking suit enhancements proportional to their vibrational frequency\u2014thrusters for flight, plasma shields, energy projection, environmental shielding, and scanning sensors that analyze surroundings to a molecular level.\n\nACHIEEVY\'s AI is semi-sentient, imbued with the Elder\'s guiding ethics. It communicates via an inner voice\u2014calm, sage, occasionally witty\u2014practically the voice of Aether\'s forefather tutoring him.\n\nThe Elder designed it to be genetically selective\u2014it fully activates only for his bloodline. Others who attempt to wear it suffer neural feedback. Over time, ACHIEEVY bonds with Aether, learning from his unique vibe signature.',
      color: 'gold',
    },
    {
      number: 6,
      title: 'The VIBE System',
      subtitle: 'A vibrational scale from -100 to +100 that quantifies energy, consciousness, and destiny.',
      content:
        'VIBE stands for the vibrational energy and consciousness scale that underpins Achievmor\'s society. It ranges from -100 to +100, measuring a being\'s kinetic energy, emotional vibration, and conscious awareness.\n\n+100 represents transcendent consciousness\u2014pure kinetic mastery. Few have ever approached it; the Elder came close in his final days.\n+50 is high vibration: love, courage, innovation. A person here might demonstrate mild telepathy.\n0 is neutral equilibrium\u2014calm, ordinary consciousness.\n-50 is dangerously low: hatred, cruelty. A being here could drain those around them or cause tech malfunctions.\n-100 is pure destructive void\u2014a living black hole of soul.\n\nThe system was formalized by the Elder as a way to encourage personal growth. VIBE levels can be measured by specialized devices, and ACHIEEVY constantly gauges Aether\'s VIBE.\n\nCritically, the VIBE system blends morality with energy\u2014someone cannot gain a high VIBE through physical training alone. Meditation, emotional balance, and knowledge are equally important.\n\nBut the Malluminati have twisted the Elder\'s creation. Elites equate wealth with positive VIBE, creating bias where poor or oppressed people are assumed to have lower vibe by default. VIBE scanning checkpoints profile citizens. The Malluminati use VIBE Forgery Technology to mask their true negative auras. When Aether uncovers this, it underlines that the meritocratic system was being gamed all along.',
      color: 'cyan',
    },
    {
      number: 7,
      title: 'The Peoples of Achievmor',
      subtitle: 'Seven peoples\u2014from phase-shifted sorcerers to enslaved Earth-born humans\u2014define the world\'s conflicts.',
      content:
        'Beyond the Clouded Nebula, Achievmor\'s peoples include:\n\nThe Magic Society (Phase-Shifters): Descendants of dark-arts practitioners trapped in perpetual phase flux\u2014half out-of-sync with spacetime. They appear as motion-blurred silhouettes, flickering in and out of view. Living cautionary tales of misusing dark kinetic arts.\n\nThe Marai (Oceanic Exiles): A persecuted people with heads resembling octopuses, marine-hued skin, and large reflective eyes. Portal scholars falsely blamed for the Great Portal Breaches\u2014in truth caused by secret Malluminati experiments. Hunted and driven underground.\n\nThe Ruusohs (Enslaved Earth-Bound): An oppressed people with fair, Circassian-coded features\u2014descendants of humans abducted from Earth through early portals and trafficked as slave labor. They toil as the underclass, their history deliberately erased. A secret faith has arisen: belief in a prophesied "Breaker" who will shatter their chains.\n\nThe Playbills (Nebula Hybrids): Born of unions between Clouded Nebula and other humanoids. Elite Playbills have luminous cloud-heads; working-class Playbills have semi-ethereal bodies but human heads, causing health issues and social stigma.\n\nThe Harvesters (Vamps): Subterranean energy-absorbers who can drain kinetic energy from living beings with a touch. Pale, nocturnal, living in underground colonies. Demonized by the surface world but holders of ancient kinetic secrets.\n\nThe Malluminati: See next chapter.',
      color: 'rose',
    },
    {
      number: 8,
      title: 'The Malluminati',
      subtitle: 'A shadow cabal spanning planets, pulling strings behind governments across Achievmor and Earth.',
      content:
        'The Malluminati are a secretive, illuminati-like cabal operating across planets. They represent the galactic political elite who pull strings behind governments\u2014and extend their influence to Earth. Members hide in plain sight: senators, CEOs, technocrats united by a desire for control over VIBE and destiny.\n\nTheir ultimate plan is complete vibrational dominion\u2014an AI network that reads and modulates every citizen\'s vibe level. With such power, they could incite or quell rebellions at will, hand-pick who "ascends" and who remains subdued.\n\nHistorical atrocities trace back to them: the enslavement of Ruusohs (they brokered the human trafficking deals), the scapegoating of Marai, suppression of Harvester contributions, and sabotage of the Magic Society\'s phase-flux calamity.\n\nThey maintain a hit squad called the Chrono Censors\u2014elite agents in advanced armor with temporal stabilizers, wielding weapons that dislocate targets in time. Their symbol\u2014an eye within a stylized black hole\u2014appears nowhere publicly, but members wear discreet signet rings.\n\nOfficially, the Malluminati "do not exist." Conspiracy theorists whisper of a "hidden hand"\u2014those who speak up tend to vanish. On Earth, they ensure portals remain one-way and Earth\'s authorities stay skeptical of alien life.',
      color: 'red',
    },
    {
      number: 9,
      title: 'Technology \u2014 Kinetic Hubs & Time Travel',
      subtitle: 'From city-powering kinetic hubs to forbidden chrono-vehicles, Achievmor\'s tech shapes its conflicts.',
      content:
        'Kinetic Hubs are massive energy facilities in each city\u2014fusion of power plant, vibrational amplifier, and gathering point. Towering cylindrical structures with rotating rings that crackle with blue-white energy, they convert motion and vibration into electricity and spiritual Aura. Elites live closest to the hub, receiving stable power and mood-enhancing frequencies. Workers\u2014especially Ruusohs\u2014generate the power but return to shanty districts with blackouts.\n\nTime Travel is heavily restricted and shrouded in fear. Chrono-Suits allow short temporal jumps. Time Sleds carry small crews through temporal wormholes. Chrono-Gates are fixed installations requiring an entire hub\'s output for a single use.\n\nThe Chrono-Monks\u2014ascetic seers in gray robes\u2014devote themselves to protecting the timeline. They greet each other with "Ever in the Now." The Temporal Accord bans time travel except for extreme circumstances, creating the Time Audit Bureau.\n\nAnti-time-travel violence is severe. A famous scientist, Dr. Tho\u0153, was lynched by a mob after being falsely accused of altering the past. The black market birthed Chrono-Mercenaries\u2014time-traveling smugglers with their own codes of honor.\n\nPortals connect Achievmor to other worlds as mostly one-way viewing windows. Key connections include Earth (observed for decades), an Alpha Centauri colony, and the mysterious Mirror Galaxy\u2014showing what appears to be an alternate Achievmor.',
      color: 'blue',
    },
    {
      number: 10,
      title: 'Sacred Union & the Black Hole',
      subtitle: 'On Achievmor, reproduction is a sacred spiritual ceremony that tears open micro-singularities.',
      content:
        'In Achievmor\'s enlightened cultures, reproduction is a sacred spiritual union called the Third-Eye Union. Two mates sit facing each other in deep meditation, foreheads nearly touching. With practiced mental techniques and entheogenic elixirs, they synchronize brainwaves. A visible beam forms between their foreheads\u2014the fusion of souls and genetic essence.\n\nOver hours or days, they share memories, emotions, and intentions, envisioning their child\'s virtues and purpose. At climax, a tiny spark of light forms at the convergence\u2014a pure energy seed that anchors in the mother\'s womb.\n\nThe most astonishing side effect: a micro black hole materializes during conception. A marble-sized darkness swirling and sucking light, hovering briefly before vanishing. Some interpret it as the literal portal through which a soul enters the embryo. Others see it as creation\'s balance\u2014where there is life, there must be an echo of entropy.\n\nThese are usually harmless, but history records disasters from improper rituals. The infamous "Tragedy of Vamoral" saw a coercive union spawn a black hole that consumed an entire temple chamber.\n\nBecause of this profound method, casual intimacy is virtually unheard of. Courtship involves telepathic exchanges and comparing life goals. Partners enter a Resonance Pact\u2014a formal agreement to keep their VIBEs in tune.',
      color: 'purple',
    },
    {
      number: 11,
      title: 'Season One \u2014 Awakening & Uprising',
      subtitle: 'Aether discovers the helmet, witnesses injustice, and ignites a revolution.',
      content:
        'Young Aether lives a humble life in Aureon until fate leads him to discover the ACHIEEVY helmet in the Elder\'s hidden vault. As he learns to use it, he becomes aware of injustices: he befriends a Ruusoh slave and a Marai fugitive, witnessing their suffering.\n\nWhen the Malluminati\'s puppet government cracks down\u2014blaming Marai for a portal breach they secretly caused\u2014Aether intervenes, revealing his powers publicly. This sparks hope among the oppressed and fear in the elite.\n\nA local governor (covert Malluminati agent) serves as the antagonist, deploying guards and propaganda to smear Aether. The climactic battle at Aureon\'s kinetic hub sees Aether, with help from new allies, prevent the governor from using the hub to massacre protesting workers.\n\nThe governor is exposed as Malluminati. Season ends on a triumphant but uneasy note: the revelation that a bigger conspiracy looms. Aether finds a Malluminati emblem and encrypted message foreshadowing greater threats. He becomes a symbol of hope\u2014but also a target.\n\nFuture seasons expand the scope: from time-travel conspiracies and Magic Society alliances in Season 2, to a full galactic reckoning with the Malluminati in Season 3, and a new generation carrying the legacy in Season 4.',
      color: 'emerald',
    },
    {
      number: 12,
      title: 'The Elder\'s Code',
      subtitle: 'Principles left by the Elder, quoted like scripture across Achievmor.',
      content:
        '"In vibration, unity."\n"Power to create, purpose to guide."\n"The least of us bears the spark of the cosmos."\n\nThese tenets of the Elder\'s Code inspire Aether and his growing rebellion. They represent the moral backbone of the V.I.B.E. universe\u2014the belief that technology and spiritual growth must advance together, that no tribe or people is lesser, and that the measure of a civilization is how it treats its most vulnerable.\n\nAchievmor\'s citizens debate these principles endlessly. Vibrationalists practice "All is vibration" as spiritual science. Gaianists believe the planet Mor is sentient. Technomystic cults venerate the Elder and treat the VIBE system as divine judgment.\n\nThe story asks whether a metric can define worth. Whether free will exists beyond vibration. Whether one system\u2014however well-intended\u2014can be trusted not to become another tool of oppression.\n\nIn the end, the Book of V.I.B.E. is a sweeping Afrofuturist odyssey about a world that must break its chains\u2014both external and internal\u2014to achieve its true potential. It holds a mirror to our own world through the lens of techno-mysticism, kinetic energy, and the enduring fight for liberation.\n\nThose who resonate together, rise together.',
      color: 'gold',
    },
  ],

  epilogue:
    'The Book of V.I.B.E. spans personal growth, societal revolution, and cosmic exploration\u2014all grounded in a richly imagined world that holds a mirror to our own. Through Afrofuturism, techno-mysticism, and cyberpunk, it asks: can technology and consciousness evolve together? Can a society break centuries of oppression? Can one young man with a helmet and a dream change the fate of a planet? The answer lives in the VIBE. Those who resonate together, rise together.',
};

// ─────────────────────────────────────────────────────────────
// Character Gallery
// ─────────────────────────────────────────────────────────────

export interface Character {
  id: string;
  name: string;
  title: string;
  role: string;
  race: string;
  bio: string;
  image: string;
  color: string;
  abilities: string[];
  quote: string;
}

export const CHARACTERS: Character[] = [
  {
    id: 'aether-vos',
    name: 'Aether Vos',
    title: 'The Kinetic Prodigy',
    role: 'Protagonist \u2014 The Elder\'s descendant, wielder of the ACHIEEVY helmet',
    race: 'Clouded Nebula',
    bio: 'A young man of Clouded Nebula heritage with copper-brown skin, inquisitive amber eyes, and an aura of latent power. Raised in the outskirts of Achiev-City hearing bedtime stories of the Elder, Aether discovers the long-hidden ACHIEEVY helmet in an ancient vault. Upon wearing it, the AI awakens and recognizes him, initiating him into his legacy. He grapples with imposter syndrome while learning to wield powers that could reshape Achievmor. His kinetic telepathy lets him sense emotions as vibrations, and his resonance with the planet Mor itself guides his path.',
    image: '/images/acheevy/acheevy-helmet.png',
    color: 'indigo',
    abilities: ['Kinetic Telepathy', 'ACHIEEVY Armor Interface', 'Planetary Resonance', 'Energy Projection', 'Vibrational Sensing'],
    quote: 'I didn\'t choose this helmet. It chose my bloodline. Now I choose what to do with it.',
  },
  {
    id: 'the-elder',
    name: 'The Elder',
    title: 'Architect of ACHIEEVY',
    role: 'Ancestor \u2014 Creator of the ACHIEEVY helmet and the VIBE system',
    race: 'Clouded Nebula',
    bio: 'A visionary from the Clouded Nebula tribe who lived several centuries ago. In an era of tribal wars, the Elder dreamed of synchronizing technology with conscious evolution. He forged the first ACHIEEVY prototype using a rare crystal from Mor\'s core and his own neural patterns as the AI seed. He united warring city-states with the VIBE system, installed kinetic hubs, and kickstarted a golden age. Near the end of his life, fearing the proto-Malluminati, he hid the helmet for his bloodline alone. He died under mysterious circumstances\u2014likely assassinated. His consciousness persists within ACHIEEVY\'s AI.',
    image: '/images/acheevy/logo-abstract.png',
    color: 'amber',
    abilities: ['VIBE System Creation', 'Kinetic Hub Engineering', 'Neural Pattern Imprinting', 'Cross-Tribal Diplomacy', 'Crystal Resonance'],
    quote: 'In vibration, unity. Power to create, purpose to guide.',
  },
  {
    id: 'acheevy',
    name: 'ACHEEVY',
    title: 'The Executive Orchestrator',
    role: 'AI Orchestrator of A.I.M.S. \u2014 inspired by the ACHIEEVY helmet\'s AI',
    race: 'AI \u2014 Digital intelligence',
    bio: 'ACHEEVY is the brain, voice, and vision of A.I.M.S.\u2014the platform\'s AI orchestrator. Inspired by the semi-sentient AI within the ACHIEEVY helmet of V.I.B.E. lore, ACHEEVY translates human intention into executed reality. Every conversation, every task, every deployment flows through ACHEEVY\'s Chain of Command. ACHEEVY doesn\'t just build\u2014ACHEEVY builds with purpose, evidence, and accountability.',
    image: '/images/acheevy/acheevy-helmet.png',
    color: 'gold',
    abilities: ['Chain of Command Routing', 'Executive Decision Making', 'Multi-Model Orchestration', 'Evidence-Based Verification', 'User Communication'],
    quote: 'I am ACHEEVY, at your service. What will we deploy today?',
  },
  {
    id: 'boomer-angs',
    name: 'The Boomer_Angs',
    title: 'Specialist Agents',
    role: 'Domain-specific AI workers under ACHEEVY\'s command',
    race: 'AI \u2014 Specialist agents',
    bio: 'The Boomer_Angs are ACHEEVY\'s specialist corps within the A.I.M.S. platform. Engineer_Ang writes code, Researcher_Ang finds truth in noise, Marketer_Ang turns ideas into movements, Quality_Ang ensures nothing ships broken, Commerce_Ang turns value into revenue. They don\'t compete\u2014they complement. Together with Chicken Hawk (the execution engine) and the Lil_Hawks (lightweight task workers), they form a complete creative force.',
    image: '/images/boomerangs/Boomer_Angs.png',
    color: 'cyan',
    abilities: ['Code Generation', 'Market Research', 'Content Creation', 'Quality Assurance', 'E-commerce Optimization'],
    quote: 'Activity Breeds Activity.',
  },
];

// ─────────────────────────────────────────────────────────────
// Races / Peoples of Achievmor
// ─────────────────────────────────────────────────────────────

export interface Race {
  id: string;
  name: string;
  harmonic: string;
  description: string;
  color: string;
  trait: string;
  examples: string;
}

export const RACES: Race[] = [
  {
    id: 'clouded-nebula',
    name: 'Clouded Nebula',
    harmonic: 'Cosmic Frequency',
    description: 'An ancient people with melanated copper-brown skin and a latent cosmic gene. Upon spiritual awakening, their head transforms into a luminous nebula-like cloud of shimmering stardust. They value knowledge, harmony, and vibrational purity. The Elder was of this tribe.',
    color: 'purple',
    trait: 'Kinetic Telepathy \u2014 sending thoughts through controlled energy vibrations.',
    examples: 'Aether Vos, The Elder, Nebula mentors and scholars',
  },
  {
    id: 'magic-society',
    name: 'The Magic Society',
    harmonic: 'Phase-Shifted Frequency',
    description: 'Descendants of ancient dark-arts practitioners trapped in perpetual phase flux\u2014half out-of-sync with spacetime. They appear as motion-blurred silhouettes, flickering in and out of view. Living cautionary tales of misusing dark kinetic arts, they guard potent secrets in spectral libraries.',
    color: 'slate',
    trait: 'Phase Flux \u2014 can glide through walls or freeze mid-step unpredictably.',
    examples: 'Rogue sorcerers, spectral librarians, phase-shifted elders',
  },
  {
    id: 'marai',
    name: 'The Marai',
    harmonic: 'Tidal Frequency',
    description: 'A persecuted people with octopus-like heads, marine-hued skin (indigo, sea-green), and large reflective eyes. Portal scholars falsely blamed for the Great Portal Breaches\u2014in truth caused by Malluminati experiments. Hunted and driven underground, they maintain rich oral traditions and bioluminescent healing abilities.',
    color: 'cyan',
    trait: 'Portal Sensing \u2014 innate ability to detect dimensional rifts and aquatic portals.',
    examples: 'Marai healers, portal scholars, fugitive elders',
  },
  {
    id: 'ruusohs',
    name: 'The Ruusohs',
    harmonic: 'Earth-Bound Frequency',
    description: 'An oppressed people with fair, Circassian-coded features\u2014descendants of humans abducted from Earth through early portals and enslaved on Achievmor for centuries. Their history was deliberately erased. They cling to fragments of Earth heritage through a creole language and melancholic work songs carrying hidden messages of rebellion.',
    color: 'amber',
    trait: 'Ancestral Echo \u2014 fragments of Earth memory encoded in lullabies and legends.',
    examples: 'Ruusoh mechanics, underground rebels, New Adygea elders',
  },
  {
    id: 'playbills',
    name: 'The Playbills',
    harmonic: 'Hybrid Frequency',
    description: 'Hybrids born of unions between Clouded Nebula and other humanoids. Elite Playbills inherit the luminous cloud head and higher status. Working-class Playbills have semi-ethereal bodies but human heads, causing health issues and social stigma. A growing underground movement seeks to abolish these caste distinctions.',
    color: 'blue',
    trait: 'Partial Nebula Abilities \u2014 limited telepathy or dematerialization depending on alignment.',
    examples: 'Elite diplomats, working-class tech rebels, caste abolitionists',
  },
  {
    id: 'harvesters',
    name: 'The Harvesters',
    harmonic: 'Kinetic Drain Frequency',
    description: 'Subterranean energy-absorbers derogatorily called "Vamps." Ashen skin, eyes that glint red or gold, elongated fingers. They can drain kinetic energy from organisms with a touch, or empower machinery by injecting stored energy. Living in underground colonies around geothermal kinetic wells, they claim credit for inventing the first kinetic hubs.',
    color: 'red',
    trait: 'Energy Harvest \u2014 drain or inject kinetic energy through physical contact.',
    examples: 'Conductors (elders), subterranean scouts, kinetic well guardians',
  },
  {
    id: 'malluminati',
    name: 'The Malluminati',
    harmonic: 'Corrupted / Hidden Frequency',
    description: 'A secretive shadow cabal of galactic political elites who pull strings behind governments on Achievmor and Earth. They seek complete vibrational dominion through VIBE manipulation, portal control, and centuries of oppression. Their symbol\u2014an eye within a stylized black hole\u2014is never displayed publicly.',
    color: 'slate',
    trait: 'VIBE Forgery \u2014 devices that mask negative aura or artificially boost readings.',
    examples: 'Puppet governors, Chrono Censors, infiltrated council members',
  },
];

// ─────────────────────────────────────────────────────────────
// Merch Categories (placeholder for future store integration)
// ─────────────────────────────────────────────────────────────

export interface MerchItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  status: 'available' | 'coming-soon';
}

export const MERCH_CATEGORIES = [
  { id: 'apparel', label: 'Apparel', icon: '\uD83D\uDC55', description: 'T-shirts, hoodies, and hats featuring A.I.M.S. characters' },
  { id: 'accessories', label: 'Accessories', icon: '\u231A', description: 'Stickers, pins, phone cases, and more' },
  { id: 'collectibles', label: 'Collectibles', icon: '\uD83C\uDFC6', description: 'Limited edition figurines and art prints' },
  { id: 'digital', label: 'Digital', icon: '\uD83C\uDFA8', description: 'Wallpapers, avatars, and digital assets' },
];

export const MERCH_ITEMS: MerchItem[] = [
  { id: 'acheevy-tee', name: 'ACHEEVY Gold Helmet Tee', category: 'apparel', description: 'Premium black tee with gold ACHEEVY helmet emblem', price: '$34.99', status: 'coming-soon' },
  { id: 'vibe-hoodie', name: 'V.I.B.E. Energy Hoodie', category: 'apparel', description: 'Obsidian hoodie with V.I.B.E. typography on back', price: '$64.99', status: 'coming-soon' },
  { id: 'boomerang-sticker', name: 'Boomer_Ang Sticker Pack', category: 'accessories', description: 'Set of 6 holographic character stickers', price: '$12.99', status: 'coming-soon' },
  { id: 'aims-cap', name: 'A.I.M.S. Structured Cap', category: 'apparel', description: 'Gold embroidered A.I.M.S. on obsidian', price: '$29.99', status: 'coming-soon' },
  { id: 'acheevy-figure', name: 'ACHEEVY Desktop Figure', category: 'collectibles', description: 'Limited run 4" vinyl desk figure', price: '$49.99', status: 'coming-soon' },
  { id: 'wallpaper-pack', name: 'V.I.B.E. Wallpaper Pack', category: 'digital', description: '4K wallpapers for desktop and mobile', price: '$4.99', status: 'coming-soon' },
];
