import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground">
          Make changes to your account here.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground">
          Change your password here.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithCards: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you&apos;re done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Player One" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@player1" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you&apos;ll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-4">
        <h3 className="font-semibold">Player Overview</h3>
        <p className="text-sm text-muted-foreground">
          View your profile summary and recent activity.
        </p>
      </TabsContent>
      <TabsContent value="stats" className="p-4">
        <h3 className="font-semibold">Statistics</h3>
        <p className="text-sm text-muted-foreground">
          Detailed game statistics and performance metrics.
        </p>
      </TabsContent>
      <TabsContent value="history" className="p-4">
        <h3 className="font-semibold">Match History</h3>
        <p className="text-sm text-muted-foreground">
          View your past matches and results.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const GameTabs: Story = {
  render: () => (
    <Tabs defaultValue="ranked" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ranked">Ranked</TabsTrigger>
        <TabsTrigger value="casual">Casual</TabsTrigger>
      </TabsList>
      <TabsContent value="ranked" className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="font-semibold text-primary">Ranked Match</h4>
          <p className="text-sm text-muted-foreground">
            Compete for ELO rating points
          </p>
          <Button className="mt-4 w-full">Find Match</Button>
        </div>
      </TabsContent>
      <TabsContent value="casual" className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="font-semibold text-secondary">Casual Match</h4>
          <p className="text-sm text-muted-foreground">
            Play for fun without affecting your rating
          </p>
          <Button variant="secondary" className="mt-4 w-full">Play Now</Button>
        </div>
      </TabsContent>
    </Tabs>
  ),
};
