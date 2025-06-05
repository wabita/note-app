//一つの付箋の型定義
export type StickyNoteType = {
  id: string; //付箋のID
  text: string; // 付箋の内容
  isNew?: boolean; //新規追加されたかを示す
  position: { x: number; y: number }; //付箋の位置
};