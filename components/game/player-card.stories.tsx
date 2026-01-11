import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerCard } from "./player-card";

const meta: Meta<typeof PlayerCard> = {
  title: "Game/PlayerCard",
  component: PlayerCard,
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "プレイヤー名",
    },
    elo: {
      control: "number",
      description: "レーティングスコア",
    },
    wins: {
      control: "number",
      description: "勝利数",
    },
    losses: {
      control: "number",
      description: "敗北数",
    },
    isOnline: {
      control: "boolean",
      description: "オンライン状態",
    },
    isReady: {
      control: "boolean",
      description: "準備完了状態",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトのプレイヤーカード表示
 */
export const デフォルト: Story = {
  args: {
    name: "プレイヤー1",
    elo: 1200,
    wins: 10,
    losses: 5,
  },
};

/**
 * オンライン状態のプレイヤー
 */
export const オンライン: Story = {
  args: {
    name: "田中太郎",
    elo: 1500,
    wins: 25,
    losses: 10,
    isOnline: true,
  },
};

/**
 * オフライン状態のプレイヤー
 */
export const オフライン: Story = {
  args: {
    name: "山田花子",
    elo: 1350,
    wins: 15,
    losses: 8,
    isOnline: false,
  },
};

/**
 * 準備完了状態のプレイヤー
 */
export const 準備完了: Story = {
  args: {
    name: "準備中プレイヤー",
    elo: 1400,
    wins: 20,
    losses: 12,
    isOnline: true,
    isReady: true,
  },
};

/**
 * アバター画像付きのプレイヤーカード
 */
export const アバター付き: Story = {
  args: {
    name: "アバターユーザー",
    avatarUrl: "https://github.com/shadcn.png",
    elo: 1600,
    wins: 30,
    losses: 15,
    isOnline: true,
  },
};

/**
 * 最小限の情報のみ表示
 */
export const 最小情報: Story = {
  args: {
    name: "ゲスト",
  },
};

/**
 * 高ランクプレイヤー
 */
export const 高ランク: Story = {
  args: {
    name: "チャンピオン",
    elo: 2100,
    wins: 100,
    losses: 20,
    isOnline: true,
    isReady: true,
  },
};

/**
 * プレイヤーカードの比較表示
 */
export const 比較表示: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PlayerCard
        name="プレイヤー1"
        elo={1500}
        wins={25}
        losses={10}
        isOnline={true}
        isReady={true}
      />
      <PlayerCard
        name="プレイヤー2"
        elo={1450}
        wins={20}
        losses={15}
        isOnline={true}
        isReady={false}
      />
    </div>
  ),
};
