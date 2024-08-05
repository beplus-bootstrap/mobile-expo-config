export const getAndroidApplicationId = (__DEV__: boolean) => {
  return process.env.BE_APP_ANDROID_APPLICATION_ID ?? "io.beplus.bootstrap.mobile.expo";
}
