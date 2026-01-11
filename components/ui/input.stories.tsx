import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト入力欄
 */
export const デフォルト: Story = {
  args: {
    type: "text",
    placeholder: "テキストを入力...",
  },
};

/**
 * メールアドレス入力
 */
export const メール: Story = {
  args: {
    type: "email",
    placeholder: "example@mail.com",
  },
};

/**
 * パスワード入力
 */
export const パスワード: Story = {
  args: {
    type: "password",
    placeholder: "パスワードを入力",
  },
};

/**
 * 無効状態
 */
export const 無効: Story = {
  args: {
    disabled: true,
    placeholder: "無効な入力欄",
  },
};

/**
 * ラベル付き入力欄
 */
export const ラベル付き: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">メールアドレス</Label>
      <Input type="email" id="email" placeholder="メールアドレス" />
    </div>
  ),
};

/**
 * 初期値付き入力欄
 */
export const 初期値付き: Story = {
  args: {
    defaultValue: "デフォルト値",
  },
};

/**
 * 検索入力欄
 */
export const 検索: Story = {
  args: {
    type: "search",
    placeholder: "検索...",
  },
};
