import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, Coins, Loader2, Check, X, Play } from "lucide-react";
import { 
  usePendingSessionRequests, 
  useSentSessionRequests, 
  useScheduledSessions, 
  useSessionHistory, 
  useAcceptSession,
  useRejectSession,
  useCancelSession,
  useCompleteSession, 
  useRateSession 
} from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CREDIT_RATES } from "@/lib/api";

const Sessions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: pendingRequests, isLoading: pendingLoading } = usePendingSessionRequests();
  const { data: sentRequests, isLoading: sentLoading } = useSentSessionRequests();
  const { data: scheduledSessions, isLoading: scheduledLoading } = useScheduledSessions();
  const { data: history, isLoading: historyLoading } = useSessionHistory();
  
  const acceptSession = useAcceptSession();
  const rejectSession = useRejectSession();
  const cancelSession = useCancelSession();
  const completeSession = useCompleteSession();
  const rateSession = useRateSession();

  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("scheduled");

  const isLoading = pendingLoading || sentLoading || scheduledLoading || historyLoading;

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await acceptSession.mutateAsync(sessionId);
      toast({ title: "Session accepted!", description: "The session has been scheduled." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to accept session.", variant: "destructive" });
    }
  };

  const handleRejectSession = async (sessionId: string) => {
    try {
      await rejectSession.mutateAsync(sessionId);
      toast({ title: "Session rejected" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject session.", variant: "destructive" });
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await cancelSession.mutateAsync(sessionId);
      toast({ title: "Session cancelled" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel session.", variant: "destructive" });
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await completeSession.mutateAsync(sessionId);
      toast({ title: "Session completed!", description: "Credits have been transferred." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete session.", variant: "destructive" });
    }
  };

  const handleRateSession = async () => {
    if (!ratingSessionId || selectedRating === 0) return;
    try {
      await rateSession.mutateAsync({ 
        sessionId: ratingSessionId, 
        rating: selectedRating, 
        feedback: feedback || undefined 
      });
      toast({ title: "Rating submitted", description: "Thank you for your feedback!" });
      setRatingSessionId(null);
      setSelectedRating(0);
      setFeedback('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit rating.", variant: "destructive" });
    }
  };

  const getSessionRole = (session: any) => {
    if (session.user_id === user?.id) {
      return session.type === 'teaching' ? 'Teaching' : 'Learning';
    } else {
      return session.type === 'teaching' ? 'Learning' : 'Teaching';
    }
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
          <h1 className="text-2xl font-semibold">Your Sessions</h1>
          <p className="text-muted-foreground">Manage your learning and teaching sessions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo/10 rounded-lg">
          <Coins className="w-5 h-5 text-indigo" />
          <span className="font-semibold text-indigo">{user?.credits || 0} credits</span>
        </div>
      </div>

      {/* Credit Rates Info */}
      <Card className="bg-gradient-to-r from-indigo/5 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo" />
              <span className="font-medium">Session Credit Rates:</span>
            </div>
            <div className="flex gap-4">
              {Object.entries(CREDIT_RATES).map(([duration, credits]) => (
                <div key={duration} className="text-center">
                  <Badge variant="outline" className="mb-1">{duration} min</Badge>
                  <p className="text-sm font-medium text-indigo">{credits} credits</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo" />
              <div>
                <p className="text-2xl font-bold">{scheduledSessions?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{history?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {history?.reduce((acc, s) => acc + (s.credits_amount || 0), 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Credits Exchanged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="requests" className="relative">
            Requests
            {(pendingRequests?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests?.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentRequests?.length || 0})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledSessions?.length || 0})</TabsTrigger>
          <TabsTrigger value="history">History ({history?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {!pendingRequests?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending session requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((session) => (
              <Card key={session.id} className="hover:shadow-card transition-shadow border-l-4 border-l-orange-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription>
                        {session.participant_name} wants you to {session.type === 'teaching' ? 'learn' : 'teach'} • {session.skill}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {session.time}
                    </span>
                    <span>{session.duration} min</span>
                    <span className="flex items-center gap-1 text-indigo font-medium">
                      <Coins className="w-4 h-4" /> {session.credits_amount} credits
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="indigo" 
                      onClick={() => handleAcceptSession(session.id)}
                      disabled={acceptSession.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleRejectSession(session.id)}
                      disabled={rejectSession.isPending}
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          {!sentRequests?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No sent requests waiting for response</p>
              </CardContent>
            </Card>
          ) : (
            sentRequests.map((session) => (
              <Card key={session.id} className="hover:shadow-card transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription>
                        Waiting for {session.participant_name} to accept • {session.skill}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Waiting</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {session.time}
                    </span>
                    <span>{session.duration} min</span>
                    <span className="flex items-center gap-1 text-indigo font-medium">
                      <Coins className="w-4 h-4" /> {session.credits_amount} credits
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-destructive"
                    onClick={() => handleCancelSession(session.id)}
                    disabled={cancelSession.isPending}
                  >
                    Cancel Request
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Scheduled Sessions Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          {!scheduledSessions?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No scheduled sessions</p>
                <Button variant="indigo" onClick={() => window.location.href = '/matches'}>
                  Find Learning Partners
                </Button>
              </CardContent>
            </Card>
          ) : (
            scheduledSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-card transition-shadow border-l-4 border-l-indigo">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription>
                        with {session.participant_name} • You are {getSessionRole(session)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getSessionRole(session) === 'Teaching' ? 'secondary' : 'outline'}>
                        {getSessionRole(session)}
                      </Badge>
                      <Badge variant="default" className="bg-indigo">{session.skill}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {session.time}
                    </span>
                    <span>{session.duration} min</span>
                    <span className="flex items-center gap-1 text-indigo font-medium">
                      <Coins className="w-4 h-4" /> {session.credits_amount} credits
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="indigo"
                      onClick={() => handleCompleteSession(session.id)}
                      disabled={completeSession.isPending}
                    >
                      <Play className="w-4 h-4 mr-1" /> Complete Session
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleCancelSession(session.id)}
                      disabled={cancelSession.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {!history?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No completed sessions yet</p>
              </CardContent>
            </Card>
          ) : (
            history.map((session) => (
              <Card key={session.id} className="hover:shadow-card transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription>
                        with {session.participant_name} • {session.date} • {getSessionRole(session)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>
                      {session.rating && (
                        <Badge variant="outline">★ {session.rating.toFixed(1)}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{session.duration} min</span>
                    <span className="flex items-center gap-1 text-indigo font-medium">
                      <Coins className="w-4 h-4" /> {session.credits_amount} credits
                    </span>
                  </div>
                  {!session.rating ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="indigo" onClick={() => setRatingSessionId(session.id)}>
                          Give Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Session Feedback</DialogTitle>
                          <DialogDescription>
                            How was your session with {session.participant_name}?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Rating</Label>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setSelectedRating(star)}
                                  className={`w-8 h-8 text-2xl transition-colors ${
                                    star <= selectedRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Comment (optional)</Label>
                            <Textarea 
                              placeholder="Share your experience..." 
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="min-h-20"
                            />
                          </div>
                          <Button 
                            variant="indigo" 
                            className="w-full"
                            onClick={handleRateSession}
                            disabled={rateSession.isPending || selectedRating === 0}
                          >
                            Submit Feedback
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {session.feedback && <p className="italic">"{session.feedback}"</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sessions;
