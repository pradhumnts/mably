"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function BookCallCard({ 
  freelancerName = "Emma", 
  freelancerAvatar = "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  calendarLink = "https://calendly.com/"
}) {
  return (
    <Link href={calendarLink} target="_blank" rel="noopener noreferrer">
      <Card className="w-full max-w-full cursor-pointer bg-white/50 p-0 ring-0 transition-shadow duration-200 hover:shadow-lg focus:shadow-none sm:w-fit sm:max-w-sm">
        <CardContent className="flex gap-4 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={freelancerAvatar} alt={freelancerName} />
              <AvatarFallback>{freelancerName.charAt(0)}</AvatarFallback>
            </Avatar>

          </div>
          <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1">
            Book a call with {freelancerName}
          </h3>
          <p className="text-sm text-muted-foreground">
            A one-on-one call with your freelancer.
          </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
