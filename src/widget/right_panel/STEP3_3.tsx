import React, { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { MAX_X_RANGE } from '../constants';
import { Context, ContextData } from '../local_exports';
import { ConfigInput } from '../mui_extensions/Inputs';

const findEntry = (obj: any, entry: string): any => {
  if (entry in obj) {
    return obj[entry];
  }
  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      const result = findEntry(obj[key], entry);
      if (typeof result !== 'undefined') {
        return result;
      }
    }
  }
};

export const STEP3_3 = (props: any): JSX.Element => {
  const theme = useTheme();

  const contextData: ContextData = useContext(Context);
  const configData = findEntry(contextData.configJSON, 'integDur');
  configData.elements = 1;

  const handleIntDurInputChange = (value: string) => {
    if (value !== '' && isNaN(Number(value))) {
      return;
    }
    if (value === '') {
      props.setIntDur(undefined);
      return;
    }
    const num = parseInt(value, 10);
    if (num < MAX_X_RANGE) {
      props.setIntDur(num);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <ConfigInput
        configEntry={configData}
        handleInputValueChange={handleIntDurInputChange}
        inputValue={props.intDur !== undefined ? props.intDur : ''}
        inputValueUnits="TAC clock periods"
        inputValueColor={
          props.intDur !== undefined && props.modelParams !== undefined
            ? props.intDur < props.modelParams.minimumIntDur
              ? 'red'
              : theme.palette.text.primary
            : null
        }
        tooltip={
          props.intDur !== undefined && props.modelParams !== undefined
            ? props.intDur < props.modelParams.minimumIntDur
              ? 'suggested minimum: ' + props.modelParams.minimumIntDur
              : ''
            : ''
        }
      />
    </div>
  );
};

export default STEP3_3;
