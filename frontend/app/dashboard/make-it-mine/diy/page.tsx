'use client';

// frontend/app/dashboard/make-it-mine/diy/page.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';
import type {
  ConsultationState,
  ConsultationStep,
  DIYProject,
  InteractionMode,
  VoiceMessage,
} from '@/lib/diy/types';
import {
  CONSULTATION_QUESTIONS,
  CATEGORY_MAP,
  SKILL_MAP,
  getNextStep,
  getStepProgress,
  CATEGORY_SAFETY_TIPS,
  estimateDuration,
} from '@/lib/diy/consultation';

// ─────────────────────────────────────────────────────────────
// Permission Request Component
// ─────────────────────────────────────────────────────────────

function PermissionGate({
  onGranted,
}: {
  onGranted: () => void;
}) {
  const {
    permissions,
    platform,
    instructions,
    isChecking,
    error,
    requestBoth,
    openSystemSettings,
  } = useMediaPermissions();

  const handleRequestPermissions = async () => {
    const result = await requestBoth();
    if (result.camera && result.microphone) {
      onGranted();
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-white/50">Checking permissions...</div>
      </div>
    );
  }

  const cameraGranted = permissions.camera === 'granted';
  const micGranted = permissions.microphone === 'granted';

  if (cameraGranted && micGranted) {
    onGranted();
    return null;
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-12">
      <div className="text-6xl mb-4">🎥🎤</div>
      <h2 className="text-xl font-semibold text-white">
        Camera & Microphone Access Required
      </h2>
      <p className="text-white/50">
        DIY Mode uses your camera to see your project and your microphone for voice interaction.
        This allows ACHEEVY to provide real-time guidance as you work.
      </p>

      <div className="flex flex-col gap-3 mt-6">
        {/* Permission Status */}
        <div className="flex justify-center gap-8 text-sm">
          <div className={`flex items-center gap-2 ${cameraGranted ? 'text-green-400' : 'text-white/40'}`}>
            <span>{cameraGranted ? '✓' : '○'}</span>
            <span>Camera</span>
          </div>
          <div className={`flex items-center gap-2 ${micGranted ? 'text-green-400' : 'text-white/40'}`}>
            <span>{micGranted ? '✓' : '○'}</span>
            <span>Microphone</span>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Request Button */}
        <button
          onClick={handleRequestPermissions}
          className="mt-4 px-6 py-3 rounded-full bg-gradient-to-r from-gold to-gold text-black font-semibold hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-shadow"
        >
          Grant Access
        </button>

        {/* Platform-specific instructions */}
        {(permissions.camera === 'denied' || permissions.microphone === 'denied') && (
          <div className="mt-4 text-sm text-white/40">
            <p className="mb-2">If the button doesn&apos;t work, you may need to enable permissions manually:</p>
            <button
              onClick={openSystemSettings}
              className="text-gold hover:text-gold underline"
            >
              Open Settings Instructions
            </button>
            <p className="mt-2 text-xs text-white/20">
              Platform detected: {platform}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Consultation Flow Component
// ─────────────────────────────────────────────────────────────

function ConsultationFlow({
  onComplete,
}: {
  onComplete: (project: DIYProject) => void;
}) {
  const [state, setState] = useState<ConsultationState>({
    currentStep: 'welcome',
    projectDraft: {},
    responses: {},
    isComplete: false,
  });

  const currentQuestion = CONSULTATION_QUESTIONS.find(q => q.step === state.currentStep);
  const progress = getStepProgress(state.currentStep);

  const handleResponse = (value: string) => {
    const newResponses = { ...state.responses, [state.currentStep]: value };

    // Map responses to project draft
    const draft = { ...state.projectDraft };

    if (state.currentStep === 'project_description') {
      draft.description = value;
      draft.title = value.split(' ').slice(0, 5).join(' ');
    } else if (state.currentStep === 'category_selection') {
      draft.category = CATEGORY_MAP[value] || 'other';
    } else if (state.currentStep === 'skill_assessment') {
      draft.skillLevel = SKILL_MAP[value] || 'beginner';
    } else if (state.currentStep === 'tools_inventory') {
      draft.toolsNeeded = value.split(',').map(t => t.trim());
    }

    const nextStep = getNextStep(state.currentStep);

    if (nextStep === 'ready') {
      // Complete the project setup
      const finalProject: DIYProject = {
        id: `diy-${Date.now()}`,
        userId: 'current-user',
        title: draft.title || 'My DIY Project',
        description: draft.description || '',
        category: draft.category || 'other',
        skillLevel: draft.skillLevel || 'beginner',
        estimatedDuration: estimateDuration(
          draft.category || 'other',
          draft.skillLevel || 'beginner',
          draft.description || ''
        ),
        toolsNeeded: draft.toolsNeeded || [],
        materialsNeeded: [],
        safetyConsiderations: CATEGORY_SAFETY_TIPS[draft.category || 'other'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      };
      onComplete(finalProject);
      return;
    }

    setState({
      ...state,
      currentStep: nextStep,
      projectDraft: draft,
      responses: newResponses,
    });
  };

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-white/30 mb-2">
          <span>Consultation</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/[0.03] border border-gold/20 rounded-2xl p-8">
        <p className="text-lg text-white whitespace-pre-line">
          {currentQuestion.prompt}
        </p>

        <div className="mt-6">
          {currentQuestion.type === 'text' && (
            <TextInput onSubmit={handleResponse} />
          )}
          {currentQuestion.type === 'select' && (
            <SelectInput options={currentQuestion.options || []} onSelect={handleResponse} />
          )}
          {currentQuestion.type === 'multiselect' && (
            <MultiSelectInput options={currentQuestion.options || []} onSubmit={handleResponse} />
          )}
          {currentQuestion.type === 'confirm' && (
            <ConfirmInput options={currentQuestion.options || []} onSelect={handleResponse} />
          )}
        </div>
      </div>

      {/* Project Summary Preview */}
      {Object.keys(state.projectDraft).length > 0 && state.currentStep === 'plan_review' && (
        <div className="mt-6 bg-white/[0.02] border border-wireframe-stroke rounded-xl p-6">
          <h3 className="text-sm font-medium text-gold mb-3">Project Summary</h3>
          <dl className="space-y-2 text-sm">
            {state.projectDraft.title && (
              <div className="flex">
                <dt className="w-24 text-white/30">Project:</dt>
                <dd className="text-white">{state.projectDraft.title}</dd>
              </div>
            )}
            {state.projectDraft.category && (
              <div className="flex">
                <dt className="w-24 text-white/30">Category:</dt>
                <dd className="text-white capitalize">{state.projectDraft.category.replace('_', ' ')}</dd>
              </div>
            )}
            {state.projectDraft.skillLevel && (
              <div className="flex">
                <dt className="w-24 text-white/30">Level:</dt>
                <dd className="text-white capitalize">{state.projectDraft.skillLevel}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

// Input Components
function TextInput({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-32 bg-black/40 border border-wireframe-stroke rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:border-gold/30 transition-colors resize-none"
        placeholder="Describe your project..."
        autoFocus
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="mt-4 px-6 py-2 rounded-full bg-gold text-black font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold transition-colors"
      >
        Continue
      </button>
    </form>
  );
}

function SelectInput({ options, onSelect }: { options: string[]; onSelect: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="text-left px-4 py-3 rounded-xl border border-wireframe-stroke bg-white/[0.02] text-white/70 hover:border-gold/20 hover:bg-white/[0.05] transition-all"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function MultiSelectInput({ options, onSubmit }: { options: string[]; onSubmit: (value: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (option: string) => {
    const next = new Set(selected);
    if (next.has(option)) {
      next.delete(option);
    } else {
      next.add(option);
    }
    setSelected(next);
  };

  return (
    <div>
      <div className="grid gap-2 mb-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              selected.has(option)
                ? 'border-gold/30 bg-gold/10 text-white'
                : 'border-wireframe-stroke bg-white/[0.02] text-white/70 hover:border-white/20'
            }`}
          >
            <span className="mr-2">{selected.has(option) ? '✓' : '○'}</span>
            {option}
          </button>
        ))}
      </div>
      <button
        onClick={() => onSubmit(Array.from(selected).join(', '))}
        className="px-6 py-2 rounded-full bg-gold text-black font-medium hover:bg-gold transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

function ConfirmInput({ options, onSelect }: { options: string[]; onSelect: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="px-5 py-2 rounded-full border border-gold/20 bg-gold/10 text-white/50 hover:border-gold/30 hover:bg-gold/10 transition-all"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Voice + Vision Interactive Mode
// ─────────────────────────────────────────────────────────────

function VoiceVisionMode({
  project,
  onSwitchToConsole,
}: {
  project: DIYProject;
  onSwitchToConsole: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: '1',
      role: 'acheevy',
      content: `Great! I'm ready to help with your ${project.category.replace('_', ' ')} project: "${project.title}". Show me what you're working on and I'll guide you through it. You can speak or type your questions.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [cameraActive, setCameraActive] = useState(false);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
    }
  }, []);

  // Capture current frame
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Send message with optional image
  const sendMessage = useCallback(async (text: string, includeImage: boolean = false) => {
    const userMessage: VoiceMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      hasImage: includeImage,
    };

    setMessages(prev => [...prev, userMessage]);

    // Capture image if requested
    const imageBase64 = includeImage ? captureFrame() : undefined;

    try {
      const response = await fetch('/api/acheevy/diy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: project.id,
          projectId: project.id,
          message: text,
          imageBase64,
          mode: 'voice_vision' as InteractionMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const acheevyMessage: VoiceMessage = {
          id: `msg-${Date.now()}-reply`,
          role: 'acheevy',
          content: data.reply,
          timestamp: new Date().toISOString(),
          imageAnalysis: data.visionAnalysis,
        };
        setMessages(prev => [...prev, acheevyMessage]);

        // TODO: Play TTS audio if available
        if (data.audioUrl) {
          setIsSpeaking(true);
          // Play audio...
          setTimeout(() => setIsSpeaking(false), 3000);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [project.id, captureFrame]);

  // Toggle voice listening
  const toggleListening = () => {
    setIsListening(!isListening);
    // TODO: Implement Web Speech API recognition
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: stop camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-wireframe-stroke">
        <div>
          <h2 className="font-semibold text-white">{project.title}</h2>
          <p className="text-xs text-white/30 capitalize">{project.category.replace('_', ' ')} • {project.skillLevel}</p>
        </div>
        <button
          onClick={onSwitchToConsole}
          className="text-sm text-white/50 hover:text-gold transition-colors"
        >
          Switch to Console Mode
        </button>
      </header>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Camera View */}
        <div className="w-1/2 relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={() => sendMessage('What do you see?', true)}
              className="px-4 py-2 rounded-full bg-gold text-black text-sm font-medium hover:bg-gold transition-colors"
            >
              📸 Capture & Analyze
            </button>
          </div>

          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-white/50">Starting camera...</p>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="w-1/2 flex flex-col bg-white/[0.02] rounded-xl border border-wireframe-stroke">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gold/10 text-white'
                      : 'bg-white/5 text-white/70'
                  }`}
                >
                  {msg.hasImage && (
                    <span className="text-xs text-gold block mb-1">📸 Image attached</span>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.imageAnalysis && (
                    <div className="mt-2 pt-2 border-t border-wireframe-stroke text-xs text-white/40">
                      <p>Detected: {msg.imageAnalysis.analysis.labels.slice(0, 3).map(l => l.description).join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-wireframe-stroke">
            <div className="flex gap-2">
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                🎤
              </button>
              <input
                type="text"
                placeholder="Type or speak your question..."
                className="flex-1 bg-black/40 border border-wireframe-stroke rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-gold/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    sendMessage(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={() => sendMessage('Show me what you see', true)}
                className="p-3 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
              >
                📷
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="px-4 py-2 border-t border-wireframe-stroke flex items-center justify-between text-xs text-white/30">
        <div className="flex items-center gap-4">
          <span className={cameraActive ? 'text-green-400' : 'text-red-400'}>
            ● Camera {cameraActive ? 'Active' : 'Inactive'}
          </span>
          <span className={isListening ? 'text-green-400' : ''}>
            ● Voice {isListening ? 'Listening' : 'Ready'}
          </span>
        </div>
        <span>Session: {project.id.slice(-8)}</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Console Mode (Text + Voice, No Vision)
// ─────────────────────────────────────────────────────────────

function ConsoleMode({
  project,
  onSwitchToVision,
}: {
  project: DIYProject;
  onSwitchToVision: () => void;
}) {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: '1',
      role: 'acheevy',
      content: `Console mode active. Voice is still available but camera is off. Ask me anything about your ${project.category.replace('_', ' ')} project.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const sendMessage = async (text: string) => {
    const userMessage: VoiceMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/acheevy/diy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: project.id,
          projectId: project.id,
          message: text,
          mode: 'console' as InteractionMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const acheevyMessage: VoiceMessage = {
          id: `msg-${Date.now()}-reply`,
          role: 'acheevy',
          content: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, acheevyMessage]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-wireframe-stroke">
        <div>
          <h2 className="font-semibold text-white">{project.title}</h2>
          <p className="text-xs text-white/30">Console Mode • Voice Active • Camera Off</p>
        </div>
        <button
          onClick={onSwitchToVision}
          className="text-sm text-gold hover:text-gold transition-colors"
        >
          Enable Camera
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gold/10 text-white'
                  : 'bg-white/5 text-white/70'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-wireframe-stroke">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) sendMessage(input.trim());
          }}
          className="flex gap-2"
        >
          <button
            type="button"
            onClick={() => setIsListening(!isListening)}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-black/40 border border-wireframe-stroke rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-gold/30"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-5 py-3 rounded-xl bg-gold text-black font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

type PageState = 'permissions' | 'consultation' | 'voice_vision' | 'console';

export default function DIYPage() {
  const [pageState, setPageState] = useState<PageState>('permissions');
  const [project, setProject] = useState<DIYProject | null>(null);

  const handlePermissionsGranted = () => {
    setPageState('consultation');
  };

  const handleConsultationComplete = (completedProject: DIYProject) => {
    setProject(completedProject);
    setPageState('voice_vision');
  };

  return (
    <div className="min-h-screen">
      {pageState === 'permissions' && (
        <PermissionGate onGranted={handlePermissionsGranted} />
      )}

      {pageState === 'consultation' && (
        <ConsultationFlow onComplete={handleConsultationComplete} />
      )}

      {pageState === 'voice_vision' && project && (
        <VoiceVisionMode
          project={project}
          onSwitchToConsole={() => setPageState('console')}
        />
      )}

      {pageState === 'console' && project && (
        <ConsoleMode
          project={project}
          onSwitchToVision={() => setPageState('voice_vision')}
        />
      )}
    </div>
  );
}
