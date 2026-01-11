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

/**
 * 水平セパレーター
 */
export const 水平: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">セクションタイトル</h4>
        <p className="text-sm text-muted-foreground">
          このセクションの説明文。
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">別のセクション</h4>
        <p className="text-sm text-muted-foreground">
          セパレーターの下にあるコンテンツ。
        </p>
      </div>
    </div>
  ),
};

/**
 * 垂直セパレーター
 */
export const 垂直: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>ホーム</div>
      <Separator orientation="vertical" />
      <div>プロフィール</div>
      <Separator orientation="vertical" />
      <div>設定</div>
    </div>
  ),
};

/**
 * ナビゲーション内での使用例
 */
export const ナビゲーション内: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <span className="font-semibold">PONG.42</span>
      <Separator orientation="vertical" className="h-6" />
      <nav className="flex gap-4 text-sm text-muted-foreground">
        <a href="#">プレイ</a>
        <a href="#">ランキング</a>
        <a href="#">プロフィール</a>
      </nav>
    </div>
  ),
};
