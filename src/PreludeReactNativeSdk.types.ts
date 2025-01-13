export type DispatchingSignalsStatus = {
  status: string,
  dispatchID: string;
};

export type Configuration = {
  sdk_key: string;
  endpoint?: string;
  timeout_milliseconds?: number;
}