export const IPC = {
  SELECT_FILES: 'select-files',
  PROCESS_FILE: 'process-file',
  CANCEL_FILE: 'cancel-file',
  PROGRESS: 'progress',
  DONE: 'done',
  ERROR: 'error',
  GET_CAPABILITIES: 'get-capabilities',
  OPEN_FOLDER: 'open-folder',
  SELECT_FOLDER: 'select-folder',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
