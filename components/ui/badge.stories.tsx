import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "success", "warning"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトバッジ
 */
export const デフォルト: Story = {
  args: {
    children: "バッジ",
    variant: "default",
  },
};

/**
 * セカンダリバッジ
 */
export const セカンダリ: Story = {
  args: {
    children: "セカンダリ",
    variant: "secondary",
  },
};

/**
 * エラー（削除・危険）バッジ
 */
export const エラー: Story = {
  args: {
    children: "エラー",
    variant: "destructive",
  },
};

/**
 * アウトラインバッジ
 */
export const アウトライン: Story = {
  args: {
    children: "アウトライン",
    variant: "outline",
  },
};

/**
 * 成功バッジ
 */
export const 成功: Story = {
  args: {
    children: "成功",
    variant: "success",
  },
};

/**
 * 警告バッジ
 */
export const 警告: Story = {
  args: {
    children: "警告",
    variant: "warning",
  },
};

/**
 * 全バリエーション一覧
 */
export const 全バリエーション: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">デフォルト</Badge>
      <Badge variant="secondary">セカンダリ</Badge>
      <Badge variant="destructive">エラー</Badge>
      <Badge variant="outline">アウトライン</Badge>
      <Badge variant="success">成功</Badge>
      <Badge variant="warning">警告</Badge>
    </div>
  ),
};
