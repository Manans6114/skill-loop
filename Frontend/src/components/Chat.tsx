import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, Users } from "lucide-react";
import { useConversations, useConversation, useSendMessage, useConnections, useStartConversation } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useConversations();
  const { data: connections, isLoading: connectionsLoading } = useConnections();
  const { data: conversationData, isLoading: messagesLoading } = useConversation(selectedConversationId || '');
  const sendMessage = useSendMessage();
  const startConversation = useStartConversation();

  // Find connections that don't have conversations yet
  const connectionsWithoutConversations = connections?.filter(conn => {
    return !conversations?.some(conv => conv.other_user.id === conn.user.id);
  }) || [];

  // Auto-select first conversation or connection
  useEffect(() => {
    if (!selectedConversationId && !selectedConnectionId) {
      if (conversations && conversations.length > 0) {
        setSelectedConversationId(conversations[0].id);
      } else if (connectionsWithoutConversations.length > 0) {
        setSelectedConnectionId(connectionsWithoutConversations[0].user.id);
      }
    }
  }, [conversations, connectionsWithoutConversations, selectedConversationId, selectedConnectionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages]);

  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setSelectedConnectionId(null);
  };

  const handleSelectConnection = async (userId: string) => {
    // Start a conversation with this connection
    try {
      const conv = await startConversation.mutateAsync({ userId });
      await refetchConversations();
      setSelectedConversationId(conv.id);
      setSelectedConnectionId(null);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({ title: "Error", description: "Failed to start conversation", variant: "destructive" });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: newMessage.trim()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      // Backend stores UTC time, append Z if not present to treat as UTC
      const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
      const date = new Date(utcDateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      // If less than 24 hours, show time
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-IN', options);
      }
      // If less than 7 days, show day and time
      if (diffInHours < 168) {
        return date.toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
      // Otherwise show date
      return date.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '';
    }
  };

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  const selectedConnection = connectionsWithoutConversations.find(c => c.user.id === selectedConnectionId);

  const isLoading = conversationsLoading || connectionsLoading;

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }

  const hasNoContacts = (!conversations || conversations.length === 0) && connectionsWithoutConversations.length === 0;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Conversations & Connections List */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto pb-2">
              <div className="space-y-1 p-4">
                {hasNoContacts ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No conversations yet</p>
                    <p className="text-xs text-muted-foreground mt-2 mb-4">
                      Connect with learning partners first, then start chatting
                    </p>
                    <Button variant="indigo" size="sm" onClick={() => window.location.href = '/matches'}>
                      Find Partners
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Existing Conversations */}
                    {conversations && conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversationId === conversation.id
                            ? "bg-indigo/10"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.other_user.avatar || ''} />
                          <AvatarFallback>{getInitials(conversation.other_user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{conversation.other_user.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.last_message_time)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message || "No messages yet"}
                          </p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    ))}

                    {/* Connections without conversations */}
                    {connectionsWithoutConversations.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 py-2 px-1 mt-4">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            New Connections
                          </span>
                        </div>
                        {connectionsWithoutConversations.map((connection) => (
                          <div
                            key={connection.user.id}
                            onClick={() => handleSelectConnection(connection.user.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedConnectionId === connection.user.id
                                ? "bg-green-500/10"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={connection.user.avatar || ''} />
                              <AvatarFallback className="bg-green-500 text-white">
                                {getInitials(connection.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{connection.user.name}</p>
                              <p className="text-xs text-green-600">Click to start chatting</p>
                            </div>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                              New
                            </Badge>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.other_user.avatar || ''} />
                    <AvatarFallback>{getInitials(selectedConversation.other_user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.other_user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.other_user.email}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto pb-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo" />
                    </div>
                  ) : conversationData?.messages && conversationData.messages.length > 0 ? (
                    <div className="space-y-4">
                      {conversationData.messages.map((message) => {
                        const isSelf = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isSelf ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={isSelf ? user?.avatar : message.sender_avatar || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(isSelf ? user?.name || 'You' : message.sender_name || 'User')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-xs lg:max-w-md ${isSelf ? "text-right" : ""}`}>
                              <div
                                className={`p-3 rounded-lg ${
                                  isSelf
                                    ? "bg-indigo text-white"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No messages yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Send a message to start the conversation
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                    disabled={sendMessage.isPending}
                  />
                  <Button 
                    variant="indigo" 
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : selectedConnection ? (
            // Show connection info and prompt to start conversation
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarImage src={selectedConnection.user.avatar || ''} />
                  <AvatarFallback className="text-2xl bg-green-500 text-white">
                    {getInitials(selectedConnection.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedConnection.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConnection.user.email}</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You're connected! Start a conversation to begin learning together.
                </p>
                <Button 
                  variant="indigo"
                  onClick={() => handleSelectConnection(selectedConnection.user.id)}
                  disabled={startConversation.isPending}
                >
                  {startConversation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  Start Conversation
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Chat;
