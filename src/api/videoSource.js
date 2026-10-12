/**
 * 开奖视频的临时来源：后端还没有视频数据，先给每期开奖配一个公开的测试视频。
 * 奇数期用 HLS 测试流，偶数期用 mp4，两种播放方式都能验证。
 * 后端提供视频字段（src / type / duration / cover）后，删除这里的调用即可。
 */
const SAMPLE_MP4 = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

/** 给开奖记录补上测试视频字段 */
export function withDemoVideo(draw) {
  const n = Number(draw.period)
  const hls = n % 2 === 1
  return {
    ...draw,
    duration: 125 + ((n * 31) % 40),
    cover: null,
    src: hls ? SAMPLE_HLS : SAMPLE_MP4,
    type: hls ? 'hls' : 'mp4',
  }
}
