import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector from "@mui/material/StepConnector";

import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";

import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

import { styled, useTheme } from "@mui/material/styles";

import Plot from "react-plotly.js";

import { requestAPI } from "../handler";

const showHelp = false;

const WIDTH = 800;
const HEIGHT_TITLE = 70;
const HEIGHT_CONTENT = 450;
const HEIGHT_CONTROLS = 120;
const PADDING = 24;

const CONTENT_SPACING = 2;
const CONTENT_PANEL_WIDTH = (WIDTH - PADDING * 2 - CONTENT_SPACING * 8 * 2) / 2;

const PLOT_WIDTH = CONTENT_PANEL_WIDTH;
const PLOT_HEIGHT = 300;

const STEP_ICON_SIZE = 32;

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  "& .MuiStepConnector-line": {
    minHeight: "80px",
    marginLeft: "4px"
  }
}));

const steps = [
  {
    label: "Foo"
  },
  {
    label: "Collect Baseline"
  },
  {
    label: "Bar"
  }
];

const rawData = {
  x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  y: [7, 17, 16, 19, 22, 21, 23, 25, 24, 25]
};

const rawXMin = Math.min.apply(null, rawData.x);
const rawXMax = Math.max.apply(null, rawData.x);
const rawXRange = rawXMax - rawXMin;
const rawYMin = Math.min.apply(null, rawData.y);
const rawYMax = Math.max.apply(null, rawData.y);
const rawYRange = rawYMax - rawYMin;

const plotRangeX = [rawXMin - rawXRange / 10, rawXMax + rawXRange / 10];
const plotRangeY = [-10, 110];

const scatterData = {
  x: rawData.x,
  y: rawData.y.map((item: number) => ((item - rawYMin) / rawYRange) * 100)
};

const points = 500;
const step = (rawXMax - rawXMin) / (points - 1);

const sigmoidData = {
  x: [] as number[],
  y: [] as number[],
  yScaled: [] as number[]
};

let sigmoidYMin: number;
let sigmoidYMax: number;
let sigmoidYRange: number;

const plotData = [
  {
    x: scatterData.x,
    y: scatterData.y,
    type: "scatter",
    mode: "markers",
    marker: {
      color: "#007dc3",
      size: 10,
      line: {
        color: "black",
        width: 1
      }
    }
  },
  {
    xaxis: "x2",
    yaxis: "y2",
    x: sigmoidData.x,
    y: sigmoidData.y,
    type: "scatter",
    line: { shape: "spline" }
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
    range: plotRangeX,
    fixedrange: true,
    zeroline: false,
    showline: true,
    showgrid: false,
    showticklabels: false
  },
  xaxis2: {
    overlaying: "x",
    side: "top",
    range: plotRangeX,
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
  hovermode: false,
  showlegend: false
};

const sigmoid = (x: number, L: number, x0: number, k: number, b: number) => {
  const y = L / (1 + Math.exp(-k * (x - x0))) + b;
  return y;
};

let sigmoidParams: [number, number, number, number];

let minThreshold = 0;

const slider2Threshold = (value: number): number => {
  return ((100 - minThreshold) / (points - 1)) * value + minThreshold;
};

const resetPlot = () => {
  sigmoidData.x = [];
  sigmoidData.y = [];
  sigmoidData.yScaled = [];
  plotLayout.xaxis2.tickvals = [];
  plotLayout.xaxis2.ticktext = [];
  plotLayout.yaxis2.tickvals = [];
  plotLayout.yaxis2.ticktext = [];
  plotLayout.shapes[0].x0 = "";
  plotLayout.shapes[0].x1 = "";
  plotLayout.shapes[1].y0 = "";
  plotLayout.shapes[1].y1 = "";
};

const updatePlot = (targetThreshold: number): number => {
  const threshold = sigmoidData.yScaled.reduce(function (prev, curr) {
    return Math.abs(curr - targetThreshold) < Math.abs(prev - targetThreshold)
      ? curr
      : prev;
  });
  const index = sigmoidData.yScaled.indexOf(threshold);
  const maxIntDur = rawXMin + index * step;
  const intDur = scatterData.x.reduce(function (prev, curr) {
    return curr > maxIntDur ? prev : curr;
  });
  const signal = sigmoid(intDur, ...sigmoidParams);
  const scaledSignal = Math.round(
    ((signal - sigmoidYMin) / sigmoidYRange) * 100
  );
  plotLayout.xaxis2.tickvals = [intDur];
  plotLayout.xaxis2.ticktext = [intDur + "&mu;s"];
  plotLayout.yaxis2.tickvals = [signal];
  plotLayout.yaxis2.ticktext = [scaledSignal + "%"];
  plotLayout.shapes[0].x0 = intDur + "";
  plotLayout.shapes[0].x1 = intDur + "";
  plotLayout.shapes[1].y0 = signal + "";
  plotLayout.shapes[1].y1 = signal + "";
  return intDur;
};

const initPlot = async () => {
  const dataToSend: any = {
    sigmoid: {
      xdata: scatterData.x,
      ydata: scatterData.y
    }
  };
  try {
    const response = await requestAPI<any>("tutor/IntDur", {
      body: JSON.stringify(dataToSend),
      method: "POST"
    });
    sigmoidParams = response;
    for (let i = 0; i < points; i++) {
      const x = rawXMin + i * step;
      const y = sigmoid(x, ...sigmoidParams);
      sigmoidData.x.push(x);
      sigmoidData.y.push(y);
    }
    sigmoidYMin = Math.min.apply(null, sigmoidData.y);
    sigmoidYMax = Math.max.apply(null, sigmoidData.y);
    sigmoidYRange = sigmoidYMax - sigmoidYMin;
    for (let i = 0; i < points; i++) {
      sigmoidData.yScaled.push(
        ((sigmoidData.y[i] - sigmoidYMin) / sigmoidYRange) * 100
      );
    }
    minThreshold =
      Math.floor(
        ((sigmoid(scatterData.x[1], ...sigmoidParams) - sigmoidYMin) /
          sigmoidYRange) *
          100
      ) - 1;
  } catch (error) {
    Promise.reject(error);
  }
};

export const Landing = (props: any): JSX.Element => {
  const [data, setData] = useState<any>([]);
  const [layout, setLayout] = useState<any>({});
  const [config, setConfig] = useState<any>({});
  const [frames, setFrames] = useState<any>([]);
  const [intDur, setIntDur] = useState<number | null>();
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);

  const theme = useTheme();

  const handleIntDurInputChange = (value: string) => {
    if (value !== "" && isNaN(Number(value))) {
      return;
    }
    if (value === "") {
      setIntDur(null);
      return;
    }
    const num = parseInt(value, 10);
    if (num < 100) {
      setIntDur(num);
    }
  };

  const storeState = (figure: any) => {
    setData(figure.data);
    setLayout(figure.layout);
    setConfig(figure.config);
    setFrames(figure.frames);
  };

  const handleNextButtonClick = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBackButtonClick = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSliderOnChange = (event: any) => {
    const intDur = updatePlot(slider2Threshold(event.target.value));
    setData([plotData[0], plotData[1]]);
    setLayout(plotLayout);
    setIntDur(intDur);
    setSliderValue(event.target.value);
  };

  useEffect(() => {
    plotLayout.plot_bgcolor = theme.palette.mode === "light" ? "#fff" : "#000";
    plotLayout.font.color = theme.palette.text.primary;
    setData([plotData[0], plotData[1]]);
    setLayout(plotLayout);
  }, [theme]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initPlot();
        setData(plotData);
        setLayout(plotLayout);
        setConfig(plotConfig);
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
    <>
      <Stack spacing={2}>
        <Box
          sx={{
            width: WIDTH + "px",
            height: HEIGHT_TITLE + "px",
            position: "relative",
            bgcolor: "section.background"
          }}
        >
          <Typography
            variant="h5"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)"
            }}
          >
            Integration Duration
          </Typography>
          {showHelp && (
            <Button
              variant="text"
              sx={{
                position: "absolute",
                top: "50%",
                left: "16px",
                transform: "translate(0%, -50%)"
              }}
            >
              <Typography variant="underline">Help</Typography>
            </Button>
          )}
        </Box>
        <Box
          sx={{
            width: WIDTH + "px",
            minHeight: HEIGHT_CONTENT + "px",
            boxSizing: "border-box",
            padding: PADDING + "px",
            position: "relative",
            bgcolor: "section.background",
            display: "flex"
          }}
        >
          <Stack
            spacing={CONTENT_SPACING}
            direction="row"
            divider={<Divider orientation="vertical" flexItem />}
          >
            <div style={{ width: CONTENT_PANEL_WIDTH + "px" }}>
              <Stepper
                activeStep={activeStep}
                orientation="vertical"
                connector={<CustomStepConnector />}
                sx={{
                  "& .MuiStepIcon-root": {
                    width: STEP_ICON_SIZE + "px",
                    height: STEP_ICON_SIZE + "px"
                  }
                }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </div>
            <div style={{ width: CONTENT_PANEL_WIDTH + "px" }}>
              <Stack spacing={3} direction="column" alignItems="center">
                <Plot
                  data={data}
                  layout={layout}
                  frames={frames}
                  config={config}
                  onInitialized={(figure) => storeState(figure)}
                  onUpdate={(figure) => storeState(figure)}
                />
                <div style={{ width: CONTENT_PANEL_WIDTH + "px" }}>
                  <Stack spacing={1} direction="row">
                    <Typography variant="body2" sx={{ paddingTop: "5px" }}>
                      Threshold: {minThreshold}&nbsp;
                    </Typography>
                    <Slider
                      size="small"
                      max={points - 1}
                      value={sliderValue}
                      onChange={handleSliderOnChange}
                    />
                    <Typography variant="body2" sx={{ paddingTop: "5px" }}>
                      &nbsp;100
                    </Typography>
                  </Stack>
                </div>
                <div style={{ alignSelf: "stretch" }}>
                  <Typography variant="body2" sx={{ display: "inline-block" }}>
                    Integration Duration:&nbsp;
                  </Typography>
                  <TextField
                    variant="standard"
                    value={intDur ? intDur : ""}
                    inputProps={{ style: { textAlign: "center" } }}
                    onChange={(event) =>
                      handleIntDurInputChange(event.target.value)
                    }
                    sx={{
                      width: "18px",
                      display: "inline-block",
                      "& .MuiInput-root": {
                        fontSize: "0.875rem"
                      },
                      "& .MuiInput-input": {
                        padding: 0
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ display: "inline-block" }}>
                    &nbsp;&mu;s
                  </Typography>
                </div>
              </Stack>
            </div>
          </Stack>
        </Box>
        <Box
          sx={{
            width: WIDTH + "px",
            minHeight: HEIGHT_CONTROLS + "px",
            boxSizing: "border-box",
            padding: PADDING + "px",
            position: "relative",
            bgcolor: "section.background",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Button sx={{ width: "150px" }}>Apply</Button>
          <Button
            variant="text"
            disabled={activeStep === 0}
            onClick={() => handleBackButtonClick()}
            sx={{
              padding: 0,
              position: "absolute",
              top: "50%",
              left: "24px",
              transform: "translate(0%, -50%)"
            }}
          >
            <KeyboardArrowLeft />
            Back
          </Button>
          <Button
            variant="text"
            disabled={activeStep === steps.length - 1}
            onClick={() => handleNextButtonClick()}
            sx={{
              padding: 0,
              position: "absolute",
              top: "50%",
              right: "24px",
              transform: "translate(0%, -50%)"
            }}
          >
            Next
            <KeyboardArrowRight />
          </Button>
        </Box>
      </Stack>
    </>
  );
};

export default Landing;
