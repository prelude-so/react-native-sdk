export enum Features {
  SilentVerification = 1 << 0,
}

export function toRawValue(features: Features[]): number {
  return features.reduce((acc, feature) => acc | feature, 0);
}
