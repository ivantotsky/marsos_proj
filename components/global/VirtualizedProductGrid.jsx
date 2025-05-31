import { FixedSizeGrid as Grid } from "react-window";
import ProductCard from "./ProductCard"; // your current memoized ProductCard

const VirtualizedProductGrid = ({ products }) => {
  const columnCount = 4; // Number of products per row
  const itemHeight = 320; // Card height
  const itemWidth = 260; // Card width

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={itemWidth}
      height={700} // the height of the container
      rowCount={Math.ceil(products.length / columnCount)}
      rowHeight={itemHeight}
      width={1100} // adjust according to your layout
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        const product = products[index];
        if (!product) return null;

        return (
          <div style={style}>
            <ProductCard product={product} />
          </div>
        );
      }}
    </Grid>
  );
};

export default VirtualizedProductGrid;
