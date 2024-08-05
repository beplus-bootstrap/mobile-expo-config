import { EOL } from "os";
import fs from "fs";
import path from "path";

import { ExpoConfig } from "expo/config";

import { withInfoPlist, withEntitlementsPlist, withXcodeProject, withAppDelegate, withAppBuildGradle, withProjectBuildGradle } from "@expo/config-plugins";

import { getIosBundleId } from "./ios/getIosBundleId";
import { beplusDebugScheme } from "./ios/schemes/beplus.debug.xcscheme";
import { beplusReleaseDevScheme } from "./ios/schemes/beplus.dev.xcscheme";
import { beplusReleaseStageScheme } from "./ios/schemes/beplus.stage.xcscheme";
import { beplusReleaseScheme } from "./ios/schemes/beplus.xcscheme";

import { fastfileAndroid } from "./android/fastlane/Fastfile";

import { fastfileIos } from "./ios/fastlane/Fastfile";
import { matchfileIos } from "./ios/fastlane/Matchfile";

interface Options {
  __DEV__: boolean;
}

// @todo
function orderObjectKeysAlphabetically(obj: Record<string, any>): Record<string, any> {
  const orderedObj: Record<string, any> = {};
  Object.keys(obj).sort().forEach((key) => {
    orderedObj[key] = obj[key];
  });
  return orderedObj;
}

export const withBeplusBootstrapMobile = (config: ExpoConfig, options: Options): ExpoConfig => {
  config.version = process.env.BE_APP_VERSION ?? "1.0.0";

  return config;
}

export const withBeplusBootstrapMobileForIos = (config: ExpoConfig, options: Options): ExpoConfig => {
  if (!config.ios) {
    config.ios = {};
  }

  config.ios.bundleIdentifier = getIosBundleId(options.__DEV__);
  config.ios.buildNumber = process.env.BE_APP_BUILD_NUMBER ?? "1";

  config = withInfoPlist(config, (config) => {
    config.modResults.CFBundleDisplayName = `$(BE_APP_NAME)`;
    config.modResults.CFBundleShortVersionString = `$(BE_APP_VERSION)`;
    config.modResults.CFBundleVersion = `$(BE_APP_BUILD_NUMBER)`;
    config.modResults.CFBundleURLTypes = [
      {
        CFBundleURLSchemes: [ `beplus`, `$(PRODUCT_BUNDLE_IDENTIFIER)` ],
      },
      {
        CFBundleURLSchemes: [ `exp+beplus` ],
      },
    ];
    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] = "development";
    return config;
  });

  let xcodeProjectPath = "";
  config = withXcodeProject(config, (config) => {
    const pbxProject = config.modResults;
    xcodeProjectPath = pbxProject.filepath;

    const configurations = ["Debug", "ReleaseDev", "ReleaseStage", "Release"];

    // This will list all available methods in pbxProject
    // console.dir(pbxProject.__proto__);

    const pbxProjectSection = pbxProject.pbxProjectSection();
    // console.log("pbxProjectSection", pbxProjectSection);
    let mainGroupKey = "";
    for (const key in pbxProjectSection) {
      if (pbxProjectSection[key] && pbxProjectSection[key].isa === 'PBXProject') {
        mainGroupKey = pbxProjectSection[key].mainGroup;
        break; // Exit the loop once the mainGroup is found
      }
    }

    // Get the items in the PBXFileReference section
    const pbxFileReference = pbxProject.pbxFileReferenceSection();
    // console.log("pbxFileReference", pbxFileReference);

    // Get the items in the "Pods" PBXGroup
    const pbxGroupForPods = pbxProject.pbxGroupByName("Pods");
    // console.log("pbxGroupForPods", pbxGroupForPods);

    // Get the Configuration items available in the XCConfigurationList section
    const pbxConfigurationList = pbxProject.pbxXCConfigurationList();
    // console.log("pbxConfigurationList", pbxConfigurationList);

    // react-native-config
    let alreadyAddedRNConfig = false;
    let uuidForRNConfig = "";
    Object.keys(pbxFileReference).map(pbxFileRefKey => {
      if (!pbxFileRefKey.includes("_comment") && pbxFileReference[pbxFileRefKey].name === "Config.xcconfig") {
        alreadyAddedRNConfig = true;
        uuidForRNConfig = pbxFileRefKey;
      }
    });

    if (!alreadyAddedRNConfig) {
      uuidForRNConfig = pbxProject.generateUuid();
      pbxProject.addToPbxFileReferenceSection({
        fileRef: uuidForRNConfig,
        isa: "PBXFileReference",
        lastKnownFileType: "text.xcconfig",
        basename: "Config.xcconfig",
        path: "Config.xcconfig",
        sourceTree: '"<group>"'
      });

      pbxProject.addToPbxGroup({ fileRef: uuidForRNConfig, basename: "Config.xcconfig" }, mainGroupKey);
    }

    // Read the default "Debug" Configuration item, as:
    // - we need to add Config.xcconfig to it
    const debugConfigs = pbxProject.getBuildConfigByName("Debug");
    // console.log("debugConfigs", debugConfigs);
    Object.keys(debugConfigs).map(key => {
      let debugConfigType = "";
      Object.keys(pbxConfigurationList).map(configListKey => {
        if (configListKey.includes("_comment") && pbxConfigurationList[configListKey].includes("PBXNativeTarget")) {
          const _configListKey = configListKey.replace("_comment", "");
          const _found = pbxConfigurationList[_configListKey].buildConfigurations.filter((_buildConfig: any) => _buildConfig.comment === "Debug" && _buildConfig.value === key).length === 1;
          if (_found) {
            debugConfigType = "PBXNativeTarget";
          }
        }
        if (configListKey.includes("_comment") && pbxConfigurationList[configListKey].includes("PBXProject")) {
          const _configListKey = configListKey.replace("_comment", "");
          const _found = pbxConfigurationList[_configListKey].buildConfigurations.filter((_buildConfig: any) => _buildConfig.comment === "Debug" && _buildConfig.value === key).length === 1;
          if (_found) {
            debugConfigType = "PBXProject";
          }
        }

        if (debugConfigType === "PBXNativeTarget") {}

        if (debugConfigType === "PBXProject") {
          pbxProject.pbxXCBuildConfigurationSection()[key].baseConfigurationReference = uuidForRNConfig;
          pbxProject.pbxXCBuildConfigurationSection()[key].baseConfigurationReference_comment = "Config.xcconfig";
        }
      });
    });

    // Read the default "Release" Configuration item, as:
    const releaseConfigs = pbxProject.getBuildConfigByName("Release");
    // console.log("releaseConfigs", releaseConfigs);
    
    // - we need to add Config.xcconfig to it
    Object.keys(releaseConfigs).map(key => {
      let releaseConfigType = "";
      Object.keys(pbxConfigurationList).map(configListKey => {
        if (configListKey.includes("_comment") && pbxConfigurationList[configListKey].includes("PBXNativeTarget")) {
          const _configListKey = configListKey.replace("_comment", "");
          const _found = pbxConfigurationList[_configListKey].buildConfigurations.filter((_buildConfig: any) => _buildConfig.comment === "Release" && _buildConfig.value === key).length === 1;
          if (_found) {
            releaseConfigType = "PBXNativeTarget";
          }
        }
        if (configListKey.includes("_comment") && pbxConfigurationList[configListKey].includes("PBXProject")) {
          const _configListKey = configListKey.replace("_comment", "");
          const _found = pbxConfigurationList[_configListKey].buildConfigurations.filter((_buildConfig: any) => _buildConfig.comment === "Release" && _buildConfig.value === key).length === 1;
          if (_found) {
            releaseConfigType = "PBXProject";
          }
        }

        if (releaseConfigType === "PBXNativeTarget") {}

        if (releaseConfigType === "PBXProject") {
          pbxProject.pbxXCBuildConfigurationSection()[key].baseConfigurationReference = uuidForRNConfig;
          pbxProject.pbxXCBuildConfigurationSection()[key].baseConfigurationReference_comment = "Config.xcconfig";
        }
      });
    });

    // - that will be used as a base for the new configurations (ReleaseDev, ReleaseStage)

    // What Configuration items we're about to add
    const configsToAdd = ["ReleaseDev", "ReleaseStage"];

    configsToAdd.forEach((configName) => {
      const configAlreadyExists = pbxProject.getBuildConfigByName(configName);
      // Add the new configuration if it doesn't exist
      if (Object.keys(configAlreadyExists).length === 0) {
        const configNameInFilename = configName.charAt(0).toLowerCase() + configName.slice(1); // releaseDev, releaseStage

        Object.keys(releaseConfigs).map(key => {
          const releaseConfig = releaseConfigs[key];

          let configurationListKey;
          let releaseConfigType;
          Object.keys(pbxConfigurationList).map(configListKey => {
            if (configListKey.includes("_comment") && pbxConfigurationList[configListKey].includes("PBXNativeTarget")) {
              const _configListKey = configListKey.replace("_comment", "");
              const _found = pbxConfigurationList[_configListKey].buildConfigurations.filter((_buildConfig: any) => _buildConfig.comment === "Release" && _buildConfig.value === key).length === 1;
              if (_found) {
                configurationListKey = _configListKey;
                releaseConfigType = "PBXNativeTarget";
              }
            }
            if (configListKey.includes("_comment") && pbxConfigurationList[configListKey].includes("PBXProject")) {
              const _configListKey = configListKey.replace("_comment", "");
              const _found = pbxConfigurationList[_configListKey].buildConfigurations.filter((_buildConfig: any) => _buildConfig.comment === "Release" && _buildConfig.value === key).length === 1;
              if (_found) {
                configurationListKey = _configListKey;
                releaseConfigType = "PBXProject";
              }
            }
          });

          if (releaseConfigType === "PBXNativeTarget") {
            const uuidForBaseConfigurationReference = pbxProject.generateUuid();
            const baseConfigurationReference = pbxFileReference[releaseConfig.baseConfigurationReference];

            const name = baseConfigurationReference.name.replace(/"/g, "").replace("release", configNameInFilename);
            const path = baseConfigurationReference.path.replace(/"/g, "").replace("release", configNameInFilename);

            pbxProject.addToPbxFileReferenceSection({
              fileRef: uuidForBaseConfigurationReference,
              isa: baseConfigurationReference.isa, // 'PBXFileReference'
              includeInIndex: baseConfigurationReference.includeInIndex, // 1
              lastKnownFileType: baseConfigurationReference.lastKnownFileType, // 'text.xcconfig'
              basename: name, // '"Pods-beplus.[debug|releaseDev|releaseStage|release].xcconfig"'
              path: path, // '"Target Support Files/Pods-beplus/Pods-beplus.debug|releaseDev|releaseStage|release.xcconfig"',
              sourceTree: baseConfigurationReference.sourceTree, // '"<group>"'
            });
            pbxGroupForPods.children.push({
              value: uuidForBaseConfigurationReference,
              comment: name,
            });
            const uuidForBuildConfig = pbxProject.generateUuid();
            pbxProject.pbxXCBuildConfigurationSection()[uuidForBuildConfig] = {
              ...releaseConfig,
              name: configName,
              baseConfigurationReference: uuidForBaseConfigurationReference,
              baseConfigurationReference_comment: name,
            };

            // let configurationListKey = "";
            // Object.keys(pbxConfigurationList).map(key => {
            //   if (key.includes("_comment") && pbxConfigurationList[key].includes("PBXNativeTarget")) {
            //     configurationListKey = key.replace("_comment", "");
            //   }
            // });
            
            pbxConfigurationList[configurationListKey].buildConfigurations.push({
              value: uuidForBuildConfig,
              comment: configName,
            });
          } 
          
          if (releaseConfigType === "PBXProject") {
            const uuidForBuildConfig = pbxProject.generateUuid();
            pbxProject.pbxXCBuildConfigurationSection()[uuidForBuildConfig] = {
              ...releaseConfig,
              name: configName,
              baseConfigurationReference: uuidForRNConfig,
              baseConfigurationReference_comment: "Config.xcconfig",
            };

            // let configurationListKey = "";
            // Object.keys(pbxConfigurationList).map(key => {
            //   if (key.includes("_comment") && pbxConfigurationList[key].includes("PBXProject")) {
            //     configurationListKey = key.replace("_comment", "");
            //   }
            // });

            pbxConfigurationList[configurationListKey].buildConfigurations.push({
              value: uuidForBuildConfig,
              comment: configName,
            });
          }
        });
      }
    });

    // Order as Debug, ReleaseDev, ReleaseStage, Release
    Object.keys(pbxConfigurationList).map(key => {
      if (!key.includes("_comment")) {
        pbxConfigurationList[key].buildConfigurations.sort((a: any, b: any) => {
          const indexA = configurations.indexOf(a.comment);
          const indexB = configurations.indexOf(b.comment);
          return indexA - indexB;
        });
      }
    });

    // Modify the buildSettings of each Configuration
    const productBundleIdSuffixBasedOnConfigName: any = {
      "Debug": ".debug",
      "ReleaseDev": ".dev",
      "ReleaseStage": ".stage",
      "Release": "",
    };

    const buildConfigs = pbxProject.pbxXCBuildConfigurationSection();
    // console.log("configs", configs);

    Object.keys(buildConfigs).filter(buildConfigKey => !buildConfigKey.includes("_comment")).map(buildConfigKey => {
      const buildConfigName = buildConfigs[buildConfigKey].name;
      const buildSettings = { ...buildConfigs[buildConfigKey].buildSettings };

      if (buildConfigs[buildConfigKey].baseConfigurationReference) {
        // Remove any "CODE_SIGN_IDENTITY[*]" key
        Object.keys(buildSettings).map(k => {
          if (k.includes("CODE_SIGN_IDENTITY")) {
            delete buildSettings[k];
          }
        });

        buildSettings.CODE_SIGN_IDENTITY = buildConfigName.includes("Release") ? `"Apple Distribution"` : `"Apple Developer"`;
        buildSettings.CODE_SIGN_STYLE = `Manual`;
        buildSettings.CURRENT_PROJECT_VERSION = `"$(BE_APP_BUILD_NUMBER)"`;
        buildSettings.DEVELOPMENT_TEAM = `"$(BE_APPLE_DEVELOPER_TEAM_ID)"`;
        buildSettings.INFOPLIST_KEY_CFBundleDisplayName = `"$(BE_APP_NAME)"`;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = `15.0`;
        buildSettings.MARKETING_VERSION = `"$(BE_APP_VERSION)"`;
        buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"$(BE_APP_BUNDLE_ID)$(PRODUCT_BUNDLE_IDENTIFIER_SUFFIX)"`;
				buildSettings.PRODUCT_BUNDLE_IDENTIFIER_SUFFIX = `${productBundleIdSuffixBasedOnConfigName[buildConfigName] !== ""
          ? `${productBundleIdSuffixBasedOnConfigName[buildConfigName]}`
          : `""`}`;
				buildSettings.PRODUCT_NAME = `beplus`;
        buildSettings.PROVISIONING_PROFILE_SPECIFIER = buildConfigName.includes("Release") ? `"match AppStore $(PRODUCT_BUNDLE_IDENTIFIER)"` : `"match Development $(PRODUCT_BUNDLE_IDENTIFIER)"`;
      } else {
        // Remove any "CODE_SIGN_IDENTITY[*]" key
        Object.keys(buildSettings).map(k => {
          if (k.includes("CODE_SIGN_IDENTITY")) {
            delete buildSettings[k];
          }
        });

        buildSettings.CODE_SIGN_IDENTITY = `"Apple Developer"`;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = `15.0`;
      }

      // @todo Order buildSettings keys alphabetically

      pbxProject.pbxXCBuildConfigurationSection()[buildConfigKey].buildSettings = orderObjectKeysAlphabetically(buildSettings);
    });

    const iosPath = path.resolve(path.dirname(xcodeProjectPath), "..", "..", "ios");

  // Create the Config.xcconfig file in the /ios directory
  fs.writeFileSync(path.join(iosPath, "Config.xcconfig"), `//
//  Config.xcconfig
//

// Configuration settings file format documentation can be found at:
// https://help.apple.com/xcode/#/dev745c5c974

#include? "tmp.xcconfig"
`, { flag: "w+" });

    // Save
    fs.writeFileSync(xcodeProjectPath, pbxProject.writeSync());

    // @todo
    // Schemes
    fs.writeFileSync(path.join(iosPath, "beplus.xcodeproj", "xcshareddata", "xcschemes", "beplus.debug.xcscheme"), beplusDebugScheme);
    fs.writeFileSync(path.join(iosPath, "beplus.xcodeproj", "xcshareddata", "xcschemes", "beplus.dev.xcscheme"), beplusReleaseDevScheme);
    fs.writeFileSync(path.join(iosPath, "beplus.xcodeproj", "xcshareddata", "xcschemes", "beplus.stage.xcscheme"), beplusReleaseStageScheme);
    fs.writeFileSync(path.join(iosPath, "beplus.xcodeproj", "xcshareddata", "xcschemes", "beplus.xcscheme"), beplusReleaseScheme);

    return config;
  });

  // Add "react-native-config" to the iOS's AppDelegate.m file
  config = withAppDelegate(config, (config) => {
    if (!config.modResults.contents.includes(`#import "RNCConfig.h"`)) {
      config.modResults.contents = config.modResults.contents
        .replace(
          // from
          /@implementation AppDelegate/g,
          // to
          `#import "RNCConfig.h"` + EOL + EOL + `@implementation AppDelegate`
        );
    }

    return config;
  });

  return config;
}

export const withBeplusBootstrapMobileForAndroid = (config: ExpoConfig, options: Options): ExpoConfig => {
  if (!config.android) {
    config.android = {};
  }

  config.android.versionCode = parseInt(process.env.BE_APP_BUILD_NUMBER ?? "1");

  config = withAppBuildGradle(config, (config) => {
    // Add "react-native-config" to the Android's app/build.gradle file
    if (!config.modResults.contents.includes(`apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"`)) {
      config.modResults.contents = config.modResults.contents
        .replace(
          // from
          /apply plugin: "com.facebook.react"/g,
          // to
          `apply plugin: "com.facebook.react"` + EOL + EOL + 
          `apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"`
        );
    }

    // config.modResults.contents = config.modResults.contents
    //   .replace(/applicationId '(.*)'/g, `applicationId project.env.get("BE_APP_APPLICATION_ID").toString()`)
    //   .replace(/versionName "(.*)"/g, `versionName project.env.get("BE_APP_VERSION") ? project.env.get("BE_APP_VERSION").toString() : "1.0.0"`)
    //   .replace(/versionCode (\d)/g, `versionCode project.env.get("BE_APP_BUILD_NUMBER") ? project.env.get("BE_APP_BUILD_NUMBER").toInteger() : 1`);

    config.modResults.contents = config.modResults.contents
      .replace(/defaultConfig\s*\{([^{}]*\{([^{}]*\{[^{}]*\})*[^{}]*\})*[^{}]*\}/g, `defaultConfig {
        applicationId project.env.get("BE_APP_APPLICATION_ID").toString()
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion

        versionName System.env.get("BE_APP_VERSION") ? System.env.get("BE_APP_VERSION") : project.env.get("BE_APP_VERSION") ? project.env.get("BE_APP_VERSION").toString() : "1.0.0"
        versionCode System.env.get("BE_APP_BUILD_NUMBER") ? System.env.get("BE_APP_BUILD_NUMBER").toInteger() : project.env.get("BE_APP_BUILD_NUMBER") ? project.env.get("BE_APP_BUILD_NUMBER").toInteger() : 1

        // should correspond to the "package" in Main<Activity|Application>.kt
        resValue "string", "build_config_package", project.env.get("BE_APP_ANDROID_NAMESPACE").toString()

        // https://developer.android.com/build/shrink-code#unused-alt-resources
        resConfigs "en"
    }`);

    config.modResults.contents = config.modResults.contents
      .replace(/signingConfigs\s*\{([^{}]*\{([^{}]*\{[^{}]*\})*[^{}]*\})*[^{}]*\}/g, `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file(System.env.get("BE_GOOGLE_PLAY_UPLOAD_KEY_STORE_FILE_PATH") ? System.env.get("BE_GOOGLE_PLAY_UPLOAD_KEY_STORE_FILE_PATH").toString() : "upload.keystore")
            storePassword System.env.get("BE_GOOGLE_PLAY_UPLOAD_KEY_STORE_PASSWORD").toString()
            keyAlias System.env.get("BE_GOOGLE_PLAY_UPLOAD_KEY_ALIAS").toString()
            keyPassword System.env.get("BE_GOOGLE_PLAY_UPLOAD_KEY_PASSWORD").toString()
        }
    }`);

    config.modResults.contents = config.modResults.contents
      .replace(/buildTypes\s*\{([^{}]*\{([^{}]*\{[^{}]*\})*[^{}]*\})*[^{}]*\}/g, `buildTypes {
        debug {
            applicationIdSuffix ".debug"
            signingConfig signingConfigs.debug
        }
        releaseDev {
            applicationIdSuffix ".dev"
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            matchingFallbacks = ['release']
        }
        releaseStage {
            applicationIdSuffix ".stage"
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            matchingFallbacks = ['release']
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }`);

    return config;
  });

  return config;
}

export const withBeplusBootstrapMobileFastlane = (config: ExpoConfig, options: Options): ExpoConfig => {
  let xcodeProjectPath = "";
  let iosPath = "";
  withXcodeProject(config, (config) => {
    const pbxProject = config.modResults;
    xcodeProjectPath = pbxProject.filepath;
    iosPath = path.resolve(path.dirname(xcodeProjectPath), "..", "..", "ios");
    fs.mkdirSync(path.join(iosPath, "fastlane"), { recursive: true });
    fs.writeFileSync(path.join(iosPath, "fastlane", "Fastfile"), fastfileIos);
    fs.writeFileSync(path.join(iosPath, "fastlane", "Matchfile"), matchfileIos);
    return config;
  });

  let projectBuildGradlePath = "";
  let androidPath = "";
  config = withProjectBuildGradle(config, (config) => {
    projectBuildGradlePath = config.modResults.path;
    androidPath = path.resolve(path.dirname(projectBuildGradlePath), "..", "android");
    fs.mkdirSync(path.join(androidPath, "fastlane"), { recursive: true });
    fs.writeFileSync(path.join(androidPath, "fastlane", "Fastfile"), fastfileAndroid);
    return config;
  });

  return config;
}
