"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string;
  onUploadSuccess: (updatedUser: unknown) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  onUploadSuccess,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await fetch(`${API_BASE}/api/me/avatar`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = (await response.json().catch(() => null)) as unknown;
        if (!response.ok) {
          const message =
            (data as { message?: string } | null)?.message ??
            "アバターのアップロードに失敗しました";
          throw new Error(message);
        }
        onUploadSuccess(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "アバターのアップロードに失敗しました";
        setError(message);
      } finally {
        setUploading(false);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
    },
    [onUploadSuccess],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        setError("ファイルサイズは2MB以下にしてください");
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("対応する画像形式: JPG, PNG, GIF, WebP");
        return;
      }

      setError(null);
      setPreviewUrl(URL.createObjectURL(file));
      void uploadFile(file);
    },
    [uploadFile],
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displaySrc = previewUrl ?? currentAvatarUrl ?? undefined;
  const initial = displayName?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="group relative cursor-pointer"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        role="button"
        tabIndex={0}
      >
        <Avatar className="h-24 w-24">
          {displaySrc ? (
            <AvatarImage src={displaySrc} alt={displayName} />
          ) : null}
          <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-medium text-white">
            {uploading ? "送信中..." : "変更"}
          </span>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={uploading}
      >
        {uploading ? "アップロード中..." : "アバターを変更"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
