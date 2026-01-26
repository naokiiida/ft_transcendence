import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Separator } from "./separator";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `Player ${a.length - i}`
);

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Online Players</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-24 w-32 shrink-0 rounded-md bg-muted flex items-center justify-center"
          >
            <span className="text-sm text-muted-foreground">Item {i + 1}</span>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const ChatMessages: Story = {
  render: () => {
    const messages = [
      { user: "Player1", text: "Good game!" },
      { user: "Player2", text: "Thanks! You too!" },
      { user: "Player1", text: "Rematch?" },
      { user: "Player2", text: "Sure, let's go!" },
      { user: "Player1", text: "Nice shot!" },
      { user: "Player2", text: "Lucky one haha" },
      { user: "Player1", text: "Your serve is really fast" },
      { user: "Player2", text: "I've been practicing" },
      { user: "Player1", text: "It shows!" },
      { user: "Player2", text: "Thanks!" },
      { user: "Player1", text: "One more game?" },
      { user: "Player2", text: "Absolutely!" },
    ];

    return (
      <ScrollArea className="h-72 w-80 rounded-md border">
        <div className="p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-primary">{msg.user}</span>
              <span className="text-sm">{msg.text}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const Leaderboard: Story = {
  render: () => {
    const players = Array.from({ length: 30 }).map((_, i) => ({
      rank: i + 1,
      name: `Player${i + 1}`,
      elo: 2000 - i * 25,
    }));

    return (
      <ScrollArea className="h-80 w-64 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Leaderboard</h4>
          {players.map((player) => (
            <div key={player.rank} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="w-6 text-sm font-mono text-muted-foreground">
                  #{player.rank}
                </span>
                <span className="text-sm">{player.name}</span>
              </div>
              <span className="text-sm font-mono text-primary">{player.elo}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
};
