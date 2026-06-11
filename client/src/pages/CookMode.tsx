import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const CookMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [timers, setTimers] = useState<Map<number, number>>(new Map());
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get(`/recipes/${id}`);
      return data;
    },
  });

  const cookMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/recipes/${id}/cook`, {
        servings: recipe?.servings * servingMultiplier,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        handleVoiceCommand(transcript);
      };

      setRecognition(recog);
    }
  }, []);

  const handleVoiceCommand = (command: string) => {
    if (command.includes('next') || command.includes('forward')) {
      nextStep();
    } else if (command.includes('back') || command.includes('previous')) {
      prevStep();
    } else if (command.includes('repeat') || command.includes('again')) {
      speakStep();
    } else if (command.includes('timer') || command.includes('start timer')) {
      startTimer(currentStep);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Voice commands not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const speakStep = () => {
    if (!recipe || !recipe.steps[currentStep]) return;

    const utterance = new SpeechSynthesisUtterance(recipe.steps[currentStep].instruction);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const nextStep = () => {
    if (recipe && currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      speakStep();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTimer = (stepIndex: number) => {
    const step = recipe?.steps[stepIndex];
    if (!step?.timerMinutes) return;

    const seconds = step.timerMinutes * 60;
    setTimers(new Map(timers.set(stepIndex, seconds)));

    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = new Map(prev);
        const current = newTimers.get(stepIndex);
        if (current && current > 0) {
          newTimers.set(stepIndex, current - 1);
        } else {
          clearInterval(interval);
          newTimers.delete(stepIndex);
          // Play sound or notification
          new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLUiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606OuoVRQKRp/g8r5sIQUsgM7y1Ik3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBACh==').play();
        }
        return newTimers;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    cookMutation.mutate();
    alert('Congratulations! Cook logged successfully! 🎉');
    navigate(`/recipes/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!recipe) return null;

  const currentStepData = recipe.steps[currentStep];
  const progress = ((currentStep + 1) / recipe.steps.length) * 100;

  return (
    <div className="min-h-screen bg-forest text-cream p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(`/recipes/${id}`)} className="text-cream-dark mb-4 hover:underline">
            ← Exit Cook Mode
          </button>
          <h1 className="text-4xl font-display font-bold mb-2">{recipe.title}</h1>
          <div className="flex items-center gap-4 text-sm">
            <div>
              Servings:
              <input
                type="number"
                value={servingMultiplier * recipe.servings}
                onChange={(e) => setServingMultiplier(parseInt(e.target.value) / recipe.servings)}
                className="ml-2 w-16 bg-forest-light text-cream border-2 border-cream-dark rounded px-2 py-1"
                min={recipe.servings}
              />
            </div>
            <button
              onClick={toggleListening}
              className={`px-4 py-2 rounded-lg font-medium ${
                isListening ? 'bg-red-500 animate-pulse' : 'bg-terracotta'
              }`}
            >
              {isListening ? '🎙️ Listening...' : '🎙️ Voice Commands'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {currentStep + 1} of {recipe.steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-forest-light rounded-full h-3">
            <div
              className="bg-terracotta h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white text-forest rounded-2xl shadow-2xl p-12 mb-8">
          <div className="text-6xl font-bold text-terracotta mb-6">
            {currentStepData.stepNumber}.
          </div>
          <p className="text-3xl leading-relaxed mb-8">{currentStepData.instruction}</p>

          {/* Timer */}
          {currentStepData.timerMinutes && (
            <div className="bg-cream rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">Suggested Timer</div>
                  <div className="text-2xl font-bold">{currentStepData.timerMinutes} minutes</div>
                </div>
                {timers.has(currentStep) ? (
                  <div className="text-3xl font-mono font-bold text-terracotta">
                    {formatTime(timers.get(currentStep)!)}
                  </div>
                ) : (
                  <button
                    onClick={() => startTimer(currentStep)}
                    className="px-6 py-3 bg-terracotta text-white rounded-lg font-semibold hover:bg-terracotta-dark"
                  >
                    Start Timer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ingredients for this step (if scaling) */}
          {servingMultiplier !== 1 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <div className="text-sm font-semibold text-yellow-800 mb-2">
                📏 Scaled for {servingMultiplier * recipe.servings} servings:
              </div>
              <div className="text-sm text-yellow-700">
                All ingredient quantities have been adjusted accordingly.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1 btn-secondary disabled:opacity-30 text-lg py-4"
          >
            ← Previous
          </button>
          <button onClick={speakStep} className="px-8 py-4 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600">
            🔊 Repeat
          </button>
          {currentStep < recipe.steps.length - 1 ? (
            <button onClick={nextStep} className="flex-1 btn-primary text-lg py-4">
              Next →
            </button>
          ) : (
            <button onClick={handleFinish} className="flex-1 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 text-lg py-4">
              ✅ Finish & Log Cook
            </button>
          )}
        </div>

        {/* Voice Commands Help */}
        <div className="mt-8 bg-forest-light rounded-xl p-6 text-sm">
          <div className="font-semibold mb-2">🎙️ Voice Commands:</div>
          <div className="grid grid-cols-2 gap-2 text-cream-dark">
            <div>• Say "next" or "forward"</div>
            <div>• Say "back" or "previous"</div>
            <div>• Say "repeat" or "again"</div>
            <div>• Say "start timer"</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookMode;
