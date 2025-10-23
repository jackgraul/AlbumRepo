declare module "react-window" {
  import * as React from "react";

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
  }

  export interface FixedSizeListProps {
    height: number;
    width: number | string;
    itemCount: number;
    itemSize: number;
    className?: string;
    children: (props: ListChildComponentProps) => React.ReactNode;
  }

  export const FixedSizeList: React.FC<FixedSizeListProps>;
}