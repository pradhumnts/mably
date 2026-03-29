"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, Triangle } from "lucide-react";
import { FeatureDetailDialog } from "./feature-detail-dialog";
import { toast } from "sonner";

// Dummy data
const featureRequests = [
  {
    id: 1,
    title: "This is an in-progress feature request",
    description: "Show your users that you listen and care for them",
    status: "In Progress",
    votes: 9,
    createdBy: "Anonymous",
  },
  {
    id: 2,
    title: "This is a sample request",
    description: "Drag this around to update the status",
    status: "Pending",
    votes: 4,
    createdBy: "Anonymous",
  },
  {
    id: 3,
    title: "This is another sample request",
    description: "You can delete this by clicking on the three dots on the right portion of this card",
    status: "Pending",
    votes: 3,
    createdBy: "Anonymous",
  },
  {
    id: 4,
    title: "This is another sample request",
    description: "You can delete this by clicking on the three dots on the right portion of this card",
    status: "Approved",
    votes: 2,
    createdBy: "Anonymous",
  },
];

export function FeatureRequestsList({ filter = "open" }) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [features, setFeatures] = useState(featureRequests);
  const [votedFeatures, setVotedFeatures] = useState([]);

  // Load voted features from localStorage on mount
  useEffect(() => {
    const storedVotes = localStorage.getItem("votedFeatures");
    if (storedVotes) {
      setVotedFeatures(JSON.parse(storedVotes));
    }
  }, []);

  const handleVote = (id) => {
    // Check if user has already voted on this feature
    if (votedFeatures.includes(id)) {
      toast.error("Already voted", {
        description: "You've already voted on this feature request.",
      });
      return;
    }

    // Update features with new vote count
    setFeatures(features.map(f => 
      f.id === id ? { ...f, votes: f.votes + 1 } : f
    ));

    // Add feature to voted list
    const newVotedFeatures = [...votedFeatures, id];
    setVotedFeatures(newVotedFeatures);
    
    // Save to localStorage
    localStorage.setItem("votedFeatures", JSON.stringify(newVotedFeatures));

    toast.success("Vote recorded!", {
      description: "Thank you for your feedback.",
    });
  };

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setDetailDialogOpen(true);
  };

  const hasVoted = (id) => votedFeatures.includes(id);

  const openFeatures = features.filter(f => f.status !== "Done");
  const doneFeatures = features.filter(f => f.status === "Done");

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Done":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderFeatureCard = (feature) => {
    const voted = hasVoted(feature.id);
    
    return (
      <Card 
        key={feature.id} 
        className="hover:shadow-md transition-shadow cursor-pointer py-[16px]"
        onClick={() => handleFeatureClick(feature)}
      >
        <CardContent className="px-4 py-0">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
              <Badge variant="outline" className={getStatusColor(feature.status)}>
                
                {feature.status}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-colors ${
                voted 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "hover:bg-zinc-100"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(feature.id);
              }}
            >
              <Triangle className={`h-4 w-4 ${voted ? "fill-current" : ""}`} />
              <span className="text-sm font-semibold">{feature.votes}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const displayedFeatures = filter === "open" ? openFeatures : doneFeatures;

  return (
    <>
      <div className="space-y-3">
        {displayedFeatures.length > 0 ? (
          displayedFeatures.map(renderFeatureCard)
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {filter === "open" ? "No open feature requests yet" : "No completed features yet"}
            </CardContent>
          </Card>
        )}

      </div>

      <FeatureDetailDialog
        feature={selectedFeature}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onVote={handleVote}
        hasVoted={selectedFeature ? hasVoted(selectedFeature.id) : false}
      />
    </>
  );
}

