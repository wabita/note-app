// 一つの付箋にたいしてのコンポーネント
//useState: コンポーネント内の状態
//useEffect: コンポーネントのレンダリング後に副作用を実行するためのフック
//useRef: DOM要素（textarea や付箋の div）への参照を保持するためのフック
import { useState, useEffect, useRef } from 'react';
//useDraggable:コンポーネントをドラッグ可能にするための機能を提供
import { useDraggable } from '@dnd-kit/core';
import './Note.css'; 

//(1) 親コンポ（NoteList.tsx）にどのようなpropsを受け取るべきかの『設計図』
type NoteProps = {
  id: string; // NoteListから受け取った付箋のID
  initialText: string; // NoteListから受け取った付箋のID
  isNew?: boolean; // 新しく追加された付箋かどうかを受け取る
  position:{x:number; y:number};
};

// (2) 一枚の付箋
const Note = ({ id, initialText, isNew, position}: NoteProps) => {
  // (3) textは付箋の実際のテキスト内容を保持 初期値は親から渡されたinitialText
  //     textという状態変数と、それを更新するsetText関数 初期値=親から渡されたinitialText
  const [text, setText] = useState(initialText); // 付箋の内容

  // (4) 付箋が編集中かどうか（テキストエリアが表示されているか）を管理
  //     isEditingという状態変数と、それを更新するsetIsEditing関数 初期値=false（表示モード)
  const [isEditing, setIsEditing] = useState(isNew || false); // 編集中かどうか

  //(5)付箋をダブルクリックしたときに実行される関数
  const handleDoubleClick = () => {
    setIsEditing(true); // ダブルクリックで編集開始
  };
  
  // (6) useDraggableを呼び出して Note コンポがドラッグ可能かを設定。この時付箋のIDをuseDraggableに渡す
  //attributes: （キーボード操作など）のためのHTML属性のコレクション
  //listeners: ドラッグを開始・実行するためのイベントハンドラのコレクション
  //setNodeRef: ドラッグしたいDOM要素（この場合は付箋の div）への参照を設定するための関数
  //transform: dnd-kit が計算する、ドラッグ中の要素の一時的な見た目の移動量（
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id, // ドラッグ可能な要素のIDとしてNoteコンポのIDを使用
  });
  //useDraggable から得られた transform オブジェクトを使って、付箋がドラッグ中に動くためのCSS transform スタイルを作成
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;


  // (7) textareaへの参照を保持するためのref
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // isEditingがtrue(編集モード)になったときにtextareaにフォーカスを当てる
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]); // isEditingが変更されるたびに実行

  // (8) 「▶︎」ボタンがクリックされたときに実行される関数　編集モードから表示モードにする
  const handleConfirm = () => {
    setIsEditing(false); // 編集終了
  };

  return (
    //div要素(note)が個々の付箋を表す
    <div 
      ref={setNodeRef} //(6)で使用したdnd-kit がこの div 要素をドラッグ可能なオブジェクトとして認識し、そのDOM要素を操作できるようにする
      className="note" //className="note" でNote.cssのスタイルが適用
      style={{
        position: 'absolute', //App.tsxの任意の場所に自由に配置
        left: position.x + 'px', // App.tsx(4)から受け取った初期X座標
        top: position.y + 'px', // App.tsx(4)から受け取った初期Y座標
        ...style, // dnd-kitが計算したドラッグ中の移動量 (transform) を適用
        cursor: isEditing ? 'auto' : 'grab', // 編集中は通常カーソル、ドラッグ可能時は掴むカーソル
        zIndex: isEditing ? 1000 : (transform ? 999 : 1), // 編集中は最前面、ドラッグ中は少し手前、通常は背面
      }}
      onDoubleClick={handleDoubleClick} // (5)を使用するためにonDoubleClickを設定
      {...(!isEditing ? listeners : {})}// （4）がtrueの時は listeners(6)を空のオブジェクトにし、ドラッグを無効にする(テキスト編集中に付箋が動いてしまうのを防ぐ)
      {...attributes} //(6)で取得した属性をHTMLに適用
    >
      {/* isEditingがtrue（編集中）の場合に以下の要素を表示 */}
      <div className="note-content-wrapper">
          {isEditing ? (
            <textarea
              ref ={textareaRef}
              rows={1} // rowsは残りの高さに合わせるため1に設定 (CSSのheightが優先される)
              cols={30} // colsはCSSのwidthで上書きされる
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ここにメモを書いてね"
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <p>{text === '' ? '' : text}</p>
          )}
        </div>
        <div className="note-button-spacer">
            {isEditing && ( // 編集中のみボタンを表示
                <button onClick={handleConfirm}>▶︎</button>
            )}
        </div>
    </div>
  );
};

export default Note;