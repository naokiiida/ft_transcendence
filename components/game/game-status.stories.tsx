import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameStatus } from "./game-status";

const meta: Meta<typeof GameStatus> = {
  title: "Game/GameStatus",
  component: GameStatus,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative h-96 w-full bg-card rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = {
  args: {
    state: "waiting",
  },
};

export const WaitingWithMessage: Story = {
  args: {
    state: "waiting",
    message: "Searching for opponent...",
  },
};

export const Countdown3: Story = {
  args: {
    state: "countdown",
    countdown: 3,
  },
};

export const Countdown2: Story = {
  args: {
    state: "countdown",
    countdown: 2,
  },
};

export const Countdown1: Story = {
  args: {
    state: "countdown",
    countdown: 1,
  },
};

export const Playing: Story = {
  args: {
    state: "playing",
  },
  decorators: [
    (Story) => (
      <div className="relative h-96 w-full bg-card rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">
          (No overlay when playing - game is visible)
        </p>
        <Story />
      </div>
    ),
  ],
};

export const Paused: Story = {
  args: {
    state: "paused",
    message: "Player2 has disconnected. Waiting for reconnection...",
    reconnectProgress: 65,
  },
};

export const PausedNoProgress: Story = {
  args: {
    state: "paused",
    message: "Game paused",
  },
};

export const Disconnected: Story = {
  args: {
    state: "disconnected",
    message: "Your opponent has left the game. You win!",
  },
};

export const FinishedWithWinner: Story = {
  args: {
    state: "finished",
    winner: "Player1",
  },
};

export const FinishedGameOver: Story = {
  args: {
    state: "finished",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="waiting" />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="countdown" countdown={3} />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="paused" reconnectProgress={50} />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="finished" winner="Champion" />
      </div>
    </div>
  ),
  decorators: [],
};
