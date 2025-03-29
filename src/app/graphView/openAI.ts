import OpenAI from "openai";
import { UMAP } from "umap-js";

// OpenAI APIのクライアントを作成
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// テキストのembedding(内容のベクトル化)を取得する関数
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: texts
  });
  return response.data.map(d => d.embedding);
}

// 2つのベクトルのコサイン類似度を計算する関数
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// クエリ(baseText)とテキストの類似度を計測する関数
async function measureTextSimilarity(query: string, texts: string[]): Promise<number[]> {
  const [queryEmbedding] = await getEmbeddings([query]);
  const textsEmbeddings = await getEmbeddings(texts);
  return textsEmbeddings.map(embedding => cosineSimilarity(queryEmbedding, embedding));
}

// テキストデータとクエリから、テキストの配置座標を計算する関数
export async function getData(texts: string[], query: string): Promise<number[][]> {
  if (query === "") {
      // クエリが空の場合は、単にembeddingを返す
      return getEmbeddings(texts);
  } else {
      const similarities = await measureTextSimilarity(query, texts);
      const groups = [
          { min: 0.8, max: 1.0, radius: 500, indices: [] as number[] },
          { min: 0.6, max: 0.8, radius: 800, indices: [] as number[] },
          { min: 0.4, max: 0.6, radius: 1100, indices: [] as number[] },
          { min: 0.2, max: 0.4, radius: 1400, indices: [] as number[] },
          { min: 0.0, max: 0.2, radius: 1700, indices: [] as number[] },
      ];
      similarities.forEach((sim, i) => {
          const group = groups.find(g => sim >= g.min && sim < g.max);
          if (group) {
              group.indices.push(i);
          }
      });
      // グループごとに同心円上に配置する
      if (groups[0].indices.length === 0 && groups[1].indices.length === 0 && groups[2].indices.length === 0 && groups[3].indices.length > 0) {
        groups[3].radius = 500;
        groups[4].radius = 800;
      }
      else if (groups[0].indices.length === 0 && groups[1].indices.length === 0 && groups[2].indices.length > 0) {
          groups[2].radius = 500;
          groups[3].radius = 800;
          groups[4].radius = 1100;
      }
      else if (groups[0].indices.length === 0 && groups[1].indices.length > 0) {
          groups[1].radius = 500;
          groups[2].radius = 800;
          groups[3].radius = 1100;
          groups[4].radius = 1400;
      }

      // 各グループごとに、同心円上にテキストボックスを配置
      // （同グループ内ではテキスト数に応じて角度を均等に割り振る）
      const coordinates: number[][] = new Array(texts.length);
      groups.forEach(group => {
          const count = group.indices.length;
          group.indices.forEach((idx, j) => {
              // 0～2π のうち均等な角度
              const angle = (2 * Math.PI * j) / count;
              coordinates[idx] = [group.radius * Math.cos(angle), group.radius * Math.sin(angle)];
          });
      });
      return coordinates;
  }
}

// UMAPを使ってベクトルを2次元に削減する関数
export function reduceDimensions(embeddings: number[][]): number[][] {
  const nNeighbors = Math.max(Math.min(embeddings.length - 1, 10), 1);
  const umap = new UMAP({ nComponents: 2, nNeighbors: nNeighbors, minDist: 0.1 });
  return umap.fit(embeddings);
}

// 2 次元データに対するシンプルな K-means クラスタリング
export function clusterEmbeddings(
  data: number[][],
  maxGroup: number,
  maxIterations = 400
): { assignments: number[]; centroids: number[][] } {
  // まず各ベクトルを正規化する（ユニットベクトル）
  const normalizedData = data.map(vec => {
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return norm === 0 ? vec : vec.map(v => v / norm);
  });
  const clusterCount = Math.min(maxGroup, data.length);

  const assignments: number[] = new Array(data.length).fill(-1);
  // 重複しないように、ランダムに初期セントロイド（正規化済み）を選択
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  while (centroids.length < clusterCount) {
    const idx = Math.floor(Math.random() * data.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      centroids.push([...normalizedData[idx]]);
    }
  }

  let iterations = 0;
  let changed = true;
  while (changed && iterations < maxIterations) {
    changed = false;
    // 割り当てステップ：各点を最も内積（コサイン類似度）が高いセントロイドに割り当てる
    for (let i = 0; i < normalizedData.length; i++) {
      let bestSimilarity = -Infinity;
      let bestCluster = -1;
      for (let j = 0; j < clusterCount; j++) {
        // 各ベクトルは正規化済みなので、内積がそのままコサイン類似度となる
        const dot = normalizedData[i].reduce((sum, val, d) => sum + val * centroids[j][d], 0);
        if (dot > bestSimilarity) {
          bestSimilarity = dot;
          bestCluster = j;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // 更新ステップ：各クラスタごとに平均ベクトルを計算してから再正規化する
    const newCentroids = new Array(clusterCount).fill(0).map(() => new Array(data[0].length).fill(0));
    const counts = new Array(clusterCount).fill(0);
    for (let i = 0; i < normalizedData.length; i++) {
      const cluster = assignments[i];
      counts[cluster]++;
      for (let d = 0; d < normalizedData[i].length; d++) {
        newCentroids[cluster][d] += normalizedData[i][d];
      }
    }
    for (let j = 0; j < clusterCount; j++) {
      if (counts[j] > 0) {
        for (let d = 0; d < newCentroids[j].length; d++) {
          newCentroids[j][d] /= counts[j];
        }
        // セントロイド再正規化
        const norm = Math.sqrt(newCentroids[j].reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
          for (let d = 0; d < newCentroids[j].length; d++) {
            newCentroids[j][d] /= norm;
          }
        }
        centroids[j] = newCentroids[j];
      }
    }
    iterations++;
  }
  return { assignments, centroids };
}
