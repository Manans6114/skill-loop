import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageCircle, Users, BookOpen, Video, Plus } from "lucide-react";

const discussions = [
  {
    id: 1,
    title: "Best practices for React Hooks",
    author: "Sarah Chen",
    avatar: "SC",
    category: "React",
    replies: 23,
    lastActivity: "2 hours ago",
    isHot: true,
    excerpt: "Let's discuss the most effective patterns for using React Hooks in complex applications..."
  },
  {
    id: 2,
    title: "Career transition from Frontend to Full-Stack",
    author: "Mike Johnson",
    avatar: "MJ", 
    category: "Career",
    replies: 15,
    lastActivity: "4 hours ago",
    isHot: false,
    excerpt: "Looking for advice on making the transition. What skills should I focus on first?"
  },
  {
    id: 3,
    title: "Python vs JavaScript for beginners",
    author: "Emma Davis",
    avatar: "ED",
    category: "Programming",
    replies: 31,
    lastActivity: "1 day ago",
    isHot: true,
    excerpt: "Which language would you recommend for someone completely new to programming?"
  }
];

const studyGroups = [
  {
    id: 1,
    name: "React Advanced Patterns",
    members: 12,
    category: "React",
    nextSession: "Tomorrow 7:00 PM",
    description: "Deep dive into advanced React patterns and architectures"
  },
  {
    id: 2,
    name: "Data Science Fundamentals", 
    members: 8,
    category: "Data Science",
    nextSession: "Friday 6:00 PM",
    description: "Learn the basics of data analysis and visualization"
  },
  {
    id: 3,
    name: "System Design Study Group",
    members: 15,
    category: "System Design", 
    nextSession: "Sunday 3:00 PM",
    description: "Practice system design problems for interviews"
  }
];

const Community = () => {
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "" });

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Community</h1>
          <p className="text-muted-foreground">Connect, discuss, and learn together</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="indigo" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start a Discussion</DialogTitle>
              <DialogDescription>
                Share your thoughts or ask questions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="What's on your mind?"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="e.g., React, Career, Programming"
                  value={newPost.category}
                  onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content" 
                  placeholder="Share your thoughts..."
                  className="min-h-24"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" className="flex-1">Cancel</Button>
                <Button variant="indigo" className="flex-1">Post Discussion</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Input placeholder="Search discussions..." className="max-w-md" />
            <Button variant="outline">Filter</Button>
          </div>

          {discussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-card transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg hover:text-indigo transition-colors">
                        {discussion.title}
                      </CardTitle>
                      {discussion.isHot && (
                        <Badge variant="destructive" className="text-xs">Hot</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {discussion.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">{discussion.avatar}</AvatarFallback>
                        </Avatar>
                        <span>{discussion.author}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{discussion.category}</Badge>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{discussion.replies} replies</span>
                      </div>
                      <span>{discussion.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="outline">{group.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{group.members}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Next: {group.nextSession}
                    </div>
                    <Button size="sm" variant="indigo">Join Group</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <CardDescription>Community workshops and webinars</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">React 18 Features Workshop</div>
                    <div className="text-sm text-muted-foreground">Saturday, 2:00 PM - 4:00 PM</div>
                    <div className="flex items-center gap-2 text-xs">
                      <BookOpen className="w-3 h-3" />
                      <span>Workshop</span>
                      <Video className="w-3 h-3" />
                      <span>Online</span>
                    </div>
                  </div>
                  <Button size="sm" variant="indigo">Register</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Career Growth in Tech</div>
                    <div className="text-sm text-muted-foreground">Next Monday, 7:00 PM - 8:30 PM</div>
                    <div className="flex items-center gap-2 text-xs">
                      <MessageCircle className="w-3 h-3" />
                      <span>Panel Discussion</span>
                      <Video className="w-3 h-3" />
                      <span>Online</span>
                    </div>
                  </div>
                  <Button size="sm" variant="indigo">Register</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;