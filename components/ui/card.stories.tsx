import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトカード
 */
export const デフォルト: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>カードタイトル</CardTitle>
        <CardDescription>カードの説明文がここに入ります。</CardDescription>
      </CardHeader>
      <CardContent>
        <p>これはカードのコンテンツエリアです。</p>
      </CardContent>
      <CardFooter>
        <Button>アクション</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * シンプルなカード
 */
export const シンプル: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <p>シンプルなコンテンツのみのカード。</p>
    </Card>
  ),
};

/**
 * フッターなしカード
 */
export const フッターなし: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>通知</CardTitle>
        <CardDescription>3件の未読メッセージがあります。</CardDescription>
      </CardHeader>
      <CardContent>
        <p>新しい更新を確認してください。</p>
      </CardContent>
    </Card>
  ),
};

/**
 * アクションボタン付きカード
 */
export const アクション付き: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>プロジェクト作成</CardTitle>
        <CardDescription>ワンクリックで新しいプロジェクトをデプロイ。</CardDescription>
      </CardHeader>
      <CardContent>
        <p>ここでプロジェクトの設定を行います。</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">キャンセル</Button>
        <Button>デプロイ</Button>
      </CardFooter>
    </Card>
  ),
};
