/** Message from Devvit to the web view. */
export type DevvitMessage =
  | { type: 'update'; data: { state: number[], image?: string, answer?: string } };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'correct' }
  | { type: 'wrong' }
  | { type: 'create'; data: { image: string, answer: string } }
  | { type: 'swap'; data: [number, number] };

/**
 * Web view MessageEvent listener data type. The Devvit API wraps all messages
 * from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};
