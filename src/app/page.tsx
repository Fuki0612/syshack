import Image from "next/image";

export default async function Home() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return <div>APIキーが設定されていません</div>;
  }
  
  // chart=mostPopular で急上昇動画を取得（地域は日本）
  // maxResults=1 に変更して、取得する動画数を1件に変更
  // videoCategoryId=0 に変更して、カテゴリを指定しないように変更
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=snippet,statistics&chart=mostPopular&regionCode=JP&maxResults=1&videoCategoryId=0`,
    { next: { revalidate: 60 } }
  );
  
  if (!res.ok) {
    return <div>動画情報を取得できませんでした</div>;
  }
  
  const data = await res.json();
  const videos = data.items; 
  console.log(videos[0]); // 1番目の動画情報をコンソールに表示. 実行中の画面でF12を押してコンソールを開くと確認できます

  return (
    <div className="flex flex-col min-h-screen w-screen h-100% pt-10 justify-center items-center gap-5">
      <div style={{ width: "30%", height: "30%", position: "relative" }}>
        <Image alt="0" src="https://picsum.photos/1600/900" width={1600} height={900} />
      </div>
      <p>ここにタイトル。</p>
      <p>ここにチャンネル名。</p>
    </div>
  );
}