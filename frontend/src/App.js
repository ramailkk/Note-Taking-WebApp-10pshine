import Login from './Login';
import SignUp from './SignUp'
import './App.css';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import Quill from 'quill';
import TextEditor from './TextEditor';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import NotePanel from './NotePanel';

function App() {
  return (
    <>
    <NotePanel></NotePanel>
    </>
  );
}

export default App;
