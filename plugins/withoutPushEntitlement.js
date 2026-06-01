const { withEntitlementsPlist } = require('@expo/config-plugins');

// expo-notifications は自動プラグインとして aps-environment を追加する。
// ローカル通知のみ使用するため、provisioning profile との不一致を防ぐため除去する。
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
};
