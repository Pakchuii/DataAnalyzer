import { store } from './store.js'

/**
 * 随机壁纸引擎
 * 利用 Vite 的静态资源扫描能力，从指定文件夹随机抽选背景
 */

// 1. 扫描文件夹 (eager: true 直接获取引用)
const dayWallpapers = import.meta.glob('@/assets/wallpapers/day/*.*', { eager: true, import: 'default' })
const nightWallpapers = import.meta.glob('@/assets/wallpapers/night/*.*', { eager: true, import: 'default' })

/**
 * 判断资源类型
 */
function getResourceType(url) {
  if (typeof url !== 'string') return 'image'
  const ext = url.split('.').pop().toLowerCase()
  if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video'
  return 'image'
}

/**
 * 从列表中随机挑选一个
 */
function pickRandom(globObj) {
  const urls = Object.values(globObj)
  if (urls.length === 0) return null
  const randomIndex = Math.floor(Math.random() * urls.length)
  const url = urls[randomIndex]
  return {
    url,
    type: getResourceType(url)
  }
}

/**
 * 初始化随机壁纸
 * 每次应用启动时调用一次
 */
export function initRandomWallpapers() {
  const day = pickRandom(dayWallpapers)
  const night = pickRandom(nightWallpapers)
  
  if (day) {
    store.randomDayBg = day
    console.log('[WallpaperEngine] Selected Day Background:', day.url)
  }
  
  if (night) {
    store.randomNightBg = night
    console.log('[WallpaperEngine] Selected Night Background:', night.url)
  }
}
