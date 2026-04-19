import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, CheckCircle2, AtSign, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentSidebarProps {
  contractId: number;
}

export default function CommentSidebar({ contractId }: CommentSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const MAX_CHARS = 500;

  const { data: orgMembers } = useQuery<any[]>({
    queryKey: ["/api/org/members"],
  });

  const { data: comments, isLoading } = useQuery<any[]>({
    queryKey: [`/api/comments?contractId=${contractId}`],
    refetchInterval: 5000, // Polling every 5 seconds for "real-time" collaboration
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/comments", {
        contractId,
        content: text,
      });
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/comments?contractId=${contractId}`] });
    },
    onError: () => {
      toast({ title: "Failed to post comment", variant: "destructive" });
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS);
    setContent(val);

    // Basic @mention detection
    const lastAtPos = val.lastIndexOf("@");
    const isAtStartOrAfterSpace = lastAtPos === 0 || (lastAtPos > 0 && val[lastAtPos - 1] === " ");
    
    if (lastAtPos !== -1 && isAtStartOrAfterSpace) {
      const textAfterAt = val.slice(lastAtPos + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionQuery(textAfterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: any) => {
    const lastAtPos = content.lastIndexOf("@");
    const before = content.slice(0, lastAtPos);
    const after = content.slice(lastAtPos + mentionQuery.length + 1);
    setContent(`${before}@${member.firstName}${after}`);
    setShowMentions(false);
  };

  const filteredMembers = orgMembers?.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(mentionQuery) ||
    m.email.toLowerCase().includes(mentionQuery)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    postMutation.mutate(content);
    setShowMentions(false);
  };

  return (
    <Card className="h-full border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col">
      <CardHeader className="border-b border-slate-800 py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
          <MessageSquare className="h-4 w-4 text-primary" />
          Internal Collaboration
          {orgMembers && orgMembers.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500 font-normal">
              <Users className="h-3 w-3" />
              {orgMembers.length} online
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-slate-500 text-xs py-10 italic">Loading conversation...</div>
            ) : comments?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-medium">No comments yet</p>
                  <p className="text-slate-600 text-[10px] mt-1">Start the discussion. Use @ to mention teammates.</p>
                </div>
              </div>
            ) : (
              [...(comments || [])].reverse().map((comment) => (
                <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Avatar className="h-8 w-8 border border-slate-800">
                    <AvatarImage src={comment.user?.profileImageUrl} />
                    <AvatarFallback className="bg-slate-800 text-slate-300 text-[10px]">
                      {comment.user?.firstName?.[0] || comment.user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-800/50">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80 relative">
          {showMentions && filteredMembers && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-64 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 p-1">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Mention Teammate
              </div>
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => insertMention(member)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded text-left transition-colors"
                >
                  <Avatar className="h-5 w-5 border border-slate-800">
                    <AvatarFallback className="bg-slate-700 text-[8px]">{member.firstName?.[0] || member.email?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{member.firstName} {member.lastName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{member.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Type a comment or @mention a teammate..."
              value={content}
              onChange={handleTextChange}
              className="min-h-[80px] text-xs border-slate-800 bg-slate-950 text-white resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Audit persistence active
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${content.length > MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-slate-600'}`}>
                  {content.length}/{MAX_CHARS}
                </span>
                <Button 
                  size="sm" 
                  type="submit" 
                  disabled={postMutation.isPending || !content.trim()}
                  className="bg-primary hover:bg-primary/90 h-8"
                >
                  {postMutation.isPending ? "..." : <Send className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
