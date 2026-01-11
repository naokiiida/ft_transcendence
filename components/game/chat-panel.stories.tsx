import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatPanel } from "./chat-panel";

const meta: Meta<typeof ChatPanel> = {
  title: "Game/ChatPanel",
  component: ChatPanel,
  tags: ["autodocs"],
  args: {
    onSendMessage: (message: string) => console.log("Message sent:", message),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMessages = [
  {
    id: "1",
    userId: "user1",
    userName: "Player1",
    content: "Good luck!",
    timestamp: new Date(),
    isOwn: true,
  },
  {
    id: "2",
    userId: "user2",
    userName: "Player2",
    content: "You too! Let's have a good game",
    timestamp: new Date(),
    isOwn: false,
  },
  {
    id: "3",
    userId: "user1",
    userName: "Player1",
    content: "Nice shot!",
    timestamp: new Date(),
    isOwn: true,
  },
  {
    id: "4",
    userId: "user2",
    userName: "Player2",
    content: "Thanks! That was lucky haha",
    timestamp: new Date(),
    isOwn: false,
  },
];

export const Default: Story = {
  args: {
    messages: sampleMessages,
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
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

export const Disabled: Story = {
  args: {
    messages: sampleMessages,
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

export const ManyMessages: Story = {
  args: {
    messages: [
      ...sampleMessages,
      {
        id: "5",
        userId: "user1",
        userName: "Player1",
        content: "That was close!",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "6",
        userId: "user2",
        userName: "Player2",
        content: "Yeah, great rally!",
        timestamp: new Date(),
        isOwn: false,
      },
      {
        id: "7",
        userId: "user1",
        userName: "Player1",
        content: "One more point...",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "8",
        userId: "user2",
        userName: "Player2",
        content: "Match point!",
        timestamp: new Date(),
        isOwn: false,
      },
      {
        id: "9",
        userId: "user1",
        userName: "Player1",
        content: "GG!",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "10",
        userId: "user2",
        userName: "Player2",
        content: "Good game! Rematch?",
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

export const WithAvatars: Story = {
  args: {
    messages: [
      {
        id: "1",
        userId: "user1",
        userName: "Player1",
        userAvatar: "https://github.com/shadcn.png",
        content: "Ready?",
        timestamp: new Date(),
        isOwn: true,
      },
      {
        id: "2",
        userId: "user2",
        userName: "Player2",
        userAvatar: "https://github.com/vercel.png",
        content: "Let's go!",
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
