"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp } from "lucide-react";
import { FeatureDetailDialog } from "./feature-detail-dialog";

// Dummy data organized by status
const initialFeatures = {
  pending: [
    {
      id: 2,
      title: "This is a sample request",
      description: "Drag this around to update the status",
      votes: 4,
    },
    {
      id: 3,
      title: "This is another sample request",
      description: "You can delete this by clicking on the three dots on the right portion of this card",
      votes: 3,
    },
  ],
  approved: [
    {
      id: 4,
      title: "This is another sample request",
      description: "You can delete this by clicking on the three dots on the right portion of this card",
      votes: 2,
    },
  ],
  inProgress: [
    {
      id: 1,
      title: "This is an in-progress feature request",
      description: "Show your users that you listen and care for them",
      votes: 9,
    },
  ],
  done: [],
};

export function FeatureRoadmap() {
  const [features, setFeatures] = useState(initialFeatures);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const columns = [
    { id: "pending", title: "Pending 👀", count: features.pending.length },
    { id: "approved", title: "Approved 👍", count: features.approved.length },
    { id: "inProgress", title: "In Progress ⚒️", count: features.inProgress.length },
    { id: "done", title: "Done ✅", count: features.done.length },
  ];

  const handleFeatureClick = (feature, status) => {
    setSelectedFeature({ ...feature, status });
    setDetailDialogOpen(true);
  };

  const renderFeatureCard = (feature, status) => (
    <Card
      key={feature.id}
      className="cursor-pointer hover:shadow-md transition-shadow mb-3 p-[16px]"
      onClick={() => handleFeatureClick(feature, status)}
    >
      <CardContent className="px-0 flex flex-column items-start justify-between gap-[16px]">
        <div className="flex flex-col items-start justify-between gap-[8px]">
          <h4 className="font-medium text-sm flex-1">{feature.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
        </div>
        <div className="flex flex-col items-center">
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{feature.votes}</span>
          </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Roadmap</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by Votes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="secondary" className="rounded-full">
                {column.count}
              </Badge>
            </div>
            <div className="space-y-2">
              {features[column.id].length > 0 ? (
                features[column.id].map((feature) => renderFeatureCard(feature, column.id))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-xs text-muted-foreground">
                    No features
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>


      <FeatureDetailDialog
        feature={selectedFeature}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}

