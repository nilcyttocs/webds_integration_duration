import React from 'react';

import { TouchcommADCReport } from '@webds/service';

export { requestAPI, webdsService } from '../local_exports';
export { Context, ContextData } from './IntegrationDurationComponent';

export const ADCDataContext = React.createContext([] as TouchcommADCReport[]);
