import React from "react";
import "./CustomToolbar.css";
import FontDropdown from "./FontDropdown.js";
import FontSizeDropdown from "./FontSizeDropdown.js";

const CustomToolbar = ({ quill }) => {
  return (
    <div id="custom-toolbar" className="custom-toolbar-expanded">{
      /*  Undo/Redo */}
      <div className="toolbar-group">
        <button className="ql-undo">↶</button>
        <button className="ql-redo">↷</button>
      </div>

      {/* Font Options */}
      <div className="toolbar-group">
        <FontDropdown quill={quill} />

        <FontSizeDropdown quill={quill} />
      </div>

      {/* Text Styles */}
      <div className="toolbar-group">
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
        <button className="ql-strike" />
      </div>

      {/* Colors */}
      <div className="toolbar-group">
        <select className="ql-color" />
        <select className="ql-background" />
      </div>

      {/* Lists */}
      <div className="toolbar-group">
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
      </div>

      {/* Alignments */}
      <div className="toolbar-group">
        <button className="ql-align" value="" />
        <button className="ql-align" value="center" />
        <button className="ql-align" value="right" />
        <button className="ql-align" value="justify" />
      </div>

      {/* Advanced Formatting */}
      <div className="toolbar-group">
        <button className="ql-blockquote" />
        <button className="ql-code-block" />
        <button className="ql-direction" value="rtl" />
        <button className="ql-indent" value="-1" />
        <button className="ql-indent" value="+1" />
        <button className="ql-clean" />
      </div>

      {/* Media */}
      <div className="toolbar-group">
        <button className="ql-link" />
        <button className="ql-image" />
      </div>
    </div>
  );
};

export default CustomToolbar;
