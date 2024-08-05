export const getAndroidNamespace = (__DEV__: boolean) => {
  return process.env.BE_APP_ANDROID_NAMESPACE ?? "io.beplus.bootstrap.mobile.expo";
}
