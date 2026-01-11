import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 画像付きアバター
 */
export const 画像付き: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="ユーザー" />
      <AvatarFallback>田中</AvatarFallback>
    </Avatar>
  ),
};

/**
 * フォールバック表示（画像なし）
 */
export const フォールバック: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.jpg" alt="ユーザー" />
      <AvatarFallback>山田</AvatarFallback>
    </Avatar>
  ),
};

/**
 * サイズバリエーション
 */
export const サイズ: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback>小</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>中</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14">
        <AvatarFallback>大</AvatarFallback>
      </Avatar>
      <Avatar className="h-20 w-20">
        <AvatarFallback>特大</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/**
 * グループ表示
 */
export const グループ: Story = {
  render: () => (
    <div className="flex -space-x-4">
      <Avatar className="border-2 border-background">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>B</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>C</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  ),
};
