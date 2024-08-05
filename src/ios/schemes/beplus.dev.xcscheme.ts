export const beplusReleaseDevScheme = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1210"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <PreActions>
         <ExecutionAction
            ActionType = "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction">
            <ActionContent
               title = "Run Script"
               scriptText = "&quot;\${SRCROOT}/../node_modules/react-native-config/ios/ReactNativeConfig/BuildXCConfig.rb&quot; &quot;\${SRCROOT}/..&quot; &quot;\${SRCROOT}/tmp.xcconfig&quot;&#10;">
               <EnvironmentBuildable>
                  <BuildableReference
                     BuildableIdentifier = "primary"
                     BlueprintIdentifier = "13B07F861A680F5B00A75B9A"
                     BuildableName = "beplus.app"
                     BlueprintName = "beplus"
                     ReferencedContainer = "container:beplus.xcodeproj">
                  </BuildableReference>
               </EnvironmentBuildable>
            </ActionContent>
         </ExecutionAction>
      </PreActions>
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "13B07F861A680F5B00A75B9A"
               BuildableName = "beplus.app"
               BlueprintName = "beplus"
               ReferencedContainer = "container:beplus.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "ReleaseDev"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
      <Testables>
         <TestableReference
            skipped = "NO">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "00E356ED1AD99517003FC87E"
               BuildableName = "beplusTests.xctest"
               BlueprintName = "beplusTests"
               ReferencedContainer = "container:beplus.xcodeproj">
            </BuildableReference>
         </TestableReference>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "ReleaseDev"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "13B07F861A680F5B00A75B9A"
            BuildableName = "beplus.app"
            BlueprintName = "beplus"
            ReferencedContainer = "container:beplus.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "ReleaseDev"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "13B07F861A680F5B00A75B9A"
            BuildableName = "beplus.app"
            BlueprintName = "beplus"
            ReferencedContainer = "container:beplus.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "ReleaseDev">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "ReleaseDev"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
`;
