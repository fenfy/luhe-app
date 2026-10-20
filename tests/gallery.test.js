import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALL_TYPE, homeTabs, typesWithAll, typeParam } from '../src/utils/gallery.js'
import { getGalleryTypes, getGalleryImages } from '../src/api/mock.js'

test('typesWithAll：「全部」在最前，数量为有图类别之和，跳过没有图片的类别', () => {
  const list = typesWithAll([
    { value: '1', label: '跑狗系列', count: 3 },
    { value: '2', label: '书籍系列', count: 0 },
    { value: '3', label: '全网系列', count: '2' },
  ])
  assert.deepEqual(list.map((t) => t.value), [ALL_TYPE, '1', '3'])
  assert.equal(list[0].label, '全部')
  assert.equal(list[0].count, 5)
})

test('typesWithAll：该彩种没有任何图片时为空（不显示孤零零的「全部」）', () => {
  assert.deepEqual(typesWithAll([{ value: '1', label: '跑狗系列', count: 0 }]), [])
  assert.deepEqual(typesWithAll(null), [])
})

test('typeParam：「全部」和空值都不带类型', () => {
  assert.equal(typeParam(ALL_TYPE), '')
  assert.equal(typeParam(''), '')
  assert.equal(typeParam(undefined), '')
  assert.equal(typeParam('2'), '2')
})

test('mock 图库：按彩种区分数量，不带类型时返回该彩种全部图片', async () => {
  const yd = await getGalleryTypes({ lottery: 'yd' })
  const hk = await getGalleryTypes({ lottery: 'hk' })
  const sum = (types) => types.reduce((s, t) => s + t.count, 0)
  assert.ok(sum(hk) < sum(yd))

  const all = await getGalleryImages({ lottery: 'hk', type: '', page: 1, pageSize: 5 })
  assert.equal(all.total, sum(hk))
  assert.equal(all.list.length, 5)

  const one = await getGalleryImages({ lottery: 'hk', type: '1', page: 1, pageSize: 50 })
  assert.equal(one.total, hk.find((t) => t.value === '1').count)
  assert.ok(one.list.every((x) => x.type === '1'))
})

test('homeTabs：「全部」+ 最多 4 个类别，超过 4 个才显示「更多」', () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ value: String(i + 1), label: `类别${i + 1}`, count: 1 }))
  const four = homeTabs(mk(4), 4)
  assert.deepEqual(four.tabs.map((t) => t.value), [ALL_TYPE, '1', '2', '3', '4'])
  assert.equal(four.more, false)

  const six = homeTabs(mk(6), 4)
  assert.deepEqual(six.tabs.map((t) => t.value), [ALL_TYPE, '1', '2', '3', '4'])
  assert.equal(six.more, true)
  // 「全部」的数量仍是该彩种全部类别之和
  assert.equal(six.tabs[0].count, 6)

  // 没有图片的类别不占名额
  const sparse = homeTabs([...mk(4), { value: '9', label: '空', count: 0 }], 4)
  assert.equal(sparse.more, false)
})
