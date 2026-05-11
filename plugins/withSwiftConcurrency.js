const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSwiftConcurrency(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const injection = [
        '  installer.pods_project.targets.each do |target|',
        '    target.build_configurations.each do |config|',
        "      config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'",
        '    end',
        '  end',
      ].join('\n');

      podfile = podfile.replace(
        'post_install do |installer|',
        `post_install do |installer|\n${injection}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return cfg;
    },
  ]);
};
