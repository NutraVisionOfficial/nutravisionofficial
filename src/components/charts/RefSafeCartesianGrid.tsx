import * as React from "react";
import { CartesianGrid as RechartsCartesianGrid, type CartesianGridProps } from "recharts";

export const CartesianGrid = React.forwardRef<SVGElement, CartesianGridProps>((props, _ref) => (
  <RechartsCartesianGrid {...props} />
));

CartesianGrid.displayName = "CartesianGrid";