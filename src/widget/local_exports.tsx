import React from "react";

import { TouchcommADCReport } from "@webds/service";

export { ContextData, Context } from "./IntegrationDurationComponent";

export { requestAPI } from "../handler";

export const ADCDataContext = React.createContext([] as TouchcommADCReport[]);
