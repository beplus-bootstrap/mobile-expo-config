export const getAppName = (__DEV__: boolean) => {
  let name = process.env.BE_APP_NAME ?? "Bootstrap";
  let suffix = "";

  if (__DEV__) {
    suffix = "debug";
  } else {
    switch (process.env.BE_ENVIRONMENT) {
      case "dev":
      case "stage":
        suffix = `${process.env.BE_ENVIRONMENT}`;
        break;
      case "prod":
      default:
        suffix = "";
        break;
    }
  }

  return `${name}${suffix ? ` (${suffix})` : ""}`;
}
