import Image from "next/image";
import Counter from "@/components/Counter";

export default function Home() {
  return (
    <div className="px-4 py-8 mx-auto min-h-screen">
      <div className="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <Image
          className="my-6 dark:invert"
          src="/next.svg"
          width={128}
          height={128}
          alt="Next.js logo"
          priority
        />
        <h1 className="text-4xl font-bold">Welcome to ft_transcendence</h1>
        <p className="my-4 text-muted-foreground">
          Now running on{" "}
          <code className="mx-2 bg-muted px-2 py-1 rounded">
            Next.js App Router
          </code>
        </p>
        <Counter />
      </div>
    </div>
  );
}
