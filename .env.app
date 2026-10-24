# Android App 打包用（yarn build:app 即 vite build --mode app 时读取）。
# App 内页面来自 https://localhost，不能用相对路径 /api，要写线上完整地址；
# 后端 app.cors.allowed-origins 需包含 https://localhost
VITE_USE_MOCK=false
VITE_API_BASE=https://www.ydliuhecai.cc/api
VITE_FILE_BASE=https://www.ydliuhecai.cc
