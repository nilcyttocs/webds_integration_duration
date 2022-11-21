export const ALERT_MESSAGE_APP_INFO =
  "Failed to read application info from device.";

export const ALERT_MESSAGE_STATIC_CONFIG =
  "Failed to read static config from device.";

export const ALERT_MESSAGE_STATIC_CONFIG_ENTRIES =
  "Failed to located required static config entries. Please ensure running firmware supports integration duration tuning.";

export const ALERT_MESSAGE_TUNING_INITIALIZATION =
  "Faled to initialize tuning process.";

export const ALERT_MESSAGE_TUNING_BASELINE_DATA =
  "Faled to collect baseline data.";

export const ALERT_MESSAGE_TUNING_TEST_PIXEL_DATA =
  "Faled to collect test pixel data.";

export const ALERT_MESSAGE_TUNING_RESULTS =
  "Failed to obtain tuning results. Please ensure valid finger delta provided during data collection.";

export const ALERT_MESSAGE_TUNING_CANCEL = " Failed to cancel data collection";

export const STATIC_CONFIG_ENTRIES = [
  "integDur",
  "freqTable[0].stretchDur",
  "freqTable[0].rstretchDur"
];

export const EVENT_NAME = "integration_duration";

export const STEPPER_STEPS = {
  1: {
    label: "Collect Baseline Data",
    content: `Baseline data is collected during this step. Do not touch sensor during data collection. Click "Collect" button when ready.`
  },
  2: {
    label: "Collect Test Pixel Data",
    content: `Test pixel data is collected during this step. Place finger in area circled in red on sensor and click "Collect" button. Do not lift finger until data collection is complete. Repeat for each test pixel.`,
    alert: `Please complete baseline data collection first.`
  },
  3: {
    label: "Select Integration Duration",
    content: `Use right panel to select integration duration. Write selection to RAM for temporary usage or flash for persistent usage.`,
    alert: `Please carry out data collection steps to complete tuning first.`
  }
};
