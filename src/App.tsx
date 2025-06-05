//useState=コンポ内部で保持する状態を管理
//useEffect=関数の実行タイミングをReactのレンダリング後まで遅らせる
import { useState,useEffect} from 'react'; 
//DndContext=このコンポーネントで囲まれた範囲を移動可能にする　
//DragEndEvent= ドラックした時に発生するイベント（IDや移動量）の情報を表す
import { DndContext,DragEndEvent } from '@dnd-kit/core';
import AddButton from './components/AddButton'; 
import NoteList from './components/NoteList';  
import {StickyNoteType} from './types';
import { NOTE_WIDTH, NOTE_HEIGHT, PADDING,ADD_BUTTON_WIDTH,ADD_BUTTON_HEIGHT } from './constants';
import './App.css';

function App() {
  //(1)　　　付箋のメッセージとIDを管理するState(状態変数)とStateを更新する関数
  //stickyNotesは画面に表示されるすべての付箋データ(NoteListに渡す配列) State
  //setStickyNotesは新たに付箋を追加したり、既存のを更新するための関数
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  
  //(2) ブラウザのウィンドウを管理するState
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // (3) 付箋を追加した時現在のウィンドウサイズを取得する
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    //windowオブにresizeのイベントを監視
    window.addEventListener('resize', handleResize);
    // useEffect の「お片付け」の部分　（コンポーネントが画面から消える時にイベントリスナーを削除）
    return () => window.removeEventListener('resize', handleResize);
  }, []); // 付箋が画面に表示された１度だけ実行

  //　(4) ウィンドウサイズ変更時の付箋の再配置
  useEffect(() => {
    // 付箋発生時とwindowSizeの更新（画面のリサイズ時）に実行
    // （２）で付箋の位置を再計算し更新
    setStickyNotes((prevNotes) => {
      return prevNotes.map((note) => {
        // 新しい位置を計算
        let newX = note.position.x;
        let newY = note.position.y;

        // ボタンの領域を考慮した補正
        // この useEffect は主に「画面外への飛び出し」補正なので、ボタンの重なりは addNote で避けるのが理想的ですが、
        // ドラッグでボタンの上に置かれた付箋がリサイズ時に適切に動くように、ここにもロジックを追加しておきます。
        const buttonLeft = windowSize.width / 2 - ADD_BUTTON_WIDTH / 2;
        const buttonTop = windowSize.height / 2 - ADD_BUTTON_HEIGHT / 2;
        const buttonRight = windowSize.width / 2 + ADD_BUTTON_WIDTH / 2;
        const buttonBottom = windowSize.height / 2 + ADD_BUTTON_HEIGHT / 2;

               // 画面端の補正
        newX = Math.max(PADDING, Math.min(newX, windowSize.width - NOTE_WIDTH - PADDING));
        newY = Math.max(PADDING, Math.min(newY, windowSize.height - NOTE_HEIGHT - PADDING));

        // 付箋の新しい位置がボタン領域と重なる場合、強制的にボタンの上下左右のいずれかに移動させる
        // ただし、この自動補正はユーザーの意図を無視するため、UXを損なう可能性も。
        // シンプルに「初期配置で避ける」に集中するなら、この useEffect からボタン関連の補正は削除しても良いです。
        // ここでは、念のため、ボタンとの重なりも考慮したリサイズ補正ロジックを維持します。
        const overlapsWithButton = !(
          (newX + NOTE_WIDTH <= buttonLeft) ||
          (newX >= buttonRight) ||
          (newY + NOTE_HEIGHT <= buttonTop) ||
          (newY >= buttonBottom)
        );

        if (overlapsWithButton) {
            // ボタンの真上、または真下、または左右のいずれかに強制的に移動させるフォールバック
            // このロジックは addNote と似ていますが、既存の位置からの「引き戻し」なので少し複雑になります。
            // 複雑さを避けるなら、リサイズ時は単に「画面内」に戻すだけに留め、
            // 「ボタンを避ける」は addNote のみで行う方がシンプルです。
            // 例: ボタンの上か下に配置
            if (newY < windowSize.height / 2) { // ボタンより上にあったら
                newY = buttonBottom + PADDING; // ボタンの下に配置
            } else { // ボタンより下にあったら
                newY = buttonTop - NOTE_HEIGHT - PADDING; // ボタンの上に配置
            }
            newY = Math.max(PADDING, Math.min(newY, windowSize.height - NOTE_HEIGHT - PADDING)); // 画面内補正
        }

        // 更新が必要な場合のみ新しいオブジェクトを返す
        if (newX !== note.position.x || newY !== note.position.y) {
          return {
            ...note,
            position: { x: newX, y: newY },
          };
        }
        return note; // 位置が変わらない場合は元のオブジェクトを返す (無駄なレンダリングを防ぐ)
      });
    });
  }, [windowSize]); // windowSize が変更されるたびにこのエフェクトを実行


  // (5)　　　新しい付箋を追加する関数 (引数なし)
  //AddBottonがクリックされたときに呼び出される
  const addNote = () => {
    // IDを生成 今回は現在のミリ秒を使ってIDを生成。
    const newId = Date.now().toString();

     // ★★★ ボタンの占有領域を計算 ★★★
    // AddButton は fixed で top: 50%, left: 50% と transform: translate(-50%, -50%) で中央なので、
    // そのピクセル座標を計算します。
    const buttonCenterX = windowSize.width / 2;
    const buttonCenterY = windowSize.height / 2;

    const buttonLeft = buttonCenterX - ADD_BUTTON_WIDTH / 2;
    const buttonRight = buttonCenterX + ADD_BUTTON_WIDTH / 2;
    const buttonTop = buttonCenterY - ADD_BUTTON_HEIGHT / 2;
    const buttonBottom = buttonCenterY + ADD_BUTTON_HEIGHT / 2;

    // 付箋が画面内（PADDING内側）に収まる最大座標と最小座標
    const minPosX = PADDING;
    const maxPosX = windowSize.width - NOTE_WIDTH - PADDING;
    const minPosY = PADDING;
    const maxPosY = windowSize.height - NOTE_HEIGHT - PADDING;

    let randomX: number;
    let randomY: number;
    let attempts = 0;
    let overlaps=false; 
    const MAX_ATTEMPTS = 100; // 無限ループ防止のための試行回数制限

    // ★★★ ボタンと重ならない位置が見つかるまでランダム生成を繰り返す ★★★
    do {
      // 画面全体（PADDING内側）でランダムな位置を生成
      randomX = minPosX + Math.random() * (maxPosX - minPosX);
      randomY = minPosY + Math.random() * (maxPosY - minPosY);

      // 生成された付箋の領域の座標
      const noteRectLeft = randomX;
      const noteRectRight = randomX + NOTE_WIDTH;
      const noteRectTop = randomY;
      const noteRectBottom = randomY + NOTE_HEIGHT;

      // ボタン領域との重なりをチェック (軸分離定理の逆)
      // 重ならない条件: (付箋の右端 <= ボタンの左端) OR (付箋の左端 >= ボタンの右端) OR
      // (付箋の下端 <= ボタンの上端) OR (付箋の上端 >= ボタンの下端)
      // overlaps は「重なっている」場合に true になるように定義
      overlaps = !(
        noteRectRight <= buttonLeft ||
        noteRectLeft >= buttonRight ||
        noteRectBottom <= buttonTop ||
        noteRectTop >= buttonBottom
      );

      attempts++;
    } while (overlaps && attempts < MAX_ATTEMPTS);

    // ★★★ 最大試行回数に達しても良い位置が見つからなかった場合のフォールバックロジック ★★★
    // 例: ボタンの真上または真下に強制的に配置 (画面端の補正も考慮)
    if (attempts >= MAX_ATTEMPTS) {
        // ボタンのすぐ上に配置を試みる
        randomY = buttonTop - NOTE_HEIGHT - PADDING;
        randomX = buttonLeft; // X座標はボタンに合わせる

        // もし上に配置すると画面からはみ出すなら、ボタンのすぐ下に配置する
        if (randomY < PADDING) {
            randomY = buttonBottom + PADDING;
        }

        // 最後に画面端の補正を適用
        randomX = Math.max(PADDING, Math.min(randomX, maxPosX));
        randomY = Math.max(PADDING, Math.min(randomY, maxPosY));
    }

    // 新しい付箋を追加する際に、isNew: true を設定
    // (2)を実行
    setStickyNotes([...stickyNotes, { id: newId, text: '', isNew: true,position:{x:randomX,y:randomY }}]);
  };

  // (6)　　　ユーザーがドラッグ移動したとき実行
  // onDragEnd イベントハンドラを DndContext に渡し、ドラッグ終了時に付箋の新しい位置を計算して更新するロジックの記述
  const handleDragEnd =(event:DragEndEvent) => {
    //    {要素の情報,　　移動量 }
    const { active, delta } = event; //eventから分割して取り出す

    setStickyNotes((prevNotes) => {  // prevNotes（直前の状態）を使って更新
      return prevNotes.map((note) => {  //すべての付箋をループ
        if (note.id === active.id) {  //ドラッグした付箋を見つける
          let newX = note.position.x + delta.x;
          let newY = note.position.y + delta.y;

          // ★★★ ドラッグ後も画面内（ボタン領域外も考慮）に留まるように補正 ★★★
          const buttonLeft = windowSize.width / 2 - ADD_BUTTON_WIDTH / 2;
          const buttonTop = windowSize.height / 2 - ADD_BUTTON_HEIGHT / 2;
          const buttonRight = windowSize.width / 2 + ADD_BUTTON_WIDTH / 2;
          const buttonBottom = windowSize.height / 2 + ADD_BUTTON_HEIGHT / 2;

          // 画面端の補正を先に適用
          newX = Math.max(PADDING, Math.min(newX, windowSize.width - NOTE_WIDTH - PADDING));
          newY = Math.max(PADDING, Math.min(newY, windowSize.height - NOTE_HEIGHT - PADDING));

          // ドラッグ後の付箋がボタン領域と重なるかチェックし、調整
          const overlapsWithButtonAfterDrag = !(
            (newX + NOTE_WIDTH <= buttonLeft) ||
            (newX >= buttonRight) ||
            (newY + NOTE_HEIGHT <= buttonTop) ||
            (newY >= buttonBottom)
          );

          if (overlapsWithButtonAfterDrag) {
              // ドラッグ終了後もボタンに重なる場合、ボタンの上下左右のいずれかに移動させる
              // ここでの「補正」はユーザーの意図を一部無視することになるため、
              // 非常に小さな補正量にするか、より複雑な衝突解決アルゴリズムが必要になることがあります。
              // 今回はシンプルなフォールバックとして、ボタンの真上に移動させる。
              // もしドラッグ後の重なりを「許容する」なら、この if ブロックは削除してください。
              newY = buttonTop - NOTE_HEIGHT - PADDING;
              // X座標は中心に。
              newX = buttonLeft + (ADD_BUTTON_WIDTH / 2) - (NOTE_WIDTH / 2);

              // 最終的な画面内補正を再適用
              newX = Math.max(PADDING, Math.min(newX, windowSize.width - NOTE_WIDTH - PADDING));
              newY = Math.max(PADDING, Math.min(newY, windowSize.height - NOTE_HEIGHT - PADDING));
          }
          return {
            ...note, // その他のプロパティはそのまま
            position:{  // positionだけ更新
              x: newX,//元の座標+移動量（delta.x）
              y: newY,
            }
          };
        }
        return note; // 一致しない場合は、その付箋は変更せずにそのまま返す
      });
    });
  }

  return (
    //DndContextでの情報を handleDragEnd関数（4） を渡す
    <DndContext onDragEnd={handleDragEnd}> 
      <div className="App">{/* App.cssが適用 */}
        {/* AddButton.tsx(2) onAddNoteプロパティに引数なしaddNote関数(3)を渡す*/}
        <AddButton onAddNote={addNote} /> {/*AddButtonコンポは付箋が追加されたことをAppコンポに伝えることができる*/}
        {/* NoteList.tsx(3) stickyNotesプロパティに(2)の配列を渡す*/}
      <NoteList stickyNotes={stickyNotes} /> {/* NoteListは受け取ったリストに基づいて付箋を表示できる　*/}
      </div>
    </DndContext>
  );
}

export default App;
