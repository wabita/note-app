//付箋追加ボタンのコンポーネントでクリック時にApp.tsxに新しい付箋を追加することを報告
import './AddButton.css';

// (1) 親コンポ（App.tsx）にどのようなぽpropsを受け取るべきかの『設計図』
type AddButtonProps = {
  // void : 引数なしの何も返さない関数であることを示す
  onAddNote: () => void; // 付箋を追加する関数（App.tsxで定義した addNote 関数）のみを受け取る
};

// (2) 付箋を追加するボタン　　　　App.tsxに渡すコンポーネント
// App.tsx　で受け取った　onAddNote={addNote}　について　（１）　でonAddNoteを取り出している
const AddButton = ({ onAddNote }: AddButtonProps) => {
  // (3) 「付箋を追加」ボタンがクリックされたときに実行される関数　（onClick={onAddStickyNote} と直接書くと、意図しないタイミングで関数が実行されてしまう可能性があるため必要）
  const handleClick = () => {
    onAddNote(); // 引数なしで親の関数を呼び出す
  };

  return (
    //↓ボタンの周りに少し余白を作るためのインラインスタイルでmarginを定義
    <div className="add-button-fixed" style={{ margin: '5px' }}>
      {/* 付箋追加ボタン */}
      <button className="button" onClick={handleClick}>{/* クリックされたときにhandleClickを実行 */}
        付箋を追加
      </button>
    </div>
  );
};

export default AddButton;