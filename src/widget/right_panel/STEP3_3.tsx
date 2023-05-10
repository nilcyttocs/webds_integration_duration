import React, { useContext } from 'react';

import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { MAX_X_RANGE } from '../constants';
import { Context, ContextData } from '../local_exports';

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
        //alignItems: 'center'
      }}
    >
      <Typography sx={{ fontWeight: 'bold' }}>{configData.name}</Typography>
      <div style={{ marginTop: '8px', alignSelf: 'stretch' }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 'bold', display: 'inline-block' }}
        >
          Value:&nbsp;
        </Typography>
        <Tooltip
          title={
            props.intDur !== undefined
              ? props.intDur < props.modelParams.minimumIntDur
                ? 'suggested minimum: ' + props.modelParams.minimumIntDur
                : ''
              : ''
          }
          arrow
        >
          <TextField
            variant="standard"
            disabled={props.modelParams === undefined}
            value={props.intDur !== undefined ? props.intDur : ''}
            inputProps={{ style: { textAlign: 'center' } }}
            onChange={event => handleIntDurInputChange(event.target.value)}
            sx={{
              width: '48px',
              display: 'inline-block',
              '& .MuiInput-root': {
                fontSize: '0.875rem'
              },
              '& .MuiInput-input': {
                padding: 0,
                color:
                  props.intDur !== undefined
                    ? props.intDur < props.modelParams.minimumIntDur
                      ? 'red'
                      : theme.palette.text.primary
                    : null
              }
            }}
          />
        </Tooltip>
        <Typography
          variant="body2"
          sx={{
            display: 'inline-block',
            fontSize: '0.65rem'
          }}
        >
          &nbsp;(TAC clock periods)
        </Typography>
      </div>
      <div style={{ marginTop: '8px' }}>
        <Stack spacing={5} direction="row">
          <div>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Type
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {configData.type}
            </Typography>
          </div>
          <div>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Min
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}
            >
              {configData.min}
            </Typography>
          </div>
          <div>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Max
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}
            >
              {configData.max}
            </Typography>
          </div>
        </Stack>
        <div style={{ marginTop: '8px' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Description
          </Typography>
          {configData.description && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {configData.description.trim()}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default STEP3_3;
