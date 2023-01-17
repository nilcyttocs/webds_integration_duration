import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { WebDSService, WebDSWidget } from '@webds/service';

import { integrationDurationIcon } from './icons';
import IntegrationDurationWidget from './widget/IntegrationDurationWidget';

namespace Attributes {
  export const command = 'webds_integration_duration:open';
  export const id = 'webds_integration_duration_widget';
  export const label = 'Integration Duration';
  export const caption = 'Integration Duration';
  export const category = 'Touch - Config Library';
  export const rank = 40;
}

export let webdsService: WebDSService;

/**
 * Initialization data for the @webds/integration_duration extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@webds/integration_duration:plugin',
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService
  ) => {
    console.log(
      'JupyterLab extension @webds/integration_duration is activated!'
    );

    webdsService = service;

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = Attributes.command;
    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
      icon: (args: { [x: string]: any }) => {
        return args['isLauncher'] ? integrationDurationIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new IntegrationDurationWidget(Attributes.id);
          widget = new WebDSWidget<IntegrationDurationWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.icon = integrationDurationIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) tracker.add(widget);

        if (!widget.isAttached) shell.add(widget, 'main');

        shell.activateById(widget.id);
      }
    });

    launcher.add({
      command,
      args: { isLauncher: true },
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({
      namespace: Attributes.id
    });
    restorer.restore(tracker, {
      command,
      name: () => Attributes.id
    });
  }
};

export default plugin;
