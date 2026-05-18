import { Seo } from "@/components/Seo";
import { useState, useEffect } from "react";
import { Activity, ArrowRight, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/passwordValidation";

const TOTAL_STEPS = 4;

const ACTIVITY_LEVELS = [
  { label: "Sedentary", desc: "Little to no exercise" },
  { label: "Light", desc: "Light exercise 1-3 days/week" },
  { label: "Active", desc: "Moderate exercise 3-5 days/week" },
  { label: "Very Active", desc: "Hard exercise 6-7 days/week" },
];

export default function Onboarding() {
  const [phase, setPhase] = useState<"welcome" | "questions" | "loading" | "signup">("welcome");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [activity, setActivity] = useState("");
  const [timeline, setTimeline] = useState([12]);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Slide direction for animation
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setSlideDir("right");
      setStep(step + 1);
    } else {
      setPhase("loading");
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setSlideDir("left");
      setStep(step - 1);
    }
  };

  // Loading interstitial timer
  useEffect(() => {
    if (phase === "loading") {
      const timer = setTimeout(() => setPhase("signup"), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const pwCheck = validatePassword(password);
        if (!pwCheck.isValid) {
          toast({
            title: "Weak password",
            description: "Please meet all password requirements before continuing.",
            variant: "destructive",
          });
          setAuthLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name,
              current_weight: Number(currentWeight),
              goal_weight: Number(goalWeight),
              activity_level: activity,
              goal_timeframe_months: timeline[0],
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  // Welcome screen
  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <Seo title="Get started – NutraVision" description="Create your NutraVision account and set your biometrics, goals, and diet preferences in minutes." path="/onboarding" />
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <Activity className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold font-display text-foreground text-center mb-3">
          Build your personalized<br />transformation plan.
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-8">
          Answer a few quick questions and we'll create a custom macro plan tailored to your goals.
        </p>
        <Button size="lg" className="px-8" onClick={() => setPhase("questions")}>
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <button onClick={() => navigate("/auth")} className="text-primary font-medium hover:underline">
            Log In
          </button>
        </p>
      </div>
    );
  }

  // Loading interstitial
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <h2 className="text-xl font-bold font-display text-foreground text-center mb-2">
          Analyzing your profile...
        </h2>
        <p className="text-muted-foreground text-center">
          Generating your custom macro plan...
        </p>
      </div>
    );
  }

  // Signup wall
  if (phase === "signup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Your plan is ready!</h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Create a free account to view your custom dashboard and unlock your Lifetime Free Smart Food Scanner.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold font-display text-card-foreground mb-4">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="mt-1" />
                {!isLogin && <PasswordStrengthIndicator password={password} />}
              </div>
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? "Loading..." : isLogin ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                }
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </Button>

            <p className="text-sm text-center text-muted-foreground mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Questions flow
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with back button and progress */}
      <div className="p-4 pt-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (step === 1) {
                  navigate("/");
                } else {
                  prevStep();
                }
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div key={step} className="w-full max-w-md animate-fade-in space-y-6">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold font-display text-foreground">What is your name?</h2>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
                autoFocus
              />
              <Button onClick={nextStep} disabled={!name.trim()} className="w-full" size="lg">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold font-display text-foreground">What is your current weight and goal weight?</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="mt-1 h-12 text-lg"
                    min={30}
                    max={300}
                  />
                </div>
                <div>
                  <Label>Goal Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    className="mt-1 h-12 text-lg"
                    min={30}
                    max={300}
                  />
                </div>
              </div>
              <Button onClick={nextStep} disabled={!currentWeight || !goalWeight} className="w-full" size="lg">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold font-display text-foreground">How active are you?</h2>
              <div className="space-y-3">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.label}
                    onClick={() => setActivity(level.label)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      activity === level.label
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{level.label}</p>
                    <p className="text-sm text-muted-foreground">{level.desc}</p>
                  </button>
                ))}
              </div>
              <Button onClick={nextStep} disabled={!activity} className="w-full" size="lg">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-2xl font-bold font-display text-foreground">What is your timeline?</h2>
              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-5xl font-bold font-display text-primary">{timeline[0]}</span>
                  <span className="text-xl text-muted-foreground ml-2">months</span>
                </div>
                <Slider
                  value={timeline}
                  onValueChange={setTimeline}
                  min={1}
                  max={36}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 month</span>
                  <span>3 years</span>
                </div>
              </div>
              <Button onClick={nextStep} className="w-full" size="lg">
                See My Plan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
