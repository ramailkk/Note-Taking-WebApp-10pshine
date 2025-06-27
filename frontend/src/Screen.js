import Sidebar from "./Sidebar";
import NotePanel from "./NotePanel";
import TextEditor from "./TextEditor";

function Screen(){
return(
    <div className="container-fluid d-flex flex-row ">
    <Sidebar></Sidebar>
    <TextEditor></TextEditor>
</div>
)
}

export default Screen;