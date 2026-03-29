"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RealtimeChat } from "@/components/realtime-chat";
import { cn } from "@/lib/utils";

export function FloatingChatWidget({ projectId, userName, userRole, projectData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [introPhase, setIntroPhase] = useState("icon"); // "icon" → "avatar"

  // After 1.8s, cross-fade from chat icon to avatar
  useEffect(() => {
    const timer = setTimeout(() => setIntroPhase("avatar"), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0); // Clear unread count when opening chat
  };

  // Mock data - replace with actual data from props
  const clientAvatar = "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const freelancerAvatar = "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const projectLogo = projectData?.logo || "/images/Logo-icon.svg";

  // Dummy messages for testing
  const dummyMessages = [
    {
      id: "1",
      content: "Hey! I've started working on the project. Just wanted to confirm the design specifications.",
      user: {
        name: userRole === "client" ? "Freelancer" : "Client",
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: "2",
      content: "That's great! Yes, please follow the latest Figma designs I shared yesterday.",
      user: {
        name: userName,
      },
      createdAt: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
    },
    {
      id: "3",
      content: "Perfect! I'll make sure everything matches. Do you have any preference for the color scheme?",
      user: {
        name: userRole === "client" ? "Freelancer" : "Client",
      },
      createdAt: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
    },
    {
      id: "4",
      content: "Let's stick with the primary colors we discussed. The orange accent works really well.",
      user: {
        name: userName,
      },
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
    {
      id: "5",
      content: "Sounds good! I'll have the first draft ready by tomorrow.",
      user: {
        name: userRole === "client" ? "Freelancer" : "Client",
      },
      createdAt: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
    },
    {
      id: "6",
      content: "That's great! I'll have the first draft ready by tomorrow.",
      user: {
        name: userRole === "client" ? "Freelancer" : "Client",
      },
      createdAt: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Panel */}
      {isOpen && (
        <Card className="mb-4 w-[500px] h-[70vh] shadow-2xl border-[1px] animate-in slide-in-from-bottom-4 duration-300 overflow-hidden p-0 gap-0 relative">
          {/* Background Image */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/images/chat-bg.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-3">
              {/* Show 2 avatars for freelancer, 1 for client */}
              <div className="flex items-center -space-x-2">
                {userRole === "freelancer" ? (
                  <>
                    <Avatar className="h-[48px] w-[48px] border-1 border-white">
                      <AvatarImage src={clientAvatar} alt="Client" />
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-[48px] w-[48px] border-1 border-white">
                      <AvatarImage src={projectLogo} alt="Project" />
                      <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  <Avatar className="h-[48px] w-[48px] border-1 border-white">
                    <AvatarImage src={freelancerAvatar} alt="Freelancer" />
                    <AvatarFallback>F</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {userRole === "client" ? "Emma Reed" : "Sophie James"}
                </h3>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Content */}
          <div className="h-[calc(70vh-5.3rem)] relative z-10">
            <RealtimeChat
              roomName={`project-${projectId}`}
              username={userName}
              userRole={userRole}
              clientAvatar={clientAvatar}
              freelancerAvatar={freelancerAvatar}
              messages={dummyMessages}
            />
          </div>
        </Card>
      )}

      {/* Floating Button — intro animation: icon → avatar */}
      <div className={cn(
        "relative animate-in slide-in-from-bottom-4 zoom-in-75 duration-500",
        isOpen && "hidden"
      )}>
        <Button
          onClick={handleOpenChat}
          size="icon"
          variant="outline"
          className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-shadow duration-300 p-0 overflow-hidden border-2 border-white relative"
        >
          {/* Phase 1: Chat icon */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-white rounded-full transition-all duration-600",
              introPhase === "avatar"
                ? "opacity-0 scale-75"
                : "opacity-100 scale-100"
            )}
          >

            <MessageCircle className="h-9 w-9 text-black" />
          </span>

          {/* Phase 2: Avatar */}
          <span
            className={cn(
              "absolute inset-0 transition-all duration-600",
              introPhase === "avatar"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-110"
            )}
          >
            <Avatar className="h-full w-full">
              <AvatarImage
                src={userRole === "client" ? freelancerAvatar : clientAvatar}
                alt={userRole === "client" ? "Freelancer" : "Client"}
              />
              <AvatarFallback>{userRole === "client" ? "F" : "C"}</AvatarFallback>
            </Avatar>
          </span>
        </Button>

        {/* Unread Badge — only show once avatar is visible */}
        {unreadCount > 0 && introPhase === "avatar" && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white flex items-center justify-center p-0 rounded-full text-xs font-semibold animate-in zoom-in duration-300"
          >
            {unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
}

