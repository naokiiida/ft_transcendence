import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "success", "warning"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトのアラート
 */
export const デフォルト: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>お知らせ</AlertTitle>
      <AlertDescription>
        これはデフォルトのアラートメッセージです。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * エラー（削除・危険）アラート
 */
export const エラー: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>エラー</AlertTitle>
      <AlertDescription>
        問題が発生しました。もう一度お試しください。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * 成功アラート
 */
export const 成功: Story = {
  render: () => (
    <Alert variant="success">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>成功</AlertTitle>
      <AlertDescription>
        変更が正常に保存されました。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * 警告アラート
 */
export const 警告: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>警告</AlertTitle>
      <AlertDescription>
        続行する前に入力内容をご確認ください。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * 全バリエーション一覧
 */
export const 全バリエーション: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>デフォルト</AlertTitle>
        <AlertDescription>デフォルトのアラートメッセージ。</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>エラーのアラートメッセージ。</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>成功</AlertTitle>
        <AlertDescription>成功のアラートメッセージ。</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>警告</AlertTitle>
        <AlertDescription>警告のアラートメッセージ。</AlertDescription>
      </Alert>
    </div>
  ),
};
