import type { MouseEventHandler, SVGProps } from "react";

export const Icon = ({
  id,
  size,
  width,
  height,
  onClick,
  ...props
}: {
  id: string;
  size?: number;
  width?: number;
  height?: number;
  props?: object;
  onClick?: MouseEventHandler<SVGSVGElement>;
  className?: string;
} & SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      onClick={onClick}
      width={size ? size : width}
      height={size ? size : height}
      className={props.className}
    >
      <use href={`/sprite.svg#${id}`} />
    </svg>
  );
};
