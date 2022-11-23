import React, { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useTheme } from "@mui/material/styles";

import Plot from "react-plotly.js";

import { ContentAttrs, getContentAttrs } from "../mui_extensions/constants";

const contentAttrs: ContentAttrs = getContentAttrs();

const PLOT_WIDTH = contentAttrs.PANEL_WIDTH;
const PLOT_HEIGHT = 250;
const MAX_X_RANGE = 1024;

const plotRangeY = [0, 110];

const plotData = [
  {
    x: [] as number[],
    y: [] as number[],
    type: "scatter",
    line: { color: "#ffa726", shape: "spline" }
  },
  {
    xaxis: "x2",
    yaxis: "y2",
    x: [] as number[],
    y: [] as number[],
    type: "scatter",
    mode: "markers",
    marker: {
      color: "#007dc3",
      size: 7
    }
  }
];

const plotConfig = { displayModeBar: false };

const plotLayout = {
  width: PLOT_WIDTH,
  height: PLOT_HEIGHT,
  margin: {
    l: 24,
    r: 36,
    t: 16,
    b: 24
  },
  font: {
    color: ""
  },
  plot_bgcolor: "",
  paper_bgcolor: "rgba(0, 0, 0, 0)",
  xaxis: {
    title: "Integration Duration",
    range: [0, 0],
    fixedrange: true,
    zeroline: false,
    showline: true,
    showgrid: false,
    showticklabels: true,
    tickmode: "array",
    tickvals: [] as number[],
    ticktext: [] as string[],
    tickfont: {
      size: 10
    }
  },
  xaxis2: {
    overlaying: "x",
    side: "top",
    range: [0, 0],
    fixedrange: true,
    zeroline: false,
    showline: true,
    showgrid: false,
    showticklabels: true,
    tickmode: "array",
    tickvals: [] as number[],
    ticktext: [] as string[],
    tickfont: {
      size: 10
    }
  },
  yaxis: {
    title: "Signal",
    range: plotRangeY,
    fixedrange: true,
    zeroline: false,
    showline: true,
    showgrid: false,
    showticklabels: false
  },
  yaxis2: {
    overlaying: "y",
    range: plotRangeY,
    fixedrange: true,
    side: "right",
    zeroline: false,
    showline: true,
    showgrid: false,
    showticklabels: true,
    tickmode: "array",
    tickvals: [] as number[],
    ticktext: [] as string[],
    tickfont: {
      size: 10
    }
  },
  shapes: [
    {
      type: "line",
      yref: "paper",
      x0: "",
      x1: "",
      y0: 0,
      y1: 1,
      line: {
        color: "grey",
        width: 1,
        dash: "dot"
      }
    },
    {
      type: "line",
      xref: "paper",
      x0: 0,
      x1: 1,
      y0: "",
      y1: "",
      line: {
        color: "grey",
        width: 1,
        dash: "dot"
      }
    }
  ],
  showlegend: false
};

const model = (I: number, tau: number) => {
  const deltaC = (1 - Math.exp((-1 * I) / tau)) * 100;
  return deltaC;
};

const resetPlot = () => {
  plotData[0].x = [];
  plotData[0].y = [];
  plotData[1].x = [];
  plotData[1].y = [];
  plotLayout.xaxis2.tickvals = [];
  plotLayout.xaxis2.ticktext = [];
  plotLayout.yaxis2.tickvals = [];
  plotLayout.yaxis2.ticktext = [];
  plotLayout.shapes[0].x0 = "";
  plotLayout.shapes[0].x1 = "";
  plotLayout.shapes[1].y0 = "";
  plotLayout.shapes[1].y1 = "";
};

export const Step3 = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [data, setData] = useState<any>([]);
  const [layout, setLayout] = useState<any>({});
  const [config, setConfig] = useState<any>({});
  const [frames, setFrames] = useState<any>([]);
  const [intDur, setIntDur] = useState<number | undefined>(
    props.modelParams?.optimalIntDur[0]
  );
  const [sliderValue, setSliderValue] = useState<number | undefined>(
    props.modelParams?.optimalIntDur[0]
  );

  const theme = useTheme();

  const storeState = (figure: any) => {
    setData(figure.data);
    setLayout(figure.layout);
    setConfig(figure.config);
    setFrames(figure.frames);
  };

  const initPlot = () => {
    const points = MAX_X_RANGE;
    resetPlot();
    for (let i = 0; i < points; i++) {
      plotData[0].x.push(i);
      plotData[0].y.push(model(i, props.modelParams.tau));
    }
    plotData[1].x.push(props.modelParams.optimalIntDur[0]);
    plotData[1].y.push(
      model(props.modelParams.optimalIntDur[0], props.modelParams.tau)
    );
    plotLayout.xaxis.range = [0, MAX_X_RANGE - 1];
    plotLayout.xaxis2.range = [0, MAX_X_RANGE - 1];
    plotLayout.xaxis.tickvals = [0, MAX_X_RANGE - 1];
    plotLayout.xaxis.ticktext = ["0", MAX_X_RANGE - 1 + ""];
  };

  const updatePlot = (intDur: number | undefined) => {
    if (intDur !== undefined) {
      const signal = Math.round(model(intDur, props.modelParams.tau));
      plotLayout.xaxis2.tickvals = [intDur];
      plotLayout.xaxis2.ticktext = [intDur + ""];
      plotLayout.yaxis2.tickvals = [signal];
      plotLayout.yaxis2.ticktext = [signal + "%"];
      plotLayout.shapes[0].x0 = intDur + "";
      plotLayout.shapes[0].x1 = intDur + "";
      plotLayout.shapes[1].y0 = signal + "";
      plotLayout.shapes[1].y1 = signal + "";
    }
    setData([plotData[0], plotData[1]]);
    setLayout(plotLayout);
    setConfig(plotConfig);
  };

  const handleIntDurInputChange = (value: string) => {
    if (value !== "" && isNaN(Number(value))) {
      return;
    }
    if (value === "") {
      setIntDur(undefined);
      return;
    }
    const num = parseInt(value, 10);
    if (num < MAX_X_RANGE) {
      updatePlot(num);
      setIntDur(num);
      setSliderValue(num);
    }
  };

  const handleSliderChange = (event: any) => {
    updatePlot(event.target.value);
    setIntDur(event.target.value);
    setSliderValue(event.target.value);
  };

  useEffect(() => {
    plotLayout.plot_bgcolor = theme.palette.mode === "light" ? "#fff" : "#000";
    plotLayout.font.color = theme.palette.text.primary;
    setData([plotData[0], plotData[1]]);
    setLayout(plotLayout);
  }, [theme]);

  useEffect(() => {
    props.setIntDur(intDur);
  }, [intDur]);

  useEffect(() => {
    const initialize = () => {
      try {
        if (props.modelParams) {
          initPlot();
        }
        updatePlot(props.modelParams?.optimalIntDur[0]);
        setInitialized(true);
      } catch (error) {
        console.error(error);
      }
    };
    initialize();
    return () => {
      resetPlot();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {initialized && (
        <>
          <div style={{ position: "relative" }}>
            <Plot
              data={data}
              layout={layout}
              frames={frames}
              config={config}
              onInitialized={(figure) => storeState(figure)}
              onUpdate={(figure) => storeState(figure)}
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
          </div>
          <div style={{ marginTop: "24px", alignSelf: "stretch" }}>
            <Typography variant="body2" sx={{ display: "inline-block" }}>
              Integration Duration:&nbsp;
            </Typography>
            <Tooltip
              title={
                intDur !== undefined
                  ? intDur < props.modelParams.minimumIntDur
                    ? "suggested minimum: " + props.modelParams.minimumIntDur
                    : ""
                  : ""
              }
              arrow
            >
              <TextField
                variant="standard"
                disabled={props.modelParams === undefined}
                value={intDur !== undefined ? intDur : ""}
                inputProps={{ style: { textAlign: "center" } }}
                onChange={(event) =>
                  handleIntDurInputChange(event.target.value)
                }
                sx={{
                  width: "48px",
                  display: "inline-block",
                  "& .MuiInput-root": {
                    fontSize: "0.875rem"
                  },
                  "& .MuiInput-input": {
                    padding: 0,
                    color:
                      intDur !== undefined
                        ? intDur < props.modelParams.minimumIntDur
                          ? "red"
                          : theme.palette.text.primary
                        : null
                  }
                }}
              />
            </Tooltip>
            <Typography
              variant="body2"
              sx={{
                display: "inline-block",
                fontSize: "0.65rem"
              }}
            >
              &nbsp;(TAC clock periods)
            </Typography>
          </div>
          <div
            style={{
              marginTop: "16px",
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.65rem"
              }}
            >
              Suggested Setting: {props.modelParams?.optimalIntDur[0]}
            </Typography>
          </div>
          <div style={{ width: "100%", marginTop: "16px" }}>
            <Stack spacing={1} direction="row">
              <Typography variant="body2" sx={{ paddingTop: "5px" }}>
                {0}&nbsp;
              </Typography>
              <Slider
                size="small"
                disabled={props.modelParams === undefined}
                min={0}
                max={MAX_X_RANGE - 1}
                value={sliderValue}
                onChange={handleSliderChange}
              />
              <Typography variant="body2" sx={{ paddingTop: "5px" }}>
                &nbsp;{MAX_X_RANGE - 1}
              </Typography>
            </Stack>
          </div>
        </>
      )}
    </div>
  );
};

export default Step3;
