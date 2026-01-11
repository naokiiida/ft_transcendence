import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerCard } from "./player-card";

const meta: Meta<typeof PlayerCard> = {
  title: "Game/PlayerCard",
  component: PlayerCard,
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
    },
    elo: {
      control: "number",
    },
    wins: {
      control: "number",
    },
    losses: {
      control: "number",
    },
    isOnline: {
      control: "boolean",
    },
    isReady: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Player One",
    elo: 1200,
    wins: 10,
    losses: 5,
  },
};

export const Online: Story = {
  args: {
    name: "John Doe",
    elo: 1500,
    wins: 25,
    losses: 10,
    isOnline: true,
  },
};

export const Offline: Story = {
  args: {
    name: "Jane Smith",
    elo: 1350,
    wins: 15,
    losses: 8,
    isOnline: false,
  },
};

export const Ready: Story = {
  args: {
    name: "Ready Player",
    elo: 1400,
    wins: 20,
    losses: 12,
    isOnline: true,
    isReady: true,
  },
};

export const WithAvatar: Story = {
  args: {
    name: "Avatar User",
    avatarUrl: "https://github.com/shadcn.png",
    elo: 1600,
    wins: 30,
    losses: 15,
    isOnline: true,
  },
};

export const MinimalInfo: Story = {
  args: {
    name: "Guest",
  },
};

export const HighRanked: Story = {
  args: {
    name: "Champion",
    elo: 2100,
    wins: 100,
    losses: 20,
    isOnline: true,
    isReady: true,
  },
};

export const Comparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PlayerCard
        name="Player 1"
        elo={1500}
        wins={25}
        losses={10}
        isOnline={true}
        isReady={true}
      />
      <PlayerCard
        name="Player 2"
        elo={1450}
        wins={20}
        losses={15}
        isOnline={true}
        isReady={false}
      />
    </div>
  ),
};
