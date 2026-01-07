import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  usersApi, 
  skillsApi, 
  matchesApi, 
  sessionsApi, 
  creditsApi,
  User,
  Skill,
  Match,
  Session,
  CreditTransaction
} from '@/lib/api';

// Query Keys
export const queryKeys = {
  user: ['user'] as const,
  users: ['users'] as const,
  skills: ['skills'] as const,
  userSkills: (userId: string) => ['skills', userId] as const,
  skillCategories: ['skillCategories'] as const,
  matches: ['matches'] as const,
  sessions: ['sessions'] as const,
  sessionHistory: ['sessions', 'history'] as const,
  creditBalance: ['credits', 'balance'] as const,
  creditHistory: ['credits', 'history'] as const,
};

// User Hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: usersApi.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => usersApi.getAllUsers(),
  });
}

// Skills Hooks
export function useMySkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: skillsApi.getMySkills,
  });
}

export function useUserSkills(userId: string) {
  return useQuery({
    queryKey: queryKeys.userSkills(userId),
    queryFn: () => skillsApi.getUserSkills(userId),
    enabled: !!userId,
  });
}

export function useSkillCategories() {
  return useQuery({
    queryKey: queryKeys.skillCategories,
    queryFn: skillsApi.getCategories,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Skill, 'id' | 'user_id' | 'created_at'>) => skillsApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => skillsApi.deleteSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

// Matches Hooks
export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: matchesApi.getMatches,
  });
}

export function usePotentialMatches() {
  return useQuery({
    queryKey: ['potentialMatches'],
    queryFn: matchesApi.findPotentialMatches,
  });
}

export function useSentRequests() {
  return useQuery({
    queryKey: ['sentRequests'],
    queryFn: matchesApi.getSentRequests,
  });
}

export function useReceivedRequests() {
  return useQuery({
    queryKey: ['receivedRequests'],
    queryFn: matchesApi.getReceivedRequests,
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: matchesApi.getConnections,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { matched_user_id: string; match_score: number; common_skills: string[] }) => 
      matchesApi.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: ['potentialMatches'] });
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
    },
  });
}

export function useAcceptMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => matchesApi.acceptMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useRejectMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => matchesApi.rejectMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => matchesApi.cancelRequest(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['potentialMatches'] });
    },
  });
}

// Sessions Hooks
export function useSessions(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.sessions, status],
    queryFn: () => sessionsApi.getSessions(status),
    // Periodically refetch to keep dashboard charts up to date
    refetchInterval: 60000, // 60 seconds
    refetchOnWindowFocus: true,
  });
}

export function usePendingSessionRequests() {
  return useQuery({
    queryKey: ['sessionsPending'],
    queryFn: sessionsApi.getPendingRequests,
  });
}

export function useSentSessionRequests() {
  return useQuery({
    queryKey: ['sessionsSent'],
    queryFn: sessionsApi.getSentRequests,
  });
}

export function useScheduledSessions() {
  return useQuery({
    queryKey: ['sessionsScheduled'],
    queryFn: sessionsApi.getScheduledSessions,
  });
}

export function useSessionHistory() {
  return useQuery({
    queryKey: queryKeys.sessionHistory,
    queryFn: sessionsApi.getHistory,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Session, 'id' | 'user_id' | 'status' | 'credits_amount' | 'rating' | 'feedback' | 'rated_by' | 'created_at' | 'updated_at'>) => 
      sessionsApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: ['sessionsSent'] });
    },
  });
}

export function useAcceptSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.acceptSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: ['sessionsPending'] });
      queryClient.invalidateQueries({ queryKey: ['sessionsScheduled'] });
    },
  });
}

export function useRejectSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.rejectSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: ['sessionsPending'] });
    },
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.cancelSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: ['sessionsSent'] });
      queryClient.invalidateQueries({ queryKey: ['sessionsScheduled'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: Partial<Session> }) => 
      sessionsApi.updateSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance });
    },
  });
}

export function useRateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, rating, feedback }: { sessionId: string; rating: number; feedback?: string }) => 
      sessionsApi.rateSession(sessionId, rating, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionHistory });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

// Credits Hooks
export function useCreditBalance() {
  return useQuery({
    queryKey: queryKeys.creditBalance,
    queryFn: creditsApi.getBalance,
  });
}

export function useCreditHistory() {
  return useQuery({
    queryKey: queryKeys.creditHistory,
    queryFn: () => creditsApi.getHistory(),
  });
}

export function useEarnCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; transaction_type: string; description?: string; session_id?: string }) => 
      creditsApi.earnCredits(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditHistory });
    },
  });
}

export function useSpendCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; transaction_type: string; description?: string; session_id?: string }) => 
      creditsApi.spendCredits(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditHistory });
    },
  });
}

// Import messaging API
import { messagesApi, Conversation, Message } from '@/lib/api';

// Messaging Query Keys
export const messageQueryKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  unreadCount: ['unreadCount'] as const,
};

// Messaging Hooks
export function useConversations() {
  return useQuery({
    queryKey: messageQueryKeys.conversations,
    queryFn: messagesApi.getConversations,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: messageQueryKeys.conversation(conversationId),
    queryFn: () => messagesApi.getConversation(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000, // Refetch every 5 seconds for near real-time
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, initialMessage }: { userId: string; initialMessage?: string }) =>
      messagesApi.startConversation(userId, initialMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageQueryKeys.conversations });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      messagesApi.sendMessage(conversationId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messageQueryKeys.conversation(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: messageQueryKeys.conversations });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: messageQueryKeys.unreadCount,
    queryFn: messagesApi.getUnreadCount,
    refetchInterval: 30000,
  });
}
