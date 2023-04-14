import React, { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';

import {
  ALERT_MESSAGE_APP_INFO,
  ALERT_MESSAGE_PRIVATE_CONFIG_JSON,
  ALERT_MESSAGE_PUBLIC_CONFIG_JSON,
  ALERT_MESSAGE_STATIC_CONFIG,
  ALERT_MESSAGE_STATIC_CONFIG_ENTRIES,
  CONFIG_ENTRIES
} from './constants';
import Landing from './Landing';
import { requestAPI, webdsService } from './local_exports';

export type ContextData = {
  numRows: number;
  numCols: number;
  txOnYAxis: boolean;
};

export const Context = React.createContext({} as ContextData);

export const IntegrationDurationComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<string | undefined>(undefined);
  const [colsRows, setColsRows] = useState<[number, number]>([0, 0]);
  const [txOnYAxis, setTxOnYAxis] = useState<boolean>(true);
  const [configValues, setConfigValues] = useState<any[]>([]);

  const webdsTheme = webdsService.ui.getWebDSTheme();

  useEffect(() => {
    const initialize = async () => {
      const external = webdsService.pinormos.isExternal();
      try {
        if (external) {
          await webdsService.packrat.cache.addPublicConfig();
        } else {
          await webdsService.packrat.cache.addPrivateConfig();
        }
      } catch (error) {
        console.error(error);
        if (external) {
          setAlert(ALERT_MESSAGE_PUBLIC_CONFIG_JSON);
        } else {
          setAlert(ALERT_MESSAGE_PRIVATE_CONFIG_JSON);
        }
        return;
      }
      const dataToSend: any = {
        command: 'getAppInfo'
      };
      try {
        const response = await requestAPI<any>('command', {
          body: JSON.stringify(dataToSend),
          method: 'POST'
        });
        if (response.numCols && response.numRows) {
          setColsRows([response.numCols, response.numRows]);
        }
      } catch (error) {
        console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
        setAlert(ALERT_MESSAGE_APP_INFO);
        return;
      }
      try {
        const config = await webdsService.touchcomm.readStaticConfig();
        if (!CONFIG_ENTRIES.every(item => item in config)) {
          setAlert(ALERT_MESSAGE_STATIC_CONFIG_ENTRIES);
          return;
        }
        setConfigValues(CONFIG_ENTRIES.map(item => config[item]));
        if (config.txAxis) {
          setTxOnYAxis(!!config.txAxis);
        }
      } catch (error) {
        console.error(error);
        setAlert(ALERT_MESSAGE_STATIC_CONFIG);
        return;
      }
      setInitialized(true);
    };
    initialize();
  }, []);

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert !== undefined && (
            <Alert
              severity="error"
              onClose={() => setAlert(undefined)}
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {alert}
            </Alert>
          )}
          {initialized && (
            <Context.Provider
              value={{
                numRows: colsRows[1],
                numCols: colsRows[0],
                txOnYAxis: txOnYAxis
              }}
            >
              <Landing setAlert={setAlert} configValues={configValues} />
            </Context.Provider>
          )}
        </div>
        {!initialized && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
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
