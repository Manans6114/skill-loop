import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Notifications = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your SkillLoop activity</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">New Match</Badge>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">New skill match with Sarah Chen</h4>
                      <p className="text-sm text-muted-foreground">
                        Sarah wants to learn React and you teach React! Perfect match for skill exchange.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Match
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Session Request</Badge>
                        <span className="text-sm text-muted-foreground">5 hours ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">Mike Johnson requested a Python session</h4>
                      <p className="text-sm text-muted-foreground">
                        Mike would like to schedule a 60-minute Python fundamentals session this Friday.
                      </p>
                    </div>
                    <Button variant="indigo" size="sm">
                      Respond
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-success text-success-foreground">Credits Earned</Badge>
                        <span className="text-sm text-muted-foreground">1 day ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">You earned 20 credits!</h4>
                      <p className="text-sm text-muted-foreground">
                        Completed React Hooks session with Emma Wilson. Great feedback received!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">Session Reminder</Badge>
                        <span className="text-sm text-muted-foreground">2 days ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">Upcoming session tomorrow</h4>
                      <p className="text-sm text-muted-foreground">
                        Don't forget your TypeScript Advanced session with Alex Rivera at 2:00 PM.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Join Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="matches" className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">New Match</Badge>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">New skill match with Sarah Chen</h4>
                      <p className="text-sm text-muted-foreground">
                        Sarah wants to learn React and you teach React! Perfect match for skill exchange.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Match
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Session Request</Badge>
                        <span className="text-sm text-muted-foreground">5 hours ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">Mike Johnson requested a Python session</h4>
                      <p className="text-sm text-muted-foreground">
                        Mike would like to schedule a 60-minute Python fundamentals session this Friday.
                      </p>
                    </div>
                    <Button variant="indigo" size="sm">
                      Respond
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="credits" className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-success text-success-foreground">Credits Earned</Badge>
                        <span className="text-sm text-muted-foreground">1 day ago</span>
                      </div>
                      <h4 className="font-medium text-foreground">You earned 20 credits!</h4>
                      <p className="text-sm text-muted-foreground">
                        Completed React Hooks session with Emma Wilson. Great feedback received!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;