import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, MessageCircle, Loader2, Check, X, UserPlus, Sparkles, Clock, Send, Users } from "lucide-react";
import { 
  useAcceptMatch, 
  useRejectMatch, 
  usePotentialMatches, 
  useCreateMatch, 
  useCreateSession, 
  useStartConversation,
  useSentRequests,
  useReceivedRequests,
  useConnections,
  useCancelRequest
} from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PotentialMatch, SentRequest, ReceivedRequest, Connection } from "@/lib/api";

const Matches = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // API hooks - using the new separated endpoints
  const { data: potentialMatches, isLoading: potentialLoading, refetch: refetchPotential } = usePotentialMatches();
  const { data: sentRequests, isLoading: sentLoading } = useSentRequests();
  const { data: receivedRequests, isLoading: receivedLoading } = useReceivedRequests();
  const { data: connections, isLoading: connectionsLoading } = useConnections();
  
  const acceptMatch = useAcceptMatch();
  const rejectMatch = useRejectMatch();
  const createMatch = useCreateMatch();
  const cancelRequest = useCancelRequest();
  const createSession = useCreateSession();
  const startConversation = useStartConversation();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [sessionData, setSessionData] = useState({
    title: '',
    skill: '',
    date: '',
    time: '',
    duration: 30,  // Default to 30 minutes (10 credits)
    type: 'learning' as 'teaching' | 'learning'
  });

  // Filter potential matches
  const filteredPotential = potentialMatches?.filter(match => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return match.user.name.toLowerCase().includes(term) ||
           match.common_skills.some(s => s.toLowerCase().includes(term));
  }) || [];

  const isLoading = potentialLoading || sentLoading || receivedLoading || connectionsLoading;

  const handleConnect = async (potential: PotentialMatch) => {
    try {
      await createMatch.mutateAsync({
        matched_user_id: potential.user.id,
        match_score: potential.match_score,
        common_skills: potential.common_skills
      });
      toast({ title: "Connection sent!", description: `Request sent to ${potential.user.name}` });
      refetchPotential();
    } catch (error) {
      toast({ title: "Error", description: "Failed to send connection request", variant: "destructive" });
    }
  };

  const handleAcceptMatch = async (matchId: string, senderName: string) => {
    try {
      await acceptMatch.mutateAsync(matchId);
      toast({ title: "Connection accepted!", description: `You are now connected with ${senderName}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to accept request", variant: "destructive" });
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      await rejectMatch.mutateAsync(matchId);
      toast({ title: "Request declined" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to decline request", variant: "destructive" });
    }
  };

  const handleCancelRequest = async (matchId: string) => {
    try {
      await cancelRequest.mutateAsync(matchId);
      toast({ title: "Request cancelled" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
    }
  };

  const handleStartChat = async (userId: string, userName: string) => {
    // Navigate to chat - the Chat page will handle starting the conversation
    navigate('/chat');
  };

  const handleRequestSession = async (participantId: string, participantName: string, skills: string[]) => {
    if (!sessionData.title || !sessionData.date || !sessionData.time || !sessionData.skill) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      await createSession.mutateAsync({
        title: sessionData.title,
        participant_id: participantId,
        participant_name: participantName,
        skill: sessionData.skill,
        date: sessionData.date,
        time: sessionData.time,
        duration: sessionData.duration,
        type: sessionData.type
      });
      toast({ title: "Session scheduled!", description: "Your session has been created" });
      navigate('/sessions');
    } catch (error) {
      toast({ title: "Error", description: "Failed to create session", variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Find Learning Partners</h1>
          <p className="text-muted-foreground">Connect with peers who complement your skills</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Search by name or skills..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="discover" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Discover ({filteredPotential.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-1">
            <UserPlus className="w-4 h-4" />
            Received ({receivedRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-1">
            <Send className="w-4 h-4" />
            Sent ({sentRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="connected" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Connected ({connections?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab - Find New Matches */}
        <TabsContent value="discover" className="space-y-6">
          {filteredPotential.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No potential matches found</p>
                <p className="text-sm text-muted-foreground">
                  Add more skills to your profile to find learning partners
                </p>
                <Button variant="indigo" className="mt-4" onClick={() => navigate('/profile')}>
                  Add Skills
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPotential.map((potential) => (
                <Card key={potential.user.id} className="hover:shadow-card transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      {potential.user.avatar ? (
                        <img src={potential.user.avatar} alt={potential.user.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo text-white flex items-center justify-center font-medium">
                          {getInitials(potential.user.name)}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{potential.user.name}</CardTitle>
                        <CardDescription className="text-indigo font-medium">
                          {potential.match_score.toFixed(0)}% match
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {potential.they_can_teach.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Can teach you</p>
                        <div className="flex flex-wrap gap-1">
                          {potential.they_can_teach.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs capitalize">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {potential.they_want_to_learn.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Wants to learn from you</p>
                        <div className="flex flex-wrap gap-1">
                          {potential.they_want_to_learn.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs capitalize">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {potential.user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{potential.user.bio}</p>
                    )}

                    {potential.user.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{potential.user.rating.toFixed(1)}</span>
                      </div>
                    )}

                    <Button 
                      variant="indigo" 
                      className="w-full"
                      onClick={() => handleConnect(potential)}
                      disabled={createMatch.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Received Tab - Requests I received (I can accept/reject) */}
        <TabsContent value="received" className="space-y-6">
          {!receivedRequests?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
                <p className="text-sm text-muted-foreground mt-2">
                  When someone wants to connect with you, their request will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {receivedRequests.map((request: ReceivedRequest) => (
                <Card key={request.id} className="hover:shadow-card transition-shadow border-l-4 border-l-indigo">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {request.sender.avatar ? (
                          <img src={request.sender.avatar} alt={request.sender.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo text-white flex items-center justify-center font-medium text-sm">
                            {getInitials(request.sender.name)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{request.sender.name}</CardTitle>
                          <CardDescription>{request.match_score.toFixed(0)}% match</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-indigo/10 text-indigo">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {request.sender.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{request.sender.bio}</p>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Common Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {request.common_skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs capitalize">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    {request.sender.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{request.sender.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="indigo" 
                        className="flex-1"
                        onClick={() => handleAcceptMatch(request.id, request.sender.name)}
                        disabled={acceptMatch.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleRejectMatch(request.id)}
                        disabled={rejectMatch.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Tab - Requests I sent (waiting for others) */}
        <TabsContent value="sent" className="space-y-6">
          {!sentRequests?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sent requests</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Requests you send will appear here until they're accepted
                </p>
                <Button variant="indigo" className="mt-4" onClick={() => setActiveTab('discover')}>
                  Discover Partners
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sentRequests.map((request: SentRequest) => (
                <Card key={request.id} className="hover:shadow-card transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {request.matched_user.avatar ? (
                          <img src={request.matched_user.avatar} alt={request.matched_user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-medium text-sm">
                            {getInitials(request.matched_user.name)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{request.matched_user.name}</CardTitle>
                          <CardDescription>{request.match_score.toFixed(0)}% match</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {request.matched_user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{request.matched_user.bio}</p>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Common Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {request.common_skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs capitalize">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={cancelRequest.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />Cancel Request
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Connected Tab - Accepted connections (can message) */}
        <TabsContent value="connected" className="space-y-6">
          {!connections?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No connections yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Once someone accepts your request or you accept theirs, you'll be connected
                </p>
                <Button variant="indigo" onClick={() => setActiveTab('discover')}>
                  Discover Partners
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((connection: Connection) => (
                <Card key={connection.id} className="hover:shadow-card transition-shadow border-l-4 border-l-green-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {connection.user.avatar ? (
                          <img src={connection.user.avatar} alt={connection.user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-medium text-sm">
                            {getInitials(connection.user.name)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{connection.user.name}</CardTitle>
                          <CardDescription>{connection.match_score.toFixed(0)}% match</CardDescription>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {connection.user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{connection.user.bio}</p>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Skills to Exchange</p>
                      <div className="flex flex-wrap gap-1">
                        {connection.common_skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs capitalize">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    {connection.user.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{connection.user.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleStartChat(connection.user.id, connection.user.name)}
                        disabled={startConversation.isPending}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />Chat
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="indigo" className="flex-1">Schedule</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule a Session with {connection.user.name}</DialogTitle>
                            <DialogDescription>Set up a learning session</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Session Title</Label>
                              <Input 
                                placeholder="e.g., React Basics"
                                value={sessionData.title}
                                onChange={(e) => setSessionData({...sessionData, title: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Skill</Label>
                              <Select 
                                value={sessionData.skill}
                                onValueChange={(v) => setSessionData({...sessionData, skill: v})}
                              >
                                <SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger>
                                <SelectContent>
                                  {connection.common_skills.map(skill => (
                                    <SelectItem key={skill} value={skill} className="capitalize">{skill}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>I want to</Label>
                              <Select 
                                value={sessionData.type}
                                onValueChange={(v: 'teaching' | 'learning') => setSessionData({...sessionData, type: v})}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="learning">Learn this skill</SelectItem>
                                  <SelectItem value="teaching">Teach this skill</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Input 
                                  type="date" 
                                  value={sessionData.date}
                                  onChange={(e) => setSessionData({...sessionData, date: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Time</Label>
                                <Input 
                                  type="time"
                                  value={sessionData.time}
                                  onChange={(e) => setSessionData({...sessionData, time: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Duration & Credits</Label>
                              <Select 
                                value={sessionData.duration.toString()}
                                onValueChange={(v) => setSessionData({...sessionData, duration: parseInt(v)})}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="15">15 minutes - 5 credits</SelectItem>
                                  <SelectItem value="30">30 minutes - 10 credits</SelectItem>
                                  <SelectItem value="60">60 minutes - 20 credits</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {sessionData.type === 'learning' ? 'You will pay' : 'You will earn'} credits for this session
                              </p>
                            </div>
                            <Button 
                              variant="indigo" 
                              className="w-full"
                              onClick={() => handleRequestSession(connection.user.id, connection.user.name, connection.common_skills)}
                              disabled={createSession.isPending}
                            >
                              Schedule Session
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Matches;
