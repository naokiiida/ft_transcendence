import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Quarter: Story = {
  args: {
    value: 25,
  },
};

export const Half: Story = {
  args: {
    value: 50,
  },
};

export const ThreeQuarters: Story = {
  args: {
    value: 75,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div>
        <span className="text-sm text-muted-foreground">0%</span>
        <Progress value={0} />
      </div>
      <div>
        <span className="text-sm text-muted-foreground">25%</span>
        <Progress value={25} />
      </div>
      <div>
        <span className="text-sm text-muted-foreground">50%</span>
        <Progress value={50} />
      </div>
      <div>
        <span className="text-sm text-muted-foreground">75%</span>
        <Progress value={75} />
      </div>
      <div>
        <span className="text-sm text-muted-foreground">100%</span>
        <Progress value={100} />
      </div>
    </div>
  ),
};
