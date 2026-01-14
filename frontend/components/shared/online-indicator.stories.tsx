import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OnlineIndicator } from "./online-indicator";

const meta: Meta<typeof OnlineIndicator> = {
  title: "Shared/OnlineIndicator",
  component: OnlineIndicator,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["online", "offline", "away", "in-game"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    showTooltip: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  args: {
    status: "online",
  },
};

export const Offline: Story = {
  args: {
    status: "offline",
  },
};

export const Away: Story = {
  args: {
    status: "away",
  },
};

export const InGame: Story = {
  args: {
    status: "in-game",
  },
};

export const Small: Story = {
  args: {
    status: "online",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    status: "online",
    size: "lg",
  },
};

export const WithoutTooltip: Story = {
  args: {
    status: "online",
    showTooltip: false,
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <OnlineIndicator status="online" showTooltip={false} />
        <span className="text-sm">Online</span>
      </div>
      <div className="flex items-center gap-2">
        <OnlineIndicator status="offline" showTooltip={false} />
        <span className="text-sm">Offline</span>
      </div>
      <div className="flex items-center gap-2">
        <OnlineIndicator status="away" showTooltip={false} />
        <span className="text-sm">Away</span>
      </div>
      <div className="flex items-center gap-2">
        <OnlineIndicator status="in-game" showTooltip={false} />
        <span className="text-sm">In Game</span>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <OnlineIndicator status="online" size="sm" showTooltip={false} />
        <span className="text-sm">Small</span>
      </div>
      <div className="flex items-center gap-2">
        <OnlineIndicator status="online" size="md" showTooltip={false} />
        <span className="text-sm">Medium</span>
      </div>
      <div className="flex items-center gap-2">
        <OnlineIndicator status="online" size="lg" showTooltip={false} />
        <span className="text-sm">Large</span>
      </div>
    </div>
  ),
};
