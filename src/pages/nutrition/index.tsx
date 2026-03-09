import * as React from "react";
import { useSearchParams } from "react-router";

import { ErrorBoundary } from "../../components/ErrorBoundary";
import { Box } from "@mui/material";
import Loader from "../loader";

const Instructions = React.lazy(() => import("./Instructions"));
const RobotoffNutrientExtraction = React.lazy(() =>
  import("../../components/OffWebcomponents").then((module) => ({
    default: module.RobotoffNutrientExtraction,
  })),
);

export default function Nutrition() {
  const [searchParams] = useSearchParams();
  const productCode = searchParams.get("code") || undefined;

  return (
    <React.Suspense fallback={<Loader />}>
      <ErrorBoundary>
        <Instructions />
        <Box sx={{ mb: 2, px: 2 }}>
          <RobotoffNutrientExtraction productCode={productCode} />
        </Box>
      </ErrorBoundary>
    </React.Suspense>
  );
}
