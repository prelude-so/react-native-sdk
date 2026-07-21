// Web target: reuse the shared js-sdk delegate. Bundlers resolve this file
// (`.web.ts`) on web; the matching `.ts` file handles iOS/Android.
export { default } from '@prelude.so/react-native-sdk-shared/web';
