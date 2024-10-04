import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button(props: ButtonProps) {
  return (
    <button className="btn" disabled={props.loading || props.disabled} {...props}>
      {props.loading && (
        <span className="loading loading-sm loading-spinner"></span>
      )}
      {props.children}
    </button>
  );
}
