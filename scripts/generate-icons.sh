#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS_DIR="$ROOT_DIR/assets"
SRC_SVG="$ASSETS_DIR/icon.svg"
TMP_DIR="$ASSETS_DIR/.icon-build"
ICONSET_DIR="$TMP_DIR/icon.iconset"
PNG_1024="$TMP_DIR/icon_1024.png"

OUT_ICNS="$ASSETS_DIR/icon.icns"
OUT_ICO="$ASSETS_DIR/icon.ico"
OUT_PNG="$ASSETS_DIR/icon.png"

if [ ! -f "$SRC_SVG" ]; then
  echo "[generate-icons] 未找到源文件: $SRC_SVG" >&2
  exit 1
fi

mkdir -p "$ICONSET_DIR"

# 检查 ImageMagick 是否可用
if ! command -v magick >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1; then
  echo "[generate-icons] 错误: 需要安装 ImageMagick" >&2
  echo "[generate-icons] 请运行: brew install imagemagick" >&2
  exit 1
fi

# 1) SVG -> 1024 PNG（保持透明背景）
echo "[generate-icons] 从 SVG 生成 1024x1024 PNG..."
if command -v magick >/dev/null 2>&1; then
  magick -background none rsvg:"$SRC_SVG" -density 300 -resize 1024x1024 PNG32:"$PNG_1024"
else
  convert "$SRC_SVG" -background none -density 300 -resize 1024x1024 PNG32:"$PNG_1024"
fi

# 2) 生成 iconset 所需的各种尺寸（macOS）
# macOS .icns 标准尺寸：16, 32, 64, 128, 256, 512, 1024
# iconset 需要：16, 32, 128, 256, 512（以及对应的 @2x 版本）
echo "[generate-icons] 生成 macOS iconset 各尺寸图标..."

make_png() {
  local size=$1
  local out="$2"
  if command -v magick >/dev/null 2>&1; then
    magick -background none PNG32:"$PNG_1024" -resize "${size}x${size}" PNG32:"$out"
  else
    convert "$PNG_1024" -background none -resize "${size}x${size}" PNG32:"$out"
  fi
}

# 生成符合 macOS iconset 标准的所有尺寸
make_png 16   "$ICONSET_DIR/icon_16x16.png"
make_png 32   "$ICONSET_DIR/icon_16x16@2x.png"
make_png 32   "$ICONSET_DIR/icon_32x32.png"
make_png 64   "$ICONSET_DIR/icon_32x32@2x.png"
make_png 128  "$ICONSET_DIR/icon_128x128.png"
make_png 256  "$ICONSET_DIR/icon_128x128@2x.png"
make_png 256  "$ICONSET_DIR/icon_256x256.png"
make_png 512  "$ICONSET_DIR/icon_256x256@2x.png"
make_png 512  "$ICONSET_DIR/icon_512x512.png"
make_png 1024 "$ICONSET_DIR/icon_512x512@2x.png"

# 3) iconset -> icns
echo "[generate-icons] 生成 .icns 文件..."
/usr/bin/iconutil -c icns "$ICONSET_DIR" -o "$OUT_ICNS"

# 4) 生成 Windows .ico 文件
# Windows .ico 标准尺寸：16, 32, 48, 64, 128, 256
echo "[generate-icons] 生成 Windows .ico 文件..."

make_png 256 "$TMP_DIR/win_256.png"
make_png 128 "$TMP_DIR/win_128.png"
make_png 64  "$TMP_DIR/win_64.png"
make_png 48  "$TMP_DIR/win_48.png"
make_png 32  "$TMP_DIR/win_32.png"
make_png 16  "$TMP_DIR/win_16.png"

# 合并成 .ico 文件
if command -v magick >/dev/null 2>&1; then
  magick "$TMP_DIR/win_256.png" "$TMP_DIR/win_128.png" "$TMP_DIR/win_64.png" \
    "$TMP_DIR/win_48.png" "$TMP_DIR/win_32.png" "$TMP_DIR/win_16.png" \
    "$OUT_ICO"
else
  convert "$TMP_DIR/win_256.png" "$TMP_DIR/win_128.png" "$TMP_DIR/win_64.png" \
    "$TMP_DIR/win_48.png" "$TMP_DIR/win_32.png" "$TMP_DIR/win_16.png" \
    "$OUT_ICO"
fi

# 5) 生成 Linux PNG 图标
# Linux 标准尺寸：512x512 (推荐)，也可以生成多个尺寸
echo "[generate-icons] 生成 Linux .png 图标..."
make_png 512 "$OUT_PNG"

# 5) 清理临时文件
#echo "[generate-icons] 清理临时文件..."
#rm -rf "$TMP_DIR"

echo "[generate-icons] ✅ 图标生成完成:"
echo "  - macOS: $OUT_ICNS"
echo "  - Windows: $OUT_ICO"
echo "  - Linux: $OUT_PNG"
echo ""
echo "生成的图标规格:"
echo "  - macOS .icns: 16, 32, 64, 128, 256, 512, 1024 (含 @2x)"
echo "  - Windows .ico: 16, 32, 48, 64, 128, 256"
echo "  - Linux .png: 512x512"
echo "  - 背景: 透明"