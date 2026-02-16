import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameStatus } from "./game-status";

const meta: Meta<typeof GameStatus> = {
  title: "Game/GameStatus",
  component: GameStatus,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative h-96 w-full bg-card rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 待機中状態
 */
export const 待機中: Story = {
  args: {
    state: "waiting",
  },
};

/**
 * 待機中（メッセージ付き）
 */
export const 待機中メッセージ付き: Story = {
  args: {
    state: "waiting",
    message: "対戦相手を検索中...",
  },
};

/**
 * マッチング成立
 */
export const マッチング成立: Story = {
  args: {
    state: "matched",
    message: "対戦相手が見つかりました。",
  },
};

/**
 * カウントダウン3秒
 */
export const カウントダウン3: Story = {
  args: {
    state: "countdown",
    countdown: 3,
  },
};

/**
 * カウントダウン2秒
 */
export const カウントダウン2: Story = {
  args: {
    state: "countdown",
    countdown: 2,
  },
};

/**
 * カウントダウン1秒
 */
export const カウントダウン1: Story = {
  args: {
    state: "countdown",
    countdown: 1,
  },
};

/**
 * プレイ中（オーバーレイなし）
 */
export const プレイ中: Story = {
  args: {
    state: "playing",
  },
  decorators: [
    (Story) => (
      <div className="relative h-96 w-full bg-card rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">
          （プレイ中はオーバーレイなし - ゲーム画面が表示される）
        </p>
        <Story />
      </div>
    ),
  ],
};

/**
 * 一時停止中（再接続待ち）
 */
export const 一時停止中: Story = {
  args: {
    state: "paused",
    message: "相手プレイヤーが切断しました。再接続を待っています...",
    reconnectProgress: 65,
  },
};

/**
 * 一時停止中（進捗バーなし）
 */
export const 一時停止中進捗なし: Story = {
  args: {
    state: "paused",
    message: "ゲームを一時停止中",
  },
};

/**
 * 切断状態
 */
export const 切断: Story = {
  args: {
    state: "disconnected",
    message: "対戦相手が退出しました。あなたの勝利です！",
  },
};

/**
 * 終了（勝者あり）
 */
export const 終了勝者あり: Story = {
  args: {
    state: "finished",
    winner: "プレイヤー1",
  },
};

/**
 * 終了（ゲームオーバー）
 */
export const 終了ゲームオーバー: Story = {
  args: {
    state: "finished",
  },
};

/**
 * 全状態一覧表示
 */
export const 全状態一覧: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="waiting" />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="matched" message="対戦相手が見つかりました。" />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="countdown" countdown={3} />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="paused" reconnectProgress={50} />
      </div>
      <div className="relative h-48 bg-card rounded-lg">
        <GameStatus state="finished" winner="チャンピオン" />
      </div>
    </div>
  ),
  decorators: [],
};
