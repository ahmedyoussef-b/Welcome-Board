
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, VideoOff, Mic, MicOff, Hand, Crown, Trophy, Award, BarChartHorizontal, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoTileProps {
  name: string;
  isOnline: boolean;
  isTeacher?: boolean;
  hasRaisedHand?: boolean;
  points?: number;
  badgeCount?: number;
}

export default function VideoTile({ 
  name, 
  isOnline, 
  isTeacher = false, 
  hasRaisedHand = false,
  points = 0,
  badgeCount = 0
}: VideoTileProps) {
  const [attention, setAttention] = useState(0);
  const [speakingTime, setSpeakingTime] = useState(0);

  useEffect(() => {
    // Only simulate for students
    if (!isTeacher) {
      setAttention(Math.floor(Math.random() * 50) + 50); // Random score between 50 and 100

      const interval = setInterval(() => {
        if (isOnline && Math.random() > 0.7) { // 30% chance of "speaking"
            setSpeakingTime(prev => prev + 1);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOnline, isTeacher]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = () => {
    if (!points || points === 0) return null;
    
    if (points >= 50) return <Crown className="w-3 h-3 text-yellow-500" />;
    if (points >= 20) return <Trophy className="w-3 h-3 text-orange-500" />;
    if (points >= 5) return <Award className="w-3 h-3 text-blue-500" />;
    return null;
  };

  const formatSpeakingTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getAttentionColor = (score: number) => {
      if (score > 80) return "bg-green-500";
      if (score > 60) return "bg-yellow-500";
      return "bg-red-500";
  }

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 shadow-lg ${
      hasRaisedHand ? 'ring-2 ring-orange-500 ring-opacity-75' : ''
    } ${!isOnline ? 'opacity-50 grayscale' : ''}`}>
      <CardContent className="p-2">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {hasRaisedHand && (
            <Badge variant="secondary" className="p-1 bg-orange-500 hover:bg-orange-600 animate-pulse">
              <Hand className="w-3 h-3 text-white" />
            </Badge>
          )}
        </div>

        <div className="aspect-video bg-gray-900 rounded-lg mb-2 flex items-center justify-center relative">
          <Avatar className="w-16 h-16">
            <AvatarFallback className={`text-lg font-semibold ${
              isTeacher ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute bottom-1 left-1 flex gap-1">
            <Badge variant="secondary" className="p-1 bg-black/30 border-none text-white">
              {Math.random() > 0.3 ? (
                <Video className="w-3 h-3" />
              ) : (
                <VideoOff className="w-3 h-3" />
              )}
            </Badge>
            <Badge variant="secondary" className="p-1 bg-black/30 border-none text-white">
              {Math.random() > 0.2 ? (
                <Mic className="w-3 h-3" />
              ) : (
                <MicOff className="w-3 h-3" />
              )}
            </Badge>
          </div>

          <div className={`absolute top-1.5 left-1.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">{name}</p>
            {isTeacher && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                Prof
              </Badge>
            )}
          </div>

          {!isTeacher && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                {getRankIcon()}
                <span className="font-semibold">{points} pts</span>
              </div>
              {badgeCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800">
                  {badgeCount} 🏆
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {!isTeacher && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="w-3 h-3"/>
                    <span className="font-medium w-16">Attention:</span>
                    <Progress value={attention} className="h-1.5 flex-1" indicatorClassName={getAttentionColor(attention)} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <BarChartHorizontal className="w-3 h-3" />
                    <span className="font-medium w-16">Parole:</span>
                    <span className="font-mono">{formatSpeakingTime(speakingTime)}</span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
