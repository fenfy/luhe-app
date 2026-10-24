#!/usr/bin/env node
/**
 * Android 打包脚本（Windows / macOS / Linux 通用），用法见 README「Android App 打包」。
 *
 *   yarn android:init         第一次：生成 android/ 工程、签名配置、图标和启动页
 *   yarn android:sync         打包 H5（--mode app）并同步到 android/，同步版本号
 *   yarn android:open         用 Android Studio 打开 android/
 *   yarn android:apk          sync + 打 release APK（需要 android/keystore.properties），输出到 release/
 *   yarn android:apk --debug  sync + 打 debug APK（不需要 keystore，仅自测）
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ANDROID = join(ROOT, 'android')
const APP_GRADLE = join(ANDROID, 'app', 'build.gradle')
const IS_WIN = process.platform === 'win32'
const BG = '#FFFFFF'

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: IS_WIN, ...opts })
  if (r.status !== 0) {
    console.error(`\n✖ 命令失败：${cmd} ${args.join(' ')}`)
    process.exit(r.status ?? 1)
  }
}

const npx = (...args) => run('npx', ['--no-install', ...args])

function buildWeb() {
  run('yarn', ['build:app'])
}

/** 签名：读取 android/keystore.properties（不提交），没有该文件时 release 包不签名 */
const SIGNING_HEAD = `// luhe: release 签名，从 android/keystore.properties 读取（该文件和 keystore 都不提交）
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.withInputStream { keystoreProperties.load(it) }
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }`

function patchGradle() {
  let s = readFileSync(APP_GRADLE, 'utf8')
  if (!s.includes('keystore.properties')) {
    if (!/^android \{/m.test(s)) throw new Error('android/app/build.gradle 里找不到 "android {"，请手动添加签名配置')
    s = s.replace(/^android \{/m, SIGNING_HEAD)
    s = s.replace(/(buildTypes\s*\{\s*release\s*\{)/, `$1\n            if (keystorePropertiesFile.exists()) {\n                signingConfig signingConfigs.release\n            }`)
  }
  // 版本号以 package.json 为准：version → versionName，versionCode → versionCode
  s = s.replace(/versionCode\s+\d+/, `versionCode ${pkg.versionCode}`)
  s = s.replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`)
  writeFileSync(APP_GRADLE, s)
  console.log(`✔ build.gradle：versionName ${pkg.version}，versionCode ${pkg.versionCode}，签名配置已就绪`)
}

/** Gradle 需要 JDK 21 和 Android SDK：没配环境变量时，尝试 Android Studio 的默认安装位置 */
function gradleEnv() {
  const env = { ...process.env }
  if (IS_WIN && !env.JAVA_HOME) {
    const jbr = 'C:\\Program Files\\Android\\Android Studio\\jbr'
    if (existsSync(jbr)) env.JAVA_HOME = jbr
  }
  const localProps = join(ANDROID, 'local.properties')
  if (!existsSync(localProps) && !env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
    const sdk = IS_WIN
      ? join(env.LOCALAPPDATA || '', 'Android', 'Sdk')
      : join(env.HOME || '', process.platform === 'darwin' ? 'Library/Android/sdk' : 'Android/Sdk')
    if (existsSync(sdk)) writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`)
    else console.warn('⚠ 没找到 Android SDK：请先安装 Android Studio，或设置 ANDROID_HOME')
  }
  return env
}

function sync() {
  if (!existsSync(ANDROID)) {
    console.error('✖ 还没有 android/ 工程，请先执行 yarn android:init')
    process.exit(1)
  }
  buildWeb()
  patchGradle()
  npx('cap', 'sync', 'android')
}

function init() {
  if (existsSync(ANDROID)) {
    console.log('android/ 已存在，跳过 cap add（只重新生成图标并同步）')
    buildWeb()
  } else {
    buildWeb()
    npx('cap', 'add', 'android')
  }
  patchGradle()
  // 图标和启动页：用 assets/logo.png（与 src/assets/app.png 相同）生成各尺寸
  npx('capacitor-assets', 'generate', '--android', '--assetPath', 'assets', '--iconBackgroundColor', BG, '--splashBackgroundColor', BG)
  npx('cap', 'sync', 'android')
  console.log('\n✔ android/ 已生成。下一步：生成 keystore（见 README），然后 yarn android:apk')
}

function apk(debug) {
  if (!debug && !existsSync(join(ANDROID, 'keystore.properties'))) {
    console.error('✖ 缺少 android/keystore.properties，release 包无法签名。先按 README 生成 keystore，或用 yarn android:apk --debug 打测试包')
    process.exit(1)
  }
  sync()
  const task = debug ? 'assembleDebug' : 'assembleRelease'
  run(IS_WIN ? 'gradlew.bat' : './gradlew', [task], { cwd: ANDROID, env: gradleEnv() })
  const type = debug ? 'debug' : 'release'
  const from = join(ANDROID, 'app', 'build', 'outputs', 'apk', type, `app-${type}.apk`)
  const outDir = join(ROOT, 'release')
  mkdirSync(outDir, { recursive: true })
  const to = join(outDir, `luhe-${pkg.version}${debug ? '-debug' : ''}.apk`)
  copyFileSync(from, to)
  console.log(`\n✔ APK：${to}`)
}

const [cmd, ...flags] = process.argv.slice(2)
switch (cmd) {
  case 'init':
    init()
    break
  case 'sync':
    sync()
    break
  case 'open':
    npx('cap', 'open', 'android')
    break
  case 'apk':
    apk(flags.includes('--debug'))
    break
  default:
    console.log('用法：node scripts/android.mjs <init|sync|open|apk [--debug]>')
    process.exit(1)
}
