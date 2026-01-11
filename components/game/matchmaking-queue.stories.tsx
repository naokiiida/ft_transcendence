import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchmakingQueue } from "./matchmaking-queue";

const meta: Meta<typeof MatchmakingQueue> = {
  title: "Game/MatchmakingQueue",
  component: MatchmakingQueue,
  tags: ["autodocs"],
  args: {
    onCancel: () => console.log("Cancel clicked"),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isSearching: true,
    queueTime: 0,
  },
};

export const WithQueueTime: Story = {
  args: {
    isSearching: true,
    queueTime: 45,
  },
};

export const LongWait: Story = {
  args: {
    isSearching: true,
    queueTime: 185,
  },
};

export const WithPlayersCount: Story = {
  args: {
    isSearching: true,
    queueTime: 30,
    playersInQueue: 12,
  },
};

export const HighActivity: Story = {
  args: {
    isSearching: true,
    queueTime: 5,
    playersInQueue: 48,
  },
};

export const LowActivity: Story = {
  args: {
    isSearching: true,
    queueTime: 120,
    playersInQueue: 3,
  },
};
