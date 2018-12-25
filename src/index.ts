import React from 'react';
import ReactDOM from 'react-dom';
import Root from './containers/Root';
import './app.global.css';

import { formats, loadSettings } from './utils'
import * as Screens from './redux/screens'
import * as settings  from './redux/settings'
import { Toolbar } from './redux/toolbar'
import * as ReduxRoot from './redux/root'

import configureStore from './store/configureStore'

// TODO prod builds
import { electron } from './utils/electronImports'
import { FileFormat } from './redux/types';

const store = configureStore();

const filename = electron.ipcRenderer.sendSync('get-open-args');
if (filename) {
  // Load a .petmate file that the user clicked on Explorer (Windows only path).
  store.dispatch(ReduxRoot.actions.openWorkspace(filename));
} else {
  // Create one screen/framebuffer so that we have a canvas to draw on
  store.dispatch(Screens.actions.newScreen());
}


// Render the application
ReactDOM.render(
  React.createElement(Root, { store }, null),
  document.getElementById('root')
);

loadSettings((j) => store.dispatch(settings.actions.load(j)))

function dispatchExport(fmt: FileFormat) {
  // Either open an export options modal or go to export directly if the
  // output format doesn't need any configuration.
  if (formats[fmt.ext].exportOptions) {
    store.dispatch(Toolbar.actions.setShowExport({show:true, fmt}))
  } else {
    store.dispatch(ReduxRoot.actions.fileExportAs(fmt))
  }
}

electron.ipcRenderer.on('window-blur', (_event: Event, _message: any) => {
  store.dispatch(Toolbar.actions.setShortcutsActive(false))
  store.dispatch(Toolbar.actions.clearModKeyState())
})

window.addEventListener('focus', () => {
  store.dispatch(Toolbar.actions.setShortcutsActive(true))
  store.dispatch(Toolbar.actions.clearModKeyState())
})
window.addEventListener('blur', () => {
  store.dispatch(Toolbar.actions.setShortcutsActive(false))
  store.dispatch(Toolbar.actions.clearModKeyState())
})

electron.ipcRenderer.on('open-petmate-file', (_event: Event, filename: string) => {
  // Load a .petmate file that was sent to the main process via the open-file
  // event (macOS).  This can be either a double-click on a .petmate file in
  // Finder or drag&drop a .petmate file on the app icon in the task bar.
  store.dispatch(ReduxRoot.actions.openWorkspace(filename));
});

// Listen to commands from the main process
electron.ipcRenderer.on('menu', (_event: Event, message: string) => {
  switch (message) {
    case 'undo':
      store.dispatch(ReduxRoot.actions.undo())
      return
    case 'redo':
      store.dispatch(ReduxRoot.actions.redo())
      return
    case 'new':
      const { dialog } = electron.remote
      if (dialog.showMessageBox({
        type: 'question',
        buttons: ['Reset', 'Cancel'],
        cancelId: 1,
        message: 'Reset workspace?',
        detail: 'This will empty your workspace.  This cannot be undone.'
      }) === 0) {
        store.dispatch(ReduxRoot.actions.resetState())
        store.dispatch(Screens.actions.newScreen())
      }
      return
    case 'open':
      store.dispatch(ReduxRoot.actions.fileOpenWorkspace())
      return
    case 'save-as':
      store.dispatch(ReduxRoot.actions.fileSaveAsWorkspace())
      return
    case 'save':
      store.dispatch(ReduxRoot.actions.fileSaveWorkspace())
      return
    case 'export-png':
      dispatchExport(formats.png)
      return
    case 'export-marq-c':
      dispatchExport(formats.c)
      return
    case 'export-asm':
      dispatchExport(formats.asm)
      return
    case 'export-basic':
      dispatchExport(formats.bas)
      return
    case 'export-prg':
      dispatchExport(formats.prg)
      return
    case 'export-gif':
      dispatchExport(formats.gif)
      return
    case 'import-marq-c':
      store.dispatch(ReduxRoot.actions.fileImportAppend(formats.c))
      return
    case 'import-png':
      store.dispatch(Toolbar.actions.setShowImport({show: true, fmt: formats.png}));
      return
    case 'preferences':
      store.dispatch(Toolbar.actions.setShowSettings(true))
      return
    case 'new-screen':
      store.dispatch(Screens.actions.newScreen())
      return;
    case 'shift-screen-left':
      store.dispatch(Toolbar.actions.shiftHorizontal(-1))
      return;
    case 'shift-screen-right':
      store.dispatch(Toolbar.actions.shiftHorizontal(+1))
      return;
    case 'shift-screen-up':
      store.dispatch(Toolbar.actions.shiftVertical(-1))
      return;
    case 'shift-screen-down':
      store.dispatch(Toolbar.actions.shiftVertical(+1))
      return;
    default:
      console.warn('unknown message from main process', message)
  }
})
