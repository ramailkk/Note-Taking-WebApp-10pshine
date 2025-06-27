// components/CustomToolbar.jsx
import React from "react";
// import './quill-toolbar.css'; // optional for styling
import "./CustomToolbar.css";

const CustomToolbar = () => {
  return (
    <div id="custom-toolbar" style={{ marginBottom: "1rem" }}>
      {/* Font Dropdown */}
      <select
        className="ql-font"
        defaultValue="sans-serif"
        style={{ width: "140px" }}
      >
        <option value="sans-serif">Sans-serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Mono</option>
        <option value="arial">Arial</option>
        <option value="verdana">Verdana</option>
        <option value="georgia">Georgia</option>
        <option value="courier-new">Courier</option>
        <option value="times-new-roman">Times</option>
        <option value="lucida">Lucida</option>
        <option value="impact">Impact</option>
        <option value="tahoma">Tahoma</option>
        <option value="palatino">Palatino</option>
        <option value="trebuchet">Trebuchet</option>
      </select>
      {/* Font size */}
      <select
        className="ql-size"
        defaultValue="14px"
        style={{ width: "80px", marginLeft: "10px" }}
      >
        <option value="10px">10</option>
        <option value="12px">12</option>
        <option value="14px">14</option>
        <option value="16px">16</option>
        <option value="18px">18</option>
        <option value="24px">24</option>
        <option value="32px">32</option>
        <option value="48px">48</option>
      </select>
      {/* Basic Formatting */}
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
      {/* Color for font */}
      <select className="ql-color" defaultValue="">
        <option value="black" />
        <option value="red" />
        <option value="green" />
        <option value="blue" />
        <option value="orange" />
        <option value="purple" />
        <option value="gray" />
      </select>
      {/* Highlight Color */}
      <select className="ql-background" defaultValue="">
        <option value="white" />
        <option value="yellow" />
        <option value="lightgreen" />
        <option value="lightblue" />
        <option value="pink" />
        <option value="lightgray" />
      </select>
      {/* Clear formatting */}
      <button className="ql-clean" />
      {/* List buttons */}
      <button className="ql-list" value="ordered" />
      <button className="ql-list" value="bullet" />
      {/* Alignment buttons */}
      <button className="ql-align" value="" /> {/* Left align */}
      <button className="ql-align" value="center" /> {/* Center align */}
      <button className="ql-align" value="right" /> {/* Right align */}
      <button className="ql-align" value="justify" /> {/* Justify align */}

      {/* Image save */}
      <button className="ql-link" />
      <button className="ql-image" />
    </div>
  );
};

export default CustomToolbar;
