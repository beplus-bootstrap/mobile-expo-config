export const getAndroidPackageName = (__DEV__: boolean) => {
  return process.env.BE_APP_ANDROID_PACKAGE_NAME ?? "io.beplus.bootstrap.mobile.expo";
}
