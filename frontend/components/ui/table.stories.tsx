import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Badge } from "./badge";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent matches.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Match</TableHead>
          <TableHead>Player 1</TableHead>
          <TableHead>Player 2</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">#001</TableCell>
          <TableCell>Alice</TableCell>
          <TableCell>Bob</TableCell>
          <TableCell className="text-right">11 - 5</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">#002</TableCell>
          <TableCell>Charlie</TableCell>
          <TableCell>Diana</TableCell>
          <TableCell className="text-right">11 - 9</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">#003</TableCell>
          <TableCell>Eve</TableCell>
          <TableCell>Frank</TableCell>
          <TableCell className="text-right">11 - 3</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Leaderboard: Story = {
  render: () => {
    const players = [
      { rank: 1, name: "Champion", elo: 2150, wins: 45, losses: 5 },
      { rank: 2, name: "ProPlayer", elo: 2050, wins: 38, losses: 12 },
      { rank: 3, name: "GameMaster", elo: 1980, wins: 30, losses: 15 },
      { rank: 4, name: "PongKing", elo: 1920, wins: 28, losses: 18 },
      { rank: 5, name: "Ace", elo: 1875, wins: 25, losses: 20 },
    ];

    return (
      <Table>
        <TableCaption>Top 5 Players</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">ELO</TableHead>
            <TableHead className="text-right">W/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.rank}>
              <TableCell className="font-medium">#{player.rank}</TableCell>
              <TableCell>{player.name}</TableCell>
              <TableCell className="text-right font-mono text-primary">
                {player.elo}
              </TableCell>
              <TableCell className="text-right">
                <span className="text-green-500">{player.wins}</span>
                {" / "}
                <span className="text-red-500">{player.losses}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

export const MatchHistory: Story = {
  render: () => {
    const matches = [
      { id: 1, opponent: "Player2", result: "win", score: "11-5", date: "Today" },
      { id: 2, opponent: "Player3", result: "loss", score: "9-11", date: "Today" },
      { id: 3, opponent: "Player4", result: "win", score: "11-8", date: "Yesterday" },
      { id: 4, opponent: "Player5", result: "win", score: "11-3", date: "Yesterday" },
      { id: 5, opponent: "Player6", result: "loss", score: "7-11", date: "2 days ago" },
    ];

    return (
      <Table>
        <TableCaption>Your recent match history</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Opponent</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="font-medium">{match.opponent}</TableCell>
              <TableCell>
                <Badge variant={match.result === "win" ? "success" : "destructive"}>
                  {match.result.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">{match.score}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {match.date}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Win Rate</TableCell>
            <TableCell className="text-right font-semibold text-primary">60%</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  },
};

export const TournamentBracket: Story = {
  render: () => {
    const matches = [
      { round: "Quarter", player1: "Alice", player2: "Bob", winner: "Alice" },
      { round: "Quarter", player1: "Charlie", player2: "Diana", winner: "Diana" },
      { round: "Semi", player1: "Alice", player2: "Eve", winner: "Alice" },
      { round: "Final", player1: "Alice", player2: "Diana", winner: null },
    ];

    return (
      <Table>
        <TableCaption>Tournament Bracket</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Player 1</TableHead>
            <TableHead>Player 2</TableHead>
            <TableHead>Winner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge variant="outline">{match.round}</Badge>
              </TableCell>
              <TableCell className={match.winner === match.player1 ? "text-primary font-semibold" : ""}>
                {match.player1}
              </TableCell>
              <TableCell className={match.winner === match.player2 ? "text-primary font-semibold" : ""}>
                {match.player2}
              </TableCell>
              <TableCell>
                {match.winner ? (
                  <Badge variant="success">{match.winner}</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};
