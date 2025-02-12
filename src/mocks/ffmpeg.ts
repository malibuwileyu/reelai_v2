interface FFmpegProgressEvent {
  progress: number;
  time: number;
  duration?: number;
}

export const mockFFmpeg = {
  load: jest.fn(),
  exec: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  deleteFile: jest.fn(),
  terminate: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

export const mockFFmpegUtils = {
  fetchFile: jest.fn(),
  toBlobURL: jest.fn()
}; 