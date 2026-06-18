import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Mic,
  MicOff,
  Repeat2,
  Timer,
  Volume2,
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/ui/toast';

const CookMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Cook logged',
        description: 'Nice work. Your stats have been updated.',
        tone: 'success',
      });
      navigate(`/recipes/${id}`);
    },
    onError: () => {
      toast({
        title: 'Cook log failed',
        description: 'Unable to save this cook session.',
        tone: 'error',
      });
    },
  });

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

  const speakStep = (stepIndex = currentStep) => {
    if (!recipe || !recipe.steps[stepIndex]) return;

    const utterance = new SpeechSynthesisUtterance(recipe.steps[stepIndex].instruction);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const nextStep = () => {
    if (recipe && currentStep < recipe.steps.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      speakStep(nextIndex);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTimer = (stepIndex: number) => {
    const step = recipe?.steps[stepIndex];
    if (!step?.timerMinutes) {
      toast({
        title: 'No timer on this step',
        description: 'This recipe step does not include a suggested timer.',
        tone: 'info',
      });
      return;
    }

    const seconds = step.timerMinutes * 60;
    setTimers((prev) => new Map(prev).set(stepIndex, seconds));
    toast({
      title: 'Timer started',
      description: `${step.timerMinutes} minute timer started for this step.`,
      tone: 'success',
    });

    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = new Map(prev);
        const current = newTimers.get(stepIndex);
        if (current && current > 0) {
          newTimers.set(stepIndex, current - 1);
        } else {
          clearInterval(interval);
          newTimers.delete(stepIndex);
          new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLUiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606OuoVRQKRp/g8r5sIQUsgM7y1Ik3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBACh==')
            .play()
            .catch(() => undefined);
          toast({
            title: 'Timer complete',
            description: 'Move to the next step when ready.',
            tone: 'success',
          });
        }
        return newTimers;
      });
    }, 1000);
  };

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
      toast({
        title: 'Voice commands unavailable',
        description: 'Try Chrome or Edge for speech recognition.',
        tone: 'info',
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast({
        title: 'Voice commands stopped',
        description: 'Cook mode is no longer listening.',
        tone: 'info',
      });
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: 'Voice commands started',
        description: 'Say next, back, repeat, or start timer.',
        tone: 'success',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    cookMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!recipe) return null;

  const currentStepData = recipe.steps[currentStep];
  const progress = ((currentStep + 1) / recipe.steps.length) * 100;

  return (
    <div className="min-h-screen bg-forest p-8 text-cream">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/recipes/${id}`)}
            className="mb-4 inline-flex items-center gap-2 text-cream-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Cook Mode
          </button>
          <h1 className="mb-2 text-4xl font-display font-bold">{recipe.title}</h1>
          <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center">
            <div>
              Servings:
              <input
                type="number"
                value={servingMultiplier * recipe.servings}
                onChange={(e) => setServingMultiplier(parseInt(e.target.value) / recipe.servings)}
                className="ml-2 w-16 rounded border-2 border-cream-dark bg-forest-light px-2 py-1 text-cream"
                min={recipe.servings}
              />
            </div>
            <button
              onClick={toggleListening}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium ${
                isListening ? 'animate-pulse bg-red-500' : 'bg-terracotta'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? 'Listening...' : 'Voice Commands'}
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span>
              Step {currentStep + 1} of {recipe.steps.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-3 w-full rounded-full bg-forest-light">
            <div
              className="h-3 rounded-full bg-terracotta transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-12 text-forest shadow-2xl dark:bg-forest-dark dark:text-cream">
          <div className="mb-6 text-6xl font-bold text-terracotta">
            {currentStepData.stepNumber}.
          </div>
          <p className="mb-8 text-3xl leading-relaxed">{currentStepData.instruction}</p>

          {currentStepData.timerMinutes && (
            <div className="mb-8 rounded-xl bg-cream p-6 dark:bg-forest-light">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Suggested Timer</div>
                  <div className="text-2xl font-bold">{currentStepData.timerMinutes} minutes</div>
                </div>
                {timers.has(currentStep) ? (
                  <div className="font-mono text-3xl font-bold text-terracotta">
                    {formatTime(timers.get(currentStep)!)}
                  </div>
                ) : (
                  <button
                    onClick={() => startTimer(currentStep)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-6 py-3 font-semibold text-white hover:bg-terracotta-dark"
                  >
                    <Timer className="h-4 w-4" />
                    Start Timer
                  </button>
                )}
              </div>
            </div>
          )}

          {servingMultiplier !== 1 && (
            <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-400/30 dark:bg-yellow-950/40">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-800 dark:text-yellow-100">
                <Info className="h-4 w-4" />
                Scaled for {servingMultiplier * recipe.servings} servings:
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-100">
                All ingredient quantities have been adjusted accordingly.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 py-4 text-lg disabled:opacity-30"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>
          <button onClick={() => speakStep()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-8 py-4 font-semibold text-white hover:bg-purple-600">
            <Volume2 className="h-5 w-5" />
            Repeat
          </button>
          {currentStep < recipe.steps.length - 1 ? (
            <button onClick={nextStep} className="btn-primary flex flex-1 items-center justify-center gap-2 py-4 text-lg">
              Next
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={cookMutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 py-4 text-lg font-semibold text-white hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />
              {cookMutation.isPending ? 'Logging Cook...' : 'Finish & Log Cook'}
            </button>
          )}
        </div>

        <div className="mt-8 rounded-xl bg-forest-light p-6 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Mic className="h-4 w-4" />
            Voice Commands
          </div>
          <div className="grid grid-cols-1 gap-2 text-cream-dark sm:grid-cols-2">
            <div>Say "next" or "forward"</div>
            <div>Say "back" or "previous"</div>
            <div className="inline-flex items-center gap-2">
              <Repeat2 className="h-4 w-4" />
              Say "repeat" or "again"
            </div>
            <div>Say "start timer"</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookMode;
