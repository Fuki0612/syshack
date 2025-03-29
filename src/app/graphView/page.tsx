import CommentGraph from "./graph"
import GraphHeader from "./header";

export default async function graphView ({ searchParams }: {
  searchParams: { videoId?: string; base?: string };
}) {
  const params = await Promise.resolve(searchParams);
  // const [videos, setVideos] = useState([]);
  
  const videoId = params.videoId;
  if (!videoId) {
    return (
      <div className="flex flex-col min-h-screen w-screen h-100% pt-10">
        <h1 className="text-center text-3xl font-bold">Video ID が指定されていません</h1>
      </div>
    );
  }
  
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!API_KEY) {
    return (
      <div className="flex flex-col min-h-screen w-screen h-100% pt-10">
        <h1 className="text-center text-3xl font-bold">API キーが設定されていません</h1>
      </div>
    );
  }

  // 動画情報の取得
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoId}&part=snippet`,
    { next: { revalidate: 60 } }
  );
  if (!videoRes.ok) {
    return (
      <div className="flex flex-col min-h-screen w-screen h-100% pt-10">
        <h1 className="text-center text-3xl font-bold">動画情報の取得に失敗しました</h1>
      </div>
    );
  }

  const videoData = await videoRes.json();
  const videoTitle =
    videoData.items && videoData.items.length > 0
      ? videoData.items[0].snippet.title
      : "タイトル不明";

  // コメントの取得（人気順）
  const commentRes = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?key=${API_KEY}&textFormat=plainText&part=snippet&videoId=${videoId}&maxResults=50&order=relevance`,
    { next: { revalidate: 60 } }
  );

  if (!commentRes.ok) {
    return (
      <div className="flex flex-col min-h-screen w-screen h-100% pt-10">
        <h1 className="text-center text-3xl font-bold">コメントの取得に失敗しました</h1>
      </div>
    );
  }

  const commentData = await commentRes.json();

  interface CommentItem {
    snippet: {
      topLevelComment: {
        snippet: {
          textDisplay: string;
        };
      };
    };
  }

  const comments = commentData.items?.map(
    (item: CommentItem) => item.snippet.topLevelComment.snippet.textDisplay
  );

  // URL の query パラメーター（存在すれば）を取得
  const baseText = params.base || "";

  return (
    <div className="flex flex-col min-h-screen w-screen h-screen overflow-hidden pt-1">
      <GraphHeader videoTitle={videoTitle} />
      <div className="w-100vw flex right-0 left-0 mx-auto">
        <div className="w-[30vw] h-full m-0 p-0">
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="w-[70vw] h-full m-0 p-0">
          <CommentGraph comments={comments} baseText={baseText} />
        </div>
      </div>
    </div>
  );
}