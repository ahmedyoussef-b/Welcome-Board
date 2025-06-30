"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to Your Board!");
  const [inputValue, setInputValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMessage = localStorage.getItem("welcomeMessage");
      if (storedMessage) {
        setWelcomeMessage(storedMessage);
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
    }
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      try {
        setWelcomeMessage(inputValue);
        localStorage.setItem("welcomeMessage", inputValue);
        toast({
          title: "Success!",
          description: "Your welcome message has been updated.",
        });
        setInputValue("");
      } catch (error) {
        console.error("Failed to save to localStorage", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not save your message. Please try again.",
        });
      }
    }
  };

  if (!isMounted) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg rounded-2xl shadow-2xl">
          <CardHeader className="p-0 text-center">
            <div className="rounded-t-2xl bg-primary p-8">
              <Skeleton className="mx-auto h-14 w-3/4 bg-primary/50" />
            </div>
          </CardHeader>
          <CardContent className="bg-card p-8">
            <Skeleton className="mx-auto mb-6 h-5 w-3/4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-[52px] w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-lg animate-in zoom-in-95 fade-in-0 duration-500 rounded-2xl shadow-2xl">
        <CardHeader className="p-0 text-center">
          <div className="rounded-t-2xl bg-primary p-8">
            <h1 className="font-headline text-5xl font-bold text-primary-foreground">
              {welcomeMessage}
            </h1>
          </div>
        </CardHeader>
        <CardContent className="bg-card p-8">
          <CardDescription className="mb-6 text-center text-lg">
            This is your personal welcome board. You can customize the message
            below.
          </CardDescription>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="message-input" className="text-base font-semibold">
                Customize Message
              </Label>
              <Input
                id="message-input"
                type="text"
                placeholder="e.g. Hello, World!"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="text-base"
                aria-label="New welcome message"
              />
            </div>
            <Button
              type="submit"
              className="w-full py-6 text-base font-bold"
            >
              Save & Update
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
