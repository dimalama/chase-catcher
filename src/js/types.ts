export type ContentToPopupMessage =
  | { action: 'updateProgress'; current: number; total: number; progress: number }
  | { action: 'huntingComplete'; success: true; count: number }
  | { action: 'error'; error: string };

export type PopupToContentMessage =
  | { action: 'startHunting' }
  | { action: 'stopHunting' }
  | { action: 'getStatus' };

export type ContentMessageResponse =
  | { success: true; isRunning?: boolean }
  | { success: false; error: string };
