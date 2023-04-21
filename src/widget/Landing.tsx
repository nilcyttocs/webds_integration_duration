import React, { useContext, useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import {
  ALERT_MESSAGE_TUNING_BASELINE_DATA,
  ALERT_MESSAGE_TUNING_CANCEL,
  ALERT_MESSAGE_TUNING_INITIALIZATION,
  ALERT_MESSAGE_TUNING_RESULTS,
  ALERT_MESSAGE_TUNING_TEST_PIXEL_DATA,
  ALERT_MESSAGE_WRITE_TO_FLASH,
  ALERT_MESSAGE_WRITE_TO_RAM,
  CONFIG_ENTRIES,
  CONFIG_PARAMS,
  EVENT_NAME,
  STEPPER_STEPS
} from './constants';
import {
  Context,
  ContextData,
  requestAPI,
  webdsService
} from './local_exports';
import {
  BackButton,
  NextButton,
  ProgressButton
} from './mui_extensions/Buttons';
import { Canvas } from './mui_extensions/Canvas';
import {
  CANVAS_ATTRS,
  ContentAttrs,
  getContentAttrs
} from './mui_extensions/constants';
import { Content } from './mui_extensions/Content';
import { Controls } from './mui_extensions/Controls';
import { VerticalStepper } from './mui_extensions/Navigation';
import Step1 from './right_panel/Step1';
import Step2 from './right_panel/Step2';
import Step3 from './right_panel/Step3';

const SSE_CLOSED = 2;

const contentAttrs: ContentAttrs = getContentAttrs();

type ModelParams = {
  tau: number;
  bigA: number | null;
  bigD: number | null;
  minimumIntDur: number;
  optimalIntDur: [number, boolean];
};

let eventSource: EventSource | undefined = undefined;

const testPixels = [
  {
    pixel: {},
    circle: {
      bottom: 0,
      left: 0,
      transform: 'translate(-35%, 35%)'
    }
  },
  {
    pixel: {},
    circle: {
      top: 0,
      left: 0,
      transform: 'translate(-35%, -35%)'
    }
  },
  {
    pixel: {},
    circle: {
      top: 0,
      right: 0,
      transform: 'translate(35%, -35%)'
    }
  },
  {
    pixel: {},
    circle: {
      bottom: 0,
      right: 0,
      transform: 'translate(35%, 35%)'
    }
  }
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const postRequest = async (request: string, args?: any[]) => {
  const dataToSend: any = {
    request
  };
  if (args) {
    dataToSend['arguments'] = args;
  }
  try {
    const response = await requestAPI<any>('tutor/IntDur', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return response;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const Landing = (props: any): JSX.Element => {
  const [intDur, setIntDur] = useState<number | undefined>();
  const [current, setCurrent] = useState<number>();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [stepsCompleted, setStepsCompleted] = useState<number[]>([]);
  const [progress1, setProgress1] = useState<number | undefined>(undefined);
  const [progress2, setProgress2] = useState<number | undefined>(undefined);
  const [testPixel, setTestPixel] = useState<number>(0);
  const [testPixelInProgress, setTestPixelInProgress] = useState<boolean>(true);
  const [testPixelPauseResume, setTestPixelPauseResume] = useState<string>('');
  const [modelParams, setModelParams] = useState<ModelParams | undefined>();
  const [writtenToRAM, setWrittenToRAM] = useState<boolean>(true);
  const [writtenToFlash, setWrittenToFlash] = useState<boolean>(true);

  const contextData: ContextData = useContext(Context);

  const theme = useTheme();

  const collecting =
    (progress1 !== undefined && progress1 < 100) ||
    (progress2 !== undefined && progress2 < 100);

  const setStepComplete = (step: number) => {
    setStepsCompleted(prev => {
      const completed = [...prev];
      if (!completed.includes(step)) {
        completed.push(step);
      }
      return completed;
    });
  };

  const resetStepComplete = (step: number) => {
    setStepsCompleted(prev => {
      const completed = [...prev];
      const index = completed.indexOf(step);
      if (index > -1) {
        completed.splice(index, 1);
      }
      return completed;
    });
  };

  const prepareStep = (step: number) => {
    switch (step) {
      case 1:
        setProgress1(undefined);
        break;
      case 2:
        setTestPixelInProgress(true);
        setProgress2(undefined);
        break;
      case 3:
        break;
      default:
        break;
    }
  };

  const eventHandler = async (event: any) => {
    const data = JSON.parse(event.data);

    if (data.state === 'running') {
      switch (activeStep) {
        case 1:
          if (data.progress === 100) {
            setProgress1(99.9);
            await sleep(500);
          }
          setProgress1(data.progress);
          break;
        case 2:
          if (data.progress === 100) {
            setProgress2(99.9);
            await sleep(500);
          }
          if (data.progress === 100 && testPixel + 1 !== testPixels.length) {
            prepareStep(2);
          } else {
            setProgress2(data.progress);
          }
          break;
        default:
          break;
      }
    } else if (data.state === 'completed') {
      eventSource!.removeEventListener(EVENT_NAME, eventHandler, false);
      eventSource!.close();
      eventSource = undefined;
      switch (activeStep) {
        case 1:
          setStepComplete(1);
          break;
        case 2:
          await sleep(500);
          const nextPixel =
            testPixel + 1 >= testPixels.length ? 0 : testPixel + 1;
          setTestPixel(nextPixel);
          if (nextPixel === 0) {
            try {
              const results = await postRequest('get_results');
              console.log(results);
              setModelParams(results as ModelParams);
              setTestPixelInProgress(false);
              setStepComplete(2);
            } catch (error) {
              console.error(error);
              props.setAlert(ALERT_MESSAGE_TUNING_RESULTS);
              await sleep(500);
              prepareStep(2);
            }
          }
          setTestPixelPauseResume('resume');
          break;
        default:
          break;
      }
    }
  };

  const removeEvent = () => {
    if (eventSource && eventSource.readyState !== SSE_CLOSED) {
      eventSource.removeEventListener(EVENT_NAME, eventHandler, false);
      eventSource.close();
      eventSource = undefined;
    }
  };

  const errorHandler = (error: any) => {
    removeEvent();
    console.error(`Error - GET /webds/tutor/event\n${error}`);
  };

  const addEvent = () => {
    if (eventSource) {
      return;
    }
    eventSource = new window.EventSource('/webds/tutor/event');
    eventSource.addEventListener(EVENT_NAME, eventHandler, false);
    eventSource.addEventListener('error', errorHandler, false);
  };

  const handleNextButtonClick = () => {
    setActiveStep(prevActiveStep => {
      prepareStep(prevActiveStep + 1);
      return prevActiveStep + 1;
    });
  };

  const handleBackButtonClick = () => {
    setActiveStep(prevActiveStep => {
      prepareStep(prevActiveStep - 1);
      return prevActiveStep - 1;
    });
  };

  const handleCollectButtonClick = async (step: number) => {
    switch (step) {
      case 1:
        setProgress1(0);
        resetStepComplete(1);
        addEvent();
        setModelParams(undefined);
        try {
          await postRequest('collect_baseline_data');
        } catch (error) {
          console.error(error);
          props.setAlert(ALERT_MESSAGE_TUNING_BASELINE_DATA);
        }
        break;
      case 2:
        setProgress2(0);
        resetStepComplete(2);
        addEvent();
        setModelParams(undefined);
        setTestPixelPauseResume('pause');
        await sleep(1000);
        try {
          await postRequest('collect_test_pixel_data', [testPixel]);
        } catch (error) {
          console.error(error);
          props.setAlert(ALERT_MESSAGE_TUNING_TEST_PIXEL_DATA);
        }
        break;
      default:
        break;
    }
  };

  const handleDoneButtonClick = (step: number) => {
    handleNextButtonClick();
  };

  const handleResetButtonClick = (step: number) => {
    prepareStep(step);
  };

  const handleCancelButtonClick = async (step: number) => {
    try {
      await postRequest('cancel');
      eventSource!.removeEventListener(EVENT_NAME, eventHandler, false);
      eventSource!.close();
      eventSource = undefined;
      switch (activeStep) {
        case 1:
          prepareStep(1);
          break;
        case 2:
          prepareStep(2);
          setTestPixelPauseResume('resume');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
      props.setAlert(ALERT_MESSAGE_TUNING_CANCEL);
    }
  };

  const handleWriteConfigButtonClick = async (commit: boolean) => {
    const entries: any = {};
    CONFIG_ENTRIES.forEach((item, index) => {
      const value = props.configValues[index];
      switch (index) {
        case 0:
          value[CONFIG_PARAMS.SFTYPE_TRANS] = intDur;
          break;
        case 1:
          value[CONFIG_PARAMS.STRETCH_INDEX] =
            intDur! >= CONFIG_PARAMS.INT_DUR_FLOOR
              ? 0
              : CONFIG_PARAMS.INT_DUR_FLOOR - intDur!;
          break;
        case 2:
          value[CONFIG_PARAMS.STRETCH_INDEX] = CONFIG_PARAMS.ISTRETCH_DUR;
          break;
        default:
          break;
      }
      entries[item] = value;
    });
    try {
      await webdsService.touchcomm.writeStaticConfig(entries, commit);
    } catch (error) {
      console.error(error);
      props.setAlert(
        commit ? ALERT_MESSAGE_WRITE_TO_FLASH : ALERT_MESSAGE_WRITE_TO_RAM
      );
    }
    setCurrent(intDur);
    setWrittenToRAM(true);
    setWrittenToFlash(commit);
  };

  const rightPanel: (JSX.Element | null)[] = [
    <Step1 />,
    <Step2
      disabled={!stepsCompleted.includes(1)}
      testPixel={testPixel}
      testPixels={testPixels}
      inProgress={testPixelInProgress}
      pauseResume={testPixelPauseResume}
    />,
    <Step3 modelParams={modelParams} setIntDur={setIntDur} current={current} />
  ];

  const steps = [
    {
      label: STEPPER_STEPS['1'].label,
      content: (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="body2">{STEPPER_STEPS['1'].content}</Typography>
          <ProgressButton
            progress={progress1}
            onClick={() => {
              handleCollectButtonClick(1);
            }}
            onDoneClick={() => {
              handleDoneButtonClick(1);
            }}
            onResetClick={() => {
              handleResetButtonClick(1);
            }}
            onCancelClick={() => {
              handleCancelButtonClick(1);
            }}
            sx={{ margin: '16px 0px' }}
          >
            Collect
          </ProgressButton>
        </div>
      )
    },
    {
      label: STEPPER_STEPS['2'].label,
      content: (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: !stepsCompleted.includes(1)
                ? theme.palette.text.disabled
                : theme.palette.text.primary
            }}
          >
            {STEPPER_STEPS['2'].content}
          </Typography>
          <ProgressButton
            disabled={!stepsCompleted.includes(1)}
            progress={progress2}
            onClick={() => {
              handleCollectButtonClick(2);
            }}
            onDoneClick={() => {
              handleDoneButtonClick(2);
            }}
            onResetClick={() => {
              handleResetButtonClick(2);
            }}
            onCancelClick={() => {
              handleCancelButtonClick(2);
            }}
            sx={{ margin: '16px 0px' }}
          >
            Collect
          </ProgressButton>
          {!stepsCompleted.includes(1) && (
            <Typography variant="body2" color="red">
              {STEPPER_STEPS['2'].alert}
            </Typography>
          )}
        </div>
      )
    },
    {
      label: STEPPER_STEPS['3'].label,
      content: (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: [1, 2].some(item => stepsCompleted.indexOf(item) === -1)
                ? theme.palette.text.disabled
                : theme.palette.text.primary
            }}
          >
            {STEPPER_STEPS['3'].content}
          </Typography>
          <div
            style={{
              margin: '16px 0px',
              display: 'flex',
              flexDirection: 'row',
              gap: '16px'
            }}
          >
            <Button
              disabled={
                intDur === undefined ||
                (intDur === current && writtenToRAM) ||
                [1, 2].some(item => stepsCompleted.indexOf(item) === -1)
              }
              onClick={() => handleWriteConfigButtonClick(false)}
              sx={{ width: '125px' }}
            >
              Write to RAM
            </Button>
            <Button
              disabled={
                intDur === undefined ||
                (intDur === current && writtenToFlash) ||
                [1, 2].some(item => stepsCompleted.indexOf(item) === -1)
              }
              onClick={() => handleWriteConfigButtonClick(true)}
              sx={{ width: '125px' }}
            >
              Write to Flash
            </Button>
          </div>
          {[1, 2].some(item => stepsCompleted.indexOf(item) === -1) && (
            <Typography variant="body2" color="red">
              {STEPPER_STEPS['3'].alert}
            </Typography>
          )}
        </div>
      )
    }
  ];

  useEffect(() => {
    const initialize = async () => {
      try {
        await postRequest('initialize', [testPixels]);
      } catch (error) {
        console.error(error);
        props.setAlert(ALERT_MESSAGE_TUNING_INITIALIZATION);
        return;
      }
    };
    const numRows = contextData.numRows;
    const numCols = contextData.numCols;
    const txOnYAxis = contextData.txOnYAxis;
    if (txOnYAxis) {
      testPixels[0].pixel = { rx: 0, tx: 0 };
      testPixels[1].pixel = { rx: 0, tx: numRows - 1 };
      testPixels[2].pixel = { rx: numCols - 1, tx: numRows - 1 };
      testPixels[3].pixel = { rx: numCols - 1, tx: 0 };
    } else {
      testPixels[0].pixel = { rx: 0, tx: 0 };
      testPixels[1].pixel = { rx: 0, tx: numCols - 1 };
      testPixels[2].pixel = { rx: numRows - 1, tx: numCols - 1 };
      testPixels[3].pixel = { rx: numRows - 1, tx: 0 };
    }
    initialize();
    setCurrent(props.configValues[0][CONFIG_PARAMS.SFTYPE_TRANS]);
    return () => {
      removeEvent();
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
                  'px'
              }}
            />
          }
        >
          <div
            style={{
              width: contentAttrs.PANEL_WIDTH + 'px',
              minHeight:
                CANVAS_ATTRS.MIN_HEIGHT_CONTENT -
                CANVAS_ATTRS.PADDING * 2 +
                'px',
              position: 'relative'
            }}
          >
            <VerticalStepper
              steps={steps}
              strict={collecting}
              activeStep={activeStep}
              onStepClick={clickedStep => {
                prepareStep(clickedStep);
                setActiveStep(clickedStep);
              }}
            />
          </div>
          <div
            style={{
              width: contentAttrs.PANEL_WIDTH + 'px',
              minHeight:
                CANVAS_ATTRS.MIN_HEIGHT_CONTENT -
                CANVAS_ATTRS.PADDING * 2 +
                'px',
              position: 'relative'
            }}
          >
            {rightPanel[activeStep - 1]}
          </div>
        </Stack>
      </Content>
      <Controls
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <BackButton
          disabled={activeStep === 1 || collecting}
          onClick={() => handleBackButtonClick()}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '24px',
            transform: 'translate(0%, -50%)'
          }}
        />
        <NextButton
          disabled={activeStep === steps.length || collecting}
          onClick={() => handleNextButtonClick()}
          sx={{
            position: 'absolute',
            top: '50%',
            right: '24px',
            transform: 'translate(0%, -50%)'
          }}
        />
      </Controls>
    </Canvas>
  );
};

export default Landing;
