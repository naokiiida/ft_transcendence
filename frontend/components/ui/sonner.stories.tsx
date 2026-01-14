import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toaster } from "./sonner";
import { Button } from "./button";
import { toast } from "sonner";

const meta: Meta<typeof Toaster> = {
  title: "UI/Sonner (Toast)",
  component: Toaster,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div>
        <Story />
        <Toaster />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast("This is a toast message")}>
      Show Toast
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.success("Match won! +25 ELO")}
    >
      Success Toast
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button
      variant="destructive"
      onClick={() => toast.error("Connection lost")}
    >
      Error Toast
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast("Game Invitation", {
          description: "Player2 wants to play with you",
        })
      }
    >
      Toast with Description
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast("New match found!", {
          description: "Player2 (1500 ELO)",
          action: {
            label: "Accept",
            onClick: () => console.log("Match accepted"),
          },
        })
      }
    >
      Toast with Action
    </Button>
  ),
};

export const PromiseToast: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const promise = new Promise((resolve) => setTimeout(resolve, 2000));
        toast.promise(promise, {
          loading: "Finding opponent...",
          success: "Match found!",
          error: "No opponents available",
        });
      }}
    >
      Promise Toast
    </Button>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast("Default toast")}>Default</Button>
      <Button variant="outline" onClick={() => toast.success("Success!")}>
        Success
      </Button>
      <Button variant="destructive" onClick={() => toast.error("Error!")}>
        Error
      </Button>
      <Button variant="secondary" onClick={() => toast.warning("Warning!")}>
        Warning
      </Button>
      <Button variant="ghost" onClick={() => toast.info("Info")}>
        Info
      </Button>
    </div>
  ),
};

export const GameNotifications: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast.success("Victory!", {
            description: "You won against Player2 (11-5)",
          })
        }
      >
        Win
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast.error("Defeat", {
            description: "You lost against Player3 (8-11)",
          })
        }
      >
        Loss
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast("Player2 is now online", {
            description: "Challenge them to a match!",
            action: {
              label: "Invite",
              onClick: () => console.log("Invited"),
            },
          })
        }
      >
        Friend Online
      </Button>
    </div>
  ),
};
