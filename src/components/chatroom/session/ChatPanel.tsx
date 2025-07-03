// src/components/chatroom/session/ChatPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { sendMessage, shareDocument, type ChatMessage } from '@/lib/redux/slices/sessionSlice';
import type { SafeUser } from '@/types';
import { CldUploadWidget } from "next-cloudinary";
import NextImage from "next/image"; // To avoid conflict with lucide-react Image icon
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";


interface ChatPanelProps {
  user: SafeUser | null;
  isHost: boolean;
}

interface CloudinaryResult {
  event?: "success";
  info?: {
    secure_url: string;
    resource_type: string;
    original_filename: string;
    format: string;
  };
}

export default function ChatPanel({ user, isHost }: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const messages = useAppSelector(state => state.session.chatMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null;

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    dispatch(sendMessage({
      userId: user.id,
      userName: user.name || user.email,
      userAvatar: user.img,
      message: newMessage.trim(),
      userRole: user.role.toLowerCase() as any,
    }));
    setNewMessage('');
  };
  
  const handleUploadSuccess = (result: CloudinaryResult) => {
    if (result.event === "success" && result.info) {
        const { secure_url, resource_type, original_filename, format } = result.info;
        
        const documentType = resource_type === 'image' ? 'image' : (format === 'pdf' ? 'pdf' : 'other');

        dispatch(shareDocument({
            userId: user.id,
            userName: user.name || user.email,
            userAvatar: user.img,
            userRole: user.role.toLowerCase() as any,
            documentUrl: secure_url,
            documentType: documentType,
            documentName: original_filename,
        }));
        
        toast({ title: "Fichier partagé", description: "Le document a été envoyé dans le chat." });
    }
  };


  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.documentUrl) {
      const isImage = msg.documentType === 'image';
      return (
        <div className="p-2 border rounded-lg bg-background mt-1">
          <div className="flex items-center gap-3">
             {isImage ? <ImageIcon className="w-8 h-8 text-primary flex-shrink-0" /> : <FileText className="w-8 h-8 text-primary flex-shrink-0" />}
             <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{msg.documentName || 'Document partagé'}</p>
                 <Link href={msg.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                   Voir le document
                </Link>
             </div>
          </div>
          {isImage && (
             <div className="mt-2 relative aspect-video rounded-md overflow-hidden">
                <NextImage src={msg.documentUrl} alt={msg.documentName || 'Image partagée'} fill style={{ objectFit: 'contain' }} />
             </div>
          )}
        </div>
      );
    }
    return <p className="text-sm whitespace-pre-wrap">{msg.message}</p>;
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Chat de la session</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.userId === user.id ? 'justify-end' : ''}`}>
                {msg.userId !== user.id && (
                  <img src={msg.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userName}`} alt={msg.userName || 'avatar'} className="w-8 h-8 rounded-full" />
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.userId === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{msg.userName}</p>
                    <p className="text-xs opacity-70">{formatTime(msg.timestamp)}</p>
                  </div>
                  {renderMessageContent(msg)}
                </div>
                 {msg.userId === user.id && (
                  <img src={user.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name || 'avatar'} className="w-8 h-8 rounded-full" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="bg-card"
            />
            {isHost && (
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                onSuccess={handleUploadSuccess as any}
              >
                  {({ open }) => (
                     <Button type="button" variant="ghost" size="icon" onClick={() => open()} title="Partager un document">
                        <Paperclip className="w-5 h-5" />
                    </Button>
                  )}
              </CldUploadWidget>
            )}
            <Button onClick={handleSendMessage} size="icon" title="Envoyer">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
