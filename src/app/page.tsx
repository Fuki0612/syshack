import Image from 'next/image';

export default async function Home() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return <div>APIキーが設定されていません</div>;
  }
  
  // chart=mostPopular で急上昇動画を取得（地域は日本）
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=snippet,statistics&chart=mostPopular&regionCode=JP&maxResults=4&videoCategoryId=0`,
    { next: { revalidate: 60 } }
  );
  
  if (!res.ok) {
    const errorText = await res.text(); // 追加: エラーメッセージを取得
    return <div>動画情報を取得できませんでした: {errorText}</div>;
  }
  
  const data = await res.json();
  const videos = data.items;  

  if (!videos) {
    return <div>急上昇動画が見つかりませんでした</div>;
  }

  return (
    <div className="flex flex-col min-h-screen w-screen p-20 justify-center items-center">
      <div className="grid grid-cols-2 gap-5">
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
      </div>
    </div>
  );
}
// console.log("APIキー:", process.env.YOUTUBE_API_KEY);
