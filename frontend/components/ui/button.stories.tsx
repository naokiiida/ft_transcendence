import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトボタン
 */
export const デフォルト: Story = {
  args: {
    children: "ボタン",
    variant: "default",
  },
};

/**
 * 削除・危険ボタン
 */
export const 削除: Story = {
  args: {
    children: "削除",
    variant: "destructive",
  },
};

/**
 * アウトラインボタン
 */
export const アウトライン: Story = {
  args: {
    children: "アウトライン",
    variant: "outline",
  },
};

/**
 * セカンダリボタン
 */
export const セカンダリ: Story = {
  args: {
    children: "セカンダリ",
    variant: "secondary",
  },
};

/**
 * ゴーストボタン
 */
export const ゴースト: Story = {
  args: {
    children: "ゴースト",
    variant: "ghost",
  },
};

/**
 * リンクスタイルボタン
 */
export const リンク: Story = {
  args: {
    children: "リンク",
    variant: "link",
  },
};

/**
 * 小サイズボタン
 */
export const 小サイズ: Story = {
  args: {
    children: "小",
    size: "sm",
  },
};

/**
 * 大サイズボタン
 */
export const 大サイズ: Story = {
  args: {
    children: "大",
    size: "lg",
  },
};

/**
 * 無効状態ボタン
 */
export const 無効: Story = {
  args: {
    children: "無効",
    disabled: true,
  },
};

/**
 * 全バリエーション一覧
 */
export const 全バリエーション: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">デフォルト</Button>
      <Button variant="destructive">削除</Button>
      <Button variant="outline">アウトライン</Button>
      <Button variant="secondary">セカンダリ</Button>
      <Button variant="ghost">ゴースト</Button>
      <Button variant="link">リンク</Button>
    </div>
  ),
};

/**
 * 全サイズ一覧
 */
export const 全サイズ: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">小</Button>
      <Button size="default">中</Button>
      <Button size="lg">大</Button>
    </div>
  ),
};
