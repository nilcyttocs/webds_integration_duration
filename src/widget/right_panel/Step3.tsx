import React, { useState } from 'react';

import { CarousalNavigation } from '../mui_extensions/Navigation';
import STEP3_1 from './STEP3_1';
import STEP3_2 from './STEP3_2';
import STEP3_3 from './STEP3_3';

export const Step3 = (props: any): JSX.Element => {
  const [step, setStep] = useState(1);

  const showStep = (): JSX.Element | null => {
    switch (step) {
      case 1:
        return (
          <STEP3_1
            modelParams={props.modelParams}
            intDur={props.intDur}
            setIntDur={props.setIntDur}
          />
        );
      case 2:
        return <STEP3_2 />;
      case 3:
        return (
          <STEP3_3
            modelParams={props.modelParams}
            intDur={props.intDur}
            setIntDur={props.setIntDur}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {showStep()}
      <CarousalNavigation
        disabled={props.modelParams === undefined}
        onStepClick={(step: number) => setStep(step)}
        sx={{ position: 'absolute', bottom: 0 }}
      />
    </div>
  );
};

export default Step3;
