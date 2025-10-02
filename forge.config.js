const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/preload.js' // ✅ Desempaqueta el preload
    },
    name: 'CarroComidas',
    executableName: 'CarroComidas',
    icon: path.resolve(__dirname, 'assets/icon.ico'),
    extraResource: [
      './src/database/schema.sql'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'CarroComidas',
        authors: 'Predist',
        description: 'Sistema de gestión para carro de comidas',
        setupExe: 'CarroComidas-Setup-1.1.1.exe',
        noMsi: true,
        setupIcon: path.resolve(__dirname, 'assets/icon.ico'),
        shortcutName: 'CarroComidas',
        createDesktopShortcut: true,
        createStartMenuShortcut: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};