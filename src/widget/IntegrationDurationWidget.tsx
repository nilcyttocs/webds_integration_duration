import React from 'react';

import { ReactWidget } from '@jupyterlab/apputils';

import IntegrationDurationComponent from './IntegrationDurationComponent';

export class IntegrationDurationWidget extends ReactWidget {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + '_component'}>
        <IntegrationDurationComponent />
      </div>
    );
  }
}

export default IntegrationDurationWidget;
