import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScoreBoard } from "./score-board";

const meta: Meta<typeof ScoreBoard> = {
  title: "Game/ScoreBoard",
  component: ScoreBoard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    player1: { name: "Player 1", score: 0 },
    player2: { name: "Player 2", score: 0 },
  },
};

export const InProgress: Story = {
  args: {
    player1: { name: "Alice", score: 5 },
    player2: { name: "Bob", score: 3 },
  },
};

export const CloseGame: Story = {
  args: {
    player1: { name: "John", score: 10 },
    player2: { name: "Jane", score: 9 },
  },
};

export const Blowout: Story = {
  args: {
    player1: { name: "Champion", score: 11 },
    player2: { name: "Newcomer", score: 2 },
  },
};

export const MatchPoint: Story = {
  args: {
    player1: { name: "Player 1", score: 10 },
    player2: { name: "Player 2", score: 10 },
  },
};

export const GameOver: Story = {
  args: {
    player1: { name: "Winner", score: 11 },
    player2: { name: "Runner-up", score: 8 },
  },
};

export const LongNames: Story = {
  args: {
    player1: { name: "VeryLongPlayerName", score: 7 },
    player2: { name: "AnotherLongName", score: 4 },
  },
};
