import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Section Title</h4>
        <p className="text-sm text-muted-foreground">
          Description for this section.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Another Section</h4>
        <p className="text-sm text-muted-foreground">
          More content below the separator.
        </p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Home</div>
      <Separator orientation="vertical" />
      <div>Profile</div>
      <Separator orientation="vertical" />
      <div>Settings</div>
    </div>
  ),
};

export const InNavigation: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <span className="font-semibold">PONG.42</span>
      <Separator orientation="vertical" className="h-6" />
      <nav className="flex gap-4 text-sm text-muted-foreground">
        <a href="#">Play</a>
        <a href="#">Leaderboard</a>
        <a href="#">Profile</a>
      </nav>
    </div>
  ),
};
