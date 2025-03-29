"use client"

import Image from 'next/image';
import { zenkakugothicnew } from "../font";
import { useState, useEffect } from 'react';
import { IoSearchOutline } from "react-icons/io5";
import { IconContext } from 'react-icons'

export default function Home() {
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const [loading, setLoading] = useState<boolean>(true);
  const [videos, setVideos] = useState([]);
  const [now, setNow] = useState('急上昇');
  const [vidorsea, setVidorsea] = useState<string>('videos')
  const [cat, setCat] = useState<string>('chart=mostPopular&videoCategoryId=0');
  const [searchParams, setSearchParams] = useState<string>('');
  const handleClick = (category: string) => {
    switch (category) {
      case '急上昇':
        setCat('chart=mostPopular&videoCategoryId=0');
        setNow('急上昇');
        setVidorsea('videos');
        break;
      case 'スポーツ':
        setCat('chart=mostPopular&videoCategoryId=17');
        setNow('スポーツ');
        setVidorsea('videos');
        break;
      case '音楽':
        setCat('chart=mostPopular&videoCategoryId=10');
        setNow('音楽');
        setVidorsea('videos');
        break;
      case 'ゲーム':
        setCat('chart=mostPopular&videoCategoryId=20');
        setNow('ゲーム');
        setVidorsea('videos');
        break;
      case '':
        break;
      default:
        setCat(`q=${searchParams}`);
        setNow('other');
        setVidorsea('search');
        break;
    }
  }

  useEffect(() => {
    const getData = async () => {
      setLoading(true)

      if (!API_KEY) {
        return <div>APIキーが設定されていません</div>    
      }
console.log("asdf");
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/${vidorsea}?key=${API_KEY}&part=snippet&type=video&regionCode=JP&maxResults=2&${cat}`,
        { next: { revalidate: 60 } }
      )

      if (!res.ok) {
        const errorText = await res.text(); // 追加: エラーメッセージを取得
        return <div>動画情報を取得できませんでした: {errorText}</div>;
      }
      
      const data = await res.json();
      setVideos(data.items);

      if (!videos) {
        return <div>急上昇動画が見つかりませんでした</div>;
      }

      setLoading(false)
    }
    getData()

  }, [cat])
  
  return (
    <div className={`${zenkakugothicnew.className} flex flex-col min-h-screen w-screen p-15 justify-center items-center bg-white`}>
      <div className="flex flex-col fixed top-0 z-50 bg-indigo-50/70 backdrop-blur-lg w-screen">
        <div className='flex mx-10 justify-between'>
          <div className='flex flex-col justify-center items-center'>
            <div className="w-full relative h-12 text-3xl text-center content-center font-bold">
              {/* <Image
                alt="logo"
                src="/button_channel_touroku.png"
                layout="fill"
                objectFit="cover"
              /> */}
              Youtube
            </div>
            <div className="flex flex-row gap-2 content-center h-10 p-1.5 pl-6 top-12">
              <button className={`px-2 py-1 text-sm text-white rounded-lg hover:bg-indigo-400 hover:cursor-pointer ${now == '急上昇' ? 'bg-indigo-500 hover:bg-indigo-500' : 'bg-indigo-300'}`} onClick={() => handleClick('急上昇')}>急上昇</button>
              <button className={`px-2 py-1 text-sm text-white rounded-lg hover:bg-indigo-400 hover:cursor-pointer ${now == 'スポーツ' ? 'bg-indigo-500 hover:bg-indigo-500' : 'bg-indigo-300'}`} onClick={() => handleClick('スポーツ')}>スポーツ</button>
              <button className={`px-2 py-1 text-sm text-white rounded-lg hover:bg-indigo-400 hover:cursor-pointer ${now == '音楽' ? 'bg-indigo-500 hover:bg-indigo-500' : 'bg-indigo-300'}`} onClick={() => handleClick('音楽')}>音楽</button>
              <button className={`px-2 py-1 text-sm text-white rounded-lg hover:bg-indigo-400 hover:cursor-pointer ${now == 'ゲーム' ? 'bg-indigo-500 hover:bg-indigo-500' : 'bg-indigo-300'}`} onClick={() => handleClick('ゲーム')}>ゲーム</button>
            </div>
          </div>
          <form className="flex my-auto gap-3 w-[30%]" action={() => handleClick(searchParams)}>
            <input
              type="search"
              name="q"
              value={searchParams}
              onChange={(e) => {setSearchParams(e.target.value)}}
              placeholder="search"
              className=" w-full h-10 px-4 placeholder:text-indigo-300 rounded-full bg-white/70 border-1 shadow-xs shadow-indigo-300/50 border-indigo-300 focus:border-indigo-500 focus:outline-none"
            />
            <IconContext.Provider value={{ color: 'oklch(0.585 0.233 277.117)'}}>
              <button type="submit" onClick={() => handleClick(searchParams)} className="flex justify-center items-center h-10 w-14 rounded-full bg-white/70 border-1 shadow-xs shadow-indigo-300/50 border-indigo-300 focus:border-indigo-500 focus:outline-none hover:cursor-pointer"><IoSearchOutline /></button>
            </IconContext.Provider>
          </form>
        </div>
      </div>
      {loading ?
      <div className="flex justify-center">
      <div
        className="w-20 h-20 rounded-full border-10 border-indigo-300 animate-spin"
        style={{ borderTopColor: 'transparent' }}
      />
    </div>
      :
      <div className="grid grid-cols-2 gap-5 pt-10">
        {videos.map((video: { id: string; snippet: { title: string; channelTitle: string; thumbnails: { high: { url: string } } } }) => (
          <div key={video.id} className="flex flex-col items-center gap-2">
            {/* サムネイル */}
            <div style={{ width: "100%", position: "relative", paddingBottom: "56.25%" }}>
              <Image
                alt={video.snippet.title}
                src={video.snippet.thumbnails.high.url}
                layout="fill"
                objectFit="cover"
                className="rounded-lg shadow-lg"
              />
            </div>
            {/* タイトル */}
            <p className="text-2xl font-bold text-center">{video.snippet.title}</p>
            {/* チャンネル名 */}
            <p className="text-lg text-gray-600">チャンネル: {video.snippet.channelTitle}</p>
          </div>
        ))}
      </div>}
    </div>
  );
}
// console.log("APIキー:", process.env.YOUTUBE_API_KEY);



// import Image from 'next/image';
// import { zenkakugothicnew } from "../font";

// export default async function Home() {
//   const API_KEY = process.env.YOUTUBE_API_KEY;
//   if (!API_KEY) {
//     return <div>APIキーが設定されていません</div>;
//   }

//   // chart=mostPopular で急上昇動画を取得（地域は日本）
//   const res = await fetch(
//     `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=snippet,statistics&chart=mostPopular&regionCode=JP&maxResults=4&videoCategoryId=0`,
//     { next: { revalidate: 60 } }
//   );
  
//   if (!res.ok) {
//     const errorText = await res.text(); // 追加: エラーメッセージを取得
//     return <div>動画情報を取得できませんでした: {errorText}</div>;
//   }
  
//   const data = await res.json();
//   const videos = data.items;  

//   if (!videos) {
//     return <div>急上昇動画が見つかりませんでした</div>;
//   }

//   return (
//     <div className={`${zenkakugothicnew.className} flex flex-col min-h-screen w-screen p-20 justify-center items-center bg-white`}>
//       <div className="flex flex-col fixed top-0 z-50 bg-indigo-50/70 backdrop-blur-lg w-screen">
//       <div className="grid grid-cols-[1fr_20fr_9fr] gap-4 h-12">
//         <div></div>
//         <div className="w-full relative h-12 text-3xl content-center font-bold">
//           {/* <Image
//             alt="logo"
//             src="/button_channel_touroku.png"
//             layout="fill"
//             objectFit="cover"
//           /> */}
//           Youtube
//         </div>
//         <div className="content-center relative w-full px-10">
//           <input
//             type="text"
//             placeholder="search"
//             className=" h-7 w-full pl-4 pr-4 placeholder:text-indigo-300 rounded-full bg-white/70 border-1 shadow-xs shadow-indigo-300/50 border-indigo-300 focus:border-indigo-500 focus:outline-none"
//           />
//         </div>
//       </div>
//       <div className="flex flex-row gap-2 content-center h-10 p-1.5 pl-6 top-12">
//         <button className="px-2 py-1 text-sm bg-indigo-300 text-white rounded-lg hover:bg-indigo-500">急上昇</button>
//         <button className="px-2 py-1 text-sm bg-indigo-300 text-white rounded-lg hover:bg-indigo-500">スポーツ</button>
//         <button className="px-2 py-1 text-sm bg-indigo-300 text-white rounded-lg hover:bg-indigo-500">音楽</button>
//         <button className="px-2 py-1 text-sm bg-indigo-300 text-white rounded-lg hover:bg-indigo-500">ゲーム</button>
//       </div>
//       </div>
//       <div className="grid grid-cols-2 gap-5 pt-10">
//         {videos.map((video: { id: string; snippet: { title: string; channelTitle: string; thumbnails: { high: { url: string } } } }) => (
//           <div key={video.id} className="flex flex-col items-center gap-2">
//             {/* サムネイル */}
//             <div style={{ width: "100%", position: "relative", paddingBottom: "56.25%" }}>
//               <Image
//                 alt={video.snippet.title}
//                 src={video.snippet.thumbnails.high.url}
//                 layout="fill"
//                 objectFit="cover"
//                 className="rounded-lg shadow-lg"
//               />
//             </div>
//             {/* タイトル */}
//             <p className="text-2xl font-bold text-center">{video.snippet.title}</p>
//             {/* チャンネル名 */}
//             <p className="text-lg text-gray-600">チャンネル: {video.snippet.channelTitle}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
// // console.log("APIキー:", process.env.YOUTUBE_API_KEY);
