const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// ============================================================
// 基本設定
// ============================================================

// 專案根目錄
const ROOT_DIR = __dirname

// 原始圖片資料夾
const INPUT_DIR = path.join(
  ROOT_DIR,
  'img'
)

// WebP 輸出資料夾
const OUTPUT_DIR = path.join(
  ROOT_DIR,
  'image'
)

// ============================================================
// WebP 設定
// ============================================================

// WebP 品質
//
// 90 = 高品質
// 80 = 網站推薦
// 70 = 更省容量
//
const WEBP_QUALITY = 80

// ============================================================
// 支援轉換的圖片格式
// ============================================================

const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
]

// ============================================================
// 要掃描並修改圖片路徑的程式碼格式
// ============================================================

const CODE_EXTENSIONS = [
  '.html',
  '.htm',

  '.css',
  '.scss',
  '.sass',

  '.js',
  '.jsx',

  '.ts',
  '.tsx',
]

// ============================================================
// 不掃描的資料夾
// ============================================================

const IGNORE_DIRECTORIES = [
  'node_modules',

  '.git',
  '.github',
  '.vscode',

  'dist',
  'build',
  'coverage',

  // WebP 輸出資料夾
  'image',
]

// ============================================================
// 不掃描的檔案
// ============================================================

const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',

  // 不修改自己
  'convert-webp.js',
]

// ============================================================
// 統計資料
// ============================================================

const stats = {

  // 圖片
  imagesFound: 0,
  imagesCreated: 0,
  imagesUpdated: 0,
  imagesSkipped: 0,
  imagesFailed: 0,

  // 程式碼
  codeFilesFound: 0,
  codeFilesUpdated: 0,
  referencesUpdated: 0,

  // 容量
  originalSize: 0,
  webpSize: 0,
}

// ============================================================
// Byte → KB / MB / GB
// ============================================================

function formatBytes(bytes) {

  if (bytes === 0) {
    return '0 B'
  }

  const units = [
    'B',
    'KB',
    'MB',
    'GB',
  ]

  const index = Math.floor(
    Math.log(bytes) /
    Math.log(1024)
  )

  const value =
    bytes /
    Math.pow(1024, index)

  return (
    `${value.toFixed(2)} ${units[index]}`
  )
}

// ============================================================
// 計算壓縮率
// ============================================================

function getCompressionRate(
  originalSize,
  newSize
) {

  if (originalSize === 0) {
    return '0.0'
  }

  return (
    (
      (
        originalSize -
        newSize
      ) /
      originalSize
    ) *
    100
  ).toFixed(1)
}

// ============================================================
// 取得相對於專案的路徑
// ============================================================

function getRelativePath(
  filePath
) {

  return path
    .relative(
      ROOT_DIR,
      filePath
    )
    .replace(
      /\\/g,
      '/'
    )
}

// ============================================================
// 是否忽略資料夾
// ============================================================

function shouldIgnoreDirectory(
  directoryName
) {

  return IGNORE_DIRECTORIES.includes(
    directoryName
  )
}

// ============================================================
// 是否忽略檔案
// ============================================================

function shouldIgnoreFile(
  fileName
) {

  return IGNORE_FILES.includes(
    fileName
  )
}

// ============================================================
// 取得 WebP 輸出位置
// ============================================================
//
// 原本：
//
// img/logo.png
//
// ↓
//
// image/logo.webp
//
//
// 原本：
//
// img/heating/banner.png
//
// ↓
//
// image/heating/banner.webp
//
//
// 原本：
//
// img/heating/step/01.jpg
//
// ↓
//
// image/heating/step/01.webp
//
// ============================================================

function getWebpOutputPath(
  inputPath
) {

  // ----------------------------------------------------------
  // 取得相對於 img 的路徑
  //
  // img/heating/banner.png
  //
  // ↓
  //
  // heating/banner.png
  // ----------------------------------------------------------

  const relativePath =
    path.relative(
      INPUT_DIR,
      inputPath
    )

  // ----------------------------------------------------------
  // 副檔名
  // ----------------------------------------------------------

  const ext =
    path.extname(
      relativePath
    )

  // ----------------------------------------------------------
  // 移除副檔名
  // ----------------------------------------------------------

  const withoutExtension =
    relativePath.slice(
      0,
      -ext.length
    )

  // ----------------------------------------------------------
  // image/heating/banner.webp
  // ----------------------------------------------------------

  return path.join(
    OUTPUT_DIR,
    `${withoutExtension}.webp`
  )
}

// ============================================================
// 判斷圖片是否需要轉換
// ============================================================

function shouldConvert(
  inputPath,
  outputPath
) {

  // ----------------------------------------------------------
  // WebP 不存在
  // ----------------------------------------------------------

  if (
    !fs.existsSync(
      outputPath
    )
  ) {

    return {
      convert: true,
      type: 'new',
    }
  }

  // ----------------------------------------------------------
  // 比較修改時間
  // ----------------------------------------------------------

  const sourceStat =
    fs.statSync(
      inputPath
    )

  const webpStat =
    fs.statSync(
      outputPath
    )

  // ----------------------------------------------------------
  // 原始圖片比較新
  //
  // 代表原圖後來被修改過
  // ----------------------------------------------------------

  if (
    sourceStat.mtimeMs >
    webpStat.mtimeMs
  ) {

    return {
      convert: true,
      type: 'update',
    }
  }

  // ----------------------------------------------------------
  // WebP 已經是最新版
  // ----------------------------------------------------------

  return {
    convert: false,
    type: 'skip',
  }
}

// ============================================================
// 轉換單張圖片
// ============================================================

async function convertImage(
  inputPath
) {

  stats.imagesFound++

  // ----------------------------------------------------------
  // WebP 輸出位置
  // ----------------------------------------------------------

  const outputPath =
    getWebpOutputPath(
      inputPath
    )

  // ----------------------------------------------------------
  // 建立輸出資料夾
  //
  // image/heating/step/
  // ----------------------------------------------------------

  const outputDirectory =
    path.dirname(
      outputPath
    )

  if (
    !fs.existsSync(
      outputDirectory
    )
  ) {

    fs.mkdirSync(
      outputDirectory,
      {
        recursive: true,
      }
    )
  }

  // ----------------------------------------------------------
  // 是否需要轉換
  // ----------------------------------------------------------

  const status =
    shouldConvert(
      inputPath,
      outputPath
    )

  // ----------------------------------------------------------
  // 已經是最新版
  // ----------------------------------------------------------

  if (
    !status.convert
  ) {

    stats.imagesSkipped++

    console.log(
      `⏭  SKIP   ${getRelativePath(inputPath)}`
    )

    return
  }

  // ==========================================================
  // 開始轉換
  // ==========================================================

  try {

    // --------------------------------------------------------
    // 原始容量
    // --------------------------------------------------------

    const originalSize =
      fs.statSync(
        inputPath
      ).size

    // --------------------------------------------------------
    // Sharp → WebP
    // --------------------------------------------------------

    await sharp(
      inputPath
    )
      .webp({
        quality:
          WEBP_QUALITY,
      })
      .toFile(
        outputPath
      )

    // --------------------------------------------------------
    // WebP 容量
    // --------------------------------------------------------

    const webpSize =
      fs.statSync(
        outputPath
      ).size

    // --------------------------------------------------------
    // 壓縮率
    // --------------------------------------------------------

    const compressionRate =
      getCompressionRate(
        originalSize,
        webpSize
      )

    // --------------------------------------------------------
    // 統計
    // --------------------------------------------------------

    stats.originalSize +=
      originalSize

    stats.webpSize +=
      webpSize

    if (
      status.type === 'new'
    ) {

      stats.imagesCreated++
    }

    if (
      status.type === 'update'
    ) {

      stats.imagesUpdated++
    }

    // --------------------------------------------------------
    // Console
    // --------------------------------------------------------

    const icon =
      status.type === 'update'
        ? '🔄'
        : '✅'

    const action =
      status.type === 'update'
        ? 'UPDATE'
        : 'CREATE'

    console.log(
      `${icon} ${action.padEnd(6)} ${getRelativePath(inputPath)}`
    )

    console.log(
      `           → ${getRelativePath(outputPath)}`
    )

    console.log(
      `           ${formatBytes(originalSize)} → ${formatBytes(webpSize)} ↓ ${compressionRate}%`
    )

  } catch (error) {

    stats.imagesFailed++

    console.error(
      `❌ ERROR  ${getRelativePath(inputPath)}`
    )

    console.error(
      `           ${error.message}`
    )
  }
}

// ============================================================
// STEP 1
//
// 遞迴掃描 img
// ============================================================

async function scanImages(
  directory
) {

  let files

  try {

    files =
      fs.readdirSync(
        directory,
        {
          withFileTypes: true,
        }
      )

  } catch (error) {

    console.error(
      `⚠️ 無法讀取：${directory}`
    )

    return
  }

  for (
    const file of files
  ) {

    const filePath =
      path.join(
        directory,
        file.name
      )

    // --------------------------------------------------------
    // 資料夾 → 繼續往下掃
    // --------------------------------------------------------

    if (
      file.isDirectory()
    ) {

      await scanImages(
        filePath
      )

      continue
    }

    // --------------------------------------------------------
    // 非檔案
    // --------------------------------------------------------

    if (
      !file.isFile()
    ) {

      continue
    }

    // --------------------------------------------------------
    // 副檔名
    // --------------------------------------------------------

    const ext =
      path.extname(
        file.name
      ).toLowerCase()

    // --------------------------------------------------------
    // 只處理 PNG / JPG / JPEG
    // --------------------------------------------------------

    if (
      !IMAGE_EXTENSIONS.includes(
        ext
      )
    ) {

      continue
    }

    // --------------------------------------------------------
    // 轉換
    // --------------------------------------------------------

    await convertImage(
      filePath
    )
  }
}

// ============================================================
// 判斷是不是外部圖片
// ============================================================

function isExternalUrl(
  imagePath
) {

  return (
    imagePath.startsWith(
      'http://'
    ) ||
    imagePath.startsWith(
      'https://'
    ) ||
    imagePath.startsWith(
      '//'
    ) ||
    imagePath.startsWith(
      'data:'
    ) ||
    imagePath.startsWith(
      'blob:'
    )
  )
}

// ============================================================
// 取得 img/ 後面的路徑
// ============================================================
//
// ./img/pink/banner.png
//
// ↓
//
// pink/banner.png
//
//
// ../img/pink/banner.png
//
// ↓
//
// pink/banner.png
//
//
// /img/pink/banner.png
//
// ↓
//
// pink/banner.png
//
// ============================================================

function getImageRelativePath(
  imageReference
) {

  // ----------------------------------------------------------
  // 移除 query / hash
  // ----------------------------------------------------------

  let cleanPath =
    imageReference.split(
      /[?#]/
    )[0]

  // ----------------------------------------------------------
  // Windows \ → /
  // ----------------------------------------------------------

  cleanPath =
    cleanPath.replace(
      /\\/g,
      '/'
    )

  // ----------------------------------------------------------
  // 找 img/
  // ----------------------------------------------------------

  const marker =
    'img/'

  const index =
    cleanPath.indexOf(
      marker
    )

  // ----------------------------------------------------------
  // 找不到 img/
  // ----------------------------------------------------------

  if (
    index === -1
  ) {

    return null
  }

  // ----------------------------------------------------------
  // 取得 img/ 後面的部分
  //
  // ./img/heating/banner.png
  //
  // ↓
  //
  // heating/banner.png
  // ----------------------------------------------------------

  return cleanPath.substring(
    index +
    marker.length
  )
}

// ============================================================
// 取得 WebP 實體位置
// ============================================================
//
// heating/banner.png
//
// ↓
//
// image/heating/banner.webp
//
// ============================================================

function getWebpPhysicalPath(
  imageRelativePath
) {

  // ----------------------------------------------------------
  // 移除 png / jpg / jpeg
  // ----------------------------------------------------------

  const withoutExtension =
    imageRelativePath.replace(
      /\.(png|jpe?g)$/i,
      ''
    )

  // ----------------------------------------------------------
  // WebP 實體位置
  // ----------------------------------------------------------

  return path.join(
    OUTPUT_DIR,
    `${withoutExtension}.webp`
  )
}

// ============================================================
// 取得新的 WebP 路徑
// ============================================================

function getWebpReference(
  imageReference
) {

  // ----------------------------------------------------------
  // 外部圖片不處理
  // ----------------------------------------------------------

  if (
    isExternalUrl(
      imageReference
    )
  ) {

    return null
  }

  // ----------------------------------------------------------
  // 取得 img/ 後面的路徑
  // ----------------------------------------------------------

  const imageRelativePath =
    getImageRelativePath(
      imageReference
    )

  if (
    !imageRelativePath
  ) {

    return null
  }

  // ----------------------------------------------------------
  // WebP 實體位置
  // ----------------------------------------------------------

  const webpPhysicalPath =
    getWebpPhysicalPath(
      imageRelativePath
    )

  // ----------------------------------------------------------
  // WebP 不存在
  //
  // 不修改程式碼
  // ----------------------------------------------------------

  if (
    !fs.existsSync(
      webpPhysicalPath
    )
  ) {

    console.log(
      `⚠️ 找不到 WebP：${getRelativePath(webpPhysicalPath)}`
    )

    return null
  }

  // ----------------------------------------------------------
  // 把：
  //
  // img/
  //
  // ↓
  //
  // image/
  //
  // ----------------------------------------------------------

  let newReference =
    imageReference.replace(
      /img\//i,
      'image/'
    )

  // ----------------------------------------------------------
  // 把：
  //
  // .png
  // .jpg
  // .jpeg
  //
  // ↓
  //
  // .webp
  //
  // 同時保留 ?v=123 或 #xxx
  // ----------------------------------------------------------

  newReference =
    newReference.replace(
      /\.(png|jpe?g)(?=([?#]|$))/i,
      '.webp'
    )

  return newReference
}

// ============================================================
// 修改程式碼裡面的圖片路徑
// ============================================================

function replaceImageReferences(
  content
) {

  let replaceCount = 0

  // ==========================================================
  //
  // 可以抓到：
  //
  // HTML
  //
  // src="./img/a.png"
  //
  //
  // JavaScript
  //
  // imgUrl: './img/a.png'
  //
  //
  // CSS / SCSS
  //
  // url("../img/a.png")
  //
  //
  // query
  //
  // ./img/a.png?v=123
  //
  //
  // hash
  //
  // ./img/a.png#test
  //
  // ==========================================================

  const regex =
    /(["'`(])([^"'`()\s]+?\.(?:png|jpe?g)(?:[?#][^"'`()\s]*)?)(["'`)])/gi

  const newContent =
    content.replace(
      regex,
      (
        match,
        prefix,
        imageReference,
        ending
      ) => {

        // ----------------------------------------------------
        // 取得新的 WebP 路徑
        // ----------------------------------------------------

        const webpReference =
          getWebpReference(
            imageReference
          )

        // ----------------------------------------------------
        // 找不到 WebP
        //
        // 保持原樣
        // ----------------------------------------------------

        if (
          !webpReference
        ) {

          return match
        }

        // ----------------------------------------------------
        // 統計
        // ----------------------------------------------------

        replaceCount++

        // ----------------------------------------------------
        // 顯示替換內容
        // ----------------------------------------------------

        console.log(
          `   🔗 ${imageReference}`
        )

        console.log(
          `      ↓`
        )

        console.log(
          `      ${webpReference}`
        )

        // ----------------------------------------------------
        // 替換
        // ----------------------------------------------------

        return (
          prefix +
          webpReference +
          ending
        )
      }
    )

  return {
    content:
      newContent,

    count:
      replaceCount,
  }
}

// ============================================================
// 處理單一程式碼檔案
// ============================================================

function processCodeFile(
  filePath
) {

  stats.codeFilesFound++

  try {

    // --------------------------------------------------------
    // 讀取原始內容
    // --------------------------------------------------------

    const originalContent =
      fs.readFileSync(
        filePath,
        'utf8'
      )

    // --------------------------------------------------------
    // 替換圖片
    // --------------------------------------------------------

    const result =
      replaceImageReferences(
        originalContent
      )

    // --------------------------------------------------------
    // 沒有任何修改
    // --------------------------------------------------------

    if (
      result.count === 0
    ) {

      return
    }

    // --------------------------------------------------------
    // 寫回檔案
    // --------------------------------------------------------

    fs.writeFileSync(
      filePath,
      result.content,
      'utf8'
    )

    // --------------------------------------------------------
    // 統計
    // --------------------------------------------------------

    stats.codeFilesUpdated++

    stats.referencesUpdated +=
      result.count

    // --------------------------------------------------------
    // Console
    // --------------------------------------------------------

    console.log('')

    console.log(
      `📝 UPDATE ${getRelativePath(filePath)}`
    )

    console.log(
      `           修改 ${result.count} 個圖片引用`
    )

    console.log('')
  }

  catch (error) {

    console.error(
      `⚠️ CODE ERROR ${getRelativePath(filePath)}`
    )

    console.error(
      `              ${error.message}`
    )
  }
}

// ============================================================
// STEP 2
//
// 遞迴掃描程式碼
// ============================================================

function scanCodeFiles(
  directory
) {

  let files

  try {

    files =
      fs.readdirSync(
        directory,
        {
          withFileTypes: true,
        }
      )

  }

  catch {

    return
  }

  for (
    const file of files
  ) {

    const filePath =
      path.join(
        directory,
        file.name
      )

    // ========================================================
    // 資料夾
    // ========================================================

    if (
      file.isDirectory()
    ) {

      // ------------------------------------------------------
      // 忽略資料夾
      // ------------------------------------------------------

      if (
        shouldIgnoreDirectory(
          file.name
        )
      ) {

        continue
      }

      // ------------------------------------------------------
      // 下一層
      // ------------------------------------------------------

      scanCodeFiles(
        filePath
      )

      continue
    }

    // ========================================================
    // 非一般檔案
    // ========================================================

    if (
      !file.isFile()
    ) {

      continue
    }

    // ========================================================
    // 忽略檔案
    // ========================================================

    if (
      shouldIgnoreFile(
        file.name
      )
    ) {

      continue
    }

    // ========================================================
    // 副檔名
    // ========================================================

    const ext =
      path.extname(
        file.name
      ).toLowerCase()

    // ========================================================
    // 非指定程式碼格式
    // ========================================================

    if (
      !CODE_EXTENSIONS.includes(
        ext
      )
    ) {

      continue
    }

    // ========================================================
    // 處理
    // ========================================================

    processCodeFile(
      filePath
    )
  }
}

// ============================================================
// 顯示結果
// ============================================================

function printSummary() {

  console.log('')
  console.log(
    '================================================'
  )

  console.log(
    '📊 WebP 自動最佳化結果'
  )

  console.log(
    '================================================'
  )

  // ==========================================================
  // 圖片
  // ==========================================================

  console.log('')
  console.log(
    '🖼️ 圖片'
  )

  console.log(
    `   找到圖片：${stats.imagesFound}`
  )

  console.log(
    `   新增 WebP：${stats.imagesCreated}`
  )

  console.log(
    `   更新 WebP：${stats.imagesUpdated}`
  )

  console.log(
    `   跳過圖片：${stats.imagesSkipped}`
  )

  console.log(
    `   轉換失敗：${stats.imagesFailed}`
  )

  // ==========================================================
  // 程式碼
  // ==========================================================

  console.log('')
  console.log(
    '📝 程式碼'
  )

  console.log(
    `   掃描檔案：${stats.codeFilesFound}`
  )

  console.log(
    `   修改檔案：${stats.codeFilesUpdated}`
  )

  console.log(
    `   修改圖片引用：${stats.referencesUpdated}`
  )

  // ==========================================================
  // 容量
  // ==========================================================

  if (
    stats.imagesCreated > 0 ||
    stats.imagesUpdated > 0
  ) {

    console.log('')
    console.log(
      '💾 本次轉換容量'
    )

    console.log(
      `   原始：${formatBytes(stats.originalSize)}`
    )

    console.log(
      `   WebP：${formatBytes(stats.webpSize)}`
    )

    const saved =
      stats.originalSize -
      stats.webpSize

    console.log(
      `   節省：${formatBytes(saved)}`
    )

    const rate =
      getCompressionRate(
        stats.originalSize,
        stats.webpSize
      )

    console.log(
      `   壓縮：↓ ${rate}%`
    )
  }

  // ==========================================================
  // Path
  // ==========================================================

  console.log('')

  console.log(
    `📂 原始圖片：${getRelativePath(INPUT_DIR)}`
  )

  console.log(
    `📦 WebP 輸出：${getRelativePath(OUTPUT_DIR)}`
  )

  console.log('')

  console.log(
    '================================================'
  )
}

// ============================================================
// MAIN
// ============================================================

async function main() {

  console.log('')
  console.log(
    '🚀 WebP Auto Optimizer'
  )

  console.log('')

  console.log(
    `📂 Input   : ${INPUT_DIR}`
  )

  console.log(
    `📦 Output  : ${OUTPUT_DIR}`
  )

  console.log(
    `⚙️ Quality : ${WEBP_QUALITY}`
  )

  // ==========================================================
  // 確認 img 資料夾存在
  // ==========================================================

  if (
    !fs.existsSync(
      INPUT_DIR
    )
  ) {

    console.error('')
    console.error(
      '❌ 找不到 img 資料夾'
    )

    console.error(
      `   ${INPUT_DIR}`
    )

    process.exit(1)
  }

  // ==========================================================
  // 建立 image
  // ==========================================================

  if (
    !fs.existsSync(
      OUTPUT_DIR
    )
  ) {

    fs.mkdirSync(
      OUTPUT_DIR,
      {
        recursive: true,
      }
    )

    console.log('')

    console.log(
      '📁 已建立 image 資料夾'
    )
  }

  // ==========================================================
  // STEP 1
  //
  // PNG / JPG → WebP
  // ==========================================================

  console.log('')
  console.log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  )

  console.log(
    'STEP 1：PNG / JPG → WebP'
  )

  console.log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  )

  console.log('')

  await scanImages(
    INPUT_DIR
  )

  // ==========================================================
  // STEP 2
  //
  // 修改程式碼圖片引用
  // ==========================================================

  console.log('')
  console.log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  )

  console.log(
    'STEP 2：修改程式碼圖片引用'
  )

  console.log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  )

  console.log('')

  scanCodeFiles(
    ROOT_DIR
  )

  // ==========================================================
  // 統計
  // ==========================================================

  printSummary()
}

// ============================================================
// RUN
// ============================================================

main()