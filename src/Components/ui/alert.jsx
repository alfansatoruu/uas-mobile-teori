import React from "react";

export function Alert({ children }) {
  return (
    <div style={{ padding: "10px", background: "red", color: "white", borderRadius: "5px" }}>
      {children || "This is an alert!"}
    </div>
  );
}

export function AlertDescription({ description }) {
  return (
    <p style={{ marginTop: "5px", fontSize: "14px" }}>{description || "Additional details about the alert."}</p>
  );
}
