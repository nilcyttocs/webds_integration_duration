import React from "react";

import { TouchcommADCReport } from "@webds/service";

export { ContextData, Context } from "./IntegrationDurationComponent";

export const ADCDataContext = React.createContext([] as TouchcommADCReport[]);

export { webdsService } from "../local_exports";

export { requestAPI } from "../local_exports";
