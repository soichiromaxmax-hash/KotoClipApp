const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const APP_GROUP  = 'group.jp.kotoclip.app';
const EXT_NAME   = 'ShareExtension';
const DEVELOPMENT_TEAM = process.env.APPLE_TEAM_ID || '9U2YJ4XL4K';

module.exports = function withShareExtension(config) {
  config = addAppGroupsEntitlement(config);
  config = copyExtensionFiles(config);
  config = addXcodeTarget(config);
  return config;
};

// ── 1. Main app entitlements ──────────────────────────────────────────────────
function addAppGroupsEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    const key = 'com.apple.security.application-groups';
    if (!Array.isArray(c.modResults[key])) c.modResults[key] = [];
    if (!c.modResults[key].includes(APP_GROUP)) c.modResults[key].push(APP_GROUP);
    return c;
  });
}

// ── 2. Copy Swift + plist + entitlements into ios/ShareExtension/ ─────────────
function copyExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const iosRoot   = c.modRequest.platformProjectRoot;
      const projRoot  = c.modRequest.projectRoot;
      const extDir    = path.join(iosRoot, EXT_NAME);
      const bundleId  = c.ios?.bundleIdentifier ?? 'jp.kotoclip.app';

      fs.mkdirSync(extDir, { recursive: true });

      // Swift source
      const swiftSrc = path.join(projRoot, 'targets', 'share-extension', 'ShareViewController.swift');
      if (fs.existsSync(swiftSrc)) {
        fs.copyFileSync(swiftSrc, path.join(extDir, 'ShareViewController.swift'));
      }

      // Info.plist
      fs.writeFileSync(path.join(extDir, 'Info.plist'), buildInfoPlist(bundleId));

      // Entitlements
      fs.writeFileSync(path.join(extDir, `${EXT_NAME}.entitlements`), buildEntitlements());

      return c;
    },
  ]);
}

// ── 3. Add Xcode target ───────────────────────────────────────────────────────
function addXcodeTarget(config) {
  return withXcodeProject(config, (c) => {
    const project  = c.modResults;
    const bundleId = c.ios?.bundleIdentifier ?? 'jp.kotoclip.app';

    // Skip if already present
    const targets = project.pbxNativeTargetSection();
    if (Object.values(targets).some((t) => t.name === EXT_NAME)) return c;

    // Add extension target
    const { uuid: extUUID, pbxNativeTarget: extTarget } = project.addTarget(
      EXT_NAME,
      'app_extension',
      EXT_NAME,
      `${bundleId}.share`
    );

    // Build phases
    project.addBuildPhase(
      [`${EXT_NAME}/ShareViewController.swift`],
      'PBXSourcesBuildPhase',
      'Sources',
      extUUID
    );
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', extUUID);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', extUUID);

    // Build settings
    const configs = project.pbxXCBuildConfigurationSection();
    Object.values(configs).forEach((cfg) => {
      if (typeof cfg !== 'object' || !cfg.buildSettings) return;
      const name = cfg.buildSettings.PRODUCT_NAME;
      if (name !== EXT_NAME && name !== `"${EXT_NAME}"`) return;
      Object.assign(cfg.buildSettings, {
        SWIFT_VERSION: '6.0',
        IPHONEOS_DEPLOYMENT_TARGET: '16.0',
        TARGETED_DEVICE_FAMILY: '"1,2"',
        PRODUCT_BUNDLE_IDENTIFIER: `${bundleId}.share`,
        INFOPLIST_FILE: `"${EXT_NAME}/Info.plist"`,
        CODE_SIGN_ENTITLEMENTS: `"${EXT_NAME}/${EXT_NAME}.entitlements"`,
        CODE_SIGN_STYLE: 'Automatic',
        DEVELOPMENT_TEAM,
        SKIP_INSTALL: 'YES',
        FRAMEWORK_SEARCH_PATHS: '"$(PROJECT_DIR)/../ios-stubs" "$(inherited)"',
        OTHER_LDFLAGS: '"-weak_framework AppIntentsSSUTraining"',
      });
    });

    // Embed extension in main app (Copy Files phase)
    const mainTargetKey = Object.keys(targets).find(
      (k) => targets[k].productType === '"com.apple.product-type.application"'
    );
    if (mainTargetKey) {
      project.addTargetDependency(mainTargetKey, [extUUID]);

      // productReference is the UUID of the .appex file reference in the Xcode project
      const extProductRef = extTarget?.productReference;
      if (extProductRef && !hasEmbedExtensionPhase(project, mainTargetKey, extProductRef)) {
        addEmbedExtensionPhase(project, mainTargetKey, extProductRef);
      }
    }

    return c;
  });
}

function hasEmbedExtensionPhase(project, mainTargetKey, productRef) {
  const objs = project.hash.project.objects;
  const mainTarget = project.pbxNativeTargetSection()[mainTargetKey];
  const copyPhases = objs['PBXCopyFilesBuildPhase'] || {};
  const buildFiles = objs['PBXBuildFile'] || {};

  if (!mainTarget || !Array.isArray(mainTarget.buildPhases)) return false;

  return mainTarget.buildPhases.some((phase) => {
    const copyPhase = copyPhases[phase.value];
    const isPluginsPhase = copyPhase?.dstSubfolderSpec === 13 || copyPhase?.dstSubfolderSpec === '13';
    if (!copyPhase || !isPluginsPhase || !Array.isArray(copyPhase.files)) {
      return false;
    }

    return copyPhase.files.some((file) => buildFiles[file.value]?.fileRef === productRef);
  });
}

function addEmbedExtensionPhase(project, mainTargetKey, productRef) {
  const objs = project.hash.project.objects;

  // Create PBXBuildFile for the extension product
  const buildFileUUID = project.generateUuid();
  objs['PBXBuildFile'] = objs['PBXBuildFile'] || {};
  objs['PBXBuildFile'][buildFileUUID] = {
    isa: 'PBXBuildFile',
    fileRef: productRef,
    settings: { ATTRIBUTES: ['RemoveHeadersOnCopy', 'CodeSignOnCopy'] },
  };

  // Create PBXCopyFilesBuildPhase (dstSubfolderSpec 13 = PlugIns)
  const phaseUUID = project.generateUuid();
  objs['PBXCopyFilesBuildPhase'] = objs['PBXCopyFilesBuildPhase'] || {};
  objs['PBXCopyFilesBuildPhase'][phaseUUID] = {
    isa: 'PBXCopyFilesBuildPhase',
    buildActionMask: 2147483647,
    dstPath: '""',
    dstSubfolderSpec: 13,
    files: [{ value: buildFileUUID, comment: `${EXT_NAME}.appex in Embed App Extensions` }],
    name: '"Embed App Extensions"',
    runOnlyForDeploymentPostprocessing: 0,
  };

  // Attach phase to main target
  const mainTarget = project.pbxNativeTargetSection()[mainTargetKey];
  if (mainTarget && Array.isArray(mainTarget.buildPhases)) {
    mainTarget.buildPhases.push({ value: phaseUUID, comment: 'Embed App Extensions' });
  }
}

// ── 4. Podfile post_install: disable resource bundle signing (Xcode 14+) ─────
function fixResourceBundleSigning(config) {
  return withDangerousMod(config, [
    'ios',
    (c) => {
      const podfilePath = path.join(c.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return c;
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (podfile.includes('KotoClip: resource bundle signing fix')) return c;
      podfile += `
# KotoClip: resource bundle signing fix (Xcode 14+)
post_install do |installer|
  installer.pods_project.targets.each do |target|
    next unless target.respond_to?(:product_type)
    next unless target.product_type == "com.apple.product-type.bundle"
    target.build_configurations.each do |cfg|
      cfg.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
    end
  end
end
`;
      fs.writeFileSync(podfilePath, podfile, 'utf8');
      return c;
    },
  ]);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildInfoPlist(bundleId) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>KotoClipに保存</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>${bundleId}.share</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>XPC!</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionAttributes</key>
    <dict>
      <key>NSExtensionActivationRule</key>
      <dict>
        <key>NSExtensionActivationSupportsText</key>
        <true/>
        <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
        <integer>1</integer>
        <key>NSExtensionActivationSupportsWebPageWithMaxCount</key>
        <integer>1</integer>
      </dict>
    </dict>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
  </dict>
</dict>
</plist>`;
}

function buildEntitlements() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP}</string>
  </array>
</dict>
</plist>`;
}
