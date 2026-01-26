import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScoreBoard } from "./score-board";

const meta: Meta<typeof ScoreBoard> = {
  title: "Game/ScoreBoard",
  component: ScoreBoard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトのスコアボード（0-0）
 */
export const デフォルト: Story = {
  args: {
    player1: { name: "プレイヤー1", score: 0 },
    player2: { name: "プレイヤー2", score: 0 },
  },
};

/**
 * 試合中のスコア表示
 */
export const 試合中: Story = {
  args: {
    player1: { name: "田中", score: 5 },
    player2: { name: "鈴木", score: 3 },
  },
};

/**
 * 接戦のスコア表示
 */
export const 接戦: Story = {
  args: {
    player1: { name: "佐藤", score: 10 },
    player2: { name: "高橋", score: 9 },
  },
};

/**
 * 大差がついた試合
 */
export const 大差: Story = {
  args: {
    player1: { name: "チャンピオン", score: 11 },
    player2: { name: "新人", score: 2 },
  },
};

/**
 * マッチポイント（同点）
 */
export const マッチポイント: Story = {
  args: {
    player1: { name: "プレイヤー1", score: 10 },
    player2: { name: "プレイヤー2", score: 10 },
  },
};

/**
 * 試合終了後のスコア
 */
export const 試合終了: Story = {
  args: {
    player1: { name: "勝者", score: 11 },
    player2: { name: "準優勝", score: 8 },
  },
};

/**
 * 長い名前のプレイヤー表示
 */
export const 長い名前: Story = {
  args: {
    player1: { name: "とても長いプレイヤー名", score: 7 },
    player2: { name: "別の長い名前のプレイヤー", score: 4 },
  },
};
