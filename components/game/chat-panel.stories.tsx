import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatPanel } from "./chat-panel";

const meta: Meta<typeof ChatPanel> = {
  title: "Game/ChatPanel",
  component: ChatPanel,
  tags: ["autodocs"],
  args: {
    onSendMessage: (message: string) => console.log("メッセージ送信:", message),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const サンプルメッセージ = [
  {
    id: "1",
    userId: "user1",
    userName: "プレイヤー1",
    content: "よろしくお願いします！",
    timestamp: new Date(),
    isOwn: true,
  },
  {
    id: "2",
    userId: "user2",
    userName: "プレイヤー2",
    content: "こちらこそ！良い試合にしましょう",
    timestamp: new Date(),
    isOwn: false,
  },
  {
    id: "3",
    userId: "user1",
    userName: "プレイヤー1",
    content: "ナイスショット！",
    timestamp: new Date(),
    isOwn: true,
  },
  {
    id: "4",
    userId: "user2",
    userName: "プレイヤー2",
    content: "ありがとう！ラッキーでした笑",
    timestamp: new Date(),
    isOwn: false,
  },
];

/**
 * デフォルトのチャットパネル
 */
export const デフォルト: Story = {
  args: {
    messages: サンプルメッセージ,
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * メッセージなし（空状態）
 */
export const 空: Story = {
  args: {
    messages: [],
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * 入力無効状態
 */
export const 無効: Story = {
  args: {
    messages: サンプルメッセージ,
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * 多くのメッセージがある状態
 */
export const メッセージ多数: Story = {
  args: {
    messages: [
      ...サンプルメッセージ,
      {
        id: "5",
        userId: "user1",
        userName: "プレイヤー1",
        content: "惜しかった！",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "6",
        userId: "user2",
        userName: "プレイヤー2",
        content: "いいラリーでしたね！",
        timestamp: new Date(),
        isOwn: false,
      },
      {
        id: "7",
        userId: "user1",
        userName: "プレイヤー1",
        content: "あと1点...",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "8",
        userId: "user2",
        userName: "プレイヤー2",
        content: "マッチポイント！",
        timestamp: new Date(),
        isOwn: false,
      },
      {
        id: "9",
        userId: "user1",
        userName: "プレイヤー1",
        content: "GG！",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "10",
        userId: "user2",
        userName: "プレイヤー2",
        content: "いい試合でした！再戦する？",
        timestamp: new Date(),
        isOwn: false,
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * アバター付きのチャット
 */
export const アバター付き: Story = {
  args: {
    messages: [
      {
        id: "1",
        userId: "user1",
        userName: "プレイヤー1",
        userAvatar: "https://github.com/shadcn.png",
        content: "準備OK？",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "2",
        userId: "user2",
        userName: "プレイヤー2",
        userAvatar: "https://github.com/vercel.png",
        content: "行くよ！",
        timestamp: new Date(),
        isOwn: false,
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
};
