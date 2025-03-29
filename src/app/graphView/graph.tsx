"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { reduceDimensions, clusterEmbeddings, getData } from "./openAI";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  commentX: number;
  commentY: number;
  commentText: string;
  clusterId: string;
};

export default function CommentGraph({ comments, baseText }: { comments: string[]; baseText: string }) {
  const coordinateMultiplier = 400; // 座標の倍率
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null); // ドラッグ開始位置
  const [reducedData, setReducedData] = useState<number[][] | null>(null); // 次元削減後のデータ
  const [center, setCenter] = useState({ x: 0, y: 0 }); // 中心座標
  const [placedBoxes, setPlacedBoxes] = useState<Box[]>([]); // テキストボックスの配置
  const [fontSize, setFontSize] = useState(14); // フォントサイズ
  const [linkThreshold, setLinkThreshold] = useState(400);
  const [expandedComment, setExpandedComment] = useState<string | null>(null); // 追加：展開するコメント
  const dragHasMoved = useRef(false);
  let zoomScale = 1; // ズーム倍率

  useEffect(() => {
    async function fetchAndProcessData() {
      const embeddings = await getData(comments, baseText);
      const reduced = reduceDimensions(embeddings);
      if (reduced && reduced.length > 0) {
        const originalXs = reduced.map(d => d[0]);
        const originalYs = reduced.map(d => d[1]);
        const originalMinX = Math.min(...originalXs);
        const originalMaxX = Math.max(...originalXs);
        const originalMinY = Math.min(...originalYs);
        const originalMaxY = Math.max(...originalYs);
        // 中心が原点になるように各点をシフト
       const shiftedPos = reduced.map(d => [
          d[0] - (originalMinX + originalMaxX) / 2,
          d[1] - (originalMinY + originalMaxY) / 2
        ]);
        setReducedData(shiftedPos);
      } else {
        setReducedData(reduced);
      }
    }
    fetchAndProcessData();
  }, [comments, baseText]);

  const xs = useMemo(() => {
    return reducedData ? reducedData.map(d => d[0] * coordinateMultiplier) : [];
  }, [reducedData, coordinateMultiplier]);

  const ys = useMemo(() => {
    return reducedData ? reducedData.map(d => d[1] * coordinateMultiplier) : [];
  }, [reducedData, coordinateMultiplier]);

  const minX = useMemo(() => xs.length > 0 ? Math.min(...xs) : 0, [xs]);
  const maxX = useMemo(() => xs.length > 0 ? Math.max(...xs) : 0, [xs]);
  const minY = useMemo(() => ys.length > 0 ? Math.min(...ys) : 0, [ys]);
  const maxY = useMemo(() => ys.length > 0 ? Math.max(...ys) : 0, [ys]);

  // レンダリング中に実行しないよう、useEffect内で中心を更新
  useEffect(() => {
    setCenter({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
  }, [minX, maxX, minY, maxY]);

  // クラスタリング処理
  const { clusterGroups } = useMemo(() => {
    if (!reducedData) return { assignments: [] as number[], clusterGroups: {} as Record<number, number[]> };
      const dataPoints = reducedData.map(coord => [
        coord[0] * coordinateMultiplier,
        coord[1] * coordinateMultiplier,
      ]);
      const { assignments } = clusterEmbeddings(dataPoints, 15);
      const groups: Record<number, number[]> = {};
      assignments.forEach((clusterId, idx) => {
      if (!groups[clusterId]) {
        groups[clusterId] = [];
      }
      groups[clusterId].push(idx);
    });
    return { clusterGroups: groups };
  }, [reducedData, coordinateMultiplier]);

  // クラスタごとの背景色
  const clusterColors = [
    "rgba(200,200,200,0.8)",
    "rgba(255,200,200,0.8)",
    "rgba(200,255,200,0.8)",
    "rgba(200,200,255,0.8)",
    "rgba(255,255,200,0.8)",
    "rgba(200,255,255,0.8)",
    "rgba(255,200,255,0.8)",
    "rgba(255,255,255,0.8)",
    "rgba(100,100,100,0.8)",
    "rgba(255,100,100,0.8)",
    "rgba(100,255,100,0.8)",
    "rgba(100,100,255,0.8)",
    "rgba(255,255,100,0.8)",
    "rgba(100,255,255,0.8)",
    "rgba(255,100,255,0.8)",
  ];

  // テキストの重なりを検知
  function isOverlapping(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ) : boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  // 初回配置：reducedDataおよびクラスタグループが更新されたときに配置を計算
  useEffect(() => {
    if (reducedData) {
      const newBoxes: Box[] = [];
      for (const [clusterId, indices] of Object.entries(clusterGroups)) {
        const localPlaced: Array<{ x: number; y: number; width: number; height: number }> = [];
        indices.forEach(i => {
          const commentX = xs[i];
          const commentY = ys[i];
          const rectWidth = fontSize * 32;
          const rectHeight = 80;
          const rectX = commentX - rectWidth / 2;
          let candidateY = commentY - rectHeight / 2;
          const currentRect = { x: rectX, y: candidateY, width: rectWidth, height: rectHeight };

          // 重なりチェック（既に配置したものと、新規ボックスとの重なりを調整）
          while (
            localPlaced.some(rect => isOverlapping(rect, currentRect)) ||
            newBoxes.some(rect => isOverlapping(rect, currentRect))
          ) {
            candidateY += 30;
            currentRect.y = candidateY;
          }
          localPlaced.push({ ...currentRect });
          newBoxes.push({
            ...currentRect,
            commentX,
            commentY,
            commentText: comments[i],
            clusterId,
          });
        });
      }
      setPlacedBoxes(newBoxes);
    }
  }, [reducedData, clusterGroups, xs, ys, comments]);

  // マウスホイールでのズーム処理
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const newZoom = e.deltaY > 0 ? Math.max(zoomScale - 0.1 , 0.2) : Math.min(zoomScale + 0.1 , 5);
    // 前回からの倍率変化を算出
    const scaleFactor = newZoom / zoomScale;
    // フォントサイズも倍率に合わせる
    setFontSize(prevFontSize => prevFontSize * scaleFactor);
    // リンクの閾値も倍率に合わせて更新
    setLinkThreshold(prevThreshold => prevThreshold * scaleFactor);
    // 全ボックスの座標やサイズも、中心を基準に倍率変更
    setPlacedBoxes(prevBoxes =>
      prevBoxes.map(box => ({
        ...box,
        x: center.x + (box.x - center.x) * scaleFactor,
        y: center.y + (box.y - center.y) * scaleFactor,
        width: box.width * scaleFactor,
        height: box.height * scaleFactor,
        commentX: center.x + (box.commentX - center.x) * scaleFactor,
        commentY: center.y + (box.commentY - center.y) * scaleFactor,
      }))
    );
    zoomScale = newZoom;
  }, [center]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      e.preventDefault();
      setDragStart({ x: e.clientX, y: e.clientY });
      dragHasMoved.current = false;
    }
  }, []);

  // カメラ移動（ドラッグ）
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStart) {
      e.preventDefault();
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragHasMoved.current = true; // しきい値を超えたらドラッグと判定
      }
      setCenter(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPlacedBoxes(prevBoxes =>
        prevBoxes.map(box => ({
          ...box,
          x: box.x + dx,
          y: box.y + dy,
          commentX: box.commentX + dx,
          commentY: box.commentY + dy,
        }))
      );
      // 更新後の位置を基準にするため dragStart も更新
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragStart]);

  // ドラッグ終了
  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStart) {
      e.preventDefault();
      setDragStart(null);
    }
  }, [dragStart]);

  return (
    <div className="w-70vw h-full">
      <div className="flex justify-center">
        {!reducedData ? (
          <p>Loading...</p>
        ) : (
          <svg
            width  = "70vw"
            height = "90vh"
            style  = {{ border: "1px solid #ccc" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`translate(${center.x}, ${center.y})`}>
              {/* テキストボックス間の線 */}
              {placedBoxes.map((box, i) => {
                const center1 = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
                return placedBoxes.slice(i + 1).map((otherBox, j) => {
                  const center2 = { x: otherBox.x + otherBox.width / 2, y: otherBox.y + otherBox.height / 2 };
                  const distance = Math.hypot(center1.x - center2.x, center1.y - center2.y);
                  if (distance < linkThreshold) {
                    return (
                      <line
                        key={`link-${i}-${j}`}
                        x1={center1.x}
                        y1={center1.y}
                        x2={center2.x}
                        y2={center2.y}
                        stroke="gray"
                        strokeWidth={1}
                      />
                    );
                  }
                  return null;
                });
              })}
              {/* 中央（baseText）とテキストボックスの線 */}
              {baseText !== "" &&
                placedBoxes.map((box, index) => {
                  const centerBox = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
                  const distanceToBase = Math.hypot(centerBox.x, centerBox.y);
                  if (distanceToBase < linkThreshold) {
                    return (
                      <line
                        key={`link-base-${index}`}
                        x1={0}
                        y1={0}
                        x2={centerBox.x}
                        y2={centerBox.y}
                        stroke="gray"
                        strokeWidth={1}
                        strokeDasharray="4,2"
                      />
                    );
                  }
                  return null;
                })
              }
              {/* 中央の baseText */}
              {baseText !== "" ? (
                <g>
                  <rect
                    x={-50}
                    y={-20}
                    width={100}
                    height={40}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={0}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="black"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {baseText}
                  </text>
                </g>
              ) : null}
              {/* テキストボックスの描画 */}
              {placedBoxes.map((box, i) => {
                const maxChars = 30;
                const line1 = box.commentText.length > maxChars ? box.commentText.slice(0, maxChars) : box.commentText;
                const line2 = box.commentText.length > maxChars ? box.commentText.slice(maxChars, maxChars * 2) : "";
                const line3 = box.commentText.length > maxChars * 2 ? box.commentText.slice(maxChars * 2, maxChars * 3) : "";
                const lines = [line1];
                if (line2) lines.push(line2);
                if (line3) lines.push(line3);
                if (box.commentText.length > maxChars * 3) lines[lines.length - 1] += "...";
                const lineHeight = fontSize * 1.2;
                // 最初の tspan のオフセットを、全体の高さ分中央にする（行数が n のとき、-(n-1)/2 * lineHeight）
                const firstDy = -(lines.length - 1) * lineHeight / 2;
                return (
                  <g key={`comment-${i}`} onClick={() => { if (!dragHasMoved.current) setExpandedComment(box.commentText); }}>
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      fill={clusterColors[parseInt(box.clusterId) % clusterColors.length]}
                      stroke="black"
                      strokeWidth={1}
                    />
                    <text
                      x={box.commentX}
                      y={box.y + box.height / 2} // 常にボックスの中央
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="black"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {lines.map((line, idx) => (
                        <tspan key={idx} x={box.commentX} dy={idx === 0 ? firstDy : lineHeight}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
      {/* expandedComment が存在する場合、モーダルで全文表示する */}
      {expandedComment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setExpandedComment(null)
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "80%",
              maxHeight: "80%",
              overflow: "auto",
            }}
          >
            <p style={{ fontSize: `${14}px` }}>{expandedComment}</p>
          </div>
        </div>
      )} 
    </div>
  )
}