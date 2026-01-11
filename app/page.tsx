import Image from "next/image";
import Counter from "@/components/Counter";

export default function Home() {
  return (
    <div className="px-4 py-8 mx-auto bg-gradient-to-br from-gray-900 to-black min-h-screen">
      <div className="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <Image
          className="my-6"
          src="/next.svg"
          width={128}
          height={128}
          alt="Next.js logo"
          priority
        />
        <h1 className="text-4xl font-bold text-white">Welcome to ft_transcendence</h1>
        <p className="my-4 text-gray-300">
          Now running on <code className="mx-2 bg-gray-800 px-2 py-1 rounded text-white">Next.js App Router</code>
        </p>
        <Counter />
      </div>
    </div>
  );
}
