import native from './PreludeReactNativeSdkStandaloneModule';
import { makeApi } from '@prelude.so/react-native-sdk-shared';

const api = makeApi(native);

export const dispatchSignals = api.dispatchSignals;
export const verifySilent = api.verifySilent;
export { Features } from '@prelude.so/react-native-sdk-shared';
