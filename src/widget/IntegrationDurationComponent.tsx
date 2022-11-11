import React, { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";

import { ThemeProvider } from "@mui/material/styles";

import Landing from "./Landing";

import { requestAPI } from "../handler";

export type ContextData = {
  numRows: number;
  numCols: number;
};

export const Context = React.createContext({} as ContextData);

let alertMessage = "";

const alertMessageAppInfo = "Failed to read application info from device.";

export const IntegrationDurationComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [colsRows, setColsRows] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const initialize = async () => {
      const dataToSend: any = {
        command: "getAppInfo"
      };
      try {
        const response = await requestAPI<any>("command", {
          body: JSON.stringify(dataToSend),
          method: "POST"
        });
        if (response.numCols && response.numRows) {
          setColsRows([response.numCols, response.numRows]);
        }
      } catch (error) {
        console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
        alertMessage = alertMessageAppInfo;
        setAlert(true);
        return;
      }
      setInitialized(true);
    };
    initialize();
  }, []);

  const webdsTheme = props.service.ui.getWebDSTheme();

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert && (
            <Alert
              severity="error"
              onClose={() => setAlert(false)}
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {alertMessage}
            </Alert>
          )}
          {initialized && (
            <Context.Provider
              value={{ numRows: colsRows[1], numCols: colsRows[0] }}
            >
              <Landing />
            </Context.Provider>
          )}
        </div>
        {!initialized && (
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
      </ThemeProvider>
    </>
  );
};

export default IntegrationDurationComponent;
