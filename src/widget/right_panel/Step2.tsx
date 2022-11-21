import React, { useState } from "react";

import Typography from "@mui/material/Typography";

import DoneIcon from "@mui/icons-material/Done";

import CircularProgress from "@mui/material/CircularProgress";

import { useTheme } from "@mui/material/styles";

import DeltaImage from "./DeltaImage";

export const Step2 = (props: any): JSX.Element => {
  const [plotReady, setPlotReady] = useState<boolean>(false);

  const theme = useTheme();

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
            pauseResume={props.disabled ? "pause" : props.pauseResume}
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
            <>
              {props.testPixels.map((item: any, index: number) => {
                return (
                  <div
                    key={index}
                    style={{
                      width: "30px",
                      height: "30px",
                      position: "absolute",
                      border:
                        !props.disabled &&
                        props.inProgress &&
                        index === props.testPixel
                          ? "3px solid red"
                          : "1.5px solid grey",
                      borderRadius: "50%",
                      background: "rgba(0, 0, 0, 0)",
                      ...item.circle
                    }}
                  />
                );
              })}
            </>
          )}
        </div>
        {plotReady && (
          <div
            style={{
              marginTop: "48px"
            }}
          >
            {props.testPixels.map((item: any, index: number) => {
              return (
                <div
                  key={index}
                  style={{ marginTop: "12px", position: "relative" }}
                >
                  <Typography
                    variant={"body2"}
                    sx={{
                      color:
                        !props.disabled &&
                        props.inProgress &&
                        index === props.testPixel
                          ? theme.palette.primary.main
                          : theme.palette.text.disabled
                    }}
                  >
                    Test Pixel {index + 1}: Tx = {item.pixel.tx}, Rx ={" "}
                    {item.pixel.rx}
                  </Typography>
                  {!props.disabled &&
                    (!props.inProgress || index < props.testPixel) && (
                      <div
                        style={{ position: "absolute", top: -4, right: -32 }}
                      >
                        <DoneIcon sx={{ color: theme.palette.primary.main }} />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
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
