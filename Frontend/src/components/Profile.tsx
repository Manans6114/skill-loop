import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMySkills, useCreateSkill, useDeleteSkill, useUpdateUser, useCreditBalance, useSessions } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { data: skills, isLoading: skillsLoading } = useMySkills();
  const { data: creditBalance } = useCreditBalance();
  const { data: sessions } = useSessions();
  
  const updateUser = useUpdateUser();
  const createSkill = useCreateSkill();
  const deleteSkill = useDeleteSkill();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [teachLevel, setTeachLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [learnPriority, setLearnPriority] = useState(1);

  const teachingSkills = skills?.filter(s => s.type === 'teaching') || [];
  const learningSkills = skills?.filter(s => s.type === 'learning') || [];
  const completedSessions = sessions?.filter(s => s.status === 'completed') || [];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUser.mutateAsync({ name, bio });
      await refreshUser();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  const handleAddTeachSkill = async () => {
    if (!newTeachSkill.trim()) return;
    try {
      await createSkill.mutateAsync({
        name: newTeachSkill,
        level: teachLevel,
        category: 'General',
        priority: 0,
        type: 'teaching'
      });
      setNewTeachSkill('');
      toast({ title: "Skill added", description: `${newTeachSkill} added to teaching skills.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add skill.", variant: "destructive" });
    }
  };

  const handleAddLearnSkill = async () => {
    if (!newLearnSkill.trim()) return;
    try {
      await createSkill.mutateAsync({
        name: newLearnSkill,
        level: 'beginner',
        category: 'General',
        priority: learnPriority,
        type: 'learning'
      });
      setNewLearnSkill('');
      toast({ title: "Skill added", description: `${newLearnSkill} added to learning goals.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add skill.", variant: "destructive" });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      await deleteSkill.mutateAsync(skillId);
      toast({ title: "Skill removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove skill.", variant: "destructive" });
    }
  };

  if (skillsLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your profile, skills, and preferences</p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatar || ''} />
            <AvatarFallback className="text-lg">{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your basic profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled />
                      <p className="text-xs text-muted-foreground">Email is managed by Auth0</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        placeholder="Tell others about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="min-h-24"
                      />
                    </div>
                    <Button 
                      variant="indigo" 
                      onClick={handleSaveProfile}
                      disabled={updateUser.isPending}
                    >
                      {updateUser.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Credits Balance</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-semibold text-indigo">{creditBalance?.credits ?? user?.credits ?? 0}</div>
                      <p className="text-sm text-muted-foreground">Available Credits</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Session Stats</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sessions Taught</span>
                      <span className="font-medium">{sessions?.filter(s => s.type === 'teaching').length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sessions Attended</span>
                      <span className="font-medium">{sessions?.filter(s => s.type === 'learning').length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Rating</span>
                      <span className="font-medium">{user?.rating?.toFixed(1) || 'N/A'} ★</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Skills I Teach</CardTitle>
                  <CardDescription>Add skills you can teach to others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {teachingSkills.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
                        {skill.name} ({skill.level})
                        <button onClick={() => handleDeleteSkill(skill.id)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {teachingSkills.length === 0 && <p className="text-muted-foreground text-sm">No teaching skills added</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Add New Skill</Label>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="e.g., Python, React" 
                        value={newTeachSkill}
                        onChange={(e) => setNewTeachSkill(e.target.value)}
                      />
                      <Select value={teachLevel} onValueChange={(v: any) => setTeachLevel(v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={handleAddTeachSkill} disabled={createSkill.isPending}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills I Want to Learn</CardTitle>
                  <CardDescription>Add skills you'd like to learn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {learningSkills.map((skill) => (
                      <Badge key={skill.id} variant="outline" className="flex items-center gap-1">
                        {skill.name}
                        <button onClick={() => handleDeleteSkill(skill.id)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {learningSkills.length === 0 && <p className="text-muted-foreground text-sm">No learning goals added</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Add New Skill</Label>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="e.g., Machine Learning" 
                        value={newLearnSkill}
                        onChange={(e) => setNewLearnSkill(e.target.value)}
                      />
                      <Button variant="outline" onClick={handleAddLearnSkill} disabled={createSkill.isPending}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>Set when you're available for sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Weekday Availability</h4>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <div key={day} className="flex items-center justify-between">
                        <Label>{day}</Label>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Weekend Availability</h4>
                    {['Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex items-center justify-between">
                        <Label>{day}</Label>
                        <Switch />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Available From</Label>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Available Until</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>
                <Button variant="indigo">Save Availability</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Match Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified for new matches</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Reminders</Label>
                    <p className="text-sm text-muted-foreground">Reminders before sessions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Sessions per Week</Label>
                  <Select defaultValue="5">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 sessions</SelectItem>
                      <SelectItem value="5">5 sessions</SelectItem>
                      <SelectItem value="7">7 sessions</SelectItem>
                      <SelectItem value="10">10 sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Duration</Label>
                  <Select defaultValue="60">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="indigo">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
