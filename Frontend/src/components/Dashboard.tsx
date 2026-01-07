import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Clock, Star, Award, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useMatches, useMySkills, useCreditBalance, useCreditHistory } from "@/hooks/useApi";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: skills, isLoading: skillsLoading } = useMySkills();
  const { data: creditBalance } = useCreditBalance();
  const { data: creditHistory } = useCreditHistory();

  const upcomingSessions = sessions?.filter(s => s.status === 'scheduled') || [];
  const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
  const activeMatches = matches?.filter(m => m.status === 'accepted') || [];
  const teachingSkills = skills?.filter(s => s.type === 'teaching') || [];
  const learningSkills = skills?.filter(s => s.type === 'learning') || [];
  const totalHours = completedSessions.reduce((acc, s) => acc + (s.duration / 60), 0);

  const earnedCredits = creditHistory?.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0) || 0;
  const spentCredits = Math.abs(creditHistory?.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0) || 0);
  
  const creditsData = [
    { name: 'Earned', value: earnedCredits, color: '#3b82f6' },
    { name: 'Spent', value: spentCredits, color: '#10b981' },
    { name: 'Balance', value: creditBalance?.credits || 0, color: '#f59e0b' }
  ];

  // Calculate weekly activity (Mon–Sun) from session data
  const weeklyActivityData = useMemo(() => {
    // Helper to get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // End of week (Sunday 23:59:59.999)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts: Record<string, number> = Object.fromEntries(
      orderedDays.map((d) => [d, 0])
    );

    sessions?.forEach((session) => {
      if (session.status === 'completed' || session.status === 'scheduled') {
        // `session.date` is stored as YYYY-MM-DD string; construct Date
        const sessionDate = new Date(session.date);
        if (sessionDate >= weekStart && sessionDate <= weekEnd) {
          const idx = sessionDate.getDay(); // 0 = Sun ... 6 = Sat
          const dayName = orderedDays[(idx + 6) % 7]; // map 0->Sun to end
          dayCounts[dayName] += 1;
        }
      }
    });

    return orderedDays.map((day) => ({ day, sessions: dayCounts[day] }));
  }, [sessions]);

  if (sessionsLoading || matchesLoading || skillsLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground">You're on track to achieve your learning goals.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="indigo" onClick={() => navigate("/matches")}>Find New Matches</Button>
            <Button variant="outline" onClick={() => navigate("/sessions")}>Schedule Session</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-primary-foreground/80">Credits</CardDescription>
                <Award className="w-5 h-5 text-primary-foreground/80" />
              </div>
              <CardTitle className="text-3xl font-bold">{creditBalance?.credits ?? user?.credits ?? 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary-foreground/80">
                <TrendingUp className="w-4 h-4 mr-1" />
                {earnedCredits > 0 ? `+${earnedCredits} earned` : 'Start earning!'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer" onClick={() => navigate('/matches')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Active Matches</CardDescription>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl font-bold">{activeMatches.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{matches?.filter(m => m.status === 'pending').length || 0} pending</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer" onClick={() => navigate('/sessions')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Learning Hours</CardDescription>
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl font-bold">{totalHours.toFixed(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{completedSessions.length} sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Rating</CardDescription>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <CardTitle className="text-3xl font-bold">{user?.rating?.toFixed(1) || 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{completedSessions.filter(s => s.rating).length} reviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credits Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={creditsData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                    {creditsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {creditsData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teaching">Teaching</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="indigo" className="w-full" onClick={() => navigate("/matches")}>Find Matches</Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/sessions")}>Sessions</Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/community")}>Community</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {completedSessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Completed {session.skill}</span>
                      </div>
                    ))}
                    {completedSessions.length === 0 && <p className="text-muted-foreground">No recent activity</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Your Skills</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Teaching</p>
                    <div className="flex flex-wrap gap-1">
                      {teachingSkills.slice(0, 4).map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-xs">{skill.name}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Learning</p>
                    <div className="flex flex-wrap gap-1">
                      {learningSkills.slice(0, 4).map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-xs">{skill.name}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="teaching" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Skills I Teach</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teachingSkills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">{skill.name} ({skill.level})</Badge>
                    ))}
                    {teachingSkills.length === 0 && <p className="text-muted-foreground">No teaching skills</p>}
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/profile')}>Add Skills</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Teaching Stats</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions</span>
                    <span className="font-semibold">{sessions?.filter(s => s.type === 'teaching').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-semibold">{user?.rating?.toFixed(1) || 'N/A'}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Earned</span>
                    <span className="font-semibold">{earnedCredits}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Skills to Learn</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {learningSkills.map((skill) => (
                      <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                    ))}
                    {learningSkills.length === 0 && <p className="text-muted-foreground">No learning goals</p>}
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/profile')}>Add Goals</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Learning Stats</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions</span>
                    <span className="font-semibold">{sessions?.filter(s => s.type === 'learning').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skills</span>
                    <span className="font-semibold">{learningSkills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold">{spentCredits}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled sessions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")}>View All</Button>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upcoming sessions</p>
                <Button variant="indigo" onClick={() => navigate('/matches')}>Find Matches</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.participant_name} • {session.date} at {session.time}
                      </div>
                    </div>
                    <Badge variant={session.type === 'teaching' ? 'secondary' : 'outline'}>{session.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
