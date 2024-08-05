export const getIosBundleId = (__DEV__: boolean) => {
  return process.env.BE_APP_BUNDLE_ID ?? "io.beplus.bootstrap.mobile.expo";
}
