// App.tsxから受けたstickyNotes（付箋の配列）を受け個々をNoteに渡す
//App.tsx と Note.tsx の間に位置し、データを「まとまり」から「個々」へと分解して渡す「橋渡し」のような役割
import Note from './Note'; 
import {StickyNoteType} from '../types';
import './NoteList.css'; 

// (2) 親コンポ（App.tsx）にどのようなpropsを受け取るべきかの『設計図』
type NoteListProps = {
  stickyNotes: StickyNoteType[];// (1)の形が複数はいったのリストを受け取る
};

// (3) 
// App.tsx　で受け取った　stickyNotes={stickyNotes}　について　（2）　で分割代入で取り出している
const NoteList = ({ stickyNotes }: NoteListProps) => {
  return (
    <div className="note-list"> {/*NoteList.cssのスタイルが適用 */}
      {/* stickyNotes配列をmap関数でループ処理し、各要素に対してNoteコンポーネメントを生成します */}
      {stickyNotes.map((note) => (
        //mapによってstickyNotesの各要素であるnoteを取り出し、Noteコンポを作成
        <Note key={note.id} initialText={note.text} id={note.id} isNew={note.isNew} position={note.position}/>
      ))}
    </div>
  );
};

export default NoteList;