"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DemoPage() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [switchChecked, setSwitchChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Shadcn UI Theme Demo</h1>
            <p className="text-muted-foreground">
              Showcasing the <Badge variant="secondary">radix-vega</Badge> preset with <Badge variant="outline">zinc</Badge> base color
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Separator />

        {/* Alerts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Alerts</h2>
          <Alert>
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert showing the theme colors in action.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Destructive Alert</AlertTitle>
            <AlertDescription>
              This is a destructive alert for error states.
            </AlertDescription>
          </Alert>
        </section>

        <Separator />

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🔥</Button>
          </div>
        </section>

        <Separator />

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Cards</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description with muted text</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This is the card content area. Notice the subtle background and border colors.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Action</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Your performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <Badge>1,234</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Now</span>
                  <Badge variant="secondary">89</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Featured Card</CardTitle>
                <CardDescription>With primary border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This card has a primary colored border to stand out.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </section>

        <Separator />

        {/* Form Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Form Inputs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Field</label>
              <Input placeholder="Enter some text..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Dropdown</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Textarea</label>
              <Textarea placeholder="Enter a longer message..." rows={3} />
            </div>
          </div>
        </section>

        <Separator />

        {/* Interactive Components */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Interactive Components</h2>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Enable Notifications</label>
                  <p className="text-sm text-muted-foreground">Receive updates about your account</p>
                </div>
                <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Volume</label>
                  <Badge variant="secondary">{sliderValue[0]}%</Badge>
                </div>
                <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Color Palette</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="h-20 w-full rounded-md bg-primary" />
                <CardTitle>Primary</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-20 w-full rounded-md bg-secondary" />
                <CardTitle>Secondary</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-20 w-full rounded-md bg-muted" />
                <CardTitle>Muted</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-20 w-full rounded-md bg-accent" />
                <CardTitle>Accent</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Custom Orange Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Custom Orange Palette</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-100" />
                <CardTitle className="text-sm">Orange 100</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-200" />
                <CardTitle className="text-sm">Orange 200</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-300" />
                <CardTitle className="text-sm">Orange 300</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-400" />
                <CardTitle className="text-sm">Orange 400</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-500" />
                <CardTitle className="text-sm">Orange 500</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-600" />
                <CardTitle className="text-sm">Orange 600</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-700" />
                <CardTitle className="text-sm">Orange 700</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-800" />
                <CardTitle className="text-sm">Orange 800</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-16 w-full rounded-md bg-orange-900" />
                <CardTitle className="text-sm">Orange 900</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="py-8 text-center text-sm text-muted-foreground">
          <p>Switch between light and dark mode to see the theme adaptation!</p>
        </div>
      </div>
    </div>
  );
}

