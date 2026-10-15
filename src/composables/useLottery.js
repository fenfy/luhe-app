import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGames } from '../api/index.js'
import { DEFAULT_GAME, GAMES } from '../config/lottery.js'

const STORAGE_KEY = 'luhe.lottery'

/* 彩种列表：先用本地配置，后端返回后按代码合并（名称、开奖时刻以后端为准） */
const games = ref(GAMES)
let requested = false

function loadGames() {
  if (requested) return
  requested = true
  getGames()
    .then((list) => {
      if (!Array.isArray(list) || !list.length) return
      games.value = list.map((g) => {
        const local = GAMES.find((x) => x.code === g.code) || {}
        return { ...local, ...g, short: local.short || g.name }
      })
    })
    .catch(() => {
      // 用本地配置即可
    })
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function store(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // 隐私模式等情况下不记住
  }
}

const isKnown = (code) => GAMES.some((g) => g.code === code)

/** 彩种列表 */
export function useGames() {
  loadGames()
  return games
}

/**
 * 当前彩种：URL ?lottery= 优先，其次上次选择，默认新澳门。
 * setLottery 会记住选择并更新 URL（清掉期号等与彩种相关的参数）。
 */
export function useLottery() {
  const route = useRoute()
  const router = useRouter()
  loadGames()

  const code = computed(() => {
    const q = typeof route.query.lottery === 'string' ? route.query.lottery : ''
    if (isKnown(q)) return q
    const saved = readStored()
    return isKnown(saved) ? saved : DEFAULT_GAME
  })
  const game = computed(() => games.value.find((g) => g.code === code.value) || games.value[0])

  function setLottery(next) {
    if (!isKnown(next)) return
    store(next)
    if (next === code.value && route.query.lottery === next) return
    const { period, ...rest } = route.query
    router.replace({ query: { ...rest, lottery: next } })
  }

  return { games, code, game, setLottery }
}

/** 记住选择（首页标签切换用，不改 URL） */
export function rememberLottery(code) {
  if (isKnown(code)) store(code)
}

/** 读取上次选择 */
export function storedLottery() {
  const saved = readStored()
  return isKnown(saved) ? saved : DEFAULT_GAME
}
