import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateSkill } from "@/hooks/useApi"; // We saw this in your Profile.tsx
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Target, BrainCircuit, ArrowRight, Plus } from "lucide-react";

interface Recommendation {
  skill: string;
  reason: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const AIAdvisor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const createSkill = useCreateSkill(); // Hook to save skills to DB
  
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [timer, setTimer] = useState(0);

  // Timer for Render cold starts
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchRecommendations = async () => {
    if (!goal || !user?.id) {
        toast({ title: "Error", description: "Please enter a goal and ensure you are logged in." });
        return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("https://recommender-api-skillloop-service.onrender.com/api/beta/recommend-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id, // DYNAMIC ID FIXED
          goal: goal,
        }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      toast({ title: "API Error", description: "Could not reach the AI service.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skillName: string) => {
    try {
      await createSkill.mutateAsync({
        name: skillName,
        level: 'beginner',
        category: 'AI Recommended',
        priority: 1,
        type: 'learning' // Setting as a learning goal
      });
      toast({ title: "Goal Added", description: `${skillName} added to your learning list!` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add skill.", variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-semibold">AI Skill Advisor</h1>
        </div>
        <p className="text-muted-foreground">Personalized roadmap based on your profile.</p>
      </div>

      <Card className="border-indigo/20 bg-indigo/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="goal" className="flex items-center gap-2">
                <Target className="w-4 h-4" /> Your Career Goal
              </Label>
              <Input
                id="goal"
                placeholder="e.g. Frontend Developer at Google..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button 
              onClick={fetchRecommendations} 
              disabled={loading || !goal}
              variant="indigo"
              className="min-w-[150px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? "Thinking..." : "Get Roadmap"}
            </Button>
          </div>
          
          {loading && timer > 5 && (
            <p className="text-xs text-indigo-600 mt-2 animate-pulse">
              AI service is starting up... {Math.max(0, 30 - timer)}s remaining.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-muted h-[220px]" />
          ))
        ) : recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <Card key={index} className="flex flex-col hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={
                    rec.difficulty === "Beginner" ? "secondary" : 
                    rec.difficulty === "Advanced" ? "destructive" : "default" 
                  }>
                    {rec.difficulty}
                  </Badge>
                  <span className="text-xl font-bold text-indigo-100">0{index + 1}</span>
                </div>
                <CardTitle className="text-lg leading-tight">{rec.skill}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rec.reason}
                </p>
                <div className="flex gap-2 mt-4">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => handleAddSkill(rec.skill)}
                        disabled={createSkill.isPending}
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add to Goals
                    </Button>
                    <Button size="sm" variant="ghost" className="text-indigo-600 px-2">
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
              <BrainCircuit className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Ready to plan your future?</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;