import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";

interface SettingsTabProps {
  avatarUrl: string | null;
  avatarDisplayName: string;
  editDisplayName: string;
  profileSaving: boolean;
  profileError: string | null;
  profileSuccess: boolean;
  onDisplayNameChange: (value: string) => void;
  onSaveProfile: () => void;
  onTestUpdate: (payload: { result: "win" | "loss"; score_delta: number }) => void;
  onDeleteAccount: () => void;
  deletingAccount: boolean;
  onAvatarUploadSuccess: (payload: unknown) => void;
}

export function SettingsTab({
  avatarUrl,
  avatarDisplayName,
  editDisplayName,
  profileSaving,
  profileError,
  profileSuccess,
  onDisplayNameChange,
  onSaveProfile,
  onTestUpdate,
  onDeleteAccount,
  deletingAccount,
  onAvatarUploadSuccess,
}: SettingsTabProps) {
  const canSave = Boolean(editDisplayName.trim()) && !profileSaving;

  return (
    <TabsContent value="settings">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              displayName={avatarDisplayName}
              onUploadSuccess={onAvatarUploadSuccess}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              placeholder="Player42"
              value={editDisplayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
            />
          </div>
          <Button type="button" onClick={onSaveProfile} disabled={!canSave}>
            {profileSaving ? "保存中..." : "保存する"}
          </Button>
          {profileError ? (
            <p className="text-sm text-destructive">{profileError}</p>
          ) : null}
          {profileSuccess ? (
            <p className="text-sm text-green-600">プロフィールを更新しました</p>
          ) : null}
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold">テスト用更新</p>
            <p className="text-xs text-muted-foreground">
              勝利/敗北/スコアを一時的に更新します。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onTestUpdate({ result: "win", score_delta: 25 })}
              >
                勝利 (+25)
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onTestUpdate({ result: "loss", score_delta: 25 })}
              >
                敗北 (-25)
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">
                アカウント閉鎖
              </p>
              <p className="text-xs text-muted-foreground">
                この操作は取り消せません。プロフィールと戦績が削除されます。
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="mt-3 w-full">
                  アカウントを閉鎖する
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>アカウントを閉鎖しますか？</DialogTitle>
                  <DialogDescription>
                    閉鎖するとプロフィールと戦績は復元できません。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">キャンセル</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={onDeleteAccount}
                    disabled={deletingAccount}
                  >
                    閉鎖を確定する
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
