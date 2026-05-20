"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { ChevronRight, ChevronLeft, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_BRAND_COLOR_HEX } from "@/components/brand-color-field";
import { PortalBrandPreview } from "@/components/create-project/portal-brand-preview";

export function CreateProjectStep3({ formData, updateFormData, nextStep, prevStep, className, ...props }) {
  const [projectLogo, setProjectLogo] = useState(formData.projectLogo || "");
  const [brandColor, setBrandColor] = useState(
    formData.brandColor?.trim() || DEFAULT_BRAND_COLOR_HEX
  );
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setProjectLogo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({
      projectLogo,
      brandColor,
    });
    nextStep();
  };

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
      {...props}
    >
      <form onSubmit={handleNext}>
        <FieldGroup className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-primary font-semibold uppercase">
              Step 3 of 5
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">Project Branding</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Customize how this project appears for the client in client portal.
            </p>
          </div>

          <div className="space-y-6">
            {/* Project Logo */}
            <Field>
              <FieldLabel htmlFor="projectLogo">
                Project Logo (optional)
              </FieldLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                  {projectLogo ? (
                    <>
                      <img src={projectLogo} alt="Logo" className="h-full w-full object-cover rounded-lg p-2" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-[-12px] right-[-12px] z-10 h-5 w-5 rounded-full bg-zinc-100 border text-destructive-foreground flex items-center justify-center hover:bg-zinc-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
                  {projectLogo ? "Change Logo" : "Upload Logo"}
                </Button>
              </div>
              <FieldDescription>
                This will be displayed on the client portal and communications. Max 5MB.
              </FieldDescription>
            </Field>

            {/* Brand Color */}
            <Field>
              <FieldLabel htmlFor="brandColor">
                Brand Color (optional)
              </FieldLabel>
              <div className="flex items-center gap-4">
                <Input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder={DEFAULT_BRAND_COLOR_HEX}
                  className="flex-1"
                />
              </div>
              <FieldDescription>
                Customize the accent color for this project.
              </FieldDescription>
            </Field>

            <PortalBrandPreview
              brandColor={brandColor}
              projectLogo={projectLogo}
              projectName={formData.projectName}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => { updateFormData({ projectLogo: "", brandColor: DEFAULT_BRAND_COLOR_HEX }); nextStep(); }}>
              Skip
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button type="submit" className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}

