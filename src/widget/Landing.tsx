import React, { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import LinearProgress from "@mui/material/LinearProgress";

import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";

import { useTheme } from "@mui/material/styles";

import Plot from "react-plotly.js";

import { Canvas } from "./mui_extensions/Canvas";
import { Content } from "./mui_extensions/Content";
import { Controls } from "./mui_extensions/Controls";
import {
  CANVAS_ATTRS,
  ContentAttrs,
  getContentAttrs
} from "./mui_extensions/constants";

import { VerticalStepper } from "./mui_extensions/Stepper";

import { BackButton, NextButton } from "./mui_extensions/Button";

import Step2 from "./right_panel/Step2";

import { requestAPI } from "../handler";

const contentAttrs: ContentAttrs = getContentAttrs();

const PLOT_WIDTH = contentAttrs.PANEL_WIDTH;
const PLOT_HEIGHT = 300;

const steps = [
  {
    label: "Collect Baseline Data",
    content: (
      <Typography>
        Baseline data is collected during this step. Do not touch sensor during
        data collection. Click "Collect" button when ready.
      </Typography>
    )
  },
  {
    label: "Collect Test Pixel Data",
    content: (
      <Typography>
        Test pixel signal data is collected during this step. Place finger in
        circled area on sensor and do not lift finger until data collection is
        complete. Click "Collect" button when ready.
      </Typography>
    )
  },
  {
    label: "Select Integration Duration"
  }
];

const rawData = {
  x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  y: [0, 7, 17, 16, 19, 22, 21, 23, 25, 24, 25]
};

const rawXMin = Math.min.apply(null, rawData.x);
const rawXMax = Math.max.apply(null, rawData.x);
const rawXRange = rawXMax - rawXMin;
const rawYMin = Math.min.apply(null, rawData.y);
const rawYMax = Math.max.apply(null, rawData.y);
const rawYRange = rawYMax - rawYMin;

const fittedData = {
  x: rawData.x.slice(1),
  y: [] as number[]
};

const plotRangeX = [0, rawXMax + rawXRange / 10];
const plotRangeY = [0, 110];

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
    x: scatterData.x.slice(1),
    y: scatterData.y.slice(1),
    type: "scatter",
    mode: "markers",
    marker: {
      color: "#007dc3",
      size: 10
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
  showlegend: false
};

const sigmoid = (x: number, L: number, x0: number, k: number, b: number) => {
  const y = L / (1 + Math.exp(-k * (x - x0))) + b;
  return y;
};

let sigmoidParams: [number, number, number, number];

let minThreshold = 0;

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

const updatePlot = (value: number): number => {
  const threshold: number = fittedData.y.reduce(function (prev, curr) {
    return curr > value ? prev : curr;
  });
  const intDur = fittedData.x[fittedData.y.indexOf(threshold)];
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
    fittedData.x.forEach((item) => {
      fittedData.y.push(
        Math.round(
          ((sigmoid(item, ...sigmoidParams) - sigmoidYMin) / sigmoidYRange) *
            100
        )
      );
    });
    minThreshold = fittedData.y[0];
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
  const [sliderMarks, setSliderMarks] = useState<any>([]);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);

  const theme = useTheme();

  const storeState = (figure: any) => {
    setData(figure.data);
    setLayout(figure.layout);
    setConfig(figure.config);
    setFrames(figure.frames);
  };

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

  const handleNextButtonClick = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBackButtonClick = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSliderOnChange = (event: any) => {
    let threshold: number | undefined = undefined;
    if (fittedData.y.includes(event.target.value)) {
      threshold = event.target.value;
    } else {
      for (let i = 1; i <= 2; i++) {
        threshold = fittedData.y
          .slice()
          .reverse()
          .find((item) => Math.abs(item - event.target.value) <= i);
        if (threshold) {
          break;
        }
      }
    }
    if (threshold) {
      const intDur = updatePlot(threshold);
      setData([plotData[0], plotData[1]]);
      setLayout(plotLayout);
      setIntDur(intDur);
      setSliderValue(threshold);
      return;
    } else {
      setSliderValue(event.target.value);
    }
  };

  const rightPanel: (JSX.Element | null)[] = [
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
        <Button sx={{ width: "150px" }}>Collect</Button>
        <LinearProgress sx={{ width: "150px", marginTop: "16px" }} />
      </div>
    </div>,
    <Step2 />,
    <Stack spacing={3} direction="column" alignItems="center">
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
      <div style={{ width: contentAttrs.PANEL_WIDTH + "px" }}>
        <Stack spacing={1} direction="row">
          <Typography variant="body2" sx={{ paddingTop: "5px" }}>
            Threshold: {minThreshold}&nbsp;
          </Typography>
          <Slider
            size="small"
            min={minThreshold}
            max={100}
            marks={sliderMarks}
            value={sliderValue}
            onChange={handleSliderOnChange}
            sx={{
              "& .MuiSlider-mark": {
                height: 8,
                backgroundColor: "divider",
                "&.MuiSlider-markActive": {
                  opacity: 1,
                  backgroundColor: "currentColor"
                }
              }
            }}
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
          onChange={(event) => handleIntDurInputChange(event.target.value)}
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
  ];

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
        setSliderMarks(
          fittedData.y.map((item) => {
            return { value: item };
          })
        );
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
    <Canvas title="Integration Duration">
      <Content>
        <Stack
          spacing={contentAttrs.PANEL_SPACING}
          direction="row"
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                minHeight:
                  CANVAS_ATTRS.MIN_HEIGHT_CONTENT -
                  CANVAS_ATTRS.PADDING * 2 +
                  "px"
              }}
            />
          }
        >
          <div
            style={{
              width: contentAttrs.PANEL_WIDTH + "px",
              minHeight:
                CANVAS_ATTRS.MIN_HEIGHT_CONTENT -
                CANVAS_ATTRS.PADDING * 2 +
                "px",
              position: "relative"
            }}
          >
            <VerticalStepper
              steps={steps}
              activeStep={activeStep}
              onStepClick={(step) => {
                setActiveStep(step);
              }}
            />
          </div>
          <div
            style={{
              width: contentAttrs.PANEL_WIDTH + "px",
              minHeight:
                CANVAS_ATTRS.MIN_HEIGHT_CONTENT -
                CANVAS_ATTRS.PADDING * 2 +
                "px",
              position: "relative"
            }}
          >
            {rightPanel[activeStep]}
          </div>
        </Stack>
      </Content>
      <Controls
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <BackButton
          disabled={activeStep === 0}
          onClick={() => handleBackButtonClick()}
          sx={{
            position: "absolute",
            top: "50%",
            left: "24px",
            transform: "translate(0%, -50%)"
          }}
        />
        <NextButton
          disabled={activeStep === steps.length - 1}
          onClick={() => handleNextButtonClick()}
          sx={{
            position: "absolute",
            top: "50%",
            right: "24px",
            transform: "translate(0%, -50%)"
          }}
        />
      </Controls>
    </Canvas>
  );
};

export default Landing;
