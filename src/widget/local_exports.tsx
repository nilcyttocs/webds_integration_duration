import React from "react";

import { TouchcommADCReport } from "@webds/service";

export { webdsService } from "../local_exports";

export { ContextData, Context } from "../local_exports";

export { requestAPI } from "../local_exports";

export const ADCDataContext = React.createContext([] as TouchcommADCReport[]);
