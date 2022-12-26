import React from "react";

import { TouchcommADCReport } from "@webds/service";

export { webdsService } from "./widget/IntegrationDurationWidget";

export { ContextData, Context } from "./widget/IntegrationDurationComponent";

export { requestAPI } from "./handler";

export const ADCDataContext = React.createContext([] as TouchcommADCReport[]);
