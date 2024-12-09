import { isDevMode } from '@angular/core';

export const BASE_URL = 'http://localhost:32000';

export const serverUrl = (() => {
  if (isDevMode()) {
    return BASE_URL;
  } else {
    return '';
  }
})();
