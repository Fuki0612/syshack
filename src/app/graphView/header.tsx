"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLocationArrow } from "react-icons/fa";

export default function GraphHeader({ videoTitle }: { videoTitle: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("base", query);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex h-[10vh] justify-center items-center p-0">
      <h1 className="text-center text-2xl font-bold">
        {videoTitle}
      </h1>
      <div className="content-center relative w-1/3 px-10 my-auto h-full">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="search"
          className=" h-1/3 w-full px-4 placeholder:text-indigo-300 rounded-full bg-white/70 border-1 shadow-xs shadow-indigo-300/50 border-indigo-300 focus:border-indigo-500 focus:outline-none"
        />
        <FaLocationArrow 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-500 hover:cursor-pointer"
          onClick={handleSearch}
        />
      </div>
    </div>
  )
}