import React, { useState } from "react";

import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";

import DeltaImage from "./DeltaImage";

export const Step2 = (props: any): JSX.Element => {
  const [plotReady, setPlotReady] = useState<boolean>(false);

  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <div style={{ marginTop: "16px", position: "relative" }}>
          <DeltaImage
            plotWidth={300}
            zMin={-100}
            zMax={300}
            showScale={false}
            setPlotReady={setPlotReady}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(0, 0, 0, 0)"
            }}
          />
          {plotReady && (
            <div
              style={{
                width: "30px",
                height: "30px",
                position: "absolute",
                bottom: 0,
                left: 0,
                transform: "translate(-35%, 35%)",
                border: "3px solid red",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0)"
              }}
            />
          )}
        </div>
        {plotReady && (
          <>
            <Button sx={{ width: "150px", marginTop: "48px" }}>Collect</Button>
            <LinearProgress sx={{ width: "150px", marginTop: "16px" }} />
          </>
        )}
      </div>
      {!plotReady && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <CircularProgress color="primary" />
        </div>
      )}
    </>
  );
};

export default Step2;
